import { userRepository } from '../repositories/UserRepository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/ApiError';
import { generateRandomToken, hashToken } from '../utils/crypto';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export class AuthService {
  async register(data: any) {
    const { name, username, email, password } = data;

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new ConflictError('Email already in use');

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) throw new ConflictError('Username already taken');

    const hashedPassword = await hashPassword(password);

    const user = await userRepository.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    const hashedRefreshToken = await hashPassword(refreshToken);
    await userRepository.update(user.id, { refreshToken: hashedRefreshToken });

    const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user;

    return {
      user: userWithoutSensitiveInfo,
      accessToken,
      refreshToken,
    };
  }

  async login(data: any) {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    const hashedRefreshToken = await hashPassword(refreshToken);
    await userRepository.update(user.id, { 
      refreshToken: hashedRefreshToken,
      lastLogin: new Date()
    });

    const { password: _, refreshToken: __, ...userWithoutSensitiveInfo } = user;

    return {
      user: userWithoutSensitiveInfo,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtConfig.refreshSecret);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const isMatch = await comparePassword(token, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({ userId: user.id });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    const hashedRefreshToken = await hashPassword(newRefreshToken);
    await userRepository.update(user.id, { refreshToken: hashedRefreshToken });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await userRepository.update(userId, { refreshToken: null });
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new NotFoundError('User not found');
    }

    const resetToken = generateRandomToken(32);
    const hashedToken = hashToken(resetToken);
    
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.update(user.id, {
      resetToken: hashedToken,
      resetExpires,
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = hashToken(token);

    const user = await userRepository.findByResetToken(hashedToken);

    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    // Invalidate refresh token to force logout on all devices
    await userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
      refreshToken: null, 
    });
  }

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    const { password: _, refreshToken: __, resetToken: ___, ...userWithoutSensitiveInfo } = user;
    return userWithoutSensitiveInfo;
  }
}

export const authService = new AuthService();
