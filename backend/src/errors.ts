export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const notFound = (resource = 'Resource') =>
  new AppError(404, 'not found');

export const unauthorized = () =>
  new AppError(401, 'unauthorized');

export const forbidden = () =>
  new AppError(403, 'forbidden');

export const validationError = (fields: Record<string, string>) =>
  new AppError(400, 'validation failed', fields);
