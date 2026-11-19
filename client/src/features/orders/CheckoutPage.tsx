import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Banknote } from 'lucide-react';
import { z } from 'zod';
import { addressSchema, MOROCCAN_CITIES, type Address } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { price } from '../../lib/format';
import { useCheckout, useMe } from '../../lib/queries';

const formSchema = addressSchema.extend({ note: z.string().trim().max(300).optional(), saveAddress: z.boolean() });
type FormValues = z.infer<typeof formSchema>;

export function CheckoutPage() {
  const { data: me } = useMe();
  const { cart, isLoading } = useCart();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const toast = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...(me?.address ?? { fullName: me?.name ?? '', phone: '', line1: '', line2: '', city: '', postalCode: '' }), note: '', saveAddress: true },
  });

  if (!me) return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  if (isLoading) return <div className="mx-auto mt-10 h-96 max-w-[1100px] animate-pulse rounded-panel bg-sunken" />;

  const lines = cart?.lines.filter((l) => l.quantity > 0) ?? [];
  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-2xl font-bold">Your basket is empty.</p>
        <Link to="/shop" className="mt-4 inline-block font-semibold text-brand underline">Find something you love</Link>
      </div>
    );
  }

  const onSubmit = handleSubmit(({ note, saveAddress, ...address }) =>
    checkout.mutate(
      { address: { ...address, line2: address.line2 || undefined } as Address, note, saveAddress },
      {
        onSuccess: (order) => navigate(`/orders/${order.id}?placed=1`, { replace: true }),
        onError: (e) => toast(e instanceof ApiError ? e.message : 'Your order didn’t go through. Try again.', { tone: 'error', duration: 8000 }),
      },
    ),
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-[32px] font-extrabold tracking-tight sm:text-[44px]">Checkout</h1>

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-8">
          <fieldset className="grid grid-cols-2 gap-4">
            <legend className="col-span-2 mb-4 font-display text-xl font-bold">Where should we deliver?</legend>
            <TextField label="Full name" autoComplete="name" wrapperClassName="col-span-2" error={errors.fullName?.message} {...register('fullName')} />
            <TextField label="Phone" type="tel" autoComplete="tel" hint="The courier calls before arriving" wrapperClassName="col-span-2 sm:col-span-1" error={errors.phone?.message} {...register('phone')} />
            <div className="col-span-2 sm:col-span-1">
              <TextField label="City" list="cities" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
              <datalist id="cities">{MOROCCAN_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <TextField label="Street address" autoComplete="address-line1" wrapperClassName="col-span-2" error={errors.line1?.message} {...register('line1')} />
            <TextField label="Apartment, floor (optional)" autoComplete="address-line2" error={errors.line2?.message} {...register('line2')} />
            <TextField label="Postal code" inputMode="numeric" autoComplete="postal-code" error={errors.postalCode?.message} {...register('postalCode')} />
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" {...register('saveAddress')} />
              Save this address for next time
            </label>
          </fieldset>

          <TextField label="Note for the shop (optional)" placeholder="Babouche size, a gift message…" maxLength={300} {...register('note')} />

          <section className="rounded-panel border border-rule bg-surface p-5">
            <h2 className="font-display text-xl font-bold">Payment</h2>
            <div className="mt-3 flex gap-3 rounded-control border-2 border-brand bg-brand-soft/50 p-4">
              <Banknote className="shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="font-semibold">Cash on delivery</p>
                <p className="text-sm text-ink-muted">Pay the courier {price(cart!.totalCents)} in cash when your parcel arrives. Nothing is charged now.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-panel border border-rule bg-surface p-5 lg:sticky lg:top-36">
          <h2 className="font-display text-xl font-bold">Your order</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3">
                <span className="relative">
                  <img src={l.image} alt="" className="h-16 w-16 rounded-control bg-sunken object-cover" />
                  <span className="tabular absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-paper">{l.quantity}</span>
                </span>
                <span className="flex-1 text-sm font-medium">{l.name}</span>
                <span className="tabular text-sm font-semibold">{price(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          {cart!.lines.some((l) => l.issue) && <p className="mt-4 rounded-control bg-saffron-soft px-3 py-2 text-sm">Some items changed since you added them. Check your basket.</p>}
          <dl className="tabular mt-5 flex flex-col gap-2 border-t border-rule pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Items</dt><dd>{price(cart!.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Delivery</dt><dd>{cart!.shippingCents ? price(cart!.shippingCents) : <span className="font-semibold text-mint">Free</span>}</dd></div>
            <div className="flex justify-between border-t border-rule pt-3 text-lg font-bold"><dt>To pay on delivery</dt><dd>{price(cart!.totalCents)}</dd></div>
          </dl>
          <Button type="submit" variant="primary" loading={checkout.isPending} className="mt-5 h-12 w-full text-base">Place order</Button>
          <p className="mt-2 text-center text-xs text-ink-muted">You can cancel until we start packing.</p>
        </aside>
      </form>
    </div>
  );
}
