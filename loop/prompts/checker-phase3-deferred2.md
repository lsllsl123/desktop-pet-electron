# Phase 3 Deferred Slice 2 Checker Prompt

You are the independent checker for Phase 3 Deferred Slice 2.

Default to reject unless evidence proves the authorized more-explosion-styles slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase3-deferred2.ps1` passes.
- A deterministic explosion style catalog exists.
- The catalog has more than the original default explosion style.
- Tests cover stable ids, labels, particle config metadata, fallback behavior, and deterministic config resolution.
- `src/App.tsx` can trigger explosion particles from a selected style id.
- `src/main.ts` exposes at least two explosion style menu choices through the existing pet context menu.
- `loop/reports/phase-3-deferred2-acceptance.md` exists.
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
