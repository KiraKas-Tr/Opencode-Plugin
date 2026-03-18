# CliKit

An OpenCode plugin that provides agents, commands, skills, hooks, and a memory system for AI-assisted development. Built with TypeScript and Bun.

## How It Works

The plugin (`src/index.ts`) loads agents from `src/agents/*.md`, commands from `command/*.md`, and skills from `skill/*/SKILL.md`. Runtime hooks in `src/hooks/` intercept tool execution for safety (git guard, security scan) and quality (typecheck, formatting). Configuration lives in `clikit.config.json`.

## Workflow

**Quick mode** (simple features):
```
/create → /start → /verify → /ship
```

**Deep mode** (complex features, research, UI):
```
/create → /research → /design → /start → /verify → /ship
```

- `/create` produces both spec and plan — `/start` works directly from this output
- `/verify` is the pre-ship gate — run before `/ship` finalizes and lands shared-checkout changes
- `/research` = external docs, API comparison, library research
- `/design` = UI/UX design and implementation (uses Vision agent)

## Where to Find Things

- **Agent behavior**: Read the specific agent's `.md` file in `src/agents/` — each has full instructions in its prompt.
- **Commands**: `command/*.md` — each slash command's template and instructions.
- **Skills**: `skill/*/SKILL.md` — load relevant skills before tasks. List available skills with `ls skill/`.
- **Schemas**: `@.opencode/schemas.md` — canonical schemas for tasks, beads, delegation, artifacts, and Task Packets.
- **Templates**: `memory/_templates/*.md` — templates for specs, plans, research, reviews, handoffs, PRDs.
- **Memory**: `memory/_digest.md` (auto-generated from SQLite observations on session start), plus `memory/specs/`, `memory/plans/`, `memory/research/`, `memory/handoffs/`.
- **Config**: `clikit.config.json` — enable/disable agents, hooks, override models.
- **Full docs**: `@.opencode/README.md` — complete reference for all agents, commands, skills, hooks, and config options.

## Development

```bash
bun install        # dependencies
bun run build      # compile plugin
bun run typecheck  # type check
bun run dev        # watch mode
```

## Key Conventions

- Plugin entrypoint: `src/index.ts`
- Agents are parsed from markdown frontmatter (gray-matter): `src/agents/index.ts`
- Commands are parsed the same way: `src/commands/index.ts`
- Hooks export from `src/hooks/index.ts`, wired in `src/index.ts` event handlers
- Memory tools in `src/tools/` are library code used by hooks, not registered as agent tools
- Never force push without `--force-with-lease`

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Two Interfaces

| Interface | Who Uses It | How |
|-----------|-------------|-----|
| **`bd` CLI** | User in terminal | `bd create`, `bd ready`, `bd close` |
| **`beads-village_*` MCP** | AI agents in OpenCode | `beads-village_add`, `beads-village_claim` |

**AI agents must use `beads-village_*` MCP tools — never shell `bd` commands.**

### Agent Core Cycle

```
beads-village_init → inspect shared git state → beads-village_add → beads-village_claim → reserve → work → done
```

In compressed workflow, the execution unit is a **Task Packet**:
- one concern
- one verify bundle
- 1–3 files
- strict file scope

### Key Tool Reference (v1.3 API)

| Tool | Purpose |
|------|---------|
| `beads-village_init` | Join workspace — call FIRST every session |
| `beads-village_add(title, typ, pri, tags, deps)` | Create issue |
| `beads-village_claim` | Claim next ready task (filtered by role) |
| `beads-village_reserve(paths, reason)` | Lock files before editing |
| `beads-village_done(id, msg)` | Complete task, auto-release locks |
| `beads-village_ls(status="ready")` | List claimable tasks |
| `beads-village_show(id)` | Get task details |
| `beads-village_status(include_agents=true)` | Workspace overview + agent discovery |
| `beads-village_msg(subj, global=true, to="all")` | Broadcast to team |
| `beads-village_inbox(unread=true)` | Read messages |
| `beads-village_sync` | Push/pull git changes |

### v1.3 API Changes (avoid old names)

| ❌ Old (broken) | ✅ Correct |
|---|---|
| `beads-village_ready` | `beads-village_ls(status="ready")` |
| `beads-village_broadcast` | `beads-village_msg(global=true, to="all")` |
| `beads-village_discover` | `beads-village_status(include_agents=true)` |

### Policy

- Trivial (< 2 min, 1-line fix): skip Beads, just do it
- Non-trivial: create issue first → claim → work → done
- `todowrite` = in-session UI display only — Beads is the persistent and authoritative execution state
- Work in the shared checkout on the repo default branch — no git worktrees or per-task branches unless the user explicitly requests them
- Check `git status --short --branch` before editing; if overlapping local changes already exist in your scope, stop and coordinate instead of isolating the work
- Use `beads-village_reserve` to surface conflicts early in the shared workspace
- Always `reserve` files before editing in multi-agent contexts
- Call `done` before ending a completed session; for mid-task handoff, leave the issue open and hand off without `done`
