import { and, asc, count, desc, eq, gte, gt, ilike, lte, or, type SQL } from 'drizzle-orm';
import type { Product, ProductCard, productQuerySchema } from '@souk/shared';
import type { z } from 'zod';
import { db } from '../../db/index.js';
import { categories, products } from '../../db/schema.js';

type Query = z.output<typeof productQuerySchema>;
type Row = { p: typeof products.$inferSelect; c: { slug: string; name: string } };

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

export const toCard = ({ p, c }: Row): ProductCard => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  priceCents: p.priceCents,
  stock: p.stock,
  image: p.images[0] ?? '',
  origin: p.origin,
  category: c,
});

export const toProduct = (r: Row): Product => ({
  ...toCard(r),
  description: r.p.description,
  images: r.p.images,
  featured: r.p.featured,
  isActive: r.p.isActive,
  categoryId: r.p.categoryId,
  createdAt: r.p.createdAt.toISOString(),
});

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const productSelect = () =>
  db
    .select({ p: products, c: { slug: categories.slug, name: categories.name } })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));

/** Storefront search. `includeInactive` is only ever true for the admin list. */
export async function searchProducts(q: Query, { includeInactive = false } = {}) {
  const parts: (SQL | undefined)[] = [];
  if (!includeInactive) parts.push(eq(products.isActive, true));
  if (q.category) parts.push(eq(categories.slug, q.category));
  if (q.min !== undefined) parts.push(gte(products.priceCents, Math.round(q.min * 100)));
  if (q.max !== undefined) parts.push(lte(products.priceCents, Math.round(q.max * 100)));
  if (q.inStock === '1') parts.push(gt(products.stock, 0));
  for (const word of q.q?.split(/\s+/).filter(Boolean).slice(0, 5) ?? []) {
    const pat = `%${likeEscape(word)}%`;
    parts.push(or(ilike(products.name, pat), ilike(products.description, pat), ilike(products.origin, pat), ilike(categories.name, pat)));
  }
  const where = and(...parts);

  const order = {
    featured: [desc(products.featured), desc(products.createdAt), asc(products.id)],
    newest: [desc(products.createdAt), desc(products.id)],
    'price-asc': [asc(products.priceCents), asc(products.id)],
    'price-desc': [desc(products.priceCents), asc(products.id)],
  }[q.sort];

  const [rows, [{ total }]] = await Promise.all([
    productSelect()
      .where(where)
      .orderBy(...order)
      .limit(q.limit)
      .offset((q.page - 1) * q.limit),
    db.select({ total: count() }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(where),
  ]);
  return { rows, meta: { page: q.page, limit: q.limit, total, pages: Math.max(1, Math.ceil(total / q.limit)) } };
}
