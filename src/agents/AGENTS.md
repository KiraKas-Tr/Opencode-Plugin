# Agents

Each `.md` file in this directory defines an agent. The frontmatter sets model, tools, and permissions. The markdown body becomes the agent's system prompt. Loaded by `index.ts` using gray-matter.

## Agent Roles

| Agent | Role | Mode | Modifies Code? |
|---|---|---|---|
| **@build** | Primary orchestrator and code executor. Delegates, implements, verifies. | primary | ✅ Yes |
| **@plan** | Primary strategic planner. Produces specs and plans. Architecture-aware. | primary | ❌ Plans only |
| **@oracle** | Architecture advisor and complex analysis. Deep local inspection. | subagent | ❌ Read-only |
| **@explore** | Fast codebase navigator. File search, definitions, git history. | subagent | ❌ Read-only |
| **@research** | External research. Docs, APIs, GitHub evidence, web sources. | subagent | ❌ Read-only |
| **@review** | Code reviewer and security auditor. Quality gate before merge. | subagent | ❌ Read-only |
| **@vision** | Design architect and visual implementer. Frontend UI only. | subagent | ✅ Frontend only |

## Active Roles in Compressed Workflow

Default active roles:
- `@build`
- `@plan`
- `@review`
- coordinator logic in command/runtime flow

On-demand specialists:
- `@explore`
- `@research`
- `@oracle`
- `@vision`

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

- Primary agents (@build, @plan) can delegate to subagents
- Subagents should NOT delegate to other subagents (exception: Oracle → Research for external evidence)
- Build delegates architecture decisions to Oracle or Plan — does not decide itself
- Plan consults Oracle for hard trade-offs — Oracle provides analysis, Plan makes the plan
- Read the specific agent's `.md` file before modifying its behavior

## Delegation Flow

```
User → @build (orchestrator)
         ├── @explore (find code)
         ├── @research (find docs)
         ├── @oracle (hard decisions)
         ├── @plan (multi-step planning)
         ├── @vision (UI work)
         └── @review (quality gate)

User → @plan (planning)
         ├── @explore (codebase context)
         ├── @research (external info)
         └── @oracle (architecture trade-offs)
```
