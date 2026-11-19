import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/index.js';
import { cartItems, categories, orderItems, orders, products, users } from '../src/db/schema.js';

const app = createApp();
const ADDRESS = { fullName: 'Test Buyer', phone: '0612345678', line1: '1 Rue Test', city: 'Rabat', postalCode: '10000' };

let admin: string[];
let alice: string[];
let bob: string[];
let lamp: number; // 1 in stock, 500 MAD
let bowl: number; // 20 in stock, 100 MAD
let catId: number;

const login = async (email: string, password: string) =>
  (await request(app).post('/api/auth/login').send({ email, password })).get('Set-Cookie') ?? [];
const signUp = async (email: string) =>
  (await request(app).post('/api/auth/register').send({ name: email, email, password: 'long-enough-pw' })).get('Set-Cookie') ?? [];
const stockOf = async (id: number) => (await db.select().from(products).where(eq(products.id, id)))[0].stock;

beforeAll(async () => {
  await db.delete(cartItems);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(users);
  await db.insert(users).values({ name: 'Admin', email: 'admin@test.dev', passwordHash: await hash('admin-password'), role: 'ADMIN' });
  admin = await login('admin@test.dev', 'admin-password');
  alice = await signUp('alice@test.dev');
  bob = await signUp('bob@test.dev');
  [{ id: catId }] = await db.insert(categories).values({ name: 'Lighting', slug: 'lighting' }).returning();
});

beforeEach(async () => {
  await db.delete(cartItems);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  [{ id: lamp }, { id: bowl }] = await db
    .insert(products)
    .values([
      { slug: 'lamp', name: 'Lamp', description: 'A lamp', priceCents: 500_00, stock: 1, categoryId: catId, images: ['/products/lamp.svg'] },
      { slug: 'bowl', name: 'Bowl', description: 'A bowl', priceCents: 100_00, stock: 20, categoryId: catId, images: ['/products/bowl.svg'] },
    ])
    .returning();
});

afterAll(async () => {
  await pool.end();
});

describe('storefront', () => {
  it('lists, filters and searches active products publicly', async () => {
    await db.insert(products).values({ slug: 'hidden', name: 'Hidden', description: 'x', priceCents: 1, stock: 1, categoryId: catId, images: ['/x.svg'], isActive: false });
    const all = await request(app).get('/api/products');
    expect(all.body.data.map((p: { slug: string }) => p.slug).sort()).toEqual(['bowl', 'lamp']);
    const cheap = await request(app).get('/api/products?max=200');
    expect(cheap.body.data.map((p: { slug: string }) => p.slug)).toEqual(['bowl']);
    const byWord = await request(app).get('/api/products?q=lamp');
    expect(byWord.body.data).toHaveLength(1);
    expect((await request(app).get('/api/products/hidden')).status).toBe(404);
  });

  it('prices a guest cart from the database, clamping to stock', async () => {
    const res = await request(app).post('/api/cart/preview').send({ items: [{ productId: lamp, quantity: 3, priceCents: 1 }] });
    expect(res.body.data.lines[0]).toMatchObject({ quantity: 1, unitPriceCents: 500_00, issue: 'REDUCED' });
    expect(res.body.data.totalCents).toBe(500_00 + 45_00); // under the free-shipping threshold
  });
});

