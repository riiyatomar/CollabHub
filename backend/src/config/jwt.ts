import { env } from './env';

export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiration: env.JWT_ACCESS_EXPIRATION,
  refreshExpiration: env.JWT_REFRESH_EXPIRATION,
};
