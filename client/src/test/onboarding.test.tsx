import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm, toFormValues, toPayload } from '@/components/forms/ProfileForm';
import { meta } from './utils';

describe('ProfileForm (onboarding wizard)', () => {
  it('moves through steps, validates, shows a review and submits', async () => {
    const onSubmit = vi.fn();
    render(<ProfileForm meta={meta} initial={toFormValues('Asha', {})} mode="wizard" submitting={false} onSubmit={onSubmit} />);

    expect(screen.getByRole('heading', { name: 'Basic details' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Age \(years\)/), '200');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByText('Age must be a whole number between 5 and 120.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/Age \(years\)/));
    await userEvent.type(screen.getByLabelText(/Age \(years\)/), '19');
    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('heading', { name: 'Education' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('heading', { name: 'Financial & eligibility' })).toBeInTheDocument();
    await userEvent.selectOptions(await screen.findByLabelText(/^Annual family income/), '1l_2l');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByRole('heading', { name: 'Review & save' })).toBeInTheDocument();
    expect(await screen.findByText('19')).toBeInTheDocument();
    expect(screen.getByText('₹1,00,001 – ₹2,00,000')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /save & see my schemes/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = toPayload(onSubmit.mock.calls[0][0]);
    expect(payload.profile).toMatchObject({ age: 19, gender: 'female', incomeBracket: '1l_2l', state: null, dateOfBirth: null });
  });
});
