import { ErrorRequestHandler, Response } from 'express';

type HttpError = {
  error: string;
  message: string;
  httpStatus: number;
};

export const errors: Record<string, HttpError> = {
  ERR_AUTH_EMAIL_NOT_FOUND: {
    httpStatus: 401,
    error: 'ERR_AUTH_EMAIL_NOT_FOUND',
    message: 'Invalid email',
  },
  ERR_AUTH_INVALID_PASSWORD: {
    httpStatus: 401,
    error: 'ERR_AUTH_INVALID_PASSWORD',
    message: 'Invalid password',
  },
  ERR_INVALID_REQUEST: {
    httpStatus: 400,
    error: 'ERR_INVALID_REQUEST',
    message: 'Invalid request',
  },
  ERR_UNAUTHORIZED: {
    httpStatus: 401,
    error: 'ERR_UNAUTHORIZED',
    message: 'Unauthorized',
  },
  ERR_AUTH_TOKEN_EXPIRED: {
    httpStatus: 401,
    error: 'ERR_AUTH_TOKEN_EXPIRED',
    message: 'Token has expired, please login again',
  },
  ERR_IMAGE_NOT_UPLOADED: {
    httpStatus: 400,
    error: 'ERR_IMAGE_NOT_UPLOADED',
    message: 'Image not uploaded, or not supported',
  },
  ERR_IMAGE_NOT_FOUND: {
    httpStatus: 404,
    error: 'ERR_IMAGE_NOT_FOUND',
    message: 'Image not found',
  },
  ERR_INTERNAL_SERVER_ERROR: {
    httpStatus: 500,
    error: 'ERR_INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  },
  ERR_FRIEND_REQUEST_NOT_FOUND: {
    httpStatus: 404,
    error: 'ERR_FRIEND_REQUEST_NOT_FOUND',
    message: 'Friend request not found',
  },
};

export type ErrorKey = keyof typeof errors;

class KnownErrors extends Error {
  constructor(public readonly errorKey: ErrorKey, public readonly details?: any) {
    super(`Get known error [${errorKey}]`);
  }
}

export const handleError: ErrorRequestHandler = (error, _, res, __) => {
  if (error instanceof KnownErrors) {
    res.status(errors[error.errorKey].httpStatus).json({
      error: error.errorKey,
      message: errors[error.errorKey].message,
      details: error.details,
    });
  } else {
    console.error('Unexpected error:', error);
    res.status(500).json({
      error: 'ERR_INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export { KnownErrors };
