# Phase 3 Deferred Slice 3 Checker Prompt

You are the independent checker for Phase 3 Deferred Slice 3.

Default to reject unless evidence proves the authorized local synthesized sound packs slice and no more.

## PASS Requirements

Return `PASS` only if all are true:

- `scripts/verify-phase3-deferred3.ps1` passes.
- A deterministic shared sound pack catalog exists.
- The catalog has more than one built-in sound pack.
- Tests cover stable ids, labels, event-to-tone metadata, fallback behavior, and deterministic tone resolution.
- Renderer code has a minimal local WebAudio/synthesized tone adapter.
- `src/App.tsx` can trigger tones from existing pet events using the selected pack id.
- `src/main.ts` exposes sound pack selection through the existing pet context menu.
- `loop/reports/phase-3-deferred3-acceptance.md` exists.
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
