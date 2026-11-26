# WINGS CONTROL

Training-management cockpit (PWA) for a small airline training-management team – A320 and B737 MAX.

> **Current state: clickable prototype v0.1** – synthetic test data, no backend, no real authentication.
> Specification: [`docs/PRD_WINGS_CONTROL_v1_4.md`](docs/PRD_WINGS_CONTROL_v1_4.md) · Review & decisions: [`docs/prototype-review.md`](docs/prototype-review.md)

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build:single   # dist-single/index.html – one self-contained file, opens without a server
npm test               # unit tests (metrics, counting rules, CSV safety, seed data)
npm run test:e2e       # browser smoke test of core flows (Playwright)
```

## Prototype walkthrough

1. Access screen: select a name, enter any non-empty password (prototype – nothing is stored or checked).
2. Administration: profile menu → *Administrator sign-in* (separate credential, any non-empty value in the prototype).
3. *Settings → Reset to test dataset* restores the synthetic data.

## Structure

| Path | Content |
|---|---|
| `src/types.ts` | Domain model (mirrors PRD §11 logical schema) |
| `src/mock/seed.ts` | Synthetic, deterministic test dataset |
| `src/store/store.ts` | Prototype state + actions (to be replaced by the Supabase data layer) |
| `src/lib/metrics.ts` | All KPI / filter / counting definitions |
| `src/pages/` | Dashboard, Projects, Action Tracker, Instructors, Training, Compliance, Meetings, Risks & Decisions, Stakeholders, Knowledge Base, Reports, Weekly Report, Administration |

## Design

Eurowings corporate palette (Light/Dark Burgundy, Skyblue, greys) from the EW brand reference; status colours use classic red/amber/green per the EW status-report rule. Typeface: Mulish (official free fallback for the Eurowings font). Pictograms from the official Eurowings icon library; UI control glyphs from Lucide.
