/**
 * Every error the API sends has the same shape:
 *   { error: { code, message, fields? } }
 * Throw an AppError anywhere in a route and the error handler formats it.
 */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }

  static badRequest(message: string, fields?: Record<string, string>) {
    return new AppError(400, 'BAD_REQUEST', message, fields);
  }
  static unauthorized(message = 'Sign in to continue') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have access to this') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(what = 'Record') {
    return new AppError(404, 'NOT_FOUND', `${what} not found`);
  }
  static conflict(message: string, fields?: Record<string, string>) {
    return new AppError(409, 'CONFLICT', message, fields);
  }
}
