# Canonical Schemas

Canonical schemas referenced by all agents.

---

## 1. Task Schema

```yaml
task_id: "T-001"              # Format: T-XXX (or "ALL" for aggregate operations)
title: "Task title"
type: task | bug | feature | chore
status: not_started | in_progress | blocked | done
assignee: build | general | fe | be | mobile | devops | qa
priority: P0 | P1 | P2        # P0=critical, P1=high, P2=normal
effort: S | M | L | XL
dependencies: ["T-xxx"]       # Optional

description: "What needs to be done"
input: ["Required artifacts"]
output: ["Expected deliverables"]
boundaries: ["What NOT to do"]

acceptance_criteria:
  - "[ ] AC-01: Criteria"
  - "[ ] AC-02: Criteria"
```

### Special Values

task_id "ALL": Used by Review Agent /finish to review entire bead

---

## 2. Bead Metadata Schema

Stored at: `.opencode/memory/beads/<bead_id>.json`

```json
{
  "bead_id": "B-YYYY-MM-DD-descriptor",
  "title": "Feature Title",
  "type": "feature",
  "priority": 2,
  "status": "created | spec'd | planned | implementing | validating | done",
  
  "git": {
    "branch": "bead/B-YYYY-MM-DD-descriptor",
    "commits": [],
    "pr": null
  },
  
  "artifacts": {
    "spec": null,
    "plan": null,
    "research": [],
    "reviews": [],
    "handoffs": []
  },
  
  "tasks": {
    "total": 0,
    "completed": 0,
    "in_progress": 0,
    "blocked": 0,
    "current": null
  },
  
  "timeline": {
    "created_at": null,
    "updated_at": null
  },
  
  "metadata": {
    "tags": []
  }
}
```

Note: Use bead_id (snake_case) consistently across all artifacts and frontmatter.

---

## 3. Delegation Request Schema

```yaml
request_id: "uuid"
bead_id: "B-YYYY-MM-DD-xxx"
task_id: "T-001"
from_agent: "plan | build | general"
to_agent: "scout | explore | review | general"
priority: low | normal | high
timebox: 1-3                  # Max iterations
```

### Request Types

Scout: type: research, question, constraints, format, depth
Explore: type: explore, need, target, scope, output_format
Review: type: review, review_type, files_changed, acceptance_criteria

---

## 4. Delegation Response Schema

```yaml
request_id: "uuid"
status: complete | partial | blocked | rejected
rejection_code: null          # TOO_LARGE | MULTI_FILE | AMBIGUOUS | OUT_OF_SCOPE | SECURITY_RISK | LOCKED
rejection_reason: null
recommendation: null          # Optional suggestion when rejected
```

### Response Extensions

Scout: confidence, summary, output_path, key_versions, recommendation, verification_needed
Explore: found_count, locations[], navigation_hint
Review: verdict, output_path, issues{}, required_changes[], suggestions[], security_findings[]

### Review Agent: status vs verdict

Review Agent responses include both status and verdict:

status: Generic delegation result (complete, partial, blocked, rejected)
verdict: Review-specific decision (approved, changes_required, blocked)

Relationship:
- status: complete + verdict: approved means Review passed
- status: complete + verdict: changes_required means Review done, needs fixes
- status: blocked + verdict: blocked means Cannot complete review (missing info, critical issues)

---

## 5. Artifact Schemas

### 5.1 Review Report

Path: `.opencode/memory/reviews/YYYY-MM-DD-<subject>-review.md`

```yaml
---
type: Code | PRD | Spec | Plan | Security
date: YYYY-MM-DD
reviewer: agent-name
artifact: path/to/reviewed
verdict: approved | changes_required | blocked
bead_id: optional
task_ids: []
---
# Review: [Subject]
## Summary
## Findings (Critical/High/Medium/Low sections)
## Verdict Details
```

### 5.2 Handoff

Path: `.opencode/memory/handoffs/YYYY-MM-DD-<phase>.md`

