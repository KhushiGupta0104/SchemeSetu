# API Reference — `/api/v1`

## Conventions

- **Success:** `{ "success": true, "data": …, "meta"?: { page, limit, total, totalPages } }`
- **Error:** `{ "success": false, "error": { "code", "message", "details"?: [{ "path", "message" }] } }`
- **Error codes:** `VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `TOKEN_EXPIRED` 401 · `FORBIDDEN` 403 ·
  `CSRF_INVALID` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `RATE_LIMITED` 429 · `SERVICE_UNAVAILABLE` 503 · `INTERNAL_ERROR` 500
- **Auth:** HttpOnly cookies (`ss_at` access, `ss_rt` refresh). Send requests with credentials.
- **CSRF:** every `POST/PUT/PATCH/DELETE` must include `X-CSRF-Token: <token from GET /auth/csrf>`.
- **Auth column:** – public · 🔓 optional (personalised when logged in) · 🔒 logged in · 🛡 admin.
- Unknown body keys are rejected (strict schemas). ObjectIds are validated.

## Health & metadata

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` (no prefix) | – | `{ status, database }`. Returns 503 if the database is down. |
| GET | `/meta` | – | Option lists, eligibility field definitions, operators and labels |

## Authentication

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/auth/csrf` | – | – | `{ csrfToken }` and sets the `ss_csrf` cookie |
| POST | `/auth/register` | – | `{ name, email, password }` | 201 `{ user }`, sets cookies. 409 duplicate email. Password needs 8+ characters with a letter and a digit. Rate-limited. |
| POST | `/auth/login` | – | `{ email, password }` | 200 `{ user }`. 401 "Incorrect email or password." Rate-limited. |
| POST | `/auth/refresh` | cookie | – | Rotates tokens. 401 clears cookies. |
| POST | `/auth/logout` | – | – | Revokes refresh tokens and clears cookies |
| GET | `/auth/me` | 🔒 | – | `{ user: { id, name, email, role, onboardingCompleted, createdAt } }` |
| DELETE | `/auth/account` | 🔒 | `{ password }` | Deletes the user, saved schemes, applications and checklists |

## Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | 🔒 | `{ name, email, profile, onboardingCompleted, completion }` |
| PUT | `/profile` | 🔒 | `{ name?, profile?, completeOnboarding? }` |

Profile fields are all optional, and `null` clears a field: `dateOfBirth` (YYYY-MM-DD) or `age`, `state`, `district`, `gender`,
`residenceType`, `educationLevel`, `course`, `courseStream`, `institutionType`, `academicYear`, `previousExamPercentage`,
`incomeBracket`, `annualIncome` (must fall within the bracket), `socialCategory`, `minorityCommunity`, `disabilityStatus`,
`employmentStatus`, `occupation`. Allowed values are listed in `GET /meta`.

## Schemes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/schemes` | 🔓 | Paginated published schemes. Query: `q`, `category` (csv), `state`, `educationLevel`, `providerType` (csv), `benefitType` (csv), `eligibility` (csv of statuses, when logged in), `hasDeadline=true\|false`, `acceptingOnly=true`, `includeDemo=false`, `sort=relevance\|deadline\|verified\|name`, `page`, `limit≤50`. Each item includes `eligibility` (when logged in), `isSaved`, `deadline { daysRemaining, state }` and `windowDisplay`. |
| GET | `/schemes/:idOrSlug` | 🔓 | Full details and `personal { isSaved, application }`. Returns 404 for drafts or unknown ids. |
| GET | `/schemes/:id/eligibility` | 🔒 | Engine result: `{ schemeId, status, criteria[], passed[], failed[], unknown[], missingFields[], additionalChecks[], hasAutomatedCriteria, evaluatedAt }` |
| GET | `/recommendations` | 🔒 | `{ likelyEligible[], moreInformationNeeded[], notEligibleCount, impactfulMissingFields[], profileCompletion }` |
| GET | `/deadlines?scope=all\|mine` | 🔓 (`mine` requires 🔒) | `{ today, upcoming[], expired[], unknown[] }` |
| GET | `/dashboard` | 🔒 | Counts, recommended, upcoming deadlines (30 days), status counts, recent activity, profile completion |