describe('checkout', () => {
  it('ignores any price or total sent by the browser', async () => {
    await request(app).put(`/api/cart/items/${bowl}`).set('Cookie', alice).send({ quantity: 2, priceCents: 1 });
    const res = await request(app)
      .post('/api/checkout')
      .set('Cookie', alice)
      .send({ address: ADDRESS, totalCents: 1, subtotalCents: 1, items: [{ productId: bowl, quantity: 2, unitPriceCents: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ subtotalCents: 200_00, shippingCents: 45_00, totalCents: 245_00, status: 'PLACED' });
    expect(res.body.data.items[0].unitPriceCents).toBe(100_00);
  });

  it('takes stock, snapshots prices and empties the cart', async () => {
    await request(app).put(`/api/cart/items/${bowl}`).set('Cookie', alice).send({ quantity: 3 });
    const res = await request(app).post('/api/checkout').set('Cookie', alice).send({ address: ADDRESS });
    expect(await stockOf(bowl)).toBe(17);
    expect((await request(app).get('/api/cart').set('Cookie', alice)).body.data.lines).toHaveLength(0);

    // Changing the product later must not rewrite the order.
    await request(app).patch(`/api/admin/products/${bowl}`).set('Cookie', admin).send({ price: 999, name: 'Renamed bowl' });
    const order = await request(app).get(`/api/orders/${res.body.data.id}`).set('Cookie', alice);
    expect(order.body.data.items[0]).toMatchObject({ name: 'Bowl', unitPriceCents: 100_00 });
  });

  it('sells the last item to exactly one of two simultaneous buyers', async () => {
    await request(app).put(`/api/cart/items/${lamp}`).set('Cookie', alice).send({ quantity: 1 });
    await request(app).put(`/api/cart/items/${lamp}`).set('Cookie', bob).send({ quantity: 1 });
    const [a, b] = await Promise.all([
      request(app).post('/api/checkout').set('Cookie', alice).send({ address: ADDRESS }),
      request(app).post('/api/checkout').set('Cookie', bob).send({ address: ADDRESS }),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect((a.status === 409 ? a : b).body.error.message).toMatch(/sold out/i);
    expect(await stockOf(lamp)).toBe(0);
  });

  it('refuses an empty cart and a bad address', async () => {
    expect((await request(app).post('/api/checkout').set('Cookie', alice).send({ address: ADDRESS })).status).toBe(400);
    await request(app).put(`/api/cart/items/${bowl}`).set('Cookie', alice).send({ quantity: 1 });
    const bad = await request(app).post('/api/checkout').set('Cookie', alice).send({ address: { ...ADDRESS, phone: '123', postalCode: 'abc' } });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(expect.arrayContaining(['address.phone', 'address.postalCode']));
  });

  it('merges a guest cart into the account after sign-in', async () => {
    await request(app).put(`/api/cart/items/${bowl}`).set('Cookie', alice).send({ quantity: 2 });
    const res = await request(app).post('/api/cart/merge').set('Cookie', alice).send({ items: [{ productId: bowl, quantity: 3 }, { productId: lamp, quantity: 1 }] });
    const lines = res.body.data.lines;
    expect(lines.find((l: { productId: number }) => l.productId === bowl).quantity).toBe(5);
    expect(lines.find((l: { productId: number }) => l.productId === lamp).quantity).toBe(1);
  });
});

describe('orders and roles', () => {
  let orderId: number;
  beforeEach(async () => {
    await request(app).put(`/api/cart/items/${bowl}`).set('Cookie', alice).send({ quantity: 4 });
    orderId = (await request(app).post('/api/checkout').set('Cookie', alice).send({ address: ADDRESS })).body.data.id;
  });

  it("hides one customer's orders from another", async () => {
    expect((await request(app).get(`/api/orders/${orderId}`).set('Cookie', bob)).status).toBe(404);
    expect((await request(app).post(`/api/orders/${orderId}/cancel`).set('Cookie', bob)).status).toBe(404);
    expect((await request(app).get('/api/orders').set('Cookie', bob)).body.data).toHaveLength(0);
  });

  it('lets the customer cancel a placed order and puts the stock back', async () => {
    expect(await stockOf(bowl)).toBe(16);
    const res = await request(app).post(`/api/orders/${orderId}/cancel`).set('Cookie', alice);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(await stockOf(bowl)).toBe(20);
  });

  it('only allows valid status changes, and only for admins', async () => {
    expect((await request(app).patch(`/api/admin/orders/${orderId}`).set('Cookie', alice).send({ status: 'SHIPPED' })).status).toBe(403);
    expect((await request(app).patch(`/api/admin/orders/${orderId}`).set('Cookie', admin).send({ status: 'DELIVERED' })).status).toBe(409);
    expect((await request(app).patch(`/api/admin/orders/${orderId}`).set('Cookie', admin).send({ status: 'PROCESSING' })).body.data.status).toBe('PROCESSING');
    // Packed orders can no longer be cancelled by the customer.
    expect((await request(app).post(`/api/orders/${orderId}/cancel`).set('Cookie', alice)).status).toBe(409);
  });

  it('blocks every admin route for customers and guests', async () => {
    for (const [method, url] of [['get', '/api/admin/stats'], ['get', '/api/admin/products'], ['post', '/api/admin/products'], ['get', '/api/admin/orders']] as const) {
      expect((await request(app)[method](url).set('Cookie', alice)).status, url).toBe(403);
      expect((await request(app)[method](url)).status, url).toBe(401);
    }
  });

  it('never lets sign-up create an admin', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Eve', email: 'eve@test.dev', password: 'long-enough-pw', role: 'ADMIN' });
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('hides (rather than deletes) a product that has been ordered', async () => {
    const res = await request(app).delete(`/api/admin/products/${bowl}`).set('Cookie', admin);
    expect(res.body.result).toBe('hidden');
    expect((await request(app).get('/api/products/bowl')).status).toBe(404);
    const del = await request(app).delete(`/api/admin/products/${lamp}`).set('Cookie', admin);
    expect(del.body.result).toBe('deleted');
  });
});