```yaml
---
date: YYYY-MM-DD
phase: spec'd | researched | planned | implementing | validating
branch: git-branch
bead_id: optional
---
# Handoff: [Feature]
## Status Summary
## Task Status (Completed/In Progress/Blocked/Not Started)
## Files Modified
## Git State
## Known Issues
## Next Steps
```

### 5.3 Research Report

Path: `.opencode/memory/research/YYYY-MM-DD-<topic>.md`

```yaml
---
topic: topic-name
date: YYYY-MM-DD
confidence: high | medium | low
depth: quick | standard | deep
versions: []
bead_id: optional
---
# Research: [Topic]
## Question
## Summary
## Key Findings
## Comparison (if applicable)
## Recommendation
## Verification Steps
## Sources
```

### 5.4 PRD (Product Requirements Document)

Path: `.opencode/memory/prds/YYYY-MM-DD-<feature>.md`

```yaml
---
title: "Feature Title"
date: YYYY-MM-DD
author: "Author Name"
status: draft | approved | deprecated
bead_id: optional
---
# PRD: [Feature Title]

## Executive Summary
[High-level overview]

## Problem Statement
[What problem this solves]

## Goals and Success Metrics
Goal: [Goal description]
Metric: [How to measure]
Target: [Target value]

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements

### Functional
- [Requirement 1]

### Non-Functional
- Performance: [Requirement]
- Security: [Requirement]

## Out of Scope
- [Excluded item]

## Timeline
Milestone: [Name], Date: YYYY-MM-DD, Description: [What]

## Dependencies
- [Dependency 1]

## Risks
Risk: [Description], Probability: L/M/H, Impact: L/M/H, Mitigation: [How]
```

---

## 6. Task Envelope Schema

Task Envelope is the wrapper passed to Build Agent containing the task and context.

```yaml
# Task Envelope - passed from Plan to Build Agent
envelope_id: "E-uuid"
bead_id: "B-YYYY-MM-DD-descriptor"
created_at: "ISO-8601"

task:                           # Full Task Schema (section 1)
  task_id: "T-001"
  title: "Task title"
  # ... all Task Schema fields

context:
  spec_path: ".opencode/memory/specs/YYYY-MM-DD-feature.md"
  plan_path: ".opencode/memory/plans/YYYY-MM-DD-feature.md"
  research_paths: []            # Optional research references
  
  file_impact:                  # From plan.md
    create: []
    modify: []
    delete: []
  
  prerequisites:
    completed_tasks: ["T-xxx"]
    pending_reviews: []

execution:
  mode: quick | deep
  max_retries: 3
  verification_commands:
    - "pnpm typecheck"
    - "pnpm test"
    - "pnpm lint"
```

### Usage

Plan Agent: Creates Envelope (after /plan approval), does not receive
Build Agent: Does not create, receives Envelope (for /implement)

---

## 7. Usage Guidelines

1. Task IDs: T-XXX format
2. Bead IDs: B-YYYY-MM-DD-<descriptor>
3. Priority: P0 (critical) to P2 (normal)
4. Assignee: build, fe, be, mobile, devops
5. Status enums: Match exactly as defined
6. Timestamps: ISO 8601 or YYYY-MM-DD

---

## 8. Priority Mapping

Task Schema and Bead Metadata use two different priority systems:

Task Priority P0 maps to Bead Priority 0: Critical, requires immediate action
Task Priority P1 maps to Bead Priority 1: High, important
Task Priority P2 maps to Bead Priority 2: Normal, default
Bead Priority 3: Low, less important (no Task equivalent)
Bead Priority 4: Backlog, deferred (no Task equivalent)

Conversion rules:
- Task to Bead: P0 becomes 0, P1 becomes 1, P2 becomes 2
- Bead to Task: 0 becomes P0, 1 becomes P1, 2-4 becomes P2

Where used:
- Task Schema (section 1): Uses P0, P1, P2
- Bead Metadata (section 2): Uses numeric 0-4
- MCP beads_village: Uses numeric 0-4 (param pri)
