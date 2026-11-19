import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';

// Runs every SQL file in server/drizzle that has not been applied yet.
// `npm start` calls this before booting the API, so deploys migrate themselves.
const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

await migrate(db, { migrationsFolder });
console.log('Database is up to date.');
await pool.end();
