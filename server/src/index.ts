import { env } from './lib/env.js';
import { pool } from './db/index.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Souk API listening on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
