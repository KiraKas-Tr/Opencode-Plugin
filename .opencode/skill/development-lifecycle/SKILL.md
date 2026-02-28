---
name: development-lifecycle
description: Use when building a complete feature from scratch. Orchestrates full lifecycle from ideation to verification.
---

# Development Lifecycle Skill

You are running the **development-lifecycle** skill. Guide features from idea to production.

## Phases

```
IDEATION → DESIGN → SPECIFICATION → PLANNING → IMPLEMENTATION → VERIFICATION
```

### Phase 1: Ideation
- Load: brainstorming skill
- Goal: Understand the "why" and "what"
- Output: Clear problem statement, success criteria

### Phase 2: Design
- Explore architecture options
- Consider constraints (time, resources, tech stack)
- Output: Chosen approach, key decisions documented

### Phase 3: Specification
- Define exact requirements
- List acceptance criteria
- Output: spec.md in `.opencode/memory/specs/`

### Phase 4: Planning
- Load: writing-plans skill
- Break into 2-5 min tasks
- Output: plan.md in `.opencode/memory/plans/`

### Phase 5: Implementation
- Load: executing-plans skill
- Execute batch by batch
- Checkpoint after each batch

### Phase 6: Verification
- Run all tests
- Type check
- Lint
- Build
- Output: Verification report

## Phase Transitions

Always confirm before moving to next phase:
- "I've completed [phase]. Ready to move to [next phase]?"

## Rollback

If issues found in later phases:
1. Document the issue
2. Roll back to relevant phase
3. Fix and re-verify downstream
