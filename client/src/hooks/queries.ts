import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AiApi,
  ApplicationApi,
  ChecklistApi,
  MetaApi,
  ProfileApi,
  SavedApi,
  SchemeApi,
  type SchemeFilters,
} from '@/services/endpoints';
import { errorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Application, Checklist, SchemeDetail } from '@/types';

export const keys = {
  meta: ['meta'] as const,
  profile: ['profile'] as const,
  schemes: (f: SchemeFilters, uid?: string) => ['schemes', uid ?? 'anon', f] as const,
  scheme: (id: string, uid?: string) => ['scheme', id, uid ?? 'anon'] as const,
  eligibility: (id: string) => ['eligibility', id] as const,
  recommendations: ['recommendations'] as const,
  dashboard: ['dashboard'] as const,
  deadlines: (scope: string, uid?: string) => ['deadlines', scope, uid ?? 'anon'] as const,
  saved: (q?: string) => ['saved', q ?? ''] as const,
  applications: ['applications'] as const,
  checklists: ['checklists'] as const,
  checklist: (id: string) => ['checklist', id] as const,
};

/** Shared options & field definitions from the server (single source of truth). */
export function useMeta() {
  return useQuery({ queryKey: keys.meta, queryFn: MetaApi.get, staleTime: Infinity, gcTime: Infinity });
}

export function useProfile(enabled = true) {
  return useQuery({ queryKey: keys.profile, queryFn: ProfileApi.get, enabled });
}

export function useSchemes(filters: SchemeFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.schemes(filters, user?.id),
    queryFn: () => SchemeApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useScheme(id: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: keys.scheme(id, user?.id), queryFn: () => SchemeApi.get(id), retry: 1 });
}

export function useEligibility(id: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: keys.eligibility(id ?? ''), queryFn: () => SchemeApi.eligibility(id!), enabled: enabled && Boolean(id) });
}

export function useRecommendations(enabled = true) {
  return useQuery({ queryKey: keys.recommendations, queryFn: SchemeApi.recommendations, enabled });
}

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: SchemeApi.dashboard });
}

export function useDeadlines(scope: 'all' | 'mine') {
  const { user } = useAuth();
  return useQuery({ queryKey: keys.deadlines(scope, user?.id), queryFn: () => SchemeApi.deadlines(scope) });
}

export function useSaved(q?: string) {
  return useQuery({ queryKey: keys.saved(q), queryFn: () => SavedApi.list(q), placeholderData: keepPreviousData });
}

export function useApplications() {
  return useQuery({ queryKey: keys.applications, queryFn: ApplicationApi.list });
}

export function useChecklists() {
  return useQuery({ queryKey: keys.checklists, queryFn: ChecklistApi.list });
}

export function useChecklist(schemeId: string | undefined) {
  return useQuery({ queryKey: keys.checklist(schemeId ?? ''), queryFn: () => ChecklistApi.get(schemeId!), enabled: Boolean(schemeId) });
}

export function useAiStatus() {
  return useQuery({ queryKey: ['ai-status'], queryFn: AiApi.status, staleTime: 10 * 60 * 1000 });
}

/** Invalidates everything that depends on a user's saved / tracked data. */
function useInvalidatePersonal() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      ['schemes', 'scheme', 'saved', 'dashboard', 'checklists', 'applications', 'deadlines'].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
}

export function useToggleSave() {
  const invalidate = useInvalidatePersonal();
  return useMutation({
    mutationFn: ({ schemeId, saved }: { schemeId: string; saved: boolean; name?: string }) =>
      saved ? SavedApi.remove(schemeId) : SavedApi.save(schemeId),
    onSuccess: (_d, v) => {
      toast.success(v.saved ? 'Removed from saved schemes' : 'Saved — find it under Saved Schemes');
      void invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useTrackApplication() {
  const invalidate = useInvalidatePersonal();
  return useMutation({
    mutationFn: (schemeId: string) => ApplicationApi.create({ schemeId }),
    onSuccess: () => {
      toast.success('Now tracking this application');
      void invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  const invalidate = useInvalidatePersonal();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; appliedAt?: string | null; notes?: string; statusNote?: string }) =>
      ApplicationApi.update(id, body),
    onSuccess: (updated) => {
      qc.setQueryData<Application[]>(keys.applications, (old) => old?.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
      void invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useDeleteApplication() {
  const invalidate = useInvalidatePersonal();
  return useMutation({
    mutationFn: (id: string) => ApplicationApi.remove(id),
    onSuccess: () => {
      toast.success('Stopped tracking this application');
      void invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** Optimistic checklist toggle with rollback on failure. */
export function useUpdateChecklist(schemeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => ChecklistApi.update(schemeId, ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: keys.checklist(schemeId) });
      const prev = qc.getQueryData<Checklist>(keys.checklist(schemeId));
      if (prev) {
        const set = new Set(ids);
        const documents = prev.documents.map((d) => ({ ...d, completed: set.has(d.docId) }));
        qc.setQueryData<Checklist>(keys.checklist(schemeId), {
          ...prev,
          documents,
          completedCount: documents.filter((d) => d.completed).length,
        });
      }
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.checklist(schemeId), ctx.prev);
      toast.error(errorMessage(err));
    },
    onSuccess: (data) => {
      qc.setQueryData(keys.checklist(schemeId), data);
      void qc.invalidateQueries({ queryKey: keys.checklists });
      void qc.invalidateQueries({ queryKey: keys.applications });
    },
  });
}

export type { SchemeDetail };
