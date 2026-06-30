// Custom Express Request type with JWT payload and userId
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: JwtPayload;
    }
  }
}
