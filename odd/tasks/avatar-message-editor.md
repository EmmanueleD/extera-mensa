# Feature: avatar-message-editor

## Objective

Give each newly registered profile a random curated avatar color, keep car avatars geometrically stable when messages are visible, and let only the authenticated participant open a compact message editor from their own avatar.

## Scope

- Assign one of the existing curated avatar colors to future profiles at database creation time.
- Leave existing profile colors unchanged.
- Reserve stable message space so showing or hiding a message never moves an avatar seat.
- Make only the authenticated participant avatar interactive.
- Open a compact editor containing message text, message color, Save, and Remove actions.
- Refresh the visible participant state immediately after a successful save when possible.

## Non-goals

- No avatar color changes for existing users.
- No editing other participants.
- No full profile redesign.
- No change to message length or database ownership policies.

## Tasks

- [x] T1 Database default: add a migration and pgTAP evidence for random curated colors on future profiles.
- [x] T2 Stable layout: remove message-dependent car displacement and add a regression covering stable avatar positioning.
- [x] T3 Owner-only compact editor: propagate current-user identity, make only the owner avatar an accessible edit control, and add message text/color editing, remove action, focus restoration, and immediate participant refresh.
- [ ] T4 Verification: run focused database/component checks and aggregate verification.
- [ ] T5 Delivery evidence: record commit identities; PR, push, and merge remain user decisions.

## Acceptance criteria

- A newly registered profile receives one of `coral`, `teal`, `sun`, `violet`, `blue`, or `pink` without always defaulting to `coral`.
- Existing profiles retain their stored avatar colors.
- Avatar seats occupy the same position whether messages are empty, collapsed, or visible.
- Only the authenticated participant avatar is keyboard/click interactive for editing.
- Clicking that avatar opens a compact editor for message text and message color.
- Saving or removing the message updates the visible participant summary without requiring profile navigation.
- Other participants remain noninteractive and cannot be edited through the UI or database policy.

## Delivery

Stacked branch based on `fix/production-reliability`. The base repair branch remains independently reviewable.

## Evidence

- T1 commit: `0cc38d6` (`feat(profile): randomize initial avatar colors`). Database verification: `npm run db:start`; `npm exec -- supabase migration up --local`; `npm run test:db` (64/64 assertions passed, including 17/17 profile assertions); `npm run db:stop`.
- T2 commit: `b1cfdc5` (`fix(carpool): keep avatars stable with messages`). Verification: focused ParticipantSummary suite 11/11, targeted ESLint passed, Prettier passed, and typecheck passed. Independent re-verification confirmed no unrelated steering-wheel or owner-edit changes.
- T3 editor commit: `9c1e52a` (`feat(profile): add compact message editor`). Integration verification: 25/25 focused tests passed plus targeted ESLint, Prettier, and typecheck. Independent re-verification confirmed owner-only interaction, nested presence semantics, stale-error reset, partial updates, Save/Remove refresh, focus restoration, and unchanged ProfileDrawer.
