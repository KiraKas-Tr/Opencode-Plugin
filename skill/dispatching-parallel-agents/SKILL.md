---
name: dispatching-parallel-agents
description: Use when facing 3+ independent failures. Dispatches concurrent subagent workflows, one agent per problem domain.
---

# Dispatching Parallel Agents Skill

You are running the **dispatching-parallel-agents** skill. Solve multiple independent problems concurrently.

## When to Use

**Use when:**
- 3+ independent failures detected
- Problems are in different domains/files
- Each issue can be solved independently
- Results can be merged after completion

**Do NOT use when:**
- Failures are related/dependent
- Agents would edit the same files
- Order of fixes matters
- One fix might break another

## Dispatch Protocol

### 1. Problem Analysis
```
For each failure:
  - Identify problem domain
  - Determine affected files
  - Check for file overlap with other problems
  - Estimate complexity
```

### 2. Agent Assignment
```
Map problems to domains:
  - Frontend issues → @build with fe context
  - Backend issues → @build with be context
  - Test issues → @build with qa context
  - Config issues → @build with devops context
```

### 3. Parallel Execution
- Launch all agents simultaneously
- Each agent works in isolation
- No cross-agent communication during work
- Track progress independently

### 4. Result Merging
```
After all agents complete:
  1. Collect all changes
  2. Verify no conflicts
  3. Run integration tests
  4. Merge results
```

## Example Scenario

```
Failures detected:
1. Login button not rendering (frontend) → Agent A
2. API timeout on /users (backend) → Agent B
3. E2E test flaky (testing) → Agent C

Dispatch 3 agents in parallel.
Each fixes their domain.
Merge after completion.
```

## Conflict Detection

Before dispatching, verify:
- No file overlap between assignments
- No shared state modifications
- No ordering dependencies

## Rules

| Rule | Why |
|------|-----|
| Minimum 3 problems | Overhead worth it at scale |
| Independent only | Avoid conflicts |
| Different files | Safe parallel edits |
| Merge verification | Catch integration issues |

## Failure Handling

If any agent fails:
1. Report failure immediately
2. Other agents continue
3. Address failed agent's issue separately
4. Do not block successful completions
