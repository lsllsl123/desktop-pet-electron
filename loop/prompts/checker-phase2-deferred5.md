# Phase 2 Deferred Slice 5 Checker Prompt

You are the independent checker for Phase 2 Deferred Slice 5.

Default to reject unless evidence proves the authorized startup launch setting slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase2-deferred5.ps1` passes.
- A testable startup launch controller module exists.
- The controller has unit tests for reading state, enabling, disabling, toggling, avoiding redundant adapter writes, and propagating adapter failures.
- `src/main.ts` integrates launch-at-login minimally through Electron main process or tray/menu.
- `loop/reports/phase-2-deferred5-acceptance.md` exists.
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
