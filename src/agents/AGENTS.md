# Agents

Each `.md` file in this directory defines an agent. The frontmatter sets model, tools, and permissions. The markdown body becomes the agent's system prompt. Loaded by `index.ts` using gray-matter.

## Agent Roles

| Agent | Role | Mode | Modifies Code? |
|---|---|---|---|
| **@build** | Primary orchestrator and code executor. Delegates, implements, verifies. | primary | ✅ Yes |
| **@plan** | Primary strategic planner. Produces specs and plans. Architecture-aware. | primary | ❌ Plans only |
| **@oracle** | High-depth read-only advisor for hard architecture trade-offs, complex debugging, and second-opinion analysis. Expensive specialist — invoke only when `@explore` or `@research` cannot resolve the question. | subagent | ❌ Read-only |
| **@explore** | Fast local codebase navigator. Symbol definitions, usages, file structure, git history. Read-only. | subagent | ❌ Read-only |
| **@research** | External evidence specialist. Docs, APIs, GitHub patterns, web sources. Read-only. | subagent | ❌ Read-only |
| **@review** | Code reviewer and security auditor. Quality gate before merge. | subagent | ❌ Read-only |
| **@vision** | Design architect and visual implementer. Frontend UI only. | subagent | ✅ Frontend only |

## Specialist Boundaries

The three read-only specialists have distinct scopes — choose the right one:

| Need | Use | Why |
|------|-----|-----|
| Find a symbol, file, usage, or recent git change | `@explore` | Fast, local, cheap |
| Find external docs, library API, GitHub pattern, version info | `@research` | External evidence only |
| Decide between approaches, assess blast radius, unblock hard debugging | `@oracle` | Deep reasoning, expensive — last resort |

**Never call `@oracle` for something `@explore` or `@research` can answer.**

## File Reading Strategy

All agents that read files must follow the **tilth-first chain** (see `skill/tilth-reading/SKILL.md`):

```
1. tilth <path> / tilth <symbol> --scope <dir>   — direct CLI first for read/search/navigation
2. grep <pattern>                                  — fallback: text pattern search when tilth did not answer
3. read <path>                                     — fallback: raw full file content
4. glob <pattern>                                  — fallback: explicit path discovery only
```

> Prefer direct `tilth` CLI first. Use `npx tilth` only when the CLI is not installed globally.
> The runtime hook (`tilth_reading`) automatically enhances `read` tool output via tilth, but it does **not** replace `grep`/`glob`, so agents must call `tilth` explicitly for search and navigation.
> `@explore` additionally has a hard runtime guard: `read` / `grep` / `glob` are blocked until an explicit `tilth` CLI attempt has been made in that subagent session.

## Active Roles in Compressed Workflow

Default active roles:
- `@build`
- `@plan`
- `@review`
- coordinator logic in command/runtime flow

On-demand specialists (invoke only when needed):
- `@explore` — codebase navigation
- `@research` — external evidence
- `@oracle` — hard decisions, expensive
- `@vision` — frontend/UI work

## Beads Task Management

Agents use **Beads** (`beads-village_*` MCP tools) for persistent task tracking.

**Policy:** Beads is used for non-trivial work. Trivial fixes (typo, single-line) skip Beads and execute immediately.

**Core cycle:**
```
beads-village_init → beads-village_add → beads-village_claim → work → beads-village_done
```

Execution happens one **Task Packet** at a time.

- **@build**: Creates issues for non-trivial tasks, claims and closes on completion
- **@plan**: Creates issues for every plan task after plan approval
- **Subagents**: Read-only — do not create/modify Beads issues

`todowrite` is for in-session UI display only. Beads persists across sessions.

## Delegation Rules

- Primary agents (`@build`, `@plan`) can delegate to subagents
- Subagents must NOT delegate to other subagents — **exception:** `@oracle` may consult `@research` for external evidence when local analysis is insufficient
- `@build` delegates architecture decisions to `@oracle` — does not decide itself
- `@plan` consults `@oracle` for hard trade-offs — Oracle provides analysis, Plan makes the plan
- Read the specific agent's `.md` file before modifying its behavior

## Delegation Flow

```
User → @build (orchestrator)
         ├── @explore   (find code, symbols, usages, git history)
         ├── @research  (find external docs, APIs, GitHub patterns)
         ├── @oracle    (hard decisions, blast radius, blocked debugging)
         ├── @plan      (multi-step planning)
         ├── @vision    (UI work)
         └── @review    (quality gate before merge)

User → @plan (planning)
         ├── @explore   (codebase context, integration points)
         ├── @research  (external info, version compatibility)
         └── @oracle    (architecture trade-offs, risky design decisions)
```
