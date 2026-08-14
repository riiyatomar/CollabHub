import { userRepository } from '../repositories/UserRepository';
import { hashPassword, comparePassword } from '../utils/password';
import { UnauthorizedError, NotFoundError } from '../utils/ApiError';

export class UserService {
  async updateProfile(userId: string, data: { name?: string; bio?: string; username?: string; statusMessage?: string; themePreference?: string; language?: string; notificationPreferences?: any; privacySettings?: any }) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    const updatedUser = await userRepository.update(userId, {
      ...(data.name && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.username && { username: data.username }),
      ...(data.statusMessage !== undefined && { statusMessage: data.statusMessage }),
      ...(data.themePreference && { themePreference: data.themePreference }),
      ...(data.language && { language: data.language }),
      ...(data.notificationPreferences && { notificationPreferences: data.notificationPreferences }),
      ...(data.privacySettings && { privacySettings: data.privacySettings }),
    });

    const { password: _, refreshToken: __, resetToken: ___, ...userWithoutSensitiveInfo } = updatedUser;
    return userWithoutSensitiveInfo;
  }

  async changePassword(userId: string, data: any) {
    const { currentPassword, newPassword } = data;

    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await userRepository.update(userId, {
      password: hashedPassword,
      // Invalidate existing tokens
      refreshToken: null, 
    });
  }

  async softDeleteAccount(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    await userRepository.update(userId, {
      isActive: false,
      deletedAt: new Date(),
      refreshToken: null,
    });
  }
}

export const userService = new UserService();
