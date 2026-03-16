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

**Quick mode:**
| Command | Phase | Action |
|---------|-------|--------|
| `/create` | DISCOVER + PLAN | Explore, gather requirements, create spec + plan |
| `/start` | IMPLEMENT | Execute plan packets one at a time |
| `/verify` | VERIFY | Pre-ship gate — all 4 checks, SHIP_READY verdict |
| `/ship` | COMPLETE | Finalize, commit, create PR |

**Deep mode (complex / UI / research):**
| Command | Phase | Action |
|---------|-------|--------|
| `/create` | DISCOVER + PLAN | As above |
| `/research` | PLAN (research) | External docs, API comparison |
| `/design` | PLAN (UI) | Variant exploration, design implementation |
| `/start` | IMPLEMENT | As above |
| `/verify` | VERIFY | As above |
| `/ship` | COMPLETE | As above |

## Enforcement

- Cannot skip phases
- Cannot implement without approved plan
- Cannot complete without passing verify
- Each phase requires explicit completion

## Status Check

Run `checkRitualProgress()` to see current phase and blockers.

## Red Flags

- Skipping IMPLEMENT without a plan (run `/create` first)
- Marking COMPLETE with failing `/verify` gates
- Moving forward without user approval on spec+plan
- Ignoring phase gates
- Running `/ship` before `/verify` returns SHIP_READY
