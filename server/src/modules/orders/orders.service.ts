import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NEXT_STATUSES, shippingFor, type Address, type Order, type OrderStatus } from '@souk/shared';
import { db } from '../../db/index.js';
import { cartItems, orderItems, orders, products, users } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';

export const orderNumber = (id: number, createdAt: Date) =>
  `SK-${createdAt.getUTCFullYear().toString().slice(2)}${String(id).padStart(5, '0')}`;

type OrderRow = typeof orders.$inferSelect;

async function withItems(rows: OrderRow[], customers?: Map<number, { name: string; email: string }>): Promise<Order[]> {
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    .orderBy(orderItems.id);
  return rows.map((o) => ({
    id: o.id,
    number: orderNumber(o.id, o.createdAt),
    status: o.status,
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    address: o.address,
    note: o.note,
    paymentMethod: 'CASH_ON_DELIVERY' as const,
    items: items
      .filter((i) => i.orderId === o.id)
      .map((i) => ({ productId: i.productId, name: i.name, image: i.image, unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    ...(customers && { customer: customers.get(o.userId) }),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));
}

/**
 * Turns the signed-in user's cart into an order in ONE database transaction:
 * lock the products, check every line against live stock, write the order with
 * price snapshots, take the stock, and empty the cart. Two people buying the last
 * item at the same moment: one gets it, the other gets a clear 409.
 */
export async function checkout(userId: number, address: Address, note: string | undefined, saveAddress: boolean) {
  const orderId = await db.transaction(async (tx) => {
    const lines = await tx.select().from(cartItems).where(eq(cartItems.userId, userId));
    if (!lines.length) throw AppError.badRequest('Your cart is empty');

    const locked = await tx
      .select()
      .from(products)
      .where(inArray(products.id, lines.map((l) => l.productId)))
      .orderBy(products.id) // consistent lock order prevents deadlocks between concurrent checkouts
      .for('update');
    const byId = new Map(locked.map((p) => [p.id, p]));

    const problems: string[] = [];
    for (const l of lines) {
      const p = byId.get(l.productId);
      if (!p || !p.isActive) problems.push(`${p?.name ?? 'An item'} is no longer sold`);
      else if (p.stock < l.quantity) problems.push(p.stock === 0 ? `${p.name} just sold out` : `Only ${p.stock} ${p.name} left`);
    }
    if (problems.length) throw AppError.conflict(`${problems.join('. ')}. Update your cart and try again.`);

    const subtotalCents = lines.reduce((a, l) => a + byId.get(l.productId)!.priceCents * l.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);

    const [order] = await tx
      .insert(orders)
      .values({ userId, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, address, note: note || null })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      lines.map((l) => {
        const p = byId.get(l.productId)!;
        return { orderId: order.id, productId: p.id, name: p.name, image: p.images[0] ?? '', unitPriceCents: p.priceCents, quantity: l.quantity };
      }),
    );
    for (const l of lines) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${l.quantity}` })
        .where(eq(products.id, l.productId));
    }
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    if (saveAddress) await tx.update(users).set({ address }).where(eq(users.id, userId));
    return order.id;
  });
  return getOrder(orderId, { userId });
}

export async function listOrders(userId: number) {
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt), desc(orders.id));
  return withItems(rows);
}

/** With `userId`, only that customer's order is visible (others get 404). Without it: admin view. */
export async function getOrder(id: number, { userId }: { userId?: number } = {}) {
  const [row] = await db
    .select()
    .from(orders)
    .where(userId === undefined ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, userId)));
  if (!row) throw AppError.notFound('Order');
  const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, row.userId));
  const [order] = await withItems([row], new Map([[row.userId, u]]));
  return order;
}

export async function listAllOrders(status?: OrderStatus) {
  const rows = await db
    .select()
    .from(orders)
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(200);
  const ids = [...new Set(rows.map((r) => r.userId))];
  const us = ids.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids)) : [];
  return withItems(rows, new Map(us.map((u) => [u.id, { name: u.name, email: u.email }])));
}

/**
 * Moves an order along its lifecycle. Only the transitions in NEXT_STATUSES are allowed;
 * cancelling puts the stock back, in the same transaction as the status change.
 */
export async function changeStatus(id: number, next: OrderStatus, { customerId }: { customerId?: number } = {}) {
  await db.transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(orders)
      .where(customerId === undefined ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, customerId)))
      .for('update');
    if (!o) throw AppError.notFound('Order');
    if (customerId !== undefined && !(next === 'CANCELLED' && o.status === 'PLACED')) {
      throw AppError.conflict('This order is already being packed, so it can’t be cancelled online. Contact the shop.');
    }
    if (!NEXT_STATUSES[o.status].includes(next)) {
      throw AppError.conflict(`An order that is ${o.status.toLowerCase()} can’t move to ${next.toLowerCase()}`);
    }
    if (next === 'CANCELLED') {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const i of items) {
        if (i.productId) await tx.update(products).set({ stock: sql`${products.stock} + ${i.quantity}` }).where(eq(products.id, i.productId));
      }
    }
    await tx.update(orders).set({ status: next }).where(eq(orders.id, id));
  });
  return getOrder(id, customerId === undefined ? {} : { userId: customerId });
}
