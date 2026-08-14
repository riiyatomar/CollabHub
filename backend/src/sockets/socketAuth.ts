import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
  };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: Missing token'));
  }

  try {
    const secret = jwtConfig.accessSecret as string;
    const decoded: any = jwt.verify(token, secret);
    
    socket.user = { userId: decoded.userId };
    
    // Join a personal room for direct messages/notifications
    socket.join(`user:${decoded.userId}`);
    
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
};
