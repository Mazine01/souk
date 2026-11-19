import { z } from 'zod';

// ---------- Store rules (shared so the cart page and the server agree) ----------

export const CURRENCY = 'MAD';
export const FREE_SHIPPING_FROM_CENTS = 800_00;
export const SHIPPING_CENTS = 45_00;
export const MAX_QTY_PER_LINE = 10;

export const shippingFor = (subtotalCents: number) =>
  subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;

export const ROLES = ['CUSTOMER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PROCESSING: 'Being packed',
  SHIPPED: 'On its way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Which status an order may move to next. Anything else is refused by the API. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const SORTS = ['featured', 'newest', 'price-asc', 'price-desc'] as const;
export type Sort = (typeof SORTS)[number];

export const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tangier', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Essaouira', 'Chefchaouen',
] as const;

// ---------- Inputs ----------

const price = z.coerce
  .number({ invalid_type_error: 'Enter a price' })
  .positive('Price must be more than 0')
  .max(1_000_000, 'Price is too high')
  .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, 'Use at most 2 decimal places')
  .transform((n) => Math.round(n * 100));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  sort: z.enum(SORTS).default('featured'),
  inStock: z.enum(['1', '0']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});
export type ProductQuery = z.input<typeof productQuerySchema>;

export const cartLineSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0).max(MAX_QTY_PER_LINE, `At most ${MAX_QTY_PER_LINE} of one item`),
});
/** Guest carts are sent as product ids + quantities only; prices always come from the database. */
export const cartItemsSchema = z.object({ items: z.array(cartLineSchema.extend({ quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE) })).max(50) });

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+212|0)[5-7]\d{8}$/, 'Use a Moroccan number, like 0612345678 or +212612345678'),
  line1: z.string().trim().min(3, 'Street address is required').max(120),
  line2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required').max(60),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Postal codes have 5 digits'),
});
export type Address = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  address: addressSchema,
  saveAddress: z.boolean().default(true),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  description: z.string().trim().min(10, 'Write at least a sentence').max(2000),
  price,
  stock: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole numbers only').min(0, 'Stock can’t be negative').max(100_000),
  categoryId: z.coerce.number({ invalid_type_error: 'Choose a category' }).int().positive('Choose a category'),
  origin: z.string().trim().max(60).optional().or(z.literal('')),
  images: z
    .array(z.string().trim().refine((v) => /^https:\/\//.test(v) || /^\/products\/[\w-]+\.(svg|png|jpe?g|webp)$/.test(v), 'Use an https:// image link'))
    .min(1, 'Add at least one image')
    .max(6, 'Up to 6 images'),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export const productUpdateSchema = productInputSchema.partial();
export type ProductPayload = z.output<typeof productInputSchema>;

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

// ---------- API shapes ----------

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  address: Address | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  blurb: string;
  productCount: number;
}

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  image: string;
  origin: string | null;
  category: { slug: string; name: string };
}

export interface Product extends ProductCard {
  description: string;
  images: string[];
  featured: boolean;
  isActive: boolean;
  categoryId: number;
  createdAt: string;
}

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  image: string;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  lineTotalCents: number;
  /** Set when the quantity had to be lowered or the item is gone. */
  issue: 'REDUCED' | 'OUT_OF_STOCK' | 'UNAVAILABLE' | null;
}

export interface Cart {
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
}

export interface OrderItem {
  productId: number | null;
  name: string;
  image: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: number;
  number: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  address: Address;
  note: string | null;
  paymentMethod: 'CASH_ON_DELIVERY';
  items: OrderItem[];
  customer?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface AdminStats {
  revenueCents: number;
  openOrders: number;
  ordersThisWeek: number;
  lowStock: { id: number; name: string; stock: number; slug: string }[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
