# Feature: production-reliability

## Objective

Restore reliable production login, direct-route reloads, and driver visibility using root-cause fixes with named regression evidence.

## Incident classification

| Failure                                   | Bucket                               | Root class                                                                             | Evidence                                                                                                                          |
| ----------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Login rejects a newly registered username | C, hosted-state hypothesis to verify | Synthetic Auth account may remain unconfirmed even though new signups now auto-confirm | Application maps username consistently; hosted `mailer_autoconfirm=true` does not retroactively confirm existing users            |
| Reloading `/today` returns Vercel 404     | C, confirmed                         | Missing SPA fallback rewrite                                                           | `createWebHistory()` is used and no Vercel rewrite file exists; `/today` and `/statistics` return 404 directly                    |
| Car visible but driver avatar absent      | C, reproduction required             | Visual rendering regression or stale hosted data                                       | `CarpoolCar` structurally renders the driver; a named regression test and hosted diagnostic are required before changing behavior |

## Scope

- Add a Vercel SPA rewrite so application routes resolve to `index.html` on direct navigation and reload.
- Preserve username login while reporting unconfirmed-account failures accurately.
- Provide an idempotent hosted Supabase repair/diagnostic script for unconfirmed synthetic users and current driver declarations.
- Add a focused regression proving the driver avatar is rendered inside the driver seat; change rendering only if the reproduction demonstrates a defect.
- Keep technical artifacts in English and UI copy in Italian.

## Non-goals

- No password handling or credential collection.
- No speculative redesign of car assignment or authentication identity storage.
- No production data mutation from the application client.

## Tasks

- [x] T1 SPA routing: add Vercel fallback configuration and regression evidence for direct routes. Route: delegated writer.
- [x] T2 Auth recovery: preserve provider error codes, show an actionable unconfirmed-account message, and add an idempotent hosted repair/diagnostic SQL file. Route: delegated writer.
- [x] T3 Driver visibility: add a named reproduction for the actual driver avatar element and repair only the proven rendering failure; include hosted declaration diagnostics. Route: delegated writer.
- [ ] T4 Run aggregate and database verification plus structural review. Skipped by explicit user instruction before delivery.
- [x] T5 Commit and push the repair; PR and merge remain explicit delivery decisions. Route: parent delivery.

## Acceptance criteria

- Direct GET requests to `/today`, `/statistics`, `/login`, and `/register` resolve to the SPA entrypoint on Vercel.
- A provider `email_not_confirmed` login response produces an actionable Italian message instead of generic invalid credentials.
- The hosted SQL script identifies and can confirm only unconfirmed `@users.ext-mensa.it` accounts, and reports current driver declarations/profile joins without changing unrelated users.
- The driver-seat regression checks the actual avatar SVG inside the driver control, not merely the car or accessible label.
- `npm run verify` and database tests pass.

## TDD

Mode: not configured -> focused regression tests before/with fixes; aggregate runner `npm run verify` and database runner `npm run test:db`.

## Delivery

Branch `fix/production-reliability`, based on production `main` after PR #19.

## Progress / Evidence

- Production HTTP reproduction: `/` returns 200; `/today` and `/statistics` return 404.
- Hosted Auth settings previously confirmed `mailer_autoconfirm=true`; this does not establish confirmation state for an already-created synthetic account.
- Engram mirror unavailable because the local Engram server predates the active CLI.

## Delivery evidence

- T1–T3 implementation commit: `378d2ca` (`fix(production): restore reliable hosted flows`).
- T4 skipped by explicit user instruction; no fresh pre-commit verification was run.
- Delivery branch: `fix/production-reliability`.

## Next step

PR and merge remain explicit delivery decisions.
