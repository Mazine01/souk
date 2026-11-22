import { Link } from 'react-router-dom';
import { Banknote, Truck, Hand } from 'lucide-react';
import { ProductCard, ProductGridSkeleton } from '../../components/ProductCard';
import { ZelligePattern } from '../../components/Zellige';
import { useCategories, useProducts } from '../../lib/queries';

const CATEGORY_ART: Record<string, string> = {
  ceramics: '/products/fes-zellige-plate.svg',
  rugs: '/products/beni-ourain-rug.svg',
  lighting: '/products/brass-star-lantern.svg',
  tea: '/products/silver-berrad-teapot.svg',
  leather: '/products/leather-pouf-tan.svg',
  home: '/products/palm-market-basket.svg',
};

export function HomePage() {
  const featured = useProducts({ sort: 'featured', limit: 8 });
  const { data: categories } = useCategories();

  return (
    <>
      <section className="relative overflow-hidden bg-brand text-white">
        <div className="absolute inset-0 opacity-90">
          <ZelligePattern a="rgb(255 255 255 / .07)" b="rgb(255 255 255 / .16)" c="rgb(226 164 44 / .45)" size={96} />
        </div>
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-tight sm:text-[64px]">
              Made by hand in Morocco.
              <br />
              <span className="text-[rgb(226_164_44)]">Paid for at your door.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/85">
              Ceramics from Safi, lanterns from Marrakech and rugs from the Atlas, sold straight from the workshops that make them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex h-12 items-center rounded-control bg-white px-6 font-semibold text-brand hover:bg-white/90">Shop everything</Link>
              <Link to="/shop?category=lighting" className="inline-flex h-12 items-center rounded-control border border-white/40 px-6 font-semibold hover:bg-white/10">See the lanterns</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="aspect-square overflow-hidden rounded-[999px_999px_24px_24px] border-[10px] border-white/15 bg-[#2A2735] shadow-2xl">
              <img src="/products/brass-star-lantern.svg" alt="Pierced brass star lantern, lit" className="h-full w-full object-cover" />
            </div>
            <Link to="/product/brass-star-lantern" className="absolute -bottom-4 left-4 rounded-control bg-white px-4 py-3 text-ink shadow-panel hover:underline">
              <span className="block text-xs text-ink-muted">Bestseller</span>
              <span className="font-semibold">Pierced brass star lantern</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="How buying works" className="border-b border-rule bg-surface">
        <ul className="mx-auto grid max-w-[1240px] gap-6 px-4 py-6 text-sm sm:grid-cols-3 sm:px-6">
          {[
            { icon: Banknote, title: 'Cash on delivery', text: 'Pay the courier when the parcel is in your hands.' },
            { icon: Truck, title: 'Free over 800 MAD', text: '45 MAD otherwise. 2 to 5 days anywhere in Morocco.' },
            { icon: Hand, title: 'Straight from the maker', text: 'Every piece names the town it was made in.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-soft text-[rgb(140_92_0)] dark:text-saffron"><Icon size={20} aria-hidden="true" /></span>
              <span><span className="block font-semibold">{title}</span><span className="text-ink-muted">{text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6" aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="font-display text-2xl font-bold tracking-tight sm:text-[32px]">Wander the stalls</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <li key={c.slug}>
              <Link to={`/shop?category=${c.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-[999px_999px_16px_16px] bg-sunken">
                  <img src={CATEGORY_ART[c.slug] ?? '/products/thuya-box.svg'} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <p className="mt-3 font-semibold group-hover:underline">{c.name}</p>
                <p className="text-sm text-ink-muted">{c.productCount} pieces</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pt-16 sm:px-6" aria-labelledby="featured-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="featured-heading" className="font-display text-2xl font-bold tracking-tight sm:text-[32px]">Picked this week</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand underline underline-offset-4">See all</Link>
        </div>
        <div className="mt-6">
          {featured.data ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {featured.data.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <ProductGridSkeleton />
          )}
        </div>
      </section>
    </>
  );
}
