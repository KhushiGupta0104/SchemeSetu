import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMeta, useProfile } from '@/hooks/queries';
import { AuthApi } from '@/services/endpoints';
import { errorMessage } from '@/services/api';
import { ProfileForm, toFormValues } from '@/components/forms/ProfileForm';
import { ProfileCompletionIndicator } from '@/components/dashboard/Widgets';
import { PageHeader } from '@/components/common/Layout';
import { ErrorState, PageLoader, Spinner } from '@/components/common/States';
import { AccessibleModal } from '@/components/common/Modal';
import { PasswordField } from '@/components/common/FormControls';
import { useSaveProfile } from './useSaveProfile';

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => AuthApi.deleteAccount(password),
    onSuccess: () => {
      qc.clear();
      toast.success('Your account and personal data have been deleted');
      navigate('/', { replace: true });
      window.location.reload();
    },
  });

  return (
    <section className="card mt-8 border-danger/30 p-5 sm:p-6" aria-labelledby="danger-title">
      <h2 id="danger-title" className="text-lg font-bold text-danger">Delete account</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Permanently deletes your account, profile, saved schemes, checklists and application records. This cannot be undone.
      </p>
      <button type="button" className="btn-secondary mt-4 border-danger/40 text-danger hover:bg-danger-soft" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" aria-hidden /> Delete my account
      </button>
      <AccessibleModal open={open} onClose={() => setOpen(false)} title="Delete your account?" description="Enter your password to confirm. All your personal data will be removed." size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) mutation.mutate();
          }}
          className="space-y-4"
        >
          <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={mutation.error ? errorMessage(mutation.error) : undefined} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-danger" disabled={!password || mutation.isPending}>
              {mutation.isPending && <Spinner />} Delete permanently
            </button>
          </div>
        </form>
      </AccessibleModal>
    </section>
  );
}

export default function ProfilePage() {
  const meta = useMeta();
  const profile = useProfile();
  const save = useSaveProfile({ completeOnboarding: true });

  if (meta.isLoading || profile.isLoading) return <PageLoader />;
  if (meta.isError || profile.isError)
    return <ErrorState error={meta.error ?? profile.error} onRetry={() => { void meta.refetch(); void profile.refetch(); }} />;

  return (
    <>
      <PageHeader eyebrow="My SchemeSetu" title="My profile" description={`Signed in as ${profile.data!.email}. Changes update your eligibility results immediately.`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <ProfileForm
          key={JSON.stringify(profile.data!.profile)}
          meta={meta.data!}
          initial={toFormValues(profile.data!.name, profile.data!.profile)}
          mode="edit"
          submitting={save.isPending}
          onSubmit={(v) => save.mutate(v)}
          serverErrors={save.serverErrors}
        />
        <div className="order-first xl:order-none">
          <div className="xl:sticky xl:top-24">
            <ProfileCompletionIndicator completion={profile.data!.completion} compact />
          </div>
        </div>
      </div>
      <DeleteAccount />
    </>
  );
}
