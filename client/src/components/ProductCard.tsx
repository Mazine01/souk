import { Link } from 'react-router-dom';
import type { ProductCard as Card } from '@souk/shared';
import { price } from '../lib/format';

export function StockNote({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-sm font-medium text-ink-muted">Sold out</span>;
  if (stock <= 3) return <span className="text-sm font-semibold text-[rgb(140_92_0)] dark:text-saffron">Only {stock} left</span>;
  return <span className="text-sm text-mint">In stock</span>;
}

export function ProductCard({ product }: { product: Card }) {
  const soldOut = product.stock === 0;
  return (
    <Link to={`/product/${product.slug}`} className="group flex flex-col focus-visible:outline-offset-4">
      <div className="relative aspect-square overflow-hidden rounded-panel bg-sunken">
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${soldOut ? 'opacity-50 grayscale' : ''}`}
        />
        {soldOut && <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">Sold out</span>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug group-hover:underline group-hover:underline-offset-4">{product.name}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{product.origin ? `Made in ${product.origin}` : product.category.name}</p>
        </div>
        <p className="shrink-0 font-display text-lg font-bold">{price(product.priceCents)}</p>
      </div>
      {!soldOut && product.stock <= 3 && (
        <div className="mt-1">
          <StockNote stock={product.stock} />
        </div>
      )}
    </Link>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse rounded-panel bg-sunken" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-sunken" />
        </div>
      ))}
    </div>
  );
}
