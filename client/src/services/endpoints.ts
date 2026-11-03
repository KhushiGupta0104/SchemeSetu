import { api, apiData } from './api';
import type {
  AdminSchemeDetail,
  AdminSchemeRow,
  AdminStats,
  Application,
  Checklist,
  ChecklistSummary,
  DashboardData,
  DeadlinesResponse,
  EligibilityResult,
  Meta,
  Profile,
  ProfileResponse,
  Recommendations,
  SavedItem,
  SchemeDetail,
  SchemeInput,
  SchemeSummary,
  User,
} from '@/types';

export interface SchemeFilters {
  q?: string;
  category?: string[];
  state?: string;
  educationLevel?: string;
  providerType?: string[];
  benefitType?: string[];
  eligibility?: string[];
  hasDeadline?: 'true' | 'false';
  acceptingOnly?: 'true';
  includeDemo?: 'false';
  sort?: string;
  page?: number;
  limit?: number;
}

export const AuthApi = {
  me: () => apiData<{ user: User }>('/auth/me'),
  login: (body: { email: string; password: string }) => apiData<{ user: User }>('/auth/login', { method: 'POST', body }),
  register: (body: { name: string; email: string; password: string }) =>
    apiData<{ user: User }>('/auth/register', { method: 'POST', body }),
  logout: () => apiData<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  deleteAccount: (password: string) => apiData<{ deleted: boolean }>('/auth/account', { method: 'DELETE', body: { password } }),
};

export const MetaApi = { get: () => apiData<Meta>('/meta') };

export const ProfileApi = {
  get: () => apiData<ProfileResponse>('/profile'),
  update: (body: { name?: string; profile?: Partial<Record<keyof Profile, unknown>>; completeOnboarding?: boolean }) =>
    apiData<ProfileResponse>('/profile', { method: 'PUT', body }),
};

export const SchemeApi = {
  list: (filters: SchemeFilters) => api<SchemeSummary[]>('/schemes', { query: { ...filters } }),
  get: (id: string) => apiData<SchemeDetail>(`/schemes/${encodeURIComponent(id)}`),
  eligibility: (id: string) => apiData<EligibilityResult>(`/schemes/${encodeURIComponent(id)}/eligibility`),
  recommendations: () => apiData<Recommendations>('/recommendations'),
  deadlines: (scope: 'all' | 'mine') => apiData<DeadlinesResponse>('/deadlines', { query: { scope } }),
  dashboard: () => apiData<DashboardData>('/dashboard'),
};

export const SavedApi = {
  list: (q?: string) => apiData<SavedItem[]>('/saved', { query: { q } }),
  save: (schemeId: string) => apiData<{ saved: boolean }>('/saved', { method: 'POST', body: { schemeId } }),
  remove: (schemeId: string) => apiData<{ saved: boolean }>(`/saved/${schemeId}`, { method: 'DELETE' }),
};

export const ApplicationApi = {
  list: () => apiData<Application[]>('/applications'),
  create: (body: { schemeId: string; status?: string; notes?: string }) =>
    apiData<Application>('/applications', { method: 'POST', body }),
  update: (id: string, body: { status?: string; appliedAt?: string | null; notes?: string; statusNote?: string }) =>
    apiData<Application>(`/applications/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiData<{ deleted: boolean }>(`/applications/${id}`, { method: 'DELETE' }),
};

export const ChecklistApi = {
  list: () => apiData<ChecklistSummary[]>('/checklists'),
  get: (schemeId: string) => apiData<Checklist>(`/checklists/${schemeId}`),
  update: (schemeId: string, completedDocumentIds: string[]) =>
    apiData<Checklist>(`/checklists/${schemeId}`, { method: 'PUT', body: { completedDocumentIds } }),
};

export const AdminApi = {
  stats: () => apiData<AdminStats>('/admin/stats'),
  list: (query: Record<string, string | number | undefined>) => api<AdminSchemeRow[]>('/admin/schemes', { query }),
  get: (id: string) => apiData<AdminSchemeDetail>(`/admin/schemes/${id}`),
  create: (body: SchemeInput) => apiData<AdminSchemeDetail>('/admin/schemes', { method: 'POST', body }),
  update: (id: string, body: Partial<SchemeInput>) => apiData<AdminSchemeDetail>(`/admin/schemes/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiData<{ removedBookmarks: number; retainedApplications: number }>(`/admin/schemes/${id}`, { method: 'DELETE' }),
};
