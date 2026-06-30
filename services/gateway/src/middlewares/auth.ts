import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { KnownErrors } from '../../shared/errors';

interface AuthenticatedRequest extends Request {
  username?: string;
  userId?: string;
}

/**
 * Gateway JWT verification middleware
 * Verifies token and adds user info to request
 * Throws error if token is missing or invalid
 */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Allow health check without auth
  if (req.path === '/health') {
    next();
    return;
  }

  // Allow auth routes without JWT verification
  if (req.path.startsWith('/auth')) {
    next();
    return;
  }

  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    throw new KnownErrors('ERR_UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      username: string;
      userId?: string;
    };
    req.username = decoded.username;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    throw new KnownErrors('ERR_AUTH_TOKEN_EXPIRED');
  }
};