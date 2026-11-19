import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from '../lib/errors.js';

type Part = 'body' | 'query' | 'params';

/** Turns Zod issues into { fieldName: message }, keeping the first message per field. */
export function zodFields(issues: { path: (string | number)[]; message: string }[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

/**
 * Validates one part of the request. The parsed (coerced, trimmed) value is
 * stored on res.locals[part] so handlers never touch unvalidated input.
 */
export function validate<S extends ZodTypeAny>(schema: S, part: Part = 'body'): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(AppError.badRequest('Some fields need fixing', zodFields(result.error.issues)));
    }
    res.locals[part] = result.data as z.infer<S>;
    next();
  };
}
