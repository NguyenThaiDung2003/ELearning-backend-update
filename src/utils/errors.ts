export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export const badRequest = (message: string) => new HttpError(message, 400);
export const unauthorized = (message = "Unauthorized") => new HttpError(message, 401);
export const forbidden = (message = "Forbidden") => new HttpError(message, 403);
export const notFound = (message: string) => new HttpError(message, 404);
export const conflict = (message: string) => new HttpError(message, 409);
