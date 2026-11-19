import { Router } from 'express';
import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { productQuerySchema } from '@souk/shared';
import { db } from '../../db/index.js';
import { categories, products } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { productSelect, searchProducts, toCard, toProduct } from './catalog.service.js';

export const catalogRouter = Router();

catalogRouter.get('/categories', async (_req, res) => {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, blurb: categories.blurb, productCount: count(products.id) })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .groupBy(categories.id)
    .orderBy(asc(categories.sort), asc(categories.name));
  res.json({ data: rows });
});

catalogRouter.get('/products', validate(productQuerySchema, 'query'), async (_req, res) => {
  const { rows, meta } = await searchProducts(res.locals.query);
  res.json({ data: rows.map(toCard), meta });
});

catalogRouter.get('/products/:slug', validate(z.object({ slug: z.string().max(100) }), 'params'), async (_req, res) => {
  const [row] = await productSelect().where(and(eq(products.slug, res.locals.params.slug), eq(products.isActive, true)));
  if (!row) throw AppError.notFound('Product');
  const related = await productSelect()
    .where(and(eq(products.categoryId, row.p.categoryId), eq(products.isActive, true), ne(products.id, row.p.id)))
    .limit(4);
  res.json({ data: toProduct(row), related: related.map(toCard) });
});
