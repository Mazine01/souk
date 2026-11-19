import { and, eq, inArray, sql } from 'drizzle-orm';
import { MAX_QTY_PER_LINE, shippingFor, type Cart, type CartLine } from '@souk/shared';
import { db } from '../../db/index.js';
import { cartItems, products } from '../../db/schema.js';

/**
 * Turns (productId, quantity) pairs into a priced cart. Prices and stock always
 * come from the database; quantities are clamped to what is actually available.
 */
export async function priceLines(items: { productId: number; quantity: number }[]): Promise<Cart> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const found = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(found.map((p) => [p.id, p]));

  const lines: CartLine[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) continue; // deleted product: silently dropped
    const allowed = Math.min(item.quantity, p.stock, MAX_QTY_PER_LINE);
    const issue: CartLine['issue'] = !p.isActive ? 'UNAVAILABLE' : p.stock === 0 ? 'OUT_OF_STOCK' : allowed < item.quantity ? 'REDUCED' : null;
    const quantity = issue === 'UNAVAILABLE' || issue === 'OUT_OF_STOCK' ? 0 : allowed;
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0] ?? '',
      unitPriceCents: p.priceCents,
      quantity,
      stock: p.stock,
      lineTotalCents: quantity * p.priceCents,
      issue,
    });
  }
  const subtotalCents = lines.reduce((a, l) => a + l.lineTotalCents, 0);
  const shippingCents = shippingFor(subtotalCents);
  return {
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    itemCount: lines.reduce((a, l) => a + l.quantity, 0),
  };
}

export async function getCart(userId: number) {
  const rows = await db
    .select({ productId: cartItems.productId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(cartItems.addedAt);
  return priceLines(rows);
}

export async function setQuantity(userId: number, productId: number, quantity: number) {
  if (quantity === 0) {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return;
  }
  await db
    .insert(cartItems)
    .values({ userId, productId, quantity })
    .onConflictDoUpdate({ target: [cartItems.userId, cartItems.productId], set: { quantity } });
}

/** Adds a guest cart into the account cart after sign-in. Quantities add up, capped per line. */
export async function mergeCart(userId: number, items: { productId: number; quantity: number }[]) {
  const ids = [...new Set(items.map((i) => i.productId))];
  if (!ids.length) return;
  const existing = await db.select({ id: products.id }).from(products).where(inArray(products.id, ids));
  const valid = new Set(existing.map((p) => p.id));
  for (const item of items) {
    if (!valid.has(item.productId)) continue;
    await db
      .insert(cartItems)
      .values({ userId, productId: item.productId, quantity: Math.min(item.quantity, MAX_QTY_PER_LINE) })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: { quantity: sql`least(${cartItems.quantity} + ${item.quantity}, ${MAX_QTY_PER_LINE})` },
      });
  }
}
