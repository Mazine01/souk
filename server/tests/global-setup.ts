import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { poolConfig } from '../src/db/connection.js';

/** Wipes the test database and applies every migration once before the suite runs. */
export default async function setup() {
  const pool = new pg.Pool(poolConfig());
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;');
  await migrate(drizzle(pool), { migrationsFolder: path.resolve('drizzle') });
  await pool.end();
}
