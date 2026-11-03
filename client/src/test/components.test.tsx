import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemeCard } from '@/components/schemes/SchemeCard';
import { EligibilityBreakdown } from '@/components/schemes/EligibilityBreakdown';
import { SafeText } from '@/components/schemes/AiExplainer';
import { DocumentChecklist } from '@/components/forms/DocumentChecklist';
import { ApplicationStatusStepper } from '@/components/dashboard/Widgets';
import { SearchBar } from '@/components/schemes/FilterPanel';
import { ErrorState, LoadingSkeleton } from '@/components/common/States';
import { ApiError } from '@/services/api';
import type { Checklist, EligibilityResult, SchemeSummary } from '@/types';
import { mockFetch, renderWithProviders } from './utils';

const scheme: SchemeSummary = {
  id: 'abc123',
  name: 'Test Merit Scholarship',
  slug: 'test-merit-scholarship',
  shortDescription: 'A scholarship for testing.',
  category: 'education',
  tags: [],
  provider: 'Test Ministry',
  providerType: 'central_government',
  isAllIndia: false,
  applicableStates: ['Karnataka'],
  educationLevels: [],
  benefitType: 'scholarship',
  benefitSummary: '₹10,000 per year',
  applicationOpenDate: null,
  applicationDeadline: null,
  applicationWindowStatus: 'not_verified',
  windowDisplay: 'not_verified',
  deadline: { date: null, daysRemaining: null, state: 'unknown' },
  officialSourceUrl: 'https://example.org',
  applicationUrl: null,
  sourceVerifiedAt: null,
  verificationStatus: 'needs_review',
  isDemo: true,
  updatedAt: '2026-10-01T00:00:00Z',
  eligibility: { status: 'LIKELY_ELIGIBLE', passedCount: 2, failedCount: 0, unknownCount: 0, missingFields: [], hasAutomatedCriteria: true },
};

describe('SchemeCard', () => {
  it('renders key scheme information and labels', async () => {
    mockFetch();
    renderWithProviders(<SchemeCard scheme={scheme} />);
    expect(screen.getByRole('heading', { name: 'Test Merit Scholarship' })).toBeInTheDocument();
    expect(screen.getByText('Likely Eligible')).toBeInTheDocument();
    expect(screen.getByText('Demo record')).toBeInTheDocument();
    expect(screen.getByText('Karnataka')).toBeInTheDocument();
    expect(screen.getByText('Deadline not verified')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', '/schemes/test-merit-scholarship');
    expect(screen.getByRole('link', { name: /official source/i })).toHaveAttribute('href', 'https://example.org');
  });
});

const result: EligibilityResult = {
  schemeId: 'abc123',
  status: 'MORE_INFORMATION_NEEDED',
  criteria: [
    { kind: 'condition', result: 'PASS', label: 'State / UT of domicile', field: 'state', source: 'geography', requirement: 'State / UT of domicile must be one of: Karnataka', reason: 'Your state / ut of domicile (Karnataka) meets this requirement.' },
    { kind: 'condition', result: 'UNKNOWN', label: 'Annual family income', field: 'annualIncome', requirement: 'Annual family income must not exceed ₹2,50,000', reason: 'Your income bracket spans this limit.' },
  ],
  passed: [{ field: 'state', label: 'State', requirement: '', reason: '' }],
  failed: [],
  unknown: [{ field: 'annualIncome', label: 'Income', requirement: '', reason: '' }],
  missingFields: ['annualIncome'],
  additionalChecks: ['Must be a regular student'],
  hasAutomatedCriteria: true,
  evaluatedAt: '2026-10-15T00:00:00Z',
};

describe('EligibilityBreakdown', () => {
  it('shows overall status, each criterion, missing info and manual checks', () => {
    mockFetch();
    renderWithProviders(<EligibilityBreakdown result={result} />);
    expect(screen.getByText('More Info Needed')).toBeInTheDocument();
    expect(screen.getByText('1 met · 0 not met · 1 need information')).toBeInTheDocument();
    expect(screen.getByText('Your income bracket spans this limit.')).toBeInTheDocument();
    expect(screen.getByText('Annual family income', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Must be a regular student')).toBeInTheDocument();
    expect(screen.getByText(/not an\s+official decision/)).toBeInTheDocument();
  });
});

describe('SafeText (AI output rendering)', () => {
  it('renders bullets and bold but never injects HTML', () => {
    const { container } = render(<SafeText text={'**Hello** <img src=x onerror=alert(1)>\n\n- one\n- two'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('strong')).toHaveTextContent('Hello');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });
});

describe('DocumentChecklist', () => {
  it('saves the updated completion list when a document is ticked', async () => {
    const checklist: Checklist = {
      scheme: { id: 's1', name: 'Scheme One', slug: 's1', officialSourceUrl: 'https://example.org', isDemo: false },
      documents: [
        { docId: 'id-proof', name: 'Identity proof', description: '', optional: false, completed: true },
        { docId: 'income', name: 'Income certificate', description: '', optional: false, completed: false },
      ],
      completedCount: 1,
      total: 2,
      updatedAt: null,
    };
    const fetch = mockFetch((url, init) =>
      url.includes('/checklists/s1') && init?.method === 'PUT'
        ? { body: { success: true, data: { ...checklist, documents: checklist.documents.map((d) => ({ ...d, completed: true })), completedCount: 2 } } }
        : undefined,
    );
    renderWithProviders(<DocumentChecklist checklist={checklist} />);
    expect(screen.getByText('1 of 2 prepared')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /income certificate/i }));
    await waitFor(() => {
      const put = fetch.mock.calls.find(([u, i]) => String(u).includes('/checklists/s1') && i?.method === 'PUT');
      expect(put).toBeTruthy();
      expect(JSON.parse(String(put![1]!.body))).toEqual({ completedDocumentIds: ['id-proof', 'income'] });
      expect((put![1]!.headers as Record<string, string>)['X-CSRF-Token']).toBe('a'.repeat(64));
    });
  });
});

describe('ApplicationStatusStepper', () => {
  it('marks the current step', () => {
    const labels = { interested: 'Interested', preparing_documents: 'Preparing Documents', ready_to_apply: 'Ready to Apply', applied: 'Applied', under_review: 'Under Review', approved: 'Approved' };
    render(<ApplicationStatusStepper status="applied" labels={labels} />);
    expect(screen.getByRole('list', { name: 'Application progress: Applied' })).toBeInTheDocument();
    expect(screen.getByText('Applied (current)')).toBeInTheDocument();
    expect(screen.getByText('Interested (done)')).toBeInTheDocument();
  });
});

describe('SearchBar', () => {
  it('debounces input before searching', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search schemes'), { target: { value: 'scholar' } });
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(400));
    expect(onChange).toHaveBeenCalledWith('scholar');
    vi.useRealTimers();
  });
});

describe('loading and error states', () => {
  it('announces loading and offers retry on errors', async () => {
    render(<LoadingSkeleton label="Loading schemes" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading schemes');
    const retry = vi.fn();
    render(<ErrorState error={new ApiError(0, 'NETWORK_ERROR', "We couldn't reach SchemeSetu.")} onRetry={retry} />);
    expect(screen.getByText('You seem to be offline')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalled();
  });
});
