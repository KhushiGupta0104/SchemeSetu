# Scheme Sources & Data Integrity

## Audit of 2026-10-16: summary

The 29 real scheme records in `server/src/seed/data/realSchemes.ts` were checked against official government or provider
sources on **2026-10-16**. The table below covers every record.

| Result | Count |
|---|---|
| **Verified** (checked against an official document; corrections applied where needed) | **21** |
| of which **corrected** during the audit (from small wording/URL fixes to changed rules) | 21 |
| **Needs review** (official source unreachable, unreadable, or did not confirm the facts) | **8** |

### Rules used for the audit

- **Verified** means the scheme's eligibility conditions, income limit, applicable states, benefits and application route
  were read on an official source: a ministry/department website, a scheme portal, or a guideline PDF published there.
  The record's `verificationNotes` name the document, and `sourceVerifiedAt` is `2026-10-16`.
- Press releases, news sites, aggregators and search-engine summaries were **not** accepted as verification. They are
  mentioned only in the notes of records that remain under review.
- **Deadlines** were added only where the official portal states them. That happened for 9 schemes listed on the National
  Scholarship Portal's AY 2026-27 list (scholarships.gov.in/All-Scholarships). Every other record keeps
  `applicationDeadline: null` and `applicationWindowStatus: "not_verified"`. After 31-10-2026 the app automatically shows
  these deadlines as "deadline passed".
- **Required-document lists** are guidance for the user's checklist. Where a guideline lists documents (for example DEPwD,
  ST scholarships and Top Class SC), the list follows it; elsewhere it gives the typical documents the portal asks for.
