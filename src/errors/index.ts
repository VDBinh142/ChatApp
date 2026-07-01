import { ErrorRequestHandler } from "express";

type HttpError = {
  error: string;
  message: string;
  httpStatus: number;
};

export const errors: Record<string, HttpError> = {
  ERR_AUTH_USER_NOT_FOUND: {
    httpStatus: 401,
    error: "ERR_AUTH_USER_NOT_FOUND",
    message: "Invalid username or password",
  },
  ERR_AUTH_INVALID_PASSWORD: {
    httpStatus: 401,
    error: "ERR_AUTH_INVALID_PASSWORD",
    message: "Invalid username or password",
  },
  ERR_AUTH_USERNAME_TAKEN: {
    httpStatus: 409,
    error: "ERR_AUTH_USERNAME_TAKEN",
    message: "Username already exists",
  },
  ERR_INVALID_REQUEST: {
    httpStatus: 400,
    error: "ERR_INVALID_REQUEST",
    message: "Invalid request",
  },
  ERR_UNAUTHORIZED: {
    httpStatus: 401,
    error: "ERR_UNAUTHORIZED",
    message: "Unauthorized",
  },
  ERR_AUTH_TOKEN_EXPIRED: {
    httpStatus: 401,
    error: "ERR_AUTH_TOKEN_EXPIRED",
    message: "Token has expired, please login again",
  },
  ERR_IMAGE_NOT_UPLOADED: {
    httpStatus: 400,
    error: "ERR_IMAGE_NOT_UPLOADED",
    message: "Image not uploaded, or not supported",
  },
  ERR_IMAGE_NOT_FOUND: {
    httpStatus: 404,
    error: "ERR_IMAGE_NOT_FOUND",
    message: "Image not found",
  },
  ERR_IMAGE_TOO_LARGE: {
    httpStatus: 413,
    error: "ERR_IMAGE_TOO_LARGE",
    message: "Image exceeds the maximum allowed size",
  },
  ERR_INTERNAL_SERVER_ERROR: {
    httpStatus: 500,
    error: "ERR_INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  },
  ERR_FRIEND_REQUEST_NOT_FOUND: {
    httpStatus: 404,
    error: "ERR_FRIEND_REQUEST_NOT_FOUND",
    message: "Friend request not found",
  },
  ERR_FRIEND_REQUEST_ALREADY_EXISTS: {
    httpStatus: 409,
    error: "ERR_FRIEND_REQUEST_ALREADY_EXISTS",
    message: "A friend request already exists between these users",
  },
  ERR_FRIEND_REQUEST_SELF: {
    httpStatus: 400,
    error: "ERR_FRIEND_REQUEST_SELF",
    message: "You cannot send a friend request to yourself",
  },
  ERR_ALREADY_FRIENDS: {
    httpStatus: 409,
    error: "ERR_ALREADY_FRIENDS",
    message: "You are already friends with this user",
  },
  ERR_NOT_FRIENDS: {
    httpStatus: 404,
    error: "ERR_NOT_FRIENDS",
    message: "You are not friends with this user",
  },
  ERR_USER_NOT_FOUND: {
    httpStatus: 404,
    error: "ERR_USER_NOT_FOUND",
    message: "User not found",
  },
  ERR_NOT_REQUEST_RECEIVER: {
    httpStatus: 403,
    error: "ERR_NOT_REQUEST_RECEIVER",
    message: "Only the recipient can respond to this friend request",
  },
};

export type ErrorKey = keyof typeof errors;

export class KnownErrors extends Error {
  constructor(public readonly errorKey: ErrorKey, public readonly details?: any) {
    super(`Known error [${errorKey}]`);
  }
}

export const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof KnownErrors) {
    res.status(errors[error.errorKey].httpStatus).json({
      error: error.errorKey,
      message: errors[error.errorKey].message,
      details: error.details,
    });
    return;
  }
  console.error("Unexpected error:", error);
  res.status(500).json({
    error: "ERR_INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
};
