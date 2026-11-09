import * as utils from "#utils";

export class AppError extends Error {
  constructor({ message, statusCode = 500, errors = [] }) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
    this.origin = this.#extractOrigin();
  }

  #extractOrigin() {
    if (typeof this.stack !== "string") return null;
    const [, callerLine] = this.stack.split("\n");
    return callerLine?.trim() ?? null;
  }
}

export class ConflictError extends AppError {
  constructor({ message = "Resource conflict", errors = [] }) {
    super({
      message,
      statusCode: 409,
      errors,
    });
  }
}

export class NotFoundError extends AppError {
  constructor({ message = "Resource not found", errors = [] }) {
    super({
      message,
      statusCode: 404,
      errors,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor({ message = "Unauthorized", errors = [] }) {
    super({
      message,
      statusCode: 401,
      errors,
    });
  }
}

export class ValidationError extends AppError {
  constructor({ message = "Validation failed", errors = [] }) {
    super({
      message,
      statusCode: 422,
      errors,
    });
  }
}

export class MailServiceError extends AppError {
  constructor({
    message = "Failed to send email transmission",
    errors = [],
  } = {}) {
    super({
      message,
      statusCode: 500,
      errors: errors.length ? errors : ["Mail service delivery failure"],
    });
  }
}

export class MailTemplateError extends AppError {
  constructor({
    message = "Mail template infrastructure missing",
    errors = [],
  } = {}) {
    super({
      message,
      statusCode: 500,
      errors: errors.length ? errors : ["Failed to load email template layout"],
    });
  }
}

export class ForbiddenError extends AppError {
  constructor({ message = "Access forbidden", errors = [] } = {}) {
    super({
      message,
      statusCode: 403,
      errors,
    });
  }
}

export class ExpiredSessionError extends AppError {
  constructor({
    message = "Session or verification code has expired",
    errors = [],
  } = {}) {
    super({
      message,
      statusCode: 410, // 410 Gone specifies that the condition is permanent and time-bound
      errors,
    });
  }
}

export const normalizeError = (err) => {
  return err instanceof AppError
    ? err
    : new AppError({
        message: err?.message || "Unhandled error",
        statusCode: 500,
        errors: ["Internal server error"],
      });
};

export const handleReqErrors = (err, req, res, next) => {
  const error = normalizeError(err);

  utils.logger.error(
    {
      name: error.name,
      user: req.body?.email,
      errors: error.errors,
      origin: error.origin,
      path: `[${req.method}] ${req.path} - ${error.statusCode}`,
      payload: {
        ...req.body,
        password: undefined, // prevent leaking sensitive data
      },
    },
    error.message,
  );

  res.status(error.statusCode || 500).json({
    success: false,
    data: null,
    error: {
      code: error.name,
      message: error.message,
      details: error.errors,
    },
  });
};
