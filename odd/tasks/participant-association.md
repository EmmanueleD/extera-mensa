# Feature: participant-association

## Objective

Make every participant name and message visually unmistakable as belonging to its avatar in the carpool scene.

## Problem / Why

In the production car scene, car occupants share one name row and a separate message list below the vehicle. With multiple occupants, spatial distance and separate grouping make ownership ambiguous. The waiting-person layout also separates identity and message across the avatar.

## Scope

- Anchor each car occupant's optional speech bubble directly above the avatar in its actual seat.
- Show only the participant initial by default; reveal and slightly enlarge the avatar with the full name on hover, keyboard focus, or tap.
- Apply the same accessible hover/focus/tap name interaction to waiting participants.
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
- [x] T4 Push the initial refinement branch. Route: parent delivery.
- [x] T5 Replace duplicated identity groups with seat-anchored bubbles and initial/name interactions for hover, focus, and tap. Route: delegated writer.
- [x] T6 Run aggregate verification, commit, and push the refinement. Route: delegated verifier plus parent delivery.
- [ ] T7 Open a pull request when authorized. Route: parent delivery.

## Acceptance criteria

- Every car message is rendered directly above the matching occupied seat and inside that participant's DOM group.
- Car occupants show an initial by default; hover, keyboard focus, and tap enlarge the avatar slightly and reveal the full name.
- Waiting participants provide the same accessible initial/name interaction.
- Tap toggles the full name on touch devices; `aria-expanded` exposes the state.
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
- T4 done: branch `fix/participant-association` pushed to origin.
- Product decision: use hover on pointer devices, focus for keyboards, and tap on touch devices to reveal the full name; keep bubbles above the actual in-car avatars.
- T5 done: messages now live above their occupied seats; initials are visible by default; hover/focus/tap reveals the full name and scales the avatar. Alternating message lanes use a visible connector to preserve seat ownership. Focused test passed: 1 file, 9 tests.
- T6 verified: independent `npm run verify` passed typecheck, ESLint, Prettier, 13 files / 82 tests, and production build. Implementation commit `4d347c6`.
- Native assessment was unassessable because untracked ODD/CodeGraph files require declaration; with RDD off, the independent verifier path was followed.
- Engram mirror unavailable because the local Engram server predates the active CLI.

## Next step

Push the verified commits and open the pull request when authorized.
