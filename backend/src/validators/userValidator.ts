import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
    statusMessage: z.string().max(100, 'Status message must be less than 100 characters').optional(),
    themePreference: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    notificationPreferences: z.any().optional(),
    privacySettings: z.any().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ['newPassword'],
  }),
});
