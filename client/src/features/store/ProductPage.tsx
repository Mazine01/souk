import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Banknote, MapPin, Truck } from 'lucide-react';
import { MAX_QTY_PER_LINE } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { ProductCard, StockNote } from '../../components/ProductCard';
import { QtyStepper } from '../../components/QtyStepper';
import { useCart } from '../../lib/cart';
import { price } from '../../lib/format';
import { useProduct } from '../../lib/queries';

export function ProductPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, error } = useProduct(slug);
  const { add, quantityOf, setOpen } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [adding, setAdding] = useState(false);

  if (isLoading) return <div className="mx-auto mt-10 h-[520px] max-w-[1240px] animate-pulse rounded-panel bg-sunken px-4" />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-2xl font-bold">This piece isn’t in the shop anymore.</p>
        <Link to="/shop" className="mt-4 inline-block font-semibold text-brand underline">Browse what’s available</Link>
      </div>
    );
  }

  const p = data.data;
  const inCart = quantityOf(p.id);
  const canAdd = Math.max(0, Math.min(p.stock, MAX_QTY_PER_LINE) - inCart);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link to="/shop" className="hover:underline">Shop</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={`/shop?category=${p.category.slug}`} className="hover:underline">{p.category.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <div className="aspect-square overflow-hidden rounded-panel bg-sunken">
            <img src={p.images[view]} alt={p.name} className="h-full w-full object-cover" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {p.images.map((src, i) => (
                <button key={src} type="button" onClick={() => setView(i)} aria-label={`View ${i + 1}`} aria-pressed={view === i} className={`h-20 w-20 overflow-hidden rounded-control border-2 ${view === i ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          {p.origin && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-muted"><MapPin size={15} aria-hidden="true" />Made in {p.origin}</p>
          )}
          <h1 className="mt-2 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px]">{p.name}</h1>
          <p className="mt-4 font-display text-3xl font-bold">{price(p.priceCents)}</p>
          <div className="mt-2"><StockNote stock={p.stock} /></div>

          <p className="mt-6 max-w-prose leading-relaxed text-ink-muted">{p.description}</p>

          {p.stock > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {canAdd > 0 && <QtyStepper value={Math.min(qty, canAdd)} max={canAdd} onChange={setQty} label="Quantity" />}
              <Button
                variant="primary"
                className="h-11 flex-1 px-8 text-base sm:flex-none"
                disabled={canAdd === 0}
                loading={adding}
                onClick={async () => {
                  setAdding(true);
                  try {
                    await add(p.id, Math.min(qty, canAdd));
                    toast(`${p.name} added to your basket.`, { action: { label: 'View basket', onClick: () => setOpen(true) } });
                    setQty(1);
                  } catch (e) {
                    toast((e as Error).message, { tone: 'error' });
                  } finally {
                    setAdding(false);
                  }
                }}
              >
                {canAdd === 0 ? 'All available are in your basket' : 'Add to basket'}
              </Button>
            </div>
          ) : (
            <p className="mt-8 rounded-control bg-sunken px-4 py-3 text-sm">This one has sold. Makers restock after each market; check back soon.</p>
          )}
          {inCart > 0 && <p className="mt-3 text-sm text-ink-muted">You have {inCart} in your basket.</p>}

          <ul className="mt-8 flex flex-col gap-3 border-t border-rule pt-6 text-sm">
            <li className="flex gap-3"><Banknote size={18} className="shrink-0 text-mint" aria-hidden="true" /><span><span className="font-semibold">Cash on delivery.</span> Pay the courier when your parcel arrives.</span></li>
            <li className="flex gap-3"><Truck size={18} className="shrink-0 text-mint" aria-hidden="true" /><span><span className="font-semibold">2 to 5 days</span> anywhere in Morocco. Free over 800 MAD.</span></li>
          </ul>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-2xl font-bold">More {p.category.name.toLowerCase()}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {data.related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
