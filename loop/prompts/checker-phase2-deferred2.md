# Phase 2 Deferred Slice 2 Checker Prompt

You are the independent checker for Phase 2 Deferred Slice 2.

Default to reject unless evidence proves the authorized reminder slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase2-deferred2.ps1` passes.
- A deterministic shared reminder store exists.
- The reminder store has unit tests for adding reminders, pending listing, due detection, completion, persistence serialization, and invalid input.
- `src/App.tsx` integrates reminders minimally without replacing the app architecture.
- `loop/reports/phase-2-deferred2-acceptance.md` exists.
- No forbidden deferred or Phase 3 features were implemented.

## FAIL Requirements

Return `FAIL` if the implementation is incomplete but can be corrected by another maker iteration.

## ESCALATE Requirements

Return `ESCALATE` with `needs_human` if:

- The slice scope is unclear.
- The repository is in an unsafe state.
- The maker implemented a forbidden feature.
- Verification cannot run.

Return only one raw JSON object matching `loop/schemas/phase-result.schema.json`.
