import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/ApiError';
import { jwtConfig } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Missing token'));
  }

  try {
    const secret = jwtConfig.accessSecret as string;
    const decoded: any = jwt.verify(token, secret);
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};
