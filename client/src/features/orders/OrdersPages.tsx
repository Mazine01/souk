import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ORDER_STATUSES, type Order } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Dialogs';
import { useToast } from '../../components/ui/Toast';
import { date, price, statusLabel, statusTone } from '../../lib/format';
import { useCancelOrder, useMe, useOrder, useOrders } from '../../lib/queries';

export function StatusChip({ order }: { order: Pick<Order, 'status'> }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[order.status]}`}>{statusLabel(order.status)}</span>;
}

export function OrdersPage() {
  const { data: me } = useMe();
  const { data: orders, isLoading } = useOrders(Boolean(me));
  if (!me) return <Navigate to="/login" replace state={{ from: '/orders' }} />;

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-[32px] font-extrabold tracking-tight sm:text-[44px]">Your orders</h1>
      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-panel bg-sunken" />
      ) : !orders?.length ? (
        <div className="mt-8 rounded-panel border border-dashed border-rule-strong px-6 py-16 text-center">
          <p className="font-display text-xl font-bold">No orders yet.</p>
          <Link to="/shop" className="mt-3 inline-block font-semibold text-brand underline">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-4 rounded-panel border border-rule bg-surface p-4 hover:border-rule-strong sm:p-5">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => <img key={i.name} src={i.image} alt="" className="h-14 w-14 rounded-control border-2 border-surface bg-sunken object-cover" />)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Order {o.number}</p>
                  <p className="text-sm text-ink-muted">{date(o.createdAt)} · {o.items.reduce((a, i) => a + i.quantity, 0)} items</p>
                </div>
                <StatusChip order={o} />
                <p className="tabular w-28 text-right font-display text-lg font-bold">{price(o.totalCents)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STEPS = ORDER_STATUSES.filter((s) => s !== 'CANCELLED');

export function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const placed = params.get('placed') === '1';
  const { data: order, isLoading, error } = useOrder(Number(id));
  const cancel = useCancelOrder();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) return <div className="mx-auto mt-10 h-96 max-w-[900px] animate-pulse rounded-panel bg-sunken" />;
  if (error || !order) return <div className="px-6 py-24 text-center"><p className="font-display text-2xl font-bold">Order not found.</p><Link to="/orders" className="mt-3 inline-block text-brand underline">Your orders</Link></div>;

  const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-10 sm:px-6">
      {placed && order.status === 'PLACED' && (
        <div className="mb-8 flex gap-4 rounded-panel bg-mint-soft p-5 text-mint">
          <CheckCircle2 size={28} className="shrink-0" aria-hidden="true" />
          <div>
            <p className="font-display text-xl font-bold">Order placed. Shukran!</p>
            <p className="mt-1 text-ink">We’ll call {order.address.phone} before delivery. Have {price(order.totalCents)} ready in cash.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-[28px] font-extrabold tracking-tight sm:text-[40px]">Order {order.number}</h1>
        <StatusChip order={order} />
      </div>
      <p className="mt-1 text-ink-muted">Placed {date(order.createdAt)}</p>

      {order.status !== 'CANCELLED' && (
        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Delivery progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined}>
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-brand' : 'bg-sunken'}`} />
              <p className={`mt-2 text-xs sm:text-sm ${i <= step ? 'font-semibold' : 'text-ink-muted'}`}>{statusLabel(s)}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="items-h" className="rounded-panel border border-rule bg-surface p-5">
          <h2 id="items-h" className="font-semibold">Items</h2>
          <ul className="mt-4 flex flex-col divide-y divide-rule">
            {order.items.map((i) => (
              <li key={i.name} className="flex items-center gap-3 py-3">
                <img src={i.image} alt="" className="h-14 w-14 rounded-control bg-sunken object-cover" />
                <span className="flex-1 text-sm"><span className="font-medium">{i.name}</span><br /><span className="text-ink-muted">{i.quantity} × {price(i.unitPriceCents)}</span></span>
                <span className="tabular text-sm font-semibold">{price(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="tabular mt-2 flex flex-col gap-1.5 border-t border-rule pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Items</dt><dd>{price(order.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt><dd>{order.shippingCents ? price(order.shippingCents) : 'Free'}</dd></div>
            <div className="flex justify-between pt-1 text-base font-bold"><dt>{order.status === 'DELIVERED' ? 'Paid on delivery' : 'To pay on delivery'}</dt><dd>{price(order.totalCents)}</dd></div>
          </dl>
        </section>
        <section aria-labelledby="addr-h" className="h-fit rounded-panel border border-rule bg-surface p-5">
          <h2 id="addr-h" className="font-semibold">Delivering to</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed">
            {order.address.fullName}<br />{order.address.line1}{order.address.line2 && <>, {order.address.line2}</>}<br />{order.address.postalCode} {order.address.city}<br />{order.address.phone}
          </address>
          {order.note && <p className="mt-4 border-t border-rule pt-3 text-sm"><span className="font-semibold">Note: </span>{order.note}</p>}
          {order.status === 'PLACED' && (
            <Button variant="ghost" className="mt-5 -ml-2 !text-danger hover:!bg-danger-soft" onClick={() => setConfirm(true)}>Cancel this order</Button>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Cancel order ${order.number}?`}
        body="The items go back on the shelf for other buyers."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(order.id, {
            onSuccess: () => { setConfirm(false); toast('Order cancelled.'); },
            onError: (e) => { setConfirm(false); toast(e.message, { tone: 'error' }); },
          })
        }
      />
    </div>
  );
}
