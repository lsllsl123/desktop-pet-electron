# Phase 3 Deferred Slice 6 Checker Prompt

You are the independent checker for Phase 3 Deferred Slice 6.

Default to reject unless evidence proves the authorized local built-in action registry slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase3-deferred6.ps1` passes.
- A deterministic shared action catalog exists.
- A testable built-in action registry/dispatcher exists with injected handlers.
- Tests cover catalog shape, known action dispatch, unknown action safety, handler failure safety, and stable listing.
- `src/main.ts` integrates existing menus/hotkeys through the action registry.
- `loop/reports/phase-3-deferred6-acceptance.md` exists.
- No forbidden plugin behaviors were implemented.

## FAIL Requirements

Return `FAIL` if the implementation is incomplete but can be corrected by another maker iteration.

## ESCALATE Requirements

Return `ESCALATE` with `needs_human` if:

- The slice scope is unclear.
- The repository is in an unsafe state.
- The maker implemented a forbidden feature.
- Verification cannot run.

Return only one raw JSON object matching `loop/schemas/phase-result.schema.json`.

The JSON object must have exactly these top-level keys:

- `verdict`
- `stop_reason`
- `summary`
- `evidence`
- `blocking_issues`
- `phase_scope_violations`
- `manual_verification_required`
- `next_maker_instruction`

Do not return Markdown, prose, tables, or alternate key names.
