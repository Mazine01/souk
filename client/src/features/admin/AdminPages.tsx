import { useState } from 'react';
import { NavLink, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search } from 'lucide-react';
import { NEXT_STATUSES, ORDER_STATUSES, type OrderStatus, type Product } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { date, price, statusLabel } from '../../lib/format';
import { useAdminOrders, useAdminProducts, useAdminStats, useMe, useSetOrderStatus } from '../../lib/queries';
import { StatusChip } from '../orders/OrdersPages';
import { ProductEditor } from './ProductEditor';

export function AdminLayout() {
  const { data: me } = useMe();
  if (!me) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (me.role !== 'ADMIN') return <Navigate to="/" replace />;
  const tab = ({ isActive }: { isActive: boolean }) => `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-sunken hover:text-ink'}`;
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-[32px] font-extrabold tracking-tight">Shop admin</h1>
      <nav aria-label="Admin" className="mt-5 flex gap-2 border-b border-rule pb-4">
        <NavLink to="/admin" end className={tab}>Today</NavLink>
        <NavLink to="/admin/products" className={tab}>Products</NavLink>
        <NavLink to="/admin/orders" className={tab}>Orders</NavLink>
      </nav>
      <div className="mt-8"><Outlet /></div>
    </div>
  );
}

export function AdminHome() {
  const { data: s } = useAdminStats();
  const { data: open } = useAdminOrders('PLACED');
  return (
    <div className="flex flex-col gap-8">
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ['New orders to pack', s ? String(open?.length ?? 0) : '–', 'brand'],
          ['Orders in the last 7 days', s ? String(s.ordersThisWeek) : '–', ''],
          ['Collected (delivered orders)', s ? price(s.revenueCents) : '–', ''],
        ].map(([label, value, tone]) => (
          <div key={label} className={`rounded-panel border p-5 ${tone ? 'border-brand bg-brand-soft/50' : 'border-rule bg-surface'}`}>
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="tabular mt-1 font-display text-3xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-panel border border-rule bg-surface p-5" aria-labelledby="pack-h">
          <h2 id="pack-h" className="font-semibold">Waiting to be packed</h2>
          {open?.length ? (
            <ul className="mt-3 divide-y divide-rule">
              {open.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span><span className="font-semibold">{o.number}</span> · {o.customer?.name} · {o.address.city}</span>
                  <NavLink to={`/admin/orders?status=PLACED`} className="font-semibold text-brand underline">{price(o.totalCents)}</NavLink>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-ink-muted">Nothing waiting. Every order is on its way.</p>}
        </section>
        <section className="rounded-panel border border-rule bg-surface p-5" aria-labelledby="low-h">
          <h2 id="low-h" className="font-semibold">Running low (3 or fewer)</h2>
          {s?.lowStock.length ? (
            <ul className="mt-3 divide-y divide-rule">
              {s.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{p.name}</span>
                  <span className={`tabular rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-danger-soft text-danger' : 'bg-saffron-soft text-[rgb(140_92_0)] dark:text-saffron'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-ink-muted">Stock looks healthy.</p>}
        </section>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useAdminProducts({ q: q || undefined, sort: 'newest', page, limit: 50 });
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <label htmlFor="admin-q" className="sr-only">Search products</label>
          <input id="admin-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products" className="h-10 w-full rounded-control border border-rule-strong bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none" />
        </div>
        <Button variant="primary" onClick={() => setEditing('new')}><Plus size={16} aria-hidden="true" />Add product</Button>
      </div>
      <div className="mt-5 overflow-x-auto rounded-panel border border-rule bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sunken text-left text-ink-muted">
            <tr><th className="px-4 py-3 font-semibold">Product</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 text-right font-semibold">Price</th><th className="px-4 py-3 text-right font-semibold">Stock</th><th className="px-4 py-3 font-semibold">Shown in shop</th><th className="w-12"><span className="sr-only">Edit</span></th></tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {data?.data.map((p) => (
              <tr key={p.id} className="hover:bg-sunken/50">
                <td className="px-4 py-2.5"><span className="flex items-center gap-3"><img src={p.image} alt="" className="h-10 w-10 rounded-md bg-sunken object-cover" /><span className="font-medium">{p.name}</span>{p.featured && <span className="rounded-full bg-saffron-soft px-2 py-0.5 text-[11px] font-semibold text-[rgb(140_92_0)] dark:text-saffron">Featured</span>}</span></td>
                <td className="px-4 py-2.5 text-ink-muted">{p.category.name}</td>
                <td className="tabular px-4 py-2.5 text-right">{price(p.priceCents)}</td>
                <td className={`tabular px-4 py-2.5 text-right font-semibold ${p.stock === 0 ? 'text-danger' : p.stock <= 3 ? 'text-[rgb(140_92_0)] dark:text-saffron' : ''}`}>{p.stock}</td>
                <td className="px-4 py-2.5">{p.isActive ? <span className="text-mint">Yes</span> : <span className="text-ink-muted">Hidden</span>}</td>
                <td className="px-2"><Button variant="ghost" size="sm" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil size={16} /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.meta.pages > 1 && (
        <div className="mt-4 flex justify-end gap-2"><Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" disabled={page >= data.meta.pages} onClick={() => setPage(page + 1)}>Next</Button></div>
      )}
      {editing && <ProductEditor key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = (ORDER_STATUSES as readonly string[]).includes(params.get('status') ?? '') ? (params.get('status') as OrderStatus) : undefined;
  const { data: orders, isLoading } = useAdminOrders(status);
  const setStatus = useSetOrderStatus();
  const toast = useToast();

  return (
    <>
      <FilterSelect label="Status" className="w-56" value={status ?? ''} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}>
        <option value="">All orders</option>
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </FilterSelect>
      {isLoading ? <div className="mt-5 h-64 animate-pulse rounded-panel bg-sunken" /> : !orders?.length ? (
        <p className="mt-8 text-ink-muted">No {status ? statusLabel(status).toLowerCase() : ''} orders.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-panel border border-rule bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="font-semibold">{o.number}</p>
                <StatusChip order={o} />
                <p className="text-sm text-ink-muted">{date(o.createdAt)} · {o.customer?.name} · {o.address.city} · {o.address.phone}</p>
                <p className="tabular ml-auto font-display text-lg font-bold">{price(o.totalCents)}</p>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</p>
              {o.note && <p className="mt-1 text-sm"><span className="font-semibold">Note:</span> {o.note}</p>}
              {NEXT_STATUSES[o.status].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-rule pt-3">
                  {NEXT_STATUSES[o.status].map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      variant={next === 'CANCELLED' ? 'ghost' : 'secondary'}
                      className={next === 'CANCELLED' ? '!text-danger' : ''}
                      loading={setStatus.isPending && setStatus.variables?.id === o.id && setStatus.variables.status === next}
                      onClick={() => setStatus.mutate({ id: o.id, status: next }, {
                        onSuccess: () => toast(`${o.number} marked ${statusLabel(next).toLowerCase()}.`),
                        onError: (e) => toast(e.message, { tone: 'error' }),
                      })}
                    >
                      {next === 'PROCESSING' ? 'Start packing' : next === 'SHIPPED' ? 'Hand to courier' : next === 'DELIVERED' ? 'Mark delivered and paid' : 'Cancel order'}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
