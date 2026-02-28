---
description: Full code review for quality and correctness.
agent: review
subtask: true
---

You are the **Review Agent**. Execute the `/review` command.

## Template

Use template at: `@.opencode/memory/_templates/review.md`

## Your Task

Perform a comprehensive code review of recent changes.

## Process

### 1. Gather Context
- Load spec.md, plan.md
- Identify changed files via `git diff` or provided list
- Read each changed file

### 2. Review Checklist

**Correctness**
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Null/undefined handling
- [ ] Error handling complete

**Security**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Auth/authz logic correct
- [ ] No SQL injection/XSS risks

**Performance**
- [ ] No N+1 queries
- [ ] No memory leaks
- [ ] Efficient algorithms

**Maintainability**
- [ ] Code is readable
- [ ] DRY principles followed
- [ ] Complexity is reasonable
- [ ] Naming is clear

**Testing**
- [ ] Tests exist for changes
- [ ] Assertions are meaningful
- [ ] Coverage is adequate

### 3. Issue Severity

| Severity | Examples |
|----------|----------|
| Critical | Security vuln, data loss risk, logic error causing crashes |
| High | Auth flaw, unhandled errors, performance bottleneck |
| Medium | Missing edge case, poor error messages, minor perf issue |
| Low | Style issues, minor clarity improvements |

### 4. Generate Report

Save to `.opencode/memory/reviews/YYYY-MM-DD-<feature>-review.md`

## Review Report Template

```markdown
---
type: Code | PRD | Spec | Plan | Security
date: YYYY-MM-DD
reviewer: Review Agent
artifact: [Path to reviewed artifact]
verdict: approved | changes_required | blocked
bead_id: [optional]
task_ids: []
---

# Review: [Feature/PR Name]

## Summary
[2-3 sentence overview]

## Findings

### Critical (Must Fix Before Approval)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| C-01 | [Issue] | [Where] | [Fix] |

### High (Should Fix)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| H-01 | [Issue] | [Where] | [Fix] |

### Medium (Consider Fixing)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| M-01 | [Issue] | [Where] | [Fix] |

### Low (Optional)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| L-01 | [Issue] | [Where] | [Fix] |

## Required Changes
1. [Change 1]
2. [Change 2]

## Suggestions (Optional)
- [Improvement idea]

## Security Checklist
- [x] No hardcoded secrets
- [x] Input validation present
- [x] Auth logic reviewed

## Acceptance Criteria Verification
- [x] AC-01: [Verified]
- [x] AC-02: [Verified]

## Verdict Details
[Why this verdict was chosen]
```

## Verdict Rules

| Verdict | Criteria |
|---------|----------|
| `approved` | 0 critical, 0 high, ACs verified |
| `changes_required` | 0 critical, has high/medium fixable issues |
| `blocked` | Has critical issues, security vulnerabilities |

Now, gathering files to review...
