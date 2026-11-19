import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
import { UNIQUE_CONSTRAINT_FIELDS } from '../db/schema.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
};

/** Postgres errors may arrive bare (pg) or wrapped by Drizzle in `cause`. */
function pgError(err: unknown): { code?: string; constraint?: string } | undefined {
  const e = err as { code?: unknown; constraint?: string; cause?: unknown };
  if (typeof e?.code === 'string' && /^[0-9A-Z]{5}$/.test(e.code)) return e as { code: string; constraint?: string };
  if (e?.cause) return pgError(e.cause);
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const pg = pgError(err);

  // 23505 unique_violation: duplicate email / student number → 409 on the right field.
  if (pg?.code === '23505') {
    const hit = pg.constraint ? UNIQUE_CONSTRAINT_FIELDS[pg.constraint] : undefined;
    err = hit
      ? AppError.conflict(hit.message, { [hit.field]: hit.message })
      : AppError.conflict('This record already exists');
  }

  // 23503 foreign_key_violation: a referenced record is missing, or still in use.
  if (pg?.code === '23503') {
    err = AppError.conflict('This item is linked to other records and can’t be changed that way');
  }

  // Malformed JSON body.
  if (err?.type === 'entity.parse.failed') {
    err = AppError.badRequest('The request body is not valid JSON');
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    });
  }

  req.log?.error(err);
  if (process.env.NODE_ENV === 'test') console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side. Try again.' } });
};
