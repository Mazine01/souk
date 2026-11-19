import { Router } from 'express';
import { and, asc, count, eq, gte, inArray, lte, ne, sum } from 'drizzle-orm';
import { z } from 'zod';
import { ORDER_STATUSES, orderStatusSchema, productInputSchema, productQuerySchema, productUpdateSchema, type AdminStats } from '@souk/shared';
import { db } from '../../db/index.js';
import { orderItems, orders, products } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { productSelect, searchProducts, slugify, toProduct } from '../catalog/catalog.service.js';
import { changeStatus, listAllOrders } from '../orders/orders.service.js';

export const adminRouter = Router();
const idParams = z.object({ id: z.coerce.number().int().positive() });

adminRouter.get('/stats', async (_req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [[revenue], [open], [week], lowStock] = await Promise.all([
    db.select({ v: sum(orders.totalCents) }).from(orders).where(eq(orders.status, 'DELIVERED')),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ['PLACED', 'PROCESSING', 'SHIPPED'])),
    db.select({ n: count() }).from(orders).where(and(gte(orders.createdAt, weekAgo), ne(orders.status, 'CANCELLED'))),
    db
      .select({ id: products.id, name: products.name, stock: products.stock, slug: products.slug })
      .from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, 3)))
      .orderBy(asc(products.stock), asc(products.name)),
  ]);
  const body: AdminStats = { revenueCents: Number(revenue.v ?? 0), openOrders: open.n, ordersThisWeek: week.n, lowStock };
  res.json({ data: body });
});

adminRouter.get('/products', validate(productQuerySchema.extend({ limit: z.coerce.number().int().min(1).max(100).default(50) }), 'query'), async (_req, res) => {
  const { rows, meta } = await searchProducts(res.locals.query, { includeInactive: true });
  res.json({ data: rows.map(toProduct), meta });
});

adminRouter.get('/products/:id', validate(idParams, 'params'), async (_req, res) => {
  const [row] = await productSelect().where(eq(products.id, res.locals.params.id));
  if (!row) throw AppError.notFound('Product');
  res.json({ data: toProduct(row) });
});

adminRouter.post('/products', validate(productInputSchema), async (_req, res) => {
  const b = res.locals.body;
  const [p] = await db
    .insert(products)
    .values({ slug: slugify(b.name), name: b.name, description: b.description, priceCents: b.price, stock: b.stock, categoryId: b.categoryId, origin: b.origin || null, images: b.images, featured: b.featured, isActive: b.isActive })
    .returning({ id: products.id });
  const [row] = await productSelect().where(eq(products.id, p.id));
  res.status(201).json({ data: toProduct(row) });
});

adminRouter.patch('/products/:id', validate(idParams, 'params'), validate(productUpdateSchema), async (_req, res) => {
  const b = res.locals.body as z.output<typeof productUpdateSchema>;
  const values: Partial<typeof products.$inferInsert> = {};
  if (b.name !== undefined) Object.assign(values, { name: b.name, slug: slugify(b.name) });
  if (b.description !== undefined) values.description = b.description;
  if (b.price !== undefined) values.priceCents = b.price;
  if (b.stock !== undefined) values.stock = b.stock;
  if (b.categoryId !== undefined) values.categoryId = b.categoryId;
  if (b.origin !== undefined) values.origin = b.origin || null;
  if (b.images !== undefined) values.images = b.images;
  if (b.featured !== undefined) values.featured = b.featured;
  if (b.isActive !== undefined) values.isActive = b.isActive;
  const updated = await db.update(products).set(values).where(eq(products.id, res.locals.params.id)).returning({ id: products.id });
  if (!updated.length) throw AppError.notFound('Product');
  const [row] = await productSelect().where(eq(products.id, res.locals.params.id));
  res.json({ data: toProduct(row) });
});

/** A product that has been ordered is hidden instead of deleted, so order history stays intact. */
adminRouter.delete('/products/:id', validate(idParams, 'params'), async (_req, res) => {
  const id = res.locals.params.id;
  const [{ n }] = await db.select({ n: count() }).from(orderItems).where(eq(orderItems.productId, id));
  if (n > 0) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    return res.json({ result: 'hidden', message: 'This product has orders, so it was hidden from the shop instead of deleted.' });
  }
  const gone = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (!gone.length) throw AppError.notFound('Product');
  res.json({ result: 'deleted' });
});

adminRouter.get('/orders', validate(z.object({ status: z.enum(ORDER_STATUSES).optional() }), 'query'), async (_req, res) => {
  res.json({ data: await listAllOrders(res.locals.query.status) });
});

adminRouter.patch('/orders/:id', validate(idParams, 'params'), validate(orderStatusSchema), async (_req, res) => {
  res.json({ data: await changeStatus(res.locals.params.id, res.locals.body.status) });
});
