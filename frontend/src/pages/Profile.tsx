import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { userApi } from '../api/user';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import ImageCropper from '../components/ImageCropper';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  statusMessage: z.string().max(100, 'Status message must be less than 100 characters').optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isSubmitting: isProfileSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      statusMessage: user?.statusMessage || '',
      themePreference: (user?.themePreference as any) || 'system',
      language: user?.language || 'en',
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }, reset: resetPassword } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const response = await userApi.updateProfile(data);
      // Assuming response.data contains the updated user
      setAuth({ ...user, ...response.data } as any, useAuthStore.getState().accessToken!);
      
      // Update local storage / document class if theme changed
      if (data.themePreference) {
        localStorage.setItem('theme-preference', data.themePreference);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (data.themePreference === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(data.themePreference);
        }
      }

      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await userApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await userApi.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const response = await userApi.uploadAvatar(file);
      setAuth({ ...user, ...response.data } as any, useAuthStore.getState().accessToken!);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update avatar');
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const response = await userApi.removeAvatar();
      setAuth({ ...user, ...response.data } as any, useAuthStore.getState().accessToken!);
      toast.success('Avatar removed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Personal Information</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="shrink-0 flex flex-col items-center">
            <ImageCropper 
              currentImageUrl={user?.avatar || undefined}
              onUpload={handleAvatarUpload}
              onRemove={user?.avatar ? handleAvatarRemove : undefined}
              title="Profile Picture"
              aspectRatio={1}
              circularCrop={true}
            />
          </div>
          
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 flex-1 max-w-md">
            <Input
              label="Name"
              placeholder="Enter your full name"
              {...registerProfile('name')}
              error={profileErrors.name?.message}
            />
            <Input
              label="Bio"
              placeholder="Tell us about yourself"
              {...registerProfile('bio')}
              error={profileErrors.bio?.message}
            />
            <Input
              label="Status Message"
              placeholder="e.g. Working remotely, In a meeting"
              {...registerProfile('statusMessage')}
              error={profileErrors.statusMessage?.message}
            />
          </form>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Preferences</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
            <select
              {...registerProfile('themePreference')}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select
              {...registerProfile('language')}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="button" onClick={handleProfileSubmit(onProfileSubmit)} isLoading={isProfileSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Security</h2>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            {...registerPassword('currentPassword')}
            error={passwordErrors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            {...registerPassword('newPassword')}
            error={passwordErrors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            {...registerPassword('confirmPassword')}
            error={passwordErrors.confirmPassword?.message}
          />
          <Button type="submit" isLoading={isPasswordSubmitting}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="DELETE"
            />
          </div>
          <Button 
            variant="danger" 
            disabled={deleteText !== 'DELETE'} 
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
