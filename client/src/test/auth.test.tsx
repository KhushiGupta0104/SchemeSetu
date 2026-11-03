import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import { mockFetch, renderWithProviders } from './utils';

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    const fetch = mockFetch();
    renderWithProviders(<LoginPage />, { route: '/login' });
    await userEvent.click(await screen.findByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([u]) => String(u).includes('/auth/login'))).toBe(false);
  });

  it('shows the server error for incorrect credentials', async () => {
    mockFetch((url) =>
      url.includes('/auth/login') ? { status: 401, body: { success: false, error: { code: 'UNAUTHENTICATED', message: 'Incorrect email or password.' } } } : undefined,
    );
    renderWithProviders(<LoginPage />, { route: '/login' });
    await userEvent.type(await screen.findByLabelText('Email address'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass1');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
  });

  it('toggles password visibility', async () => {
    mockFetch();
    renderWithProviders(<LoginPage />, { route: '/login' });
    const input = await screen.findByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('RegisterPage', () => {
  it('requires matching passwords and a letter+number password', async () => {
    mockFetch();
    renderWithProviders(<RegisterPage />, { route: '/register' });
    await userEvent.type(await screen.findByLabelText('Full name'), 'Asha');
    await userEvent.type(screen.getByLabelText('Email address'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'onlyletters');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Use at least one letter and one number.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('shows a duplicate-email error on the email field', async () => {
    mockFetch((url) =>
      url.includes('/auth/register') ? { status: 409, body: { success: false, error: { code: 'CONFLICT', message: 'An account with this email already exists.' } } } : undefined,
    );
    renderWithProviders(<RegisterPage />, { route: '/register' });
    await userEvent.type(await screen.findByLabelText('Full name'), 'Asha');
    await userEvent.type(screen.getByLabelText('Email address'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument());
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });
});
