# Desktop Pet Loop Contract

## Objective

Build the Electron desktop pet in phases using Claude Code CLI, with Phase 1 as the first automatic goal.

## Trigger

Manual command:

```powershell
.\scripts\run-phase.ps1 -Phase phase1 -MaxIterations 6 -MaxBudgetUsd 8
```

Later phases are triggered only after human approval.

## Discover / Intake

Each run reads:

- `docs/loop-engineering/source-notes.md`
- `docs/loop-engineering/loop-contract.md`
- `docs/loop-engineering/phase-plan.md`
- `loop/phase-state.json`
- `loop/LOOP_PROGRESS.md`
- latest local verification output

## Workspace

The maker may write only inside the current git repository. It must not write outside the repo, alter system settings directly, upload user files, introduce backend services, or make destructive changes.

## Context

Required context:

- product requirements from `C:/Users/13174/Documents/boost-prompt/prompts/final/desktop-pet-electron-final.md`
- approved design spec at `docs/superpowers/specs/2026-06-24-desktop-pet-claude-loop-design.md`
- this loop contract
- phase plan
- phase state
- progress log
- maker/checker prompts

## Delegation

- Maker: Claude Code CLI call with `Read,Edit,Bash`.
- Checker: separate Claude Code CLI call with `Read,Bash` and no edit permission.

The maker does not declare the phase complete.

## Verification

Verification combines:

- `scripts/verify-phase1.ps1`
- checker JSON verdict
- human GUI checklist when desktop behavior cannot be inspected automatically

## State

Durable state lives in:

- `loop/phase-state.json`
- `loop/LOOP_PROGRESS.md`
- `loop/reports/phase-1-acceptance.md`

## Budget

Initial Phase 1 budget:

- max iterations: 6
- total phase budget: USD 8
- maker call budget: USD 2
- checker call budget: USD 1
- same failure twice: stop as `stalled`

## Escalation

Stop with `needs_human` when:

- desktop GUI behavior cannot be verified automatically
- a high-risk permission is needed
- scope conflicts with the phase plan
- the checker cannot prove the phase goal
- requirements are ambiguous

## Exit

Allowed stop reasons:

- `goal_met`
- `budget_spent`
- `stalled`
- `needs_human`

Even `goal_met` requires human approval before Phase 2.
