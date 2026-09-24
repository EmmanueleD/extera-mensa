# Feature: participant-association

## Objective

Make every participant name and message visually unmistakable as belonging to its avatar in the carpool scene.

## Problem / Why

In the production car scene, car occupants share one name row and a separate message list below the vehicle. With multiple occupants, spatial distance and separate grouping make ownership ambiguous. The waiting-person layout also separates identity and message across the avatar.

## Scope

- Group each occupant's avatar identity, name, presence, and optional message into one clear visual unit.
- Keep car seating and assignment behavior unchanged.
- Keep the playful car illustration and gentle motion.
- Preserve accessible labels and reduced-motion behavior.
- Add focused component assertions for the ownership grouping.

## Non-goals

- No database, assignment, transport-form, or realtime behavior changes.
- No return to card-based participant layouts.

## Tasks

- [x] T1 Implement participant-owned identity/message groupings for car occupants and waiting participants, with focused tests. Route: delegated writer.
- [x] T2 Run aggregate verification and review the rendered structure. Route: delegated verifier plus parent readback.
- [x] T3 Commit the verified work unit. Route: parent delivery after verification.
- [ ] T4 Publish the branch and open a pull request when authorized. Route: parent delivery.

## Acceptance criteria

- Every visible message is contained in the same participant-owned DOM group as its name.
- Car occupants are rendered as distinct identity groups rather than a shared names row plus shared messages list.
- Waiting participants keep bubble, avatar, name, and presence in one explicit group.
- Existing seating, labels, travel status, and reduced-motion behavior remain intact.
- `npm run verify` passes.

## TDD

Mode: not configured -> focused tests alongside implementation; aggregate runner `npm run verify`.

## Delivery

Branch `fix/participant-association`, based on production `main` after PR #17.

## Progress / Evidence

- T1 done: car occupants now render distinct participant-owned groups; waiting participants expose the same explicit ownership wrapper. Focused test passed: 1 file, 9 tests.
- T2 done: independent structural inspection found no regressions in seating, accessibility, message colors, animation delays, or reduced-motion behavior. `npm run verify` passed: typecheck, ESLint, Prettier, 13 files / 82 tests, and production build.
- T3 done: implementation commit `83751aa`.
- Native assessment was unassessable because untracked ODD/CodeGraph files require declaration; with RDD off, the independent verifier path was followed.
- Engram mirror unavailable because the local Engram server predates the active CLI.

## Next step

Push `fix/participant-association` and open the pull request when authorized.
