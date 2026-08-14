import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface TokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, jwtConfig.accessSecret as string, {
    expiresIn: jwtConfig.accessExpiration as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, jwtConfig.refreshSecret as string, {
    expiresIn: jwtConfig.refreshExpiration as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
};
