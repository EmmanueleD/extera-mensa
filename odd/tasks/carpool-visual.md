# Feature: carpool-visual

## Objective

Replace the card-based participant list on Today with a playful carpool scene: 2D cars with drivers and seats that fill up as riders join; avatars float freely with name and speech bubble.

## Problem / Why

User request: text labels ("Auto · 5 posti", "Cerca un passaggio") and cards are dull; the trip state should be visible at a glance.

## Scope

- Transport choice limited to two options: "Ho bisogno di un passaggio" (`needs_ride`) and "Prendo la macchina" (`offers_car`, with capacity). Remove "autonomo" from the form.
- No cards around participants. Each avatar: floating very gently (subtle, slow CSS animation), name below, optional message in a speech bubble that floats imperceptibly.
- Each car drawn in 2D (inline SVG/CSS): driver avatar in the driver seat, remaining `car_capacity - 1` seats shown as empty slots.
- Riders are assigned automatically to free seats in arrival order (declaration `created_at`), cars in their own arrival order. Riders without a seat stand outside the cars (waiting area). Legacy `autonomous` declarations also render outside cars.
- Keep the trip status message (enough cars / missing cars) from the previous fix.
- Respect `prefers-reduced-motion` (no floating).

## Constraints

- No destructive migration: `transport_mode` enum keeps `autonomous`; only UI stops offering it.
- New migration redefines `get_today_state()` to include per-participant `declared_at` (declaration `created_at`) so the order is stable; regenerate/adjust TS types.
- Accessible: each car has an aria-label describing driver and passengers; empty seats labeled.
- Artifacts in English; UI copy Italian.

## Tasks

- [x] T1 Backend order: migration adding `declared_at` to participants in `get_today_state`, DB test update, TS types. Route: delegated direct.
- [x] T2 Form: only two transport options. Route: delegated direct.
- [x] T3 Carpool scene: seat assignment (pure function + unit tests), car SVG component, floating avatar + bubble, replace cards in `ParticipantSummary`. Route: delegated direct (writer trigger).
- [x] T4 Delivery verification: aggregate checks, database tests where available, and production build. Route: delegated verification.
- [ ] T5 Publication: push stacked branches and create policy-compliant issue/PR chain. Route: parent delivery.
- [ ] T6 Production: merge approved PRs, apply the Supabase migration/configuration, and verify the Vercel deployment. Route: parent delivery.

## Acceptance criteria

- One rider, no car: rider shown outside, status "Nessuna auto disponibile".
- One car (5) + 2 riders: car shows driver + 2 filled + 2 empty seats.
- No "autonomo" option in the form.
- Checks pass: `npx vitest run`, `npm run typecheck`, `npm run lint`, `npx prettier --check src`.

## TDD

Mode: not configured -> ordinary functional checks; runner `npx vitest run`.

## Delivery

Branch `feat/carpool-visual`, stacked on `feat/username-auth`. Strategy: ask-on-risk; forecast ~400-500 authored lines (may need a slice split).

## Progress / Evidence

- T1 done: commit `747f4d7`.
- T2 done: commit `604b4a3`.
- T3 done: commit `5ddb9ed`.
- Delivery is stacked on `3c43f83` (`feat/username-auth`) and `5a762c6` (`fix/auth-redirect-and-ride-status`).
- T4 done: `npm run verify` passed (13 files, 82 unit tests, production build); database verification passed (4 files, 61 tests).
- Engram mirror unavailable because the local Engram server is older than the active CLI.

## Next step

Push the branch chain and create the policy-compliant pull requests.
