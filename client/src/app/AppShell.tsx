import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useCategories, useLogout, useMe } from '../lib/queries';
import { CartDrawer } from '../components/CartDrawer';
import { Logo, ZelligePattern } from '../components/Zellige';

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const { data: categories } = useCategories();
  const { count, setOpen } = useCart();
  const logout = useLogout();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const location = useLocation();
  const activeCategory = location.pathname === '/shop' ? new URLSearchParams(location.search).get('category') : null;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-50 rounded-control bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <div className="bg-[rgb(28_27_41)] px-4 py-2 text-center text-xs text-white/85 sm:text-sm">
        Cash on delivery across Morocco · Free delivery over 800 MAD
      </div>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Souk home" className="text-brand dark:text-ink">
            <Logo />
          </Link>
          <form
            role="search"
            className="relative ml-auto hidden w-full max-w-sm md:block"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
          >
            <label htmlFor="site-search" className="sr-only">Search the shop</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input id="site-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lanterns, rugs, tagines…" className="h-10 w-full rounded-full border border-rule-strong bg-surface pl-9 pr-4 text-sm placeholder:text-ink-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </form>
          <nav aria-label="Account" className="ml-auto flex items-center gap-1 md:ml-2">
            {me?.role === 'ADMIN' && (
              <NavLink to="/admin" className="hidden h-10 items-center gap-2 rounded-control px-3 text-sm font-medium hover:bg-sunken sm:flex">
                <LayoutDashboard size={18} aria-hidden="true" /> Shop admin
              </NavLink>
            )}
            {me ? (
              <>
                <NavLink to="/orders" className="flex h-10 items-center gap-2 rounded-control px-3 text-sm font-medium hover:bg-sunken">
                  <Package size={18} aria-hidden="true" /> <span className="hidden sm:inline">Orders</span><span className="sr-only sm:hidden">Orders</span>
                </NavLink>
                <button type="button" onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })} className="hidden h-10 rounded-control px-3 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink sm:block">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="flex h-10 items-center gap-2 rounded-control px-3 text-sm font-medium hover:bg-sunken">
                <User size={18} aria-hidden="true" /> Sign in
              </Link>
            )}
            <button type="button" onClick={() => setOpen(true)} className="relative flex h-10 items-center gap-2 rounded-control bg-brand px-3.5 text-sm font-semibold text-brand-ink hover:bg-brand/90" aria-label={`Basket, ${count} item${count === 1 ? '' : 's'}`}>
              <ShoppingBag size={18} aria-hidden="true" />
              <span className="tabular">{count}</span>
            </button>
          </nav>
        </div>
        <nav aria-label="Categories" className="mx-auto flex max-w-[1240px] gap-1 overflow-x-auto px-4 pb-2 text-sm sm:px-6">
          <NavLink to="/shop" end className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 font-medium ${isActive && !activeCategory ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-sunken hover:text-ink'}`}>
            Everything
          </NavLink>
          {categories?.map((c) => (
            <NavLink key={c.slug} to={`/shop?category=${c.slug}`} aria-current={activeCategory === c.slug ? 'page' : undefined} className={() => `shrink-0 rounded-full px-3 py-1.5 font-medium ${activeCategory === c.slug ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-sunken hover:text-ink'}`}>
              {c.name}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="relative mt-20 overflow-hidden bg-brand text-white dark:bg-surface">
        <div className="absolute inset-x-0 top-0 h-6 opacity-60">
          <ZelligePattern a="rgb(255 255 255 / .25)" b="#E2A42C" c="rgb(255 255 255 / .15)" size={24} />
        </div>
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 pb-10 pt-14 sm:grid-cols-3 sm:px-6">
          <div>
            <Logo onDark />
            <p className="mt-3 max-w-xs text-sm text-white/80 dark:text-ink-muted">Handmade pieces from workshops in Fès, Safi, Marrakech and the Atlas, delivered to your door.</p>
          </div>
          <div className="text-sm text-white/85 dark:text-ink-muted">
            <p className="font-semibold text-white dark:text-ink">How buying works</p>
            <p className="mt-2">Order online, pay the courier in cash when your parcel arrives. Delivery takes 2 to 5 days.</p>
          </div>
          <div className="text-sm text-white/70 dark:text-ink-muted">
            <p>A portfolio project by M'hammed Mazin for the Auspify Full Stack internship. Product illustrations are original drawings; no real orders are shipped.</p>
          </div>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
