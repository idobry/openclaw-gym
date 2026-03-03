export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const NotFound = (entity: string) =>
  new AppError(404, "NOT_FOUND", `${entity} not found`);

export const BadRequest = (message: string) =>
  new AppError(400, "BAD_REQUEST", message);

export const Unauthorized = (message = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", message);

export const Forbidden = (message = "Forbidden") =>
  new AppError(403, "FORBIDDEN", message);

export const Conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);
