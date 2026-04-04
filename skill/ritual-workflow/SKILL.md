---
name: ritual-workflow
description: Use when starting any task. Enforces DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE with hard gates at each phase.
---

# Ritual Workflow

## Phases

```
DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE
```

| Phase | Gate (must pass before advancing) |
|-------|-----------------------------------|
| DISCOVER | Problem statement written, success criteria defined |
| PLAN | User approves plan |
| IMPLEMENT | All planned tasks checked off |
| VERIFY | typecheck + tests + lint + build all pass |
| COMPLETE | Changes landed on default branch / deployed |

## Command Map

| Mode | Commands |
|------|----------|
| Quick | `/discuss` → `/create` → `/start` → `/verify` → `/ship` |
| Deep (UI) | `/discuss` → `/create` → `/design` → `/start` → `/verify` → `/ship` |

`/create` includes a mandatory pre-plan research pass via `@research` before it finalizes the plan. `/research` remains available as an optional standalone command when the user wants a dedicated evidence pass.

## Enforcement

- Cannot skip phases
- Cannot IMPLEMENT without an approved plan — run `/create` first
- Cannot COMPLETE without `/verify` returning SHIP_READY
- Each phase requires explicit completion signal

## Red Flags

- Implementing without a plan
- Marking COMPLETE with failing `/verify` gates
- Moving forward without user approval on the plan
- Running `/ship` before SHIP_READY
