import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { SITE } from '../site';
import { DOC_PATHS } from '../features/legal/documents';

const LEGAL = [
  { label: 'Privacy', to: DOC_PATHS.privacy },
  { label: 'Terms', to: DOC_PATHS.terms },
  { label: 'Cookies', to: DOC_PATHS.cookies },
];

const contactHref = SITE.contactEmail ? `mailto:${SITE.contactEmail}` : SITE.ownerUrl;
const year = new Date().getFullYear();
// Brand column + the app's link columns + the Legal column. Spelled out so Tailwind can see them.
const GRID: Record<number, string> = {
  1: 'md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))]',
  2: 'md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]',
  3: 'md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]',
};

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  const external = /^(https?:|mailto:)/.test(to);
  const cls = 'text-ink-muted transition-colors hover:text-ink';
  return external ? (
    <a href={to} className={cls} {...(to.startsWith('http') && { target: '_blank', rel: 'noreferrer noopener' })}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}

/** Full footer for app pages; `compact` is the single line used under sign-in forms. */
export function SiteFooter({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <footer className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${className}`}>
        <span className="text-ink-muted">© {year} {SITE.name}</span>
        {LEGAL.map((l) => (
          <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>
        ))}
        <FooterLink to={contactHref}>Contact</FooterLink>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-rule ${className}`}>
      <div className={`mx-auto grid gap-10 px-4 py-12 sm:px-6 ${SITE.footerWidth} sm:grid-cols-2 ${GRID[SITE.columns.length] ?? GRID[2]}`}>
        <div className="max-w-xs">
          <p className="text-base font-bold tracking-tight">{SITE.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{SITE.tagline}</p>
        </div>
        {SITE.columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="text-sm">
            <p className="font-semibold">{col.title}</p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label="Legal" className="text-sm">
          <p className="font-semibold">Legal</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            <li><FooterLink to={DOC_PATHS.privacy}>Privacy Policy</FooterLink></li>
            <li><FooterLink to={DOC_PATHS.terms}>Terms of Service</FooterLink></li>
            <li><FooterLink to={DOC_PATHS.cookies}>Cookie Policy</FooterLink></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-ink-muted sm:px-6 ${SITE.footerWidth}`}>
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <FooterLink to={contactHref}>Contact</FooterLink>
            <a href={SITE.ownerUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
              <Github size={15} aria-hidden="true" />
              {SITE.owner}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