Example eligibility criterion:

```json
{ "kind": "condition", "result": "UNKNOWN", "field": "annualIncome", "label": "Annual family income",
  "requirement": "Annual family income must not exceed ₹3,00,000",
  "reason": "Your income bracket (₹2,50,001 – ₹3,50,000) spans this limit, so we can't tell for sure. …",
  "missingField": "annualIncome", "source": "rule" }
```

## Saved schemes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/saved?q=` | 🔒 | `[{ schemeId, savedAt, available, scheme }]` |
| POST | `/saved` | 🔒 | `{ schemeId }`. 201 when created, 200 if already saved (idempotent). 404 for unpublished schemes. |
| DELETE | `/saved/:schemeId` | 🔒 | 404 if not saved |

## Applications (user-maintained)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/applications` | 🔒 | Own applications, with scheme summary and checklist progress |
| POST | `/applications` | 🔒 | `{ schemeId, status?, notes? }`. 409 if already tracked. |
| GET | `/applications/:id` | 🔒 | Another user's id returns **404** |
| PATCH | `/applications/:id` | 🔒 | `{ status?, appliedAt? (YYYY-MM-DD or null, not in the future), notes?, statusNote? }`. A status change appends to `statusHistory`. |
| DELETE | `/applications/:id` | 🔒 | Ownership-scoped |

Statuses: `interested`, `preparing_documents`, `ready_to_apply`, `applied`, `under_review`, `approved`, `rejected`, `closed`.

## Checklists

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/checklists` | 🔒 | Summary for saved and tracked schemes: `{ scheme, tracked, applicationStatus, completed, total }` |
| GET | `/checklists/:schemeId` | 🔒 | `{ scheme, documents[{docId,name,description,optional,completed}], completedCount, total }` |
| PUT | `/checklists/:schemeId` | 🔒 | `{ completedDocumentIds: string[] }`. Ids no longer required are ignored. |

## Admin (🛡 every route — 401 anonymous, 403 non-admin)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Totals (all, published, draft, deadlines in 30 days, needs verification, demo, registered users), counts by category, recently updated. Aggregates only. |
| GET | `/admin/schemes` | Query: `q`, `publicationStatus`, `verificationStatus`, `category`, `sort=updated\|name\|deadline`, `page`, `limit≤100`. Includes drafts. |
| POST | `/admin/schemes` | Create (full schema, see below). 409 if the slug is taken. |
| GET | `/admin/schemes/:id` | Full record, including drafts |
| PATCH | `/admin/schemes/:id` | Partial update. The merged document is re-validated in full. |
| DELETE | `/admin/schemes/:id` | Removes bookmarks and checklists. Keeps users' application records, marked unavailable. |

Scheme fields: `name`, `slug?`, `shortDescription`, `description`, `category`, `tags[]`, `provider`, `providerType`,
`isAllIndia`, `applicableStates[]`, `educationLevels[]`, `benefitType`, `benefitSummary`, `benefits[]`,
`eligibilityRules`, `additionalCriteria[]`, `requiredDocuments[{docId?,name,description?,optional?}]`, `applicationSteps[]`,
`applicationOpenDate`, `applicationDeadline`, `applicationWindowStatus`, `officialSourceUrl`, `applicationUrl`,
`sourceVerifiedAt`, `verificationStatus` (`verified` requires `sourceVerifiedAt`; demo records cannot be `verified`),
`verificationNotes`, `isDemo`, `publicationStatus`.

Rule tree:

```json
{ "op": "all", "conditions": [
  { "field": "annualIncome", "operator": "lessThanOrEqual", "value": 250000 },
  { "op": "any", "conditions": [
    { "field": "gender", "operator": "equals", "value": "female" },
    { "field": "socialCategory", "operator": "in", "value": ["sc", "st"] } ] } ] }
```

Operators: `equals`, `notEquals`, `in`, `notIn` (enum fields); `greaterThan`, `greaterThanOrEqual`, `lessThan`,
`lessThanOrEqual`, `equals`, `notEquals` (number fields); and `exists` (any field).
