import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { FREE_SHIPPING_FROM_CENTS, MAX_QTY_PER_LINE } from '@souk/shared';
import { Button } from './ui/Button';
import { Drawer } from './ui/Dialogs';
import { QtyStepper } from './QtyStepper';
import { ZelligePattern } from './Zellige';
import { useCart } from '../lib/cart';
import { price } from '../lib/format';

export function CartDrawer() {
  const { cart, open, setOpen, setQuantity, isLoading } = useCart();
  const navigate = useNavigate();
  const lines = cart?.lines ?? [];
  const buyable = lines.filter((l) => l.quantity > 0);
  const toFree = FREE_SHIPPING_FROM_CENTS - (cart?.subtotalCents ?? 0);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Your basket"
      footer={
        buyable.length > 0 && cart ? (
          <div className="w-full">
            <dl className="tabular flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Items</dt><dd>{price(cart.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt><dd>{cart.shippingCents === 0 ? <span className="font-semibold text-mint">Free</span> : price(cart.shippingCents)}</dd></div>
              <div className="mt-1 flex justify-between border-t border-rule pt-2 text-base font-bold"><dt>Total</dt><dd>{price(cart.totalCents)}</dd></div>
            </dl>
            <Button
              variant="primary"
              className="mt-4 h-12 w-full text-base"
              onClick={() => {
                setOpen(false);
                navigate('/checkout');
              }}
            >
              Go to checkout
            </Button>
            <p className="mt-2 text-center text-xs text-ink-muted">You pay in cash when it arrives.</p>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-panel bg-sunken" />
      ) : lines.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="h-28 w-28 overflow-hidden rounded-full">
            <ZelligePattern a="rgb(var(--brand) / .25)" b="rgb(var(--saffron))" c="rgb(var(--mint) / .3)" size={56} />
          </div>
          <p className="mt-5 font-display text-xl font-bold">Your basket is empty</p>
          <p className="mt-1 text-sm text-ink-muted">Wander the stalls and add something you love.</p>
          <Button variant="primary" className="mt-5" onClick={() => { setOpen(false); navigate('/shop'); }}>
            Browse the shop
          </Button>
        </div>
      ) : (
        <>
          {cart && toFree > 0 && (
            <div className="mb-5 rounded-control bg-saffron-soft px-4 py-3 text-sm">
              Add <span className="font-semibold">{price(toFree)}</span> more for free delivery.
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-black/20">
                <div className="h-full rounded-full bg-saffron" style={{ width: `${Math.min(100, (cart.subtotalCents / FREE_SHIPPING_FROM_CENTS) * 100)}%` }} />
              </div>
            </div>
          )}
          <ul className="flex flex-col divide-y divide-rule">
            {lines.map((l) => (
              <li key={l.productId} className="flex gap-4 py-4 first:pt-0">
                <Link to={`/product/${l.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                  <img src={l.image} alt="" className={`h-20 w-20 rounded-control bg-sunken object-cover ${l.quantity === 0 ? 'opacity-40 grayscale' : ''}`} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link to={`/product/${l.slug}`} onClick={() => setOpen(false)} className="font-medium leading-snug hover:underline">{l.name}</Link>
                    <span className="tabular shrink-0 font-semibold">{price(l.lineTotalCents)}</span>
                  </div>
                  {l.issue === 'REDUCED' && <p className="mt-1 text-xs font-medium text-[rgb(140_92_0)] dark:text-saffron">Only {l.stock} available, so we lowered the quantity.</p>}
                  {(l.issue === 'OUT_OF_STOCK' || l.issue === 'UNAVAILABLE') && <p className="mt-1 text-xs font-medium text-danger">{l.issue === 'OUT_OF_STOCK' ? 'Sold out since you added it.' : 'No longer sold.'} It won’t be ordered.</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    {l.quantity > 0 ? (
                      <QtyStepper size="sm" value={l.quantity} max={Math.min(l.stock, MAX_QTY_PER_LINE)} onChange={(v) => setQuantity(l.productId, v)} label={`Quantity of ${l.name}`} />
                    ) : (
                      <span />
                    )}
                    <button type="button" onClick={() => setQuantity(l.productId, 0)} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
                      <Trash2 size={15} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
