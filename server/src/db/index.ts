import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

import { poolConfig } from './connection.js';

export const pool = new pg.Pool({ ...poolConfig(), max: 10 });

export const db = drizzle(pool, { schema });
export { schema };
