import { Response } from 'express';
import { userService } from '../services/UserService';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

import { authService } from '../services/AuthService';

export class UserController {
  async getMe(req: AuthRequest, res: Response) {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const updatedUser = await userService.updateProfile(req.user!.userId, req.body);
    res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
  }

  async changePassword(req: AuthRequest, res: Response) {
    await userService.changePassword(req.user!.userId, req.body);
    
    // Clear cookie since refresh token is invalidated
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully. Please log in again.'));
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    await userService.softDeleteAccount(req.user!.userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json(new ApiResponse(200, null, 'Account deleted successfully'));
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, null, 'No file provided'));
    }

    const { uploadToCloudinary, deleteFromCloudinary } = await import('../services/cloudinaryService.js');
    const { prisma } = await import('../config/database.js');

    try {
      // Check if user already has an avatar to delete it first
      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (currentUser?.avatar) {
        // Extract publicId from URL
        const parts = currentUser.avatar.split('/');
        const fileWithExt = parts[parts.length - 1];
        if (fileWithExt) {
          const publicId = fileWithExt.split('.')[0];
          await deleteFromCloudinary(`collabhub/avatars/${publicId}`, 'image');
        }
      }

      const result = await uploadToCloudinary(req.file.buffer, 'avatars', req.file.originalname);
      
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { avatar: result.secure_url },
        select: { id: true, name: true, username: true, email: true, avatar: true, bio: true }
      });

      res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar uploaded successfully'));
    } catch (error: any) {
      res.status(500).json(new ApiResponse(500, null, 'Error uploading avatar'));
    }
  }

  async removeAvatar(req: AuthRequest, res: Response) {
    try {
      const { deleteFromCloudinary } = await import('../services/cloudinaryService.js');
      const { prisma } = await import('../config/database.js');

      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (currentUser?.avatar) {
        const parts = currentUser.avatar.split('/');
        const fileWithExt = parts[parts.length - 1];
        if (fileWithExt) {
          const publicId = fileWithExt.split('.')[0];
          await deleteFromCloudinary(`collabhub/avatars/${publicId}`, 'image');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { avatar: null },
        select: { id: true, name: true, username: true, email: true, avatar: true, bio: true }
      });

      res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar removed successfully'));
    } catch (error: any) {
      res.status(500).json(new ApiResponse(500, null, 'Error removing avatar'));
    }
  }
}

export const userController = new UserController();
