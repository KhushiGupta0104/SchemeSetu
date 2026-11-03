import { expect, test, type Page } from '@playwright/test';

const SHOTS = process.env.SCREENSHOTS === 'true';
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  // Scroll through the page so scroll-triggered entrance animations run, then settle at the top.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /^[A-Z]{1,2}/ }).first().click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
}

test('Scenario A — new user: register, profile, recommendations, save, track, checklist, persistence', async ({ page }) => {
  const email = `asha${Date.now()}@example.com`;
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your Opportunities');
  await shot(page, '01-landing');

  await page.getByRole('link', { name: 'Get Started' }).first().click();
  await page.getByLabel('Full name').fill('Asha Kumari');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Confirm password').fill('password123');
  await shot(page, '02-register');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Onboarding wizard
  await expect(page.getByRole('heading', { name: 'Basic details' })).toBeVisible();
  await page.getByLabel(/Age \(years\)/).fill('19');
  await page.getByLabel(/State \/ UT of domicile/).selectOption('Karnataka');
  await page.getByRole('radio', { name: 'Female' }).check();
  await shot(page, '03-onboarding');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Current education level/).selectOption('undergraduate');
  await page.getByLabel(/Course stream/).selectOption('engineering_technical');
  await page.getByLabel(/Current year of study/).fill('1');
  await page.getByLabel(/Marks in last exam/).fill('82');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/^Annual family income/).selectOption('2_5l_3_5l');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Review & save' })).toBeVisible();
  await page.getByRole('button', { name: /Save & see my schemes/ }).click();

  // Dashboard with real recommendations
  await expect(page.getByRole('heading', { name: 'Welcome back, Asha!' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible();
  await expect(page.locator('article').first()).toBeVisible();
  await shot(page, '04-dashboard');

  // Open a scheme with an income ceiling that the bracket crosses -> "more info needed"
  await page.goto('/schemes/demo-sample-state-merit-scholarship');
  await expect(page.getByRole('heading', { name: /Sample State Merit Scholarship/ })).toBeVisible();
  await expect(page.getByText('More Info Needed').first()).toBeVisible();
  await expect(page.getByText(/spans this limit/)).toBeVisible();
  await shot(page, '06-scheme-details-eligibility');

  await page.getByRole('button', { name: 'Save Scheme' }).click();
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Track Application' }).click();
  await expect(page.getByRole('link', { name: /Tracking: Interested/ })).toBeVisible();

  await page.getByRole('button', { name: 'View Document Checklist' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Identity proof').click();
  await expect(dialog.getByText('1 of 4 prepared')).toBeVisible();
  await page.keyboard.press('Escape');

  // Update application status
  await page.goto('/applications');
  await expect(page.getByText('not automatically synchronized with government portals')).toBeVisible();
  await page.getByLabel(/Status for/).selectOption('preparing_documents');
  await expect(page.getByText('Status updated')).toBeVisible();
  await shot(page, '10-applications');

  // Logout, log in again, verify persistence
  await logout(page);
  await login(page, email, 'password123');
  await expect(page.getByRole('heading', { name: 'Welcome back, Asha!' })).toBeVisible();
  await page.goto('/saved');
  await expect(page.getByRole('link', { name: '[DEMO] Sample State Merit Scholarship for Undergraduates', exact: true })).toBeVisible();
  await page.goto('/applications');
  await expect(page.getByLabel(/Status for/)).toHaveValue('preparing_documents');
  await page.goto('/checklist');
  await expect(page.getByText('1 of 4 prepared')).toBeVisible();
  await shot(page, '09-checklist');
  await page.goto('/deadlines');
  await expect(page.getByRole('heading', { name: 'Application deadlines' })).toBeVisible();
  await shot(page, '08-deadlines');
});

test('Scenario B — admin: create, configure eligibility, publish, edit rules, unpublish', async ({ page }) => {
  const name = `E2E Fellowship ${Date.now()}`;
  await login(page, 'admin@e2e.test', 'AdminPass12345');
  await expect(page.getByRole('heading', { name: 'Admin overview' })).toBeVisible();
  await shot(page, '11-admin-dashboard');

  await page.getByRole('link', { name: 'Add scheme' }).first().click();
  await page.getByLabel(/^Scheme name/).fill(name);
  await page.getByLabel(/^Short description/).fill('An end-to-end test fellowship record.');
  await page.getByLabel(/^Full description/).fill('A hypothetical scheme created by the automated end-to-end test suite.');
  await page.getByLabel(/^Provider name/).fill('E2E Provider');
  await page.getByLabel(/^Benefit summary/).fill('Test benefit');
  await page.getByLabel(/^Official source URL/).fill('https://example.org/e2e');
  await page.getByLabel('This is a hypothetical demo record').check();
  await page.getByLabel('Verification status').selectOption('demo');
  // Eligibility: annual income at most 3,00,000
  await page.getByRole('button', { name: 'Add condition' }).first().click();
  await page.getByLabel('Field').first().selectOption('annualIncome');
  await page.getByLabel('Operator').first().selectOption('lessThanOrEqual');
  await page.getByLabel('Value').first().fill('300000');
  await shot(page, '12-admin-editor');
  await page.getByRole('button', { name: 'Save & publish' }).click();
  await expect(page.getByText('Scheme created', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Edit scheme' })).toBeVisible();

  // Appears in public explorer
  await page.goto(`/schemes?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // Student (bracket 1L–2L) is likely eligible; admin tightens the limit -> not eligible
  const student = await page.context().browser()!.newContext();
  const sp = await student.newPage();
  await login(sp, 'student@e2e.test', 'StudentPass123');
  await expect(sp.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await sp.goto(`/schemes?q=${encodeURIComponent(name)}`);
  await sp.getByRole('link', { name: 'View Details' }).click();
  await expect(sp.getByText('Likely Eligible').first()).toBeVisible();

  await page.goto('/admin/schemes');
  await page.getByRole('link', { name: `Edit ${name}` }).click();
  await page.getByLabel('Value').first().fill('100000');
  await page.getByRole('button', { name: 'Save & keep published' }).click();
  await expect(page.getByText('Scheme updated').last()).toBeVisible();
  await sp.reload();
  await expect(sp.getByText('Not Eligible').first()).toBeVisible();

  // Unpublish -> disappears from public results
  await page.getByRole('button', { name: 'Unpublish & save draft' }).click();
  await expect(page.getByText('Scheme updated').last()).toBeVisible();
  await sp.goto(`/schemes?q=${encodeURIComponent(name)}`);
  await expect(sp.getByText('No schemes match these filters')).toBeVisible();
  await student.close();
});

test('Scenario C — security: normal user denied admin API and admin UI', async ({ page, request }) => {
  await login(page, 'student@e2e.test', 'StudentPass123');
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  const status = await page.evaluate(async () => (await fetch('/api/v1/admin/stats', { credentials: 'include' })).status);
  expect(status).toBe(403);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administrators only' })).toBeVisible();
  const anon = await request.get('http://localhost:5100/api/v1/admin/stats');
  expect(anon.status()).toBe(401);
});

test('Explorer search, filters, mobile layout and screenshots', async ({ page }) => {
  await page.goto('/schemes');
  await expect(page.getByText(/schemes? found/)).toBeVisible();
  await page.getByLabel('Search schemes').fill('scholarship');
  await expect(page).toHaveURL(/q=scholarship/);
  await page.getByRole('checkbox', { name: 'Disability Support' }).check();
  await expect(page).toHaveURL(/category=disability_support/);
  await expect(page.locator('article').first()).toBeVisible();
  await shot(page, '05-explorer');

  await login(page, 'student@e2e.test', 'StudentPass123');
  await page.goto('/schemes/aicte-pragati-scholarship-girls');
  await expect(page.getByText('Likely Eligible').first()).toBeVisible();
  await shot(page, '07-eligibility-likely');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
  await shot(page, '13-mobile-menu');
  await page.goto('/login');
});
