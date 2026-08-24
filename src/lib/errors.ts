export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const NotFound = (resource: string) =>
  new AppError(404, `${resource} not found`, 'NOT_FOUND');

export const Unauthorized = (message = 'Unauthorized') =>
  new AppError(401, message, 'UNAUTHORIZED');

export const Forbidden = (message = 'Forbidden') =>
  new AppError(403, message, 'FORBIDDEN');

export const Conflict = (message: string) =>
  new AppError(409, message, 'CONFLICT');

export const BadRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'BAD_REQUEST', details);

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
