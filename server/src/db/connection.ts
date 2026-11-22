import type { PoolConfig } from 'pg';

/**
 * Builds the pg pool settings from DATABASE_URL.
 * TLS is set here explicitly (verify the server certificate) rather than through
 * `sslmode=` in the URL, so the driver doesn't warn about sslmode meanings changing,
 * and Neon's `channel_binding` parameter (which node-postgres doesn't read) is dropped.
 */
export function poolConfig(raw = process.env.DATABASE_URL): PoolConfig {
  if (!raw) throw new Error('DATABASE_URL is not set');
  const url = new URL(raw);
  const mode = url.searchParams.get('sslmode');
  // Hosted Postgres (Neon, Supabase, Render) requires TLS; local Docker does not.
  const hosted = /neon\.tech|supabase\.co|render\.com/.test(url.hostname);
  const needsSsl = hosted || ['require', 'verify-ca', 'verify-full'].includes(mode ?? '');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');
  return { connectionString: url.toString(), ssl: needsSsl ? { rejectUnauthorized: true } : undefined };
}
