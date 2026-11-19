import { readFileSync } from 'node:fs';
import path from 'node:path';
import { hash } from '@node-rs/argon2';
import type { Address } from '@souk/shared';
import { db, pool } from './index.js';
import { cartItems, categories, orderItems, orders, products, users } from './schema.js';

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  origin: string;
  description: string;
  views: unknown[];
  featured: boolean;
}

const CATEGORIES = [
  { slug: 'ceramics', name: 'Ceramics', blurb: 'Painted bowls, plates and tagines from Safi, Fès and Tamegroute.' },
  { slug: 'rugs', name: 'Rugs & textiles', blurb: 'Hand-knotted wool, recycled rag rugs and cactus-silk weaves.' },
  { slug: 'lighting', name: 'Lighting', blurb: 'Pierced brass, copper and coloured glass.' },
  { slug: 'tea', name: 'Tea service', blurb: 'Everything for a proper glass of mint tea.' },
  { slug: 'leather', name: 'Leather', blurb: 'Poufs and babouches stitched in the medina.' },
  { slug: 'home', name: 'Baskets & home', blurb: 'Palm baskets, thuya wood and mirrors.' },
];

const ADDRESS: Address = { fullName: 'Salma Idrissi', phone: '0612345678', line1: '14 Rue Moulay Ismail', line2: 'Apt 3', city: 'Rabat', postalCode: '10000' };

async function main() {
  const file = path.resolve(process.cwd(), 'scripts/products.json');
  const catalog = JSON.parse(readFileSync(file, 'utf8')) as SeedProduct[];

  await db.delete(cartItems);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(users);

  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'Souk!2026';
  const [admin, customer] = await db
    .insert(users)
    .values([
      { name: 'Souk Staff', email: 'admin@souk.dev', passwordHash: await hash(adminPw), role: 'ADMIN' },
      { name: 'Salma Idrissi', email: 'customer@souk.dev', passwordHash: await hash('Souk!2026'), address: ADDRESS },
    ])
    .returning();

  const cats = await db
    .insert(categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sort: i })))
    .returning();
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  // Stagger created dates so "newest" sorting has something to sort.
  const now = Date.now();
  const inserted = await db
    .insert(products)
    .values(
      catalog.map((p, i) => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceCents: p.price * 100,
        stock: p.stock,
        categoryId: catId(p.category),
        origin: p.origin,
        images: p.views.map((_, n) => `/products/${p.slug}${n === 0 ? '' : `-${n + 1}`}.svg`),
        featured: p.featured,
        createdAt: new Date(now - (catalog.length - i) * 36e5 * 7),
      })),
    )
    .returning();
  const bySlug = (s: string) => inserted.find((p) => p.slug === s)!;

  // A little order history so "My orders" and the admin dashboard aren't empty.
  const past: { daysAgo: number; status: 'DELIVERED' | 'SHIPPED' | 'PLACED'; items: [string, number][] }[] = [
    { daysAgo: 21, status: 'DELIVERED', items: [['silver-berrad-teapot', 1], ['beldi-tea-glasses-green', 1]] },
    { daysAgo: 9, status: 'DELIVERED', items: [['brass-star-lantern', 1]] },
    { daysAgo: 2, status: 'SHIPPED', items: [['safi-cobalt-bowl', 2], ['olive-dish-set', 1]] },
    { daysAgo: 0, status: 'PLACED', items: [['sabra-cushion-blue', 2]] },
  ];
  for (const o of past) {
    const lines = o.items.map(([slug, qty]) => ({ p: bySlug(slug), qty }));
    const subtotal = lines.reduce((a, l) => a + l.p.priceCents * l.qty, 0);
    const shipping = subtotal >= 800_00 ? 0 : 45_00;
    const at = new Date(now - o.daysAgo * 864e5 - 3 * 36e5);
    const [order] = await db
      .insert(orders)
      .values({ userId: customer.id, status: o.status, subtotalCents: subtotal, shippingCents: shipping, totalCents: subtotal + shipping, address: ADDRESS, createdAt: at, updatedAt: at })
      .returning();
    await db.insert(orderItems).values(lines.map((l) => ({ orderId: order.id, productId: l.p.id, name: l.p.name, image: l.p.images[0], unitPriceCents: l.p.priceCents, quantity: l.qty })));
  }

  console.log(`Seeded ${inserted.length} products in ${cats.length} categories, admin ${admin.email}, customer ${customer.email}, ${past.length} orders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
