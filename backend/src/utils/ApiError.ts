export class ApiError extends Error {
  public statusCode: number;
  public success: boolean;
  public errors: any;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: any = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends ApiError {
  constructor(errors: any = []) {
    super(400, 'Validation Error', errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(409, message);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service unavailable') {
    super(503, message);
  }
}
