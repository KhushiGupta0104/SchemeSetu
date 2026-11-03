# Progress

_Last updated: 2026-10-16_

## Status: complete for the agreed scope, with the exceptions listed below

### Done and verified

- [x] Monorepo (npm workspaces), TypeScript, ESLint, Prettier, env templates
- [x] Express API: security middleware, CSRF, JWT cookie sessions with refresh rotation, RBAC, Zod validation, central error handling, Pino logging, health check
- [x] MongoDB models with indexes; idempotent seed (29 real records — 21 verified against official sources on 2026-10-16, 8 needs review; 4 demo); admin bootstrap script
- [x] Three-valued eligibility engine and rule validator (29 + 17 unit tests)
- [x] All 12 required pages plus info pages (About, Privacy, Terms, Disclaimer, Contact) and 404
- [x] Saved schemes, deadline tracker, document checklist, application tracker, dashboard, admin CMS with rule builder
- [x] AI explainer (Gemini) with grounded prompts and a deterministic fallback
- [x] Tests: 103 backend, 13 frontend, 4 Playwright E2E, all passing (re-run 2026-10-16); lint and type checks clean; production builds succeed
- [x] Real screenshots in `docs/screenshots/`
- [x] Docs: README, ARCHITECTURE, API, DATABASE, TESTING, DEPLOYMENT, SCHEME_SOURCES, PROJECT_REPORT; `render.yaml`; `client/vercel.json`

### Not done or not verifiable here

- [x] **Scheme audit (2026-10-16):** 21 of 29 real records verified against official sources, with corrections; 9 NSP deadlines added (see `docs/SCHEME_SOURCES.md`)
- [ ] **Remaining scheme verification:** 8 records still need review — Minorities Post-Matric, PM Internship, DDU-GKY, PM SVANidhi, PM-SYM, PM-JAY, Kanyashree and Bihar Student Credit Card
- [ ] **Cloud deployment:** no Vercel, Render or Atlas credentials were available. Follow `docs/DEPLOYMENT.md` and set the Render URL in `client/vercel.json`.
- [x] **AI with a real Gemini key (2026-10-16):** live calls succeed with `gemini-3.5-flash` (default changed from `gemini-2.5-flash`, which new keys cannot use); thinking is off by default for speed; the fallback still covers outages such as Gemini 503 "high demand" errors
- [ ] Manual screen-reader and keyboard audit (checklist in `docs/TESTING.md`)
- [ ] Fill in team names, the GitHub URL and the course details in `README.md` and `docs/PROJECT_REPORT.md`

## Resume / run commands

```bash
npm install
cp server/.env.example server/.env   # set USE_EMBEDDED_MONGO=true or MONGODB_URI, plus ADMIN_* and DEMO_USER_PASSWORD
npm run seed:demo && npm run create-admin
npm run dev:memory                    # or: npm run dev (with MONGODB_URI)
npm test && npm run test:e2e
```
