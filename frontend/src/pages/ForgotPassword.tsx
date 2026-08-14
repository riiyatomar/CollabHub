
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const response = await authApi.forgotPassword(data);
      toast.success(response.message || 'Reset link sent to your email.');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your email to receive a reset link</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...register('email')}
            error={errors.email?.message}
          />
          
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>
        
        <p className="text-sm text-center text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
