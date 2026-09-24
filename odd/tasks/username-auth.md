# Feature: username-auth

## Objective

Register and sign in with username + password only, with no email delivery dependency.

## Problem / Why

Supabase's built-in mailer does not reliably deliver confirmation emails (work address never received it). The app is internal; email ownership adds no value.

## Scope

- Register form: username, display name, password. Login form: username (or legacy email) + password.
- Under the hood, username maps to a synthetic email `<username>@users.ext-mensa.it` (Supabase Auth requires email or phone).
- Username rules: lowercase, 3-30 chars, `[a-z0-9._-]`, trimmed; input is normalized to lowercase.
- Legacy email accounts keep working: login input containing `@` is used as-is.
- Remove password-recovery-by-email UI (link + `/recover-password` route) and the "check your email" states / `VerifyEmailPage`; after registration go straight to `/today`.
- Login page shows a short hint: forgotten password -> contact the administrator.
- `supabase/config.toml`: `[auth.email] enable_confirmations = false`.

## Constraints

- No destructive DB migration. `profiles.display_name` stays unique and editable; username is fixed.
- Hosted project requires manual dashboard change: Authentication > Providers > Email > disable "Confirm email" (user action, remote).
- Artifacts in English; UI copy in Italian (existing project language).

## Tasks

- [x] T1 Username auth in `useAuth`, `AuthPage`, router; remove email recovery/verify flow; config.toml; tests. Route: delegated direct (writer trigger: 3+ non-trivial files).

## Acceptance criteria

- Register with username creates session and lands on `/today` (when confirmations are off).
- Login with username or legacy email works.
- No UI path mentions email.
- `npx vitest run`, `npm run typecheck`, `npm run lint`, `npx prettier --check src` pass.

## TDD

Mode: not configured (unknown source) -> ordinary functional checks; tests written alongside. Runner: `npx vitest run`.

## Delivery

Branch `feat/username-auth`, stacked on `fix/auth-redirect-and-ride-status`. Strategy: ask-on-risk.

## Progress / Evidence

- T1 done: commit 3c43f83. vitest 58/58, typecheck, lint, prettier pass (writer + parent spot check vitest). Also fixed pre-existing App.test.ts rpc mock (unhandled `next.points` error on base). Removed update-password route too (unreachable).
- Review: assess medium / slice_budget_reached; preflight STATUS stopped with `rdd_disabled` -> no native review, ordinary checks only.
- Engram mirror: PENDING (engram session registration unavailable).

## Next step

User: disable "Confirm email" in hosted Supabase dashboard. Feature complete otherwise.
