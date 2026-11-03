import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/services/api';
import { PasswordField, TextField } from '@/components/common/FormControls';
import { Spinner } from '@/components/common/States';
import { AuthLayout } from './AuthLayout';
import { loginSchema, type LoginValues } from './schemas';
import type { User } from '@/types';

export function destinationFor(user: User, from?: string) {
  if (from && !from.startsWith('/login') && !from.startsWith('/register')) return from;
  if (user.role === 'admin') return '/admin';
  return user.onboardingCompleted ? '/dashboard' : '/onboarding';
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (user) return <Navigate to={destinationFor(user, from)} replace />;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const u = await login(values.email, values.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(destinationFor(u, from), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Log in to SchemeSetu"
      subtitle={
        <>
          New here?{' '}
          <Link to="/register" state={location.state} className="link">
            Create a free account
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
        <TextField label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <button type="submit" className="btn-primary w-full min-h-[3rem]" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
