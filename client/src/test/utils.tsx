import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import type { Meta } from '@/types';

export const meta: Meta = {
  states: [{ value: 'Karnataka', label: 'Karnataka' }],
  genders: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }],
  residenceTypes: [{ value: 'rural', label: 'Rural' }, { value: 'urban', label: 'Urban' }],
  educationLevels: [{ value: 'undergraduate', label: 'Undergraduate degree' }],
  courseStreams: [{ value: 'general', label: 'General' }],
  institutionTypes: [{ value: 'government', label: 'Government' }],
  employmentStatuses: [{ value: 'student', label: 'Student' }],
  occupations: [{ value: 'none', label: 'None' }],
  incomeBrackets: [{ value: '1l_2l', label: '₹1,00,001 – ₹2,00,000' }],
  socialCategories: [{ value: 'general', label: 'General' }],
  minorityCommunities: [{ value: 'none', label: 'None' }],
  disabilityStatuses: [{ value: 'none', label: 'No disability' }],
  schemeCategories: [{ value: 'education', label: 'Education' }],
  providerTypes: [{ value: 'central_government', label: 'Central Government' }],
  benefitTypes: [{ value: 'scholarship', label: 'Scholarship' }],
  verificationStatuses: [],
  windowStatuses: [],
  publicationStatuses: [],
  applicationStatuses: [
    { value: 'interested', label: 'Interested' },
    { value: 'preparing_documents', label: 'Preparing Documents' },
    { value: 'ready_to_apply', label: 'Ready to Apply' },
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'closed', label: 'Closed / Withdrawn' },
  ],
  eligibilityFields: [{ key: 'annualIncome', label: 'Annual family income', type: 'number', unit: 'inr', hint: '' }],
  operatorsByType: { enum: ['equals'], number: ['lessThanOrEqual'] },
  operatorLabels: { equals: 'is', lessThanOrEqual: 'is at most' },
};

type Handler = (url: string, init?: RequestInit) => { status?: number; body: unknown } | undefined;

/** Mocks fetch: routes by URL substring; unmatched /auth/me returns 401 (logged out). */
export function mockFetch(handler: Handler = () => undefined) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const custom = handler(url, init);
    let res: { status?: number; body: unknown };
    if (custom) res = custom;
    else if (url.includes('/auth/csrf')) res = { body: { success: true, data: { csrfToken: 'a'.repeat(64) } } };
    else if (url.includes('/auth/me')) res = { status: 401, body: { success: false, error: { code: 'UNAUTHENTICATED', message: 'Please log in' } } };
    else if (url.includes('/meta')) res = { body: { success: true, data: meta } };
    else res = { status: 404, body: { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } } };
    return new Response(JSON.stringify(res.body), { status: res.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  qc.setQueryData(['meta'], meta);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
