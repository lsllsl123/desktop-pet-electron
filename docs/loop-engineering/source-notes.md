# Loop Engineering Source Notes

This project follows the loop engineering model from:

https://github.com/invincible04/awesome-loop-engineering

## Non-Negotiable Principles

- A loop is not a cron job and not a long prompt. It discovers work, delegates, verifies, persists state, decides, and stops.
- Use a loop only for recurring work with a machine-checkable done condition.
- The maker never grades its own work. A separate checker decides whether evidence is sufficient.
- Prefer deterministic checks over LLM judgment when possible.
- State lives on disk, not only in a model context window.
- Every loop must stop for one honest reason: `goal_met`, `budget_spent`, `stalled`, or `needs_human`.
- Every unattended loop needs brakes: iteration caps, budget caps, scope limits, repeated-failure detection, progress logging, and human escalation.
- Phase completion does not automatically authorize the next phase. A human approval gate is required.

## Desktop Pet Interpretation

- Phase 1 is the only automatic implementation target.
- Phase 2 and Phase 3 are planned, but require human approval before triggering.
- GUI behavior that cannot be proven automatically must be recorded as manual verification, not silently marked as passed.
- The loop scaffolding must be completed and reviewed before any Electron implementation starts.
