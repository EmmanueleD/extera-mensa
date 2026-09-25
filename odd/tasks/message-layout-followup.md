# Feature: message-layout-followup

## Objective

Fix the production CSS cascade that still moves car-seat avatars when a message appears, and make the owner-avatar dialog the only UI for creating or editing profile messages.

## Scope

- Ensure car-seat message bubbles are absolutely positioned after the complete stylesheet cascade.
- Add a CSSOM regression that would fail when `.speech-bubble` overrides seat-bubble positioning.
- Remove message text, message color, clear action, and preview from the Profile drawer.
- Keep profile saves limited to name and avatar fields so stored messages remain unchanged.
- Preserve the dedicated owner-only `MessageEditorDialog` flow.

## Non-goals

- No redesign of speech bubbles or the Profile drawer.
- No database schema or RLS changes.
- No editing messages belonging to other users.
- No changes to waiting-participant message positioning unless verification demonstrates the same defect.

## Tasks

- [x] T1 Car-seat cascade fix: reproduce computed `position: relative`, enforce absolute positioning, and add CSSOM regression coverage.
- [x] T2 Profile boundary: remove all message editing controls from `ProfileDrawer` and prove unrelated profile saves omit message fields.
- [ ] T3 Verification: run focused tests, aggregate verification, and a browser/runtime visual check when available.
- [ ] T4 Delivery: commit reviewable work units; push, PR, merge, and production rollout remain explicit decisions.

## Acceptance criteria

- Publishing or removing a car occupant message does not alter the avatar's seat position.
- Computed style for `.carpool-seat-bubble` is `position: absolute` with the project stylesheet loaded.
- Profile drawer contains no message textarea, message color controls, preview, or clear action.
- Saving name/avatar changes does not update `message` or `message_text_color`.
- Messages remain editable only through the authenticated user's avatar dialog.
- Existing accessibility, focus, Save/Remove, and Today-refresh behavior remains intact.

## Evidence

- T1 commit: `70dd29d` (`fix(carpool): keep message bubbles out of seat flow`). RED reproduced computed `position: relative`; GREEN asserts `position: absolute`. Focused Vitest 1/1, targeted ESLint/Prettier, typecheck, diff check, and independent verification passed.
- T2 verification: ProfileDrawer suite 5/5, targeted ESLint/Prettier, typecheck, diff check, and independent structural verification passed. Update payload contains only `display_name`, `avatar_seed`, and `avatar_color`; dedicated message editor flow is unchanged.
