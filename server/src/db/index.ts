import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

// Hosted Postgres (Neon, Supabase, Render) requires TLS; local Docker does not.
const needsSsl = /sslmode=require/.test(connectionString) || /neon\.tech|supabase\.co|render\.com/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  max: 10,
  ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
});

export const db = drizzle(pool, { schema });
export { schema };
