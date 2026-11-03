import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMeta, useProfile } from '@/hooks/queries';
import { ProfileForm, toFormValues } from '@/components/forms/ProfileForm';
import { ErrorState, PageLoader } from '@/components/common/States';
import { useSaveProfile } from './useSaveProfile';

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meta = useMeta();
  const profile = useProfile();
  const save = useSaveProfile({ completeOnboarding: true, onSaved: () => navigate('/dashboard') });

  if (meta.isLoading || profile.isLoading) return <PageLoader />;
  if (meta.isError || profile.isError)
    return (
      <div className="container-page py-10">
        <ErrorState error={meta.error ?? profile.error} onRetry={() => { void meta.refetch(); void profile.refetch(); }} />
      </div>
    );

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Set up your profile</p>
          <h1 className="mt-2 text-3xl font-extrabold">Hi {user?.name.split(' ')[0]}, let&apos;s find schemes for you</h1>
          <p className="mx-auto mt-2 max-w-xl text-ink-muted">Answer what you&apos;re comfortable with. The more you share, the more precise your matches.</p>
        </div>
        <div className="card p-5 sm:p-8">
          <ProfileForm
            meta={meta.data!}
            initial={toFormValues(profile.data!.name, profile.data!.profile)}
            mode="wizard"
            submitting={save.isPending}
            onSubmit={(v) => save.mutate(v)}
            serverErrors={save.serverErrors}
          />
        </div>
        <p className="mt-4 text-center text-sm">
          <button type="button" className="link" onClick={() => navigate('/dashboard')}>
            Skip for now
          </button>{' '}
          <span className="text-ink-muted">— you can complete your profile later.</span>
        </p>
      </div>
    </div>
  );
}
