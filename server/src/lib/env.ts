import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // In production the client and API sit on different domains, so the cookie
  // must be SameSite=None + Secure. Locally (same site) Lax is enough.
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
