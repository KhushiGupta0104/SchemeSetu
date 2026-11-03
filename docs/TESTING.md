# Testing

## How to run

```bash
npm test                 # backend + frontend unit/integration tests
npm test -w server       # backend only (Vitest + Supertest + mongodb-memory-server)
npm test -w client       # frontend only (Vitest + React Testing Library + jsdom)
npm run test:e2e         # Playwright end-to-end (starts an isolated API + in-memory DB + Vite)
npm run screenshots      # E2E run that also saves docs/screenshots/*.png
npm run lint && npm run typecheck && npm run build
```

The first backend or E2E run downloads a MongoDB binary for `mongodb-memory-server`, which needs a few hundred MB of disk space.

## Results of the last verified run (2026-10-16)

| Suite | Result |
|---|---|
| Backend: 8 files | **103 passed** |
| Frontend: 3 files | **13 passed** |
| End-to-end (Chromium) | **4 passed** |
| Lint (server and client) | 0 errors |
| Type check (server and client) | clean |
| Production builds (server `tsc`, client `vite build`) | succeeded |

## What is covered

### Backend (`server/src/tests`)

- **Eligibility engine (29 tests):** all conditions passing, one failing, missing field gives UNKNOWN, "prefer not to say",
  income bracket crossing the threshold, brackets wholly above or below, exact income overriding the bracket, OR pass, OR fail,
  root OR, nested groups (DDU-GKY-style age rules), empty root and empty nested groups, malformed rules, state-specific
  and all-India schemes, boundary values (≤, <, ages 21–24), age from DOB in IST, profile changes, rule changes, and other operators.
- **Rule validator and seed integrity:** valid trees accepted. Twelve kinds of invalid rule are rejected, including injection keys,
  excessive depth and undisclosed values used as requirements. Every real seed record passes admin validation;
  only records marked verified carry a verification date, a source-naming note and (where official) a deadline or open
  window; unverified records have none; demo records are labelled.
- **Seed eligibility (`seedEligibility.test.ts`, 9 tests):** for all 29 real records, an empty profile and a profile of
  withheld / "not sure" answers never produce "Likely eligible"; schemes without machine-checkable rules always need more
  information; and the rules corrected in the 2026-10-16 audit (Ishan Uday's strict income limit, SVMCM marks bands and
  PhD income exemption, DEPwD post-matric stopping at Master's, NMMSS Classes 9–12, AICTE Saksham first-year rule) behave
  as the official documents describe.
- **Auth:** registration with HttpOnly cookies and no hash leakage; duplicate email returns 409; validation;
  `role:"admin"` injection rejected; login with a generic error message; protected routes return 401; CSRF enforced; logout revokes refresh;
  refresh works; a tampered token is rejected; account deletion.
- **Profile:** save, merge, clear; invalid values and unknown keys such as an Aadhaar field are rejected; exact income outside its bracket is rejected.
- **Schemes:** published-only listing and pagination, regex-safe search, filters, query validation, window status honesty
  (never "open" unless verified; past deadlines flagged), detail by id or slug, 404 for drafts, personalised eligibility filter,
  recommendations, dashboard counts and deadline grouping.
- **Admin:** RBAC (401/403), creation with slug and stable doc ids, invalid rules, URLs and verification rejected,
  duplicate slug returns 409, Scenario B (publish, then edit rules and see the result change, then unpublish), merged re-validation,
  verification date requirement, filters, aggregate-only stats, and safe deletion.
- **User data:** idempotent saves and persistence across logout and login, Scenario C ownership (another user's application returns 404),
  application history and validation, and checklist persistence when admins add or remove documents. Checklists are private per user.
- **AI:** login required, grounded fallback without a key, model path, fallback on model error, input limits, and prompt-injection delimiter neutralisation.

### Frontend (`client/src/test`)

Login validation, incorrect-password message, password visibility toggle, registration validation and duplicate email,
SchemeCard rendering, EligibilityBreakdown rendering, safe AI text rendering (no HTML injection), checklist interaction
(PUT payload and CSRF header), status stepper, debounced search, loading and error states, and the full onboarding wizard
(validation, step navigation, review and submit payload).

### End-to-end (`e2e/scenarios.spec.ts`)

- **Scenario A — new user:** landing, register, four-step onboarding, dashboard recommendations, scheme with a "more info needed"
  income check, save, track, tick a checklist item, AI fallback answer, change status, log out, log in, then confirm saved,
  status and checklist all persisted, and visit deadlines.
- **Scenario B — admin:** create a scheme with the visual rule builder and publish it; it appears in the explorer; a student
  sees "Likely Eligible"; the admin tightens the rule and the student sees "Not Eligible"; the admin unpublishes and the scheme
  disappears for the student.
- **Scenario C — security:** a student calling `/admin/stats` gets 403, the admin UI shows "Administrators only", and an anonymous call gets 401.
- **Explorer and mobile:** search and filters synced to the URL, a likely-eligible breakdown, and the mobile menu at 390 px width.

## Manual checklist (not automated)

- [ ] Keyboard-only walkthrough of onboarding, explorer filters (desktop sidebar and mobile sheet) and the admin rule builder.
- [ ] Screen reader spot check (NVDA/VoiceOver) of the eligibility breakdown and toasts.
- [x] AI explainer with a real `GEMINI_API_KEY` (2026-10-16, model `gemini-3.5-flash`, thinking budget 0): the eligibility, Hindi and prompt-injection questions all returned `source: "ai"` in 2–3 s, the answers stayed within the stored record, and the injection attempt was refused. The key was confirmed absent from responses, logs and the client bundle. Note: `gemini-2.5-flash` returns 404 for newly created keys, which is why the default model changed.
- [ ] Deployed environment: cookies, CORS and the Vercel → Render rewrite. This was **not run** because no deployment credentials were available.
- [ ] Recheck the real scheme records against official sources and mark them verified in the admin panel.
