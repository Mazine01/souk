import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../site';
import { DOC_PATHS, LAST_UPDATED, documents, type Block, type DocKey } from './documents';

const DOCS = documents(SITE);

function Body({ block }: { block: Block }) {
  if (Array.isArray(block)) {
    return (
      <ul className="list-disc space-y-1.5 pl-5">
        {block.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block}</p>;
}

export function LegalPage({ doc }: { doc: DocKey }) {
  const d = DOCS[doc]!;
  useEffect(() => {
    document.title = `${d.title} · ${SITE.name}`;
    return () => {
      document.title = SITE.name;
    };
  }, [d.title]);

  const others = (Object.keys(DOCS) as DocKey[]).filter((k) => k !== doc);
  return (
    <article className="mx-auto max-w-[720px] py-4">
      <p className="text-sm text-ink-muted">Last updated {LAST_UPDATED}</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">{d.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{d.summary}</p>
      <div className="mt-10 flex flex-col gap-8 leading-relaxed">
        {d.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            <div className="mt-2 flex flex-col gap-3 text-ink-muted">
              {s.body.map((b, i) => (
                <Body key={i} block={b} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <nav aria-label="Other policies" className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-6 text-sm">
        {others.map((k) => (
          <Link key={k} to={DOC_PATHS[k]} className="font-medium underline underline-offset-4">
            {DOCS[k]!.title}
          </Link>
        ))}
      </nav>
    </article>
  );
}
