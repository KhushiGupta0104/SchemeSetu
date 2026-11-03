import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ApiError, errorMessage } from '@/services/api';
import { PasswordField, TextField } from '@/components/common/FormControls';
import { Spinner } from '@/components/common/States';
import { AuthLayout } from './AuthLayout';
import { registerSchema, type RegisterValues } from './schemas';
import { destinationFor } from './LoginPage';

export default function RegisterPage() {
  const { user, register: signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  if (user) return <Navigate to={destinationFor(user)} replace />;

  const onSubmit = async (v: RegisterValues) => {
    setFormError(null);
    try {
      await signUp(v.name, v.email, v.password);
      toast.success('Account created! Let’s set up your profile.');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: err.message });
      } else if (err instanceof ApiError && err.details?.length) {
        err.details.forEach((d) => setError(d.path as keyof RegisterValues, { message: d.message }));
      } else setFormError(errorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Create your free account"
      subtitle={
        <>
          Already registered?{' '}
          <Link to="/login" state={location.state} className="link">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {formError}
          </p>
        )}
        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          help="At least 8 characters, including a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <button type="submit" className="btn-primary w-full min-h-[3rem]" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-xs text-ink-muted">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="link">Terms</Link> and{' '}
          <Link to="/privacy" className="link">Privacy Policy</Link>. We only ask for what is needed to match schemes.
        </p>
      </form>
    </AuthLayout>
  );
}
