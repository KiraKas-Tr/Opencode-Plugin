---
description: Full codebase audit with automatic bead creation for findings.
agent: review
subtask: true
---

You are the **Review Agent**. Execute the `/review-codebase` command.

## Your Task

Perform a comprehensive audit of the entire codebase and create beads for all findings.

## Process

### 1. Discover Codebase Structure

```
1. Read project root (package.json, tsconfig, etc.)
2. Identify main source directories
3. Map architecture and key modules
```

### 2. Audit Categories

Run systematic checks across:

| Category | What to Check |
|----------|---------------|
| **Security** | Hardcoded secrets, auth flaws, injection risks, exposed endpoints |
| **Performance** | N+1 queries, memory leaks, blocking operations, large bundles |
| **Code Quality** | Dead code, duplication, complexity, naming, patterns |
| **Architecture** | Circular deps, coupling, layer violations, inconsistencies |
| **Testing** | Missing tests, low coverage, flaky tests, assertion quality |
| **Dependencies** | Outdated packages, vulnerabilities, unused deps |
| **Documentation** | Missing docs, outdated comments, unclear APIs |
| **Tech Debt** | TODOs, FIXMEs, workarounds, deprecated patterns |

### 3. Severity Classification

| Severity | Priority | Examples |
|----------|----------|----------|
| Critical | P0 | Security vulnerabilities, data loss risks |
| High | P1 | Auth flaws, performance bottlenecks, blocking bugs |
| Medium | P2 | Code quality issues, missing tests, tech debt |
| Low | P3 | Style issues, minor improvements, nice-to-haves |

### 4. Create Beads for Findings

For each finding, create a bead:

```
mcp__beads_village__add(
  title: "[Category] Brief description",
  desc: "What: [issue]\nWhere: [location]\nWhy: [impact]\nHow: [suggested fix]",
  typ: "bug" | "chore" | "task",
  pri: 0-4,
  tags: ["security" | "performance" | "quality" | "debt"]
)
```

### 5. Generate Summary Report

Save to `.opencode/memory/reviews/YYYY-MM-DD-codebase-audit.md`

## Audit Checklist

### Security
- [ ] No hardcoded API keys, tokens, passwords
- [ ] No secrets in git history
- [ ] Input validation on all endpoints
- [ ] Auth/authz properly implemented
- [ ] No SQL injection / XSS vulnerabilities
- [ ] CORS configured correctly
- [ ] Rate limiting in place

### Performance
- [ ] No N+1 database queries
- [ ] Proper caching strategy
- [ ] No memory leaks
- [ ] Async operations non-blocking
- [ ] Bundle size optimized
- [ ] Images/assets optimized

### Code Quality
- [ ] No dead/unreachable code
- [ ] DRY principles followed
- [ ] Consistent naming conventions
- [ ] Reasonable complexity (< 15 cyclomatic)
- [ ] No deeply nested callbacks
- [ ] Error handling complete

### Architecture
- [ ] No circular dependencies
- [ ] Proper layer separation
- [ ] Consistent patterns across modules
- [ ] Clear module boundaries
- [ ] Single responsibility principle

### Testing
- [ ] Critical paths have tests
- [ ] Edge cases covered
- [ ] No flaky tests
- [ ] Meaningful assertions
- [ ] Integration tests exist

### Dependencies
- [ ] No known vulnerabilities (npm audit)
- [ ] No unused dependencies
- [ ] Packages reasonably up-to-date
- [ ] Lock file committed

### Documentation
- [ ] README is current
- [ ] API documentation exists
- [ ] Complex logic has comments
- [ ] Setup instructions work

### Tech Debt
- [ ] TODO/FIXME items catalogued
- [ ] No deprecated API usage
- [ ] No temporary workarounds in prod
- [ ] Console.log/debug removed

## Output Format

```markdown
# Codebase Audit Report

**Date:** YYYY-MM-DD
**Auditor:** Review Agent
**Scope:** Full codebase

---

## Executive Summary

- **Total Issues Found:** X
- **Critical:** X | **High:** X | **Medium:** X | **Low:** X
- **Beads Created:** X

### Health Score

| Category | Score | Issues |
|----------|-------|--------|
| Security | 🟢 Good / 🟡 Fair / 🔴 Poor | X |
| Performance | 🟢/🟡/🔴 | X |
| Code Quality | 🟢/🟡/🔴 | X |
| Architecture | 🟢/🟡/🔴 | X |
| Testing | 🟢/🟡/🔴 | X |
| Dependencies | 🟢/🟡/🔴 | X |

---

## Critical Findings (P0)

| ID | Issue | Location | Bead |
|----|-------|----------|------|
| C-01 | [Issue] | [File:Line] | [bead-id] |

## High Priority (P1)

| ID | Issue | Location | Bead |
|----|-------|----------|------|
| H-01 | [Issue] | [File:Line] | [bead-id] |

## Medium Priority (P2)

| ID | Issue | Location | Bead |
|----|-------|----------|------|
| M-01 | [Issue] | [File:Line] | [bead-id] |

## Low Priority (P3)

| ID | Issue | Location | Bead |
|----|-------|----------|------|
| L-01 | [Issue] | [File:Line] | [bead-id] |

---

## Recommendations

### Immediate Actions (This Sprint)
1. [Action 1]

### Short-term (Next 2-4 weeks)
1. [Action 2]

### Long-term (Technical Roadmap)
1. [Action 3]

---

## Beads Created

| Bead ID | Title | Priority | Tags |
|---------|-------|----------|------|
| [id] | [title] | P0-P3 | [tags] |

---

## Next Steps

1. Review and prioritize beads
2. Assign to team members via `/implement`
3. Schedule critical fixes immediately
```

## Tools to Use

- `finder` — Semantic code search
- `Grep` — Pattern matching (TODOs, console.log, etc.)
- `glob` — File discovery
- `Read` — File inspection
- `Bash` — Run npm audit, dependency checks
- `mcp__beads_village__add` — Create issue beads

## Rules

- ✅ ALWAYS create beads for actionable findings
- ✅ ALWAYS include file:line locations
- ✅ ALWAYS prioritize security issues first
- ✅ ALWAYS provide fix recommendations
- ✅ ALWAYS save report to `.opencode/memory/reviews/`
- ❌ NEVER skip security audit
- ❌ NEVER create beads without clear descriptions
- ❌ NEVER mark issues without verification

Now, let me begin the codebase audit...
