import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/auth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl
    }
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await authApi.resetPassword({ token: data.token, newPassword: data.newPassword });
      toast.success('Password successfully reset! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!tokenFromUrl && (
            <Input
              label="Reset Token"
              type="text"
              placeholder="Paste token here"
              {...register('token')}
              error={errors.token?.message}
            />
          )}

          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your new password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
            endIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-gray-700">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
        
        <p className="text-sm text-center text-gray-600">
          Back to{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
