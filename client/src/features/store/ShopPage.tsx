import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SORTS, type Sort } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/Field';
import { ProductCard, ProductGridSkeleton } from '../../components/ProductCard';
import { useCategories, useProducts } from '../../lib/queries';

const SORT_LABELS: Record<Sort, string> = { featured: 'Featured', newest: 'Newest', 'price-asc': 'Price, low to high', 'price-desc': 'Price, high to low' };
const PRICE_BANDS = [
  { label: 'Any price', min: undefined, max: undefined },
  { label: 'Under 250 MAD', min: undefined, max: 250 },
  { label: '250 to 1,000 MAD', min: 250, max: 1000 },
  { label: 'Over 1,000 MAD', min: 1000, max: undefined },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();
  const category = params.get('category') ?? undefined;
  const q = params.get('q') ?? undefined;
  const sort = (SORTS as readonly string[]).includes(params.get('sort') ?? '') ? (params.get('sort') as Sort) : 'featured';
  const band = Number(params.get('price') ?? 0) || 0;
  const inStock = params.get('stock') === '1' ? '1' : undefined;
  const page = Number(params.get('page')) || 1;
  const { min, max } = PRICE_BANDS[band] ?? PRICE_BANDS[0];

  const query = { category, q, sort, min, max, inStock, page, limit: 12 } as const;
  const products = useProducts(query);

  const set = (patch: Record<string, string | undefined>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (!('page' in patch)) next.delete('page');
      return next;
    });

  const [text, setText] = useState(q ?? '');
  useEffect(() => setText(q ?? ''), [q]);

  const current = categories?.find((c) => c.slug === category);
  const meta = products.data?.meta;
  const filtered = Boolean(q || band || inStock);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight sm:text-[48px]">{current?.name ?? (q ? `“${q}”` : 'Everything')}</h1>
      <p className="mt-3 max-w-xl text-ink-muted">{current?.blurb ?? (q ? 'Search results across the whole shop.' : 'Every piece in the shop, from tea glasses to hand-knotted rugs.')}</p>

      <div className="mt-8 grid grid-cols-2 gap-2 border-y border-rule py-3 sm:flex sm:items-center">
        <form className="col-span-2 sm:w-64" role="search" onSubmit={(e) => { e.preventDefault(); set({ q: text.trim() || undefined }); }}>
          <label htmlFor="shop-q" className="sr-only">Search</label>
          <input id="shop-q" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search this shop" className="h-10 w-full rounded-control border border-rule-strong bg-surface px-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm" />
        </form>
        <FilterSelect label="Price" className="sm:w-44" value={band} onChange={(e) => set({ price: e.target.value === '0' ? undefined : e.target.value })}>
          {PRICE_BANDS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
        </FilterSelect>
        <FilterSelect label="Sort" className="sm:w-48" value={sort} onChange={(e) => set({ sort: e.target.value === 'featured' ? undefined : e.target.value })}>
          {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
        </FilterSelect>
        <label className="col-span-2 flex h-10 cursor-pointer items-center gap-2 px-1 text-sm sm:col-span-1">
          <input type="checkbox" checked={Boolean(inStock)} onChange={(e) => set({ stock: e.target.checked ? '1' : undefined })} className="h-4 w-4 accent-[rgb(var(--brand))]" />
          In stock only
        </label>
        {meta && <span className="col-span-2 text-sm text-ink-muted sm:ml-auto">{meta.total} piece{meta.total === 1 ? '' : 's'}</span>}
      </div>

      <div className="mt-8" aria-busy={products.isFetching}>
        {products.isLoading ? (
          <ProductGridSkeleton />
        ) : products.data && products.data.data.length > 0 ? (
          <div className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 ${products.isPlaceholderData ? 'opacity-60' : ''}`}>
            {products.data.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="rounded-panel border border-dashed border-rule-strong px-6 py-16 text-center">
            <p className="font-display text-xl font-bold">Nothing on these shelves.</p>
            <p className="mt-1 text-ink-muted">Try a wider price range or a different word.</p>
            {filtered && <Button className="mt-5" onClick={() => setParams(category ? { category } : {})}>Clear filters</Button>}
          </div>
        )}
      </div>

      {meta && meta.pages > 1 && (
        <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })}>Previous</Button>
          <span className="tabular px-3 text-sm text-ink-muted">Page {page} of {meta.pages}</span>
          <Button size="sm" disabled={page >= meta.pages} onClick={() => set({ page: String(page + 1) })}>Next</Button>
        </nav>
      )}
    </div>
  );
}
