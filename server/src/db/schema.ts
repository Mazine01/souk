import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { ORDER_STATUSES, ROLES, type Address } from '@souk/shared';

export const roleEnum = pgEnum('role', ROLES);
export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique('users_email_unique'),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('CUSTOMER'),
  address: jsonb('address').$type<Address>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  blurb: text('blurb').notNull().default(''),
  sort: integer('sort').notNull().default(0),
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique('products_slug_unique'),
    name: text('name').notNull(),
    description: text('description').notNull(),
    priceCents: integer('price_cents').notNull(),
    stock: integer('stock').notNull().default(0),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    origin: text('origin'),
    images: text('images').array().notNull(),
    featured: boolean('featured').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('products_category_idx').on(t.categoryId), index('products_active_price_idx').on(t.isActive, t.priceCents)],
);

export const cartItems = pgTable(
  'cart_items',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum('status').notNull().default('PLACED'),
    subtotalCents: integer('subtotal_cents').notNull(),
    shippingCents: integer('shipping_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    /** Copied at checkout so later address changes don't rewrite where a past order went. */
    address: jsonb('address').$type<Address>().notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('orders_user_idx').on(t.userId), index('orders_status_idx').on(t.status)],
);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  /** Name, image and price as they were when bought. Editing a product never changes old orders. */
  name: text('name').notNull(),
  image: text('image').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const UNIQUE_CONSTRAINT_FIELDS: Record<string, { field: string; message: string }> = {
  users_email_unique: { field: 'email', message: 'An account with this email already exists' },
  products_slug_unique: { field: 'name', message: 'A product with this name already exists' },
};
