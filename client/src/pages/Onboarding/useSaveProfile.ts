import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProfileApi } from '@/services/endpoints';
import { ApiError, errorMessage } from '@/services/api';
import { ME_KEY } from '@/context/AuthContext';
import { toPayload, type ProfileFormValues } from '@/components/forms/ProfileForm';

/** Saves the profile and refreshes everything that depends on it (eligibility everywhere). */
export function useSaveProfile(opts: { completeOnboarding?: boolean; onSaved?: () => void } = {}) {
  const qc = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Array<{ path: string; message: string }>>();
  const mutation = useMutation({
    mutationFn: (v: ProfileFormValues) => ProfileApi.update({ ...toPayload(v), completeOnboarding: opts.completeOnboarding }),
    onMutate: () => setServerErrors(undefined),
    onSuccess: async (data) => {
      qc.setQueryData(['profile'], data);
      await Promise.all(
        [ME_KEY, ['recommendations'], ['dashboard'], ['schemes'], ['scheme'], ['eligibility']].map((k) => qc.invalidateQueries({ queryKey: k })),
      );
      toast.success('Profile saved — your matches have been updated');
      opts.onSaved?.();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) setServerErrors(err.details);
      toast.error(errorMessage(err));
    },
  });
  return { ...mutation, serverErrors };
}
