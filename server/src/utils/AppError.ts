/**
 * Operational error carrying an HTTP status code.
 * Thrown by the service layer and translated to a JSON response by the error handler.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