- **Nothing was invented.** Where an official source was silent, the claim was removed or flagged ("not confirmed from the
  official site"). Examples are the Mudra and Stand-Up "not a defaulter" condition and the PM-SYM EPF/NPS exclusion.
- **Guideline age.** Several official guidelines still linked by the portals are older documents: AICTE (July 2020),
  YASASVI and ST Pre-Matric (period 2021-22 to 2025-26). The notes say so, so an administrator can check for revisions.

### Unknown data never produces "Likely eligible"

The engine uses three-valued logic. A missing, "prefer not to say" or "not sure" answer evaluates to UNKNOWN, and
UNKNOWN can never become "Likely eligible". Schemes with no machine-checkable rules always return "More information
needed". Mudra was changed to this mode because its official page states no age or employment rule. Conditions a profile
cannot capture appear under "Check these yourself". `server/src/tests/seedEligibility.test.ts` checks these guarantees
against all 29 real records:
- An empty profile never gets "Likely eligible".
- A profile of withheld answers never gets "Likely eligible".
- The corrected rules give the expected results.

## Records, sources and status

Status key: ✅ verified · ✏️ corrected during the audit · ⚠️ needs review. All verification dates are 2026-10-16.
"NSP" means the official National Scholarship Portal, `https://scholarships.gov.in`.

| # | Scheme | Status | Official source checked | What changed / why not verified |
|---|---|---|---|---|
| 1 | PM-USP Central Sector Scheme of Scholarship for College and University Students | ✅✏️ | NSP guideline `CSSS_GUIDLINES_07022024_updated.pdf` + NSP AY 2026-27 list | Official name; exact rates (₹12,000 / ₹20,000); renewal rules (50% marks, 75% attendance). **AY 2026-27 is listed for renewals only**, 01-06-2026 to 31-10-2026. |
| 2 | National Means-cum-Merit Scholarship Scheme (NMMSS) | ✅✏️ | NSP guideline `NMMSSGuidelines.pdf` (March 2022 revision) + NSP list | Education levels limited to Classes 9–12; excluded school types per guideline (Sainik Schools removed, as the guideline doesn't name them); renewal conditions. Window 01-06-2026 to 31-10-2026. |
| 3 | Post Matric Scholarship for SC Students (PMS-SC) | ✅✏️ | socialjustice.gov.in/schemes/25 → PMS-SC Scheme Guidelines (revised March 2021) | Added the official academic-allowance table (₹2,500–₹13,500/yr) and the state portal / Freeship Card route. Dates are set by states. |
| 4 | Pre-Matric Scholarship for SC Students (Classes 9–10) | ✅✏️ | socialjustice.gov.in/schemes/23 | Added official rates (₹3,500 day scholar / ₹7,000 hosteller per year) and the NSP-then-state-portal route. |
| 5 | Post Matric Scholarship for ST Students | ✅✏️ | tribal.nic.in Post-matric guidelines (15-03-2023) + scheme page | Added stipend table (₹230–₹1,200/month), private-institution fee caps and the Top Class institute exclusion. |
| 6 | Pre-Matric Scholarship for ST Students (Classes 9–10) | ✅✏️ | tribal.nic.in Pre-matric guidelines (17-10-2022, period 2021-22 to 2025-26) | Added official rates (₹225 / ₹525 per month for 10 months). |
| 7 | PM YASASVI Post-Matric Scholarship for OBC, EBC and DNT | ✅✏️ | socialjustice.gov.in/schemes/101 → PM YASASVI guidelines (2021-22 to 2025-26), Part B | Added the two-boys-per-parents limit and the Freeship Card route. The guideline period ends 2025-26, but the scheme is still listed on the Ministry page. |
| 8 | Central Sector Scholarship of Top Class Education for SC Students | ✅✏️ | NSP guideline `Top_Class_Education_Scheme_2018.pdf` (applicable from 2025-26) + NSP list | Exact benefits (full tuition, capped at ₹2 lakh at private institutions; ₹86,000 / ₹41,000 allowance); first-year-only fresh awards; two-sibling limit. Window 01-06-2026 to 31-10-2026. |
| 9 | Post Matric Scholarship Scheme for Minorities | ⚠️ | minorityaffairs.gov.in scheme document `RTF1984/1672032313.pdf` | The document matches the ₹2 lakh / 50% rules, but it is undated, the Ministry page was last updated in August 2022, and the scheme is **not in the NSP AY 2026-27 list**. Current status unconfirmed. |
| 10 | Ishan Uday — Special Scholarship Scheme for NER | ✅✏️ | NSP guideline `Guidelines_ISHAN UDAY_2324.pdf` (UGC) + NSP list | **Benefit corrected** to a flat ₹8,000/month for 10 months (the old record wrongly listed course-dependent rates). **Income limit corrected** to strictly below ₹4.5 lakh. Window 16-09-2026 to 31-10-2026. |
| 11 | AICTE Pragati Scholarship (Girls) | ✅✏️ | NSP guidelines `AICTE_2010_G.pdf` (degree) and `AICTE_2011_G.pdf` (diploma), July 2020 + NSP list | Confirmed ₹50,000/yr, ₹8 lakh income limit and two girls per family; added the 2-year gap rule and the no-other-assistance rule. Window 01-06-2026 to 31-10-2026. |
| 12 | AICTE Saksham Scholarship (Specially-abled) | ✅✏️ | NSP guidelines `AICTE_2012_G.pdf` / `AICTE_2013_G.pdf`, July 2020 + NSP list | **Added the first-year / lateral-entry condition to the automated rules** (it was missing). Window 01-06-2026 to 31-10-2026. |
| 13 | Post-Matric Scholarship for Students with Disabilities | ✅✏️ | NSP guideline `DEPDGuidelines_1.pdf` (DEPwD OM of 25-09-2024) + NSP list | **PhD removed**: the scheme covers courses up to Master's level. Added official rates. Window 25-07-2026 to 31-10-2026. |
| 14 | Pre-Matric Scholarship for Students with Disabilities | ✅✏️ | same DEPwD guideline + NSP list | Added official rates and conditions. Window 25-07-2026 to 31-10-2026. |
| 15 | Top Class Education for Students with Disabilities | ✅✏️ | same DEPwD guideline + NSP list | Added official rates (fees up to ₹1.90 lakh, ₹45,000 computer grant, etc.). Window 01-06-2026 to 31-10-2026. |
| 16 | PM Internship Scheme | ⚠️ | pminternship.mca.gov.in | The portal is a JavaScript app whose eligibility text could not be read. PIB releases on the 2024-25 pilot match the record, but they describe the pilot and are not treated as verification. |
| 17 | Deen Dayal Upadhyaya Grameen Kaushalya Yojana | ⚠️ | ddugky.gov.in, ddugky.rural.gov.in, rural.gov.in | Unreachable or empty from the audit environment. |
| 18 | PM Vishwakarma | ✅✏️ | pmvishwakarma.gov.in (Eligibility, Eligible Trades, Benefits) | Exact amounts (₹500/day stipend, ₹15,000 toolkit, ₹1 lakh + ₹2 lakh loans at 5%); the full list of 18 trades; the "past 5 years" loan rule. |
| 19 | PM-KISAN | ✅✏️ | pmkisan.gov.in (About, Scheme Exclusion) | Replaced the summary with the full official exclusion list. |
| 20 | PM SVANidhi | ⚠️ | pmsvanidhi.mohua.gov.in | The portal announces enhanced loan limits and Census Town eligibility, but its FAQ still shows old amounts and no current guideline was found. |
| 21 | Pradhan Mantri Mudra Yojana | ✅✏️ | mudra.org.in | **Added Tarun Plus** (up to ₹20 lakh). **Removed the age, employment-status and "not a defaulter" conditions**, which the official page does not state, so the scheme now always shows "More information needed". |
| 22 | Stand-Up India | ✅✏️ | standupmitra.in | Confirmed ₹10 lakh–₹1 crore, SC/ST or woman above 18, greenfield, 51% rule. Removed the unconfirmed "not a defaulter" condition; the caste certificate is now SC/ST-only. |
| 23 | PM Shram Yogi Maan-dhan | ⚠️ | maandhan.in | Age 18–40, income ≤ ₹15,000/month and the ₹3,000 pension are confirmed, but the EPF/NPS/ESIC/income-tax exclusions could not be found on the official site. They are now marked "not confirmed". |
| 24 | Atal Pension Yojana | ✅✏️ | pfrda.org.in/schemes/atal-pension-yojana-apy | All facts confirmed; the source URL now points to the scheme page and the benefit wording follows the official text. |
| 25 | Ayushman Bharat PM-JAY | ⚠️ | nha.gov.in, pmjay.gov.in, beneficiary.nha.gov.in | Timed out or returned an empty app shell. |
| 26 | Kanyashree Prakalpa (West Bengal) | ⚠️ | kanyashree.wb.gov.in (new portal); wbkanyashree.gov.in timed out | The new portal confirms the K1/K2 structure, but its eligibility and FAQ pages load dynamically. Amounts, age window and any income limit are unconfirmed. The source URL was updated to the reachable portal. |
| 27 | Swami Vivekananda Merit-cum-Means Scholarship (West Bengal) | ✅✏️ | svmcm.wb.gov.in (About Us (Guidelines), FAQ) | **Marks thresholds corrected** (60% school/UG, 53% PG, 55% PG engineering). **No income ceiling for M.Phil/PhD.** ITI removed. Exact monthly rates (₹1,000–₹8,000) added. Portal URL updated (the old svmcm.wbhed.gov.in did not respond). |
| 28 | Bihar Student Credit Card Scheme | ⚠️ | 7nishchay-yuvaupmission.bihar.gov.in → `resources/Student_credit_card_guideline.pdf` (2016) | Only the original 2016 guideline is published. It confirms ₹4 lakh, Class 12 from Bihar and a maximum age of 25, but later amendments aren't available, so current terms are unconfirmed. |
| 29 | Pudhumai Penn (Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme) | ✅✏️ | tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn | Added the first-course-only rule, compatibility with other scholarships and the direct "Penkalvi" application route. The source URL now points to the department page; the application portal pudhumaipenn.tn.gov.in did not respond. |

### Full official source URLs

| # | URL |
|---|---|
| 1 | https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf |
| 2 | https://scholarships.gov.in/public/schemeGuidelines/NMMSSGuidelines.pdf |
| 3 | https://socialjustice.gov.in/schemes/25 (guideline: https://socialjustice.gov.in/writereaddata/UploadFile/PMS_for_SCs_Scheme_Guidelines.pdf) |
| 4 | https://socialjustice.gov.in/schemes/23 |
| 5 | https://tribal.nic.in/downloads/guidelines/post-matric/Post-matric-guidelines-15032023.pdf |
| 6 | https://tribal.nic.in/downloads/guidelines/pre-matric/guidelines-Pre-matric-17-Oct-2022.pdf |
| 7 | https://socialjustice.gov.in/schemes/101 |
| 8 | https://scholarships.gov.in/public/schemeGuidelines/Top_Class_Education_Scheme_2018.pdf |
| 9 | https://www.minorityaffairs.gov.in/show_content.php?lang=1&level=2&ls_id=163&lid=165 |
| 10 | https://scholarships.gov.in/public/schemeGuidelines/Guidelines_ISHAN%20UDAY_2324.pdf |
| 11 | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf |
| 12 | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf |
| 13–15 | https://scholarships.gov.in/public/schemeGuidelines/DEPDGuidelines_1.pdf |
| 16 | https://pminternship.mca.gov.in |
| 17 | https://ddugky.gov.in |
| 18 | https://pmvishwakarma.gov.in |
| 19 | https://pmkisan.gov.in |
| 20 | https://pmsvanidhi.mohua.gov.in |
| 21 | https://www.mudra.org.in |
| 22 | https://www.standupmitra.in |
| 23 | https://maandhan.in |
| 24 | https://www.pfrda.org.in/schemes/atal-pension-yojana-apy |
| 25 | https://nha.gov.in (beneficiary portal https://beneficiary.nha.gov.in) |
| 26 | https://kanyashree.wb.gov.in |
| 27 | https://svmcm.wb.gov.in/page/about.php |
| 28 | https://www.7nishchay-yuvaupmission.bihar.gov.in |
| 29 | https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn |

## How the audit was done

- **Fetching pages.** Pages and PDFs were fetched directly from the official hosts and converted to text with `pdftotext`.
  Two scanned PDFs (the PMS-SC guideline and a PM SVANidhi letter) were read from their embedded page images.
- **Bihar guideline.** The Bihar guideline is in Kruti Dev–encoded Hindi and was read directly.
- **Where the dates come from.** The NSP scheme list showed, for each scheme, "Scheme Open from" and "Student
  Application Open till" for AY 2026-27. Those dates are the only deadlines in the dataset.
- **Unreachable sites.** Some state and NHA sites did not respond from the audit environment, possibly because of
  geo-restriction. Retry them from India before concluding anything.

## Verification workflow for administrators (for the 8 records still under review, and for re-checks)

1. Open **Admin → Manage Schemes** and filter by *Verification: Needs review*.
2. Open the official source URL and compare the eligibility rules, benefits, documents, steps and links.
3. Correct anything that differs. Only add a deadline or set the window to "open" if the official source states it.
4. Click **Mark verified today**, add a verification note naming the page you checked, and save.
5. The dashboard flags verified records for re-checking 180 days after `sourceVerifiedAt`, which is April 2027 for this
   audit. Re-check the NSP dates for the next academic year in any case.
6. If you edit records in the admin panel, note that `cd server && npm run seed -- --update` would overwrite them with the seed file.
   Copy the changes into `realSchemes.ts` as well.

## Demo records

The 4 `[DEMO]` schemes are **hypothetical**. They point to `example.org`, carry `isDemo: true` and
`verificationStatus: "demo"`, and the validator forbids marking them verified.

Reference portals: https://scholarships.gov.in · https://www.myscheme.gov.in · https://www.india.gov.in
