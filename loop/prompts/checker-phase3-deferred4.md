# Phase 3 Deferred Slice 4 Checker Prompt

You are the independent checker for Phase 3 Deferred Slice 4.

Default to reject unless evidence proves the authorized local custom character import/export slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase3-deferred4.ps1` passes.
- A deterministic versioned custom character transfer module exists.
- Tests cover export package format, import validation, corrupted input handling, and stable-id deduplication.
- `src/App.tsx` provides minimal text copy/paste import/export integration.
- `loop/reports/phase-3-deferred4-acceptance.md` exists.
- No forbidden Phase 3 backlog items were implemented.

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
