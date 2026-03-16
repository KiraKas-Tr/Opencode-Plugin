---
name: cass-village
description: Use when delegating multi-agent tasks with persistent memory. Combines CASS procedural memory with beads-village coordination so agents learn from every delegation cycle.
---

# CASS Village Skill

You are running the **cass-village** skill. Memory-informed multi-agent delegation with learning feedback loops.

## How It Works

CliKit integrates with the real [CASS Memory System](https://github.com/Dicklesworthstone/cass_memory_system) (`cm` CLI) when available. If `cm` is not installed, it falls back to an embedded SQLite-based implementation with reduced capabilities.

**With `cm` installed** (recommended): Full playbook management, Bayesian rule scoring, real reflection that distills sessions into rules, outcome tracking, and cross-agent memory sharing.

**Without `cm`** (embedded fallback): Basic context retrieval via FTS5 search, feedback recording, and anti-pattern promotion. Reflection is a stub.

## The Problem

Without shared memory, subagents repeat the same mistakes across sessions. Knowledge dies when a session ends. Tasks get assigned without context about what worked or failed before. This skill closes the loop: memory informs delegation, outcomes feed back into memory.

## Core Loop

```
PLAN    cm context per task     Hydrate tasks with relevant rules
  |                                |
  v                                v
ENRICH  beads-village_add       Tasks carry CASS context in description
  |                                |
  v                                v
EXECUTE subagents claim         Follow rules, leave inline feedback
  |                                |
  v                                v
LEARN   cm outcome + reflect    Session knowledge becomes persistent rules
```

## Phase 1: Plan with Memory

Before creating tasks, query CASS for relevant knowledge.

```bash
# For each task you're about to delegate:
cm context "<task description>" --json
```

This returns:
- **Playbook rules** scored against the task (with rule IDs like `b-8f3a2c`)
- **History snippets** from past sessions where similar work was done
- **Anti-patterns** to avoid (rules previously marked harmful)

Extract the top 3-5 rules. These go into the task description.

## Phase 2: Enrich and Delegate

When creating beads-village tasks, embed CASS context directly in the task description.

**Task description template:**

```
## Task
<what needs to be done>

## Memory Context
Following rules from CASS playbook:
- b-8f3a2c: <rule content> (score: 8.2, proven)
- b-def456: <rule content> (score: 6.1, established)

Avoid anti-patterns:
- b-xyz789: PITFALL: <what not to do>

## Prior History
<relevant snippet from cm context output, if any>

## Feedback Protocol
When following a rule, comment: // [cass: helpful b-XXXX] - reason
When a rule causes problems, comment: // [cass: harmful b-XXXX] - reason
```

**Delegation commands:**

```
beads-village_add   title, desc (with CASS context), tags, deps
beads-village_assign  id, role
```

Tag tasks with roles (`fe`, `be`, `qa`, `devops`, `mobile`) so the right subagent picks them up.

## Phase 3: Subagent Execution

Subagents follow the standard beads cycle with one addition -- inline CASS feedback:

```
1. beads-village_claim          Pick up the task
2. Read the Memory Context      Note which rules apply
3. beads-village_reserve        Lock files
4. Work                         Follow the rules, write code
5. Leave inline feedback        // [cass: helpful b-XXX] or // [cass: harmful b-XXX]
6. beads-village_done           Complete the task
```

### Inline Feedback Rules

- Reference rule IDs when following them: `"Following b-8f3a2c, using retry with backoff"`
- Mark rules helpful when they prevent a mistake or speed up work
- Mark rules harmful when they cause a regression, waste time, or are wrong
- Be specific in the reason -- vague feedback is discarded during reflection

## Phase 4: Learn from Outcomes

After a batch of tasks completes, the leader records outcomes and triggers reflection.

### Record Task Outcomes

For each completed task, record whether it succeeded or failed and which rules were used:

```bash
# Successful task that followed specific rules
cm outcome success b-8f3a2c,b-def456 --json

# Failed task where a rule caused problems
cm outcome failure b-xyz789 --text "Rate limiter approach caused deadlock" --json

# Mixed results
cm outcome mixed b-8f3a2c,b-def456 --json
```

### End-of-Session Reflection

At session end, trigger reflection to distill new rules from the work done:

```bash
cm reflect --days 1 --json
```

This processes all session activity (including inline feedback) into:
- New candidate rules from patterns detected
- Score updates for existing rules (helpful/harmful counts)
- Anti-pattern inversions for consistently harmful rules
- Maturity promotions for consistently helpful rules

### Review Playbook Health

```bash
# Top performing rules
cm top 10

# Find stale rules without recent feedback
cm stale --days 60

# Understand why a rule exists
cm why b-8f3a2c

# Overall playbook health metrics
cm stats --json
```

## Decision Matrix

| Situation | Action |
|-----------|--------|
| Creating a new task | Run `cm context` first, embed top rules |
| Task similar to past failure | Include anti-patterns prominently in description |
| Subagent following a rule successfully | Leave `// [cass: helpful b-XXX]` inline |
| Rule caused a problem during execution | Leave `// [cass: harmful b-XXX]` inline |
| Batch of tasks completed | Run `cm outcome` for each, then `cm reflect` |
| Starting a new session | `cm context` for the overall goal to prime memory |

## Configuration

In `clikit.config.json`:

```json
{
  "hooks": {
    "cass_memory": {
      "enabled": true,
      "cm_path": "/path/to/cm",
      "context_on_session_created": true,
      "reflect_on_session_idle": true,
      "context_limit": 5,
      "reflect_days": 7,
      "log": true
    }
  }
}
```

The `cm_path` option lets you specify a custom path to the `cm` binary. If omitted, it looks for `cm` on your PATH.

## Graceful Degradation

| Component Missing | Behavior |
|-------------------|----------|
| `cm` not installed | Falls back to embedded SQLite mode (basic context, no real reflection) |
| No playbook rules match | Delegate without memory context |
| `cm context` returns empty | Proceed -- the task is novel, learning starts now |
| `cm reflect` fails | Outcomes are still recorded, retry later |
| `cm outcome` without `cm` | Skipped (requires real cm CLI) |

## Leader Checklist

```
[ ] Run cm context before creating tasks
[ ] Embed top rules + anti-patterns in task descriptions
[ ] Include feedback protocol instructions in each task
[ ] After batch completion, run cm outcome for each task
[ ] At session end, run cm reflect --days 1
[ ] Review new/updated rules: cm top 10
```

## Anti-Patterns

- Dumping the entire playbook into a task description (token waste, noise)
- Skipping inline feedback (the learning loop breaks)
- Never running reflection (knowledge stays ephemeral)
- Assigning tasks without checking CASS first (repeating past mistakes)
- Ignoring anti-patterns in task descriptions (same failures recur)
