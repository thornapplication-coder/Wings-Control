# WINGS CONTROL – Prototype v0.1: Decisions, PRD Review and Next Steps

Status: clickable prototype, **synthetic test data only**, no backend, no real authentication.
Source specification: [`PRD_WINGS_CONTROL_v1_4.md`](PRD_WINGS_CONTROL_v1_4.md).

## 1. Decisions taken (product owner, 26 Nov 2026)

| Topic | Decision | Consequence |
|---|---|---|
| First increment | Clickable prototype before backend | Validate design / workflows on desktop, iPad, iPhone first; UI code is reused in the production build |
| Hosting | Local only / code in repository | No cloud project until hosting and data protection are clarified |
| Normal-user identity | Select name from a Superadmin-maintained list | Clean owner attribution; still **not** proof of identity |
| Superadmin authentication | Separate administrator password | Weaker than passkey / MFA (PRD recommendation). Keep MFA as a later upgrade path |

## 2. PRD review – inconsistencies and gaps

| # | Finding | Recommendation |
|---|---|---|
| 1 | §14 lists Instructors, Meetings, Risks as "Could have later", but the dashboard acceptance criteria require risks, decisions, training snapshot; §8.8 calls meetings a core module; §15.5 calls instructor import high priority | Re-prioritise phases; the prototype shows all modules so the order can be decided on evidence |
| 2 | §3.1 free-text name vs. "Initial team setup" allowed-user list and per-user deactivation | Resolved: list selection. Deactivation only revokes sessions of that name – anyone with the shared password can choose another name |
| 3 | §8.16 / §8.19 require record-level permissions for AI, filters and exports, but the access model gives all normal users identical access | Reword as "team sees all; only Superadmin administers". Real record-level permissions need individual accounts |
| 4 | Supabase Auth has no shared-password concept; HTTP-only cookies vs. supabase-js default token storage | Edge Function: Argon2id verify + rate limit → short-lived signed JWT with session id; RLS checks session not revoked. Superadmin: separate Supabase Auth account |
| 5 | Navigation (§7) has no entry for Risks, Decisions, Stakeholders, Action Tracker although these are full modules | Prototype adds "Action Tracker", "Risks & Decisions", "Stakeholders" to the sidebar |
| 6 | Duplicate numbering (8.10 ×2, 15.6 ×2), §8.19 after §18, §9 repeats 8.13–8.15; filename v1.4 vs. header "0.3" | Editorial clean-up in the next PRD revision |
| 7 | Meaning of "WP" bases and the `B ab` column unknown; rule for combined values ("TRE/SEN") not defined | Prototype splits on "/" (documented); `B ab` displayed raw. Confirm with data owner |
| 8 | PRD names internal job titles must not appear – applies to seed / decision-authority fields too | Decision authority uses bodies ("Management Board"), not job titles |
| 9 | §16 Q7/Q8 (which trainer data may be stored, hosting region) are blocking for real data | See §4 below |

## 3. Metric definitions (implemented in `src/lib/metrics.ts`, unit-tested)

| Metric | Definition |
|---|---|
| Fleet filter | Specific fleet keeps that fleet **and** General/Both items |
| Base filter | Items without base are not base-specific and remain visible; WP bases are distinct values |
| Open task | Status Open, In Progress, Waiting For or Blocked; not archived |
| Overdue | Open task with due date before today |
| Due soon | Open task due today … +7 days |
| Waiting For | Status Waiting For, or a dependency that is not "Received" |
| Follow-up due | Waiting item with follow-up date ≤ today |
| Dependency overdue | Waiting item with expected date < today |
| Risk score | Probability (1–5) × Impact (1–5); ≥15 critical, ≥10 high, ≥5 medium, else low |
| Pending decision | Status Proposed or Under Review |
| Unique trainers | Each trainer record counted once within the result set |
| Qualification records | One per trainer × qualification category × aircraft (TRE/SEN on A320+B737 = 4 records, 1 trainer) |
| Instructor attention | Trainer records with missing source fields (Part Time, SIM, LIFUS, ORE, authority). No expiry alerts – no verified validity data |
| Project progress | Only shown where a progress method is recorded |

## 4. Data protection – blocking before any real data

Trainer records contain employee personal data (TLC, part-time status, ORE category incl. "Rente", SIM/LIFUS performance counters).
Before importing real data:

1. Approval of hosting / processing by company IT and the data protection officer (DPA with provider, EU region).
2. Clarify works-council co-determination for a system recording employee performance data. Applicable law depends on the employing entity – to be confirmed, not assessed here.
3. Until then: synthetic data only.

## 5. What the prototype does **not** do

- No real authentication, no password hashing, no server-side authorisation (guards are UI-only).
- Data lives in the browser's local storage of one device; no sync between users.
- No file upload/parsing, no DOCX/XLSX/PPTX export (CSV and print-to-PDF only).
- No PWA offline caching / service worker; no notifications outside the app.
- No AI assistant.

## 6. Proposed next steps

1. **Design review** of the prototype on your own iPhone / iPad / desktop → list of changes.
2. Decide phase order (finding 1) and hosting route (Supabase EU vs. company infrastructure).
3. Production build Phase 1: PostgreSQL schema + migrations, shared-password Edge Function, separate admin auth, RLS + authorisation tests (incl. direct API calls), PWA manifest/service worker.
4. Trainer import from the real workbook structure once data-protection approval exists.
