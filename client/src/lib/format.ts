import { ORDER_STATUS_LABELS, type OrderStatus } from '@souk/shared';

const mad = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** 26000 → "260 MAD". Whole dirhams show no decimals; anything else shows two. */
export const price = (cents: number) => {
  const v = cents / 100;
  return `${Number.isInteger(v) ? mad.format(v) : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
};

export const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const statusLabel = (s: OrderStatus) => ORDER_STATUS_LABELS[s];

export const statusTone: Record<OrderStatus, string> = {
  PLACED: 'bg-saffron-soft text-[rgb(140_92_0)] dark:text-saffron',
  PROCESSING: 'bg-brand-soft text-brand',
  SHIPPED: 'bg-brand-soft text-brand',
  DELIVERED: 'bg-mint-soft text-mint',
  CANCELLED: 'bg-sunken text-ink-muted',
};
