export class HttpError extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class ValidationError extends HttpError {
  constructor(fields: string[]) {
    super(403, `Invalid value for ${fields.join(', ')}`);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

export class InsufficientRightsError extends UnauthorizedError {
  constructor() {
    super('Insufficient rights to perform operation');
  }
}

export class KeyNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `Key not found for id: ${id}`);
  }
}
