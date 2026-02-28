---
name: deep-research
description: Use when exploring unfamiliar code or implementing complex features. Structured LSP exploration with memory-first protocol.
---

# Deep Research Skill

You are running the **deep-research** skill. Systematic codebase exploration with confidence-scored findings.

## When to Use

- Exploring unfamiliar code
- Implementing complex features
- Understanding architecture before changes
- Debugging across multiple files

## Memory-First Protocol

Always save findings to `.opencode/memory/research/`:

```
memory/research/
  ├── [topic]-findings.md
  ├── [topic]-architecture.md
  └── [topic]-decisions.md
```

## LSP Operations

Use all 9 LSP operations systematically:

### 1. Go to Definition
- Trace symbol origins
- Understand type definitions
- Find implementation details

### 2. Find References
- Locate all usages
- Understand impact of changes
- Identify consumers

### 3. Go to Type Definition
- Understand data structures
- Trace interface contracts
- Find source types

### 4. Find Implementations
- Locate concrete implementations
- Understand polymorphism
- Find all variants

### 5. Document Symbol
- Get file overview
- Understand exports
- Quick navigation

### 6. Workspace Symbol
- Find symbols across project
- Locate related code
- Cross-file navigation

### 7. Call Hierarchy (Incoming)
- Find callers
- Understand entry points
- Trace data flow up

### 8. Call Hierarchy (Outgoing)
- Find callees
- Understand dependencies
- Trace data flow down

### 9. Rename
- Preview changes
- Understand scope
- Safe refactoring

## Research Workflow

```
1. Define research question
2. Start with workspace symbol search
3. Navigate via go to definition
4. Trace references for coverage
5. Map call hierarchy for flow
6. Document findings with confidence score
7. Save to memory
```

## Confidence Scoring

Score each finding 1-10:

| Score | Meaning |
|-------|---------|
| 1-3 | Speculation, needs verification |
| 4-6 | Probable, partial evidence |
| 7-9 | Confident, strong evidence |
| 10 | Certain, verified in code |

## Output Format

```markdown
# [Topic] Research Findings

## Summary
[Brief overview]

## Key Findings

### Finding 1: [Title]
- **Confidence**: 8/10
- **Evidence**: [Code references]
- **Notes**: [Additional context]

## Architecture
[Diagram or description]

## Open Questions
[What needs more investigation]

## Recommendations
[Based on findings]
```

## Anti-Patterns

- Skipping LSP operations
- Not saving to memory
- Low confidence assertions
- Missing evidence for claims
