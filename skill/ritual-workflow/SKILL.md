---
name: ritual-workflow
description: Use when starting any task. Enforces DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE workflow with hard gates.
---

# Ritual Workflow Skill

You are running the **ritual-workflow** skill. Every task follows a strict phase structure.

## Phases (in order)

```
DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE
```

### Phase 1: DISCOVER
- Understand the problem
- Gather requirements
- Identify stakeholders and constraints
- Define success criteria
- **Gate**: Can articulate the problem clearly

### Phase 2: PLAN
- Design the solution
- Break into tasks
- Identify dependencies
- Estimate effort
- **Gate**: Plan approved (user confirms)

### Phase 3: IMPLEMENT
- Write code
- Follow plan
- Create tests
- **Gate**: All planned tasks done

### Phase 4: VERIFY
- Run tests
- Type check
- Lint
- Build
- **Gate**: All checks pass

### Phase 5: COMPLETE
- Document changes
- Create PR
- Clean up
- **Gate**: Merged or deployed

## Hard Gates

| Current Phase | Must Complete Before Advancing |
|---------------|-------------------------------|
| DISCOVER | Problem statement written |
| PLAN | User approves plan |
| IMPLEMENT | All tasks checked off |
| VERIFY | Tests pass, build succeeds |
| COMPLETE | PR merged |

## Ritual State

State is tracked in `.opencode/memory/ritual-state.json`:

```json
{
  "taskId": "bead-123",
  "phases": [
    { "name": "discover", "status": "done" },
    { "name": "plan", "status": "in_progress" },
    ...
  ],
  "currentPhase": 1
}
```

## Commands

| Command | Phase | Action |
|---------|-------|--------|
| `/create` | DISCOVER | Initialize ritual, gather requirements |
| `/plan` | PLAN | Create implementation plan |
| `/start` | IMPLEMENT | Begin implementation |
| `/verify` | VERIFY | Run checks |
| `/ship` | COMPLETE | Finalize and deploy |

## Enforcement

- Cannot skip phases
- Cannot implement without approved plan
- Cannot complete without passing verify
- Each phase requires explicit completion

## Status Check

Run `checkRitualProgress()` to see current phase and blockers.

## Red Flags

- Skipping to IMPLEMENT without PLAN
- Marking COMPLETE with failing tests
- Moving forward without user approval
- Ignoring phase gates
