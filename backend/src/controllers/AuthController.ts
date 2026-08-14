import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json(
      new ApiResponse(201, {
        user: result.user,
        accessToken: result.accessToken,
      }, 'User registered successfully')
    );
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json(
      new ApiResponse(200, {
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful')
    );
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));
    }

    const user = await authService.getCurrentUser(userId);
    res.status(200).json(new ApiResponse(200, user, 'Current user fetched'));
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json(new ApiResponse(401, null, 'No refresh token provided'));
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(new ApiResponse(200, { accessToken: result.accessToken }, 'Token refreshed'));
  }

  async logout(req: AuthRequest, res: Response) {
    if (req.user?.userId) {
      await authService.logout(req.user.userId);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const resetToken = await authService.forgotPassword(email);

    // In a real app, send an email here. We return the token for dev purposes.
    const data = process.env.NODE_ENV === 'development' ? { resetToken } : null;
    
    res.status(200).json(new ApiResponse(200, data, 'Password reset link sent (check response in dev mode)'));
  }

  async resetPassword(req: Request, res: Response) {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid or missing token'));
    }

    await authService.resetPassword(token, password);

    res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
  }
}

export const authController = new AuthController();
