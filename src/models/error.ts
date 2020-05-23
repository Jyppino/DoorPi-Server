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

export class IncorrectPasswordError extends UnauthorizedError {
  constructor() {
    super('Incorrect master password');
  }
}

export class KeyNotFoundError extends HttpError {
  constructor(uid: string) {
    super(404, `Key not found for public key: ${uid}`);
  }
}
