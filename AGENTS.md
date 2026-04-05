# CliKit

An OpenCode plugin that provides agents, commands, skills, hooks, and a memory system for AI-assisted development. Built with TypeScript and Bun.

## How It Works

The plugin (`src/index.ts`) loads agents from `src/agents/*.md`, commands from `command/*.md`, and skills from `skill/*/SKILL.md`. Runtime hooks in `src/hooks/` intercept tool execution for safety (git guard, security scan) and quality (typecheck, formatting). Configuration prefers `clikit.jsonc` or `clikit.json`; legacy `clikit.config.json` remains supported for backward compatibility.

## Workflow

**Quick mode** (simple features):
```
/discuss → /create → /start → /verify → /ship
```

**Deep mode** (complex features, research, UI):
```
/discuss → /create → /design → /start → /verify → /ship
```

- `/discuss` captures user intent and writes a planning-ready discussion artifact
- `/create` reads discussion context, runs a mandatory pre-plan research pass, then produces a single XML-structured plan — `/start` works directly from this output
- `/start` executes packet-by-packet and embeds the execute + verify loop in compressed mode
- `/verify` is the deeper optional audit / pre-ship gate — run before `/ship` finalizes and lands shared-checkout changes
- `/research` = optional standalone research command — read discussion context, close decision gaps with external evidence, and write a planning-ready report
- `/design` = UI/UX design and implementation (uses Vision agent)
- Execution happens one **Task Packet** at a time (1 concern, 1–3 files, one verify bundle)

## Where to Find Things

- **Agent behavior**: Read the specific agent's `.md` file in `src/agents/` — each has full instructions in its prompt.
- **Commands**: `command/*.md` — each slash command's template and instructions.
- **Skills**: `skill/*/SKILL.md` — load relevant skills before tasks. List available skills with `ls skill/`.
- **Schemas**: `@.opencode/schemas.md` — canonical schemas for tasks, beads, delegation, artifacts, and Task Packets.
- **Templates**: `memory/_templates/*.md` — templates for discussions, plans, research, reviews, handoffs, PRDs.
- **Memory**: `memory/_digest.md` (auto-generated from SQLite observations on session start), plus `memory/discussions/`, `memory/plans/`, `memory/research/`, `memory/handoffs/`, `memory/reviews/`, `memory/prds/`.
- **Config**: `.opencode/clikit.jsonc` or `.opencode/clikit.json` (preferred); `clikit.config.json` remains a legacy fallback.
- **Full docs**: `@.opencode/README.md` — complete reference for all agents, commands, skills, hooks, and config options.

## Context Management (DCP Beta)

CliKit installs [`@tarquinen/opencode-dcp@beta`](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) alongside itself. DCP beta uses a **single `compress` tool** — the old 3-tool system (`distill`, `compress`, `prune`) is gone.

### Token Budget

| Level | Context % | Action |
|-------|-----------|--------|
| 🟢 Green | < 40% | Normal operation |
| 🟡 Yellow | 40–65% | Offload findings to `memory/`; run `/dcp stats` to inspect |
| 🟠 Orange | 65–80% | Run `/dcp compress` to consolidate; prep handoff if work is complex |
| 🔴 Red | > 80% | Run `/dcp sweep` immediately, then `/handoff`; end session |

### DCP Commands

| Command | When to use |
|---------|-------------|
| `/dcp stats` | Check token breakdown and savings at any time |
| `/dcp context` | Full breakdown of what is consuming context |
| `/dcp compress` | Trigger context compression (will ask permission by default) |
| `/dcp sweep` | Aggressive sweep before session end when context is critical |

### Rules

- Do **not** reference `/dcp prune` or `/dcp distill` — not supported in beta.
- DCP config lives at `.opencode/dcp.jsonc` (project-level, highest priority).
- Auto-protected tools whose output DCP will never prune: `task`, `skill`, `todowrite`, `todoread`, `compress`, `batch`, `plan_enter`, `plan_exit`.
- `nudgeForce: "soft"` — DCP will suggest but not force compression.
- Reduced cache invalidation is on by default in beta for better performance.

### Integration with session-management skill

Load `session-management` skill for full threshold handling (including handoff triggers). DCP compress is a *complement* to handoffs — it compresses context in-session, while `/handoff` writes state to disk across sessions.

## Development

```bash
bun install        # dependencies
bun run build      # compile plugin
bun run typecheck  # type check
bun run verify     # full local verification
bun run dev        # watch mode
```

## Key Conventions

- Plugin entrypoint: `src/index.ts`
- Agents are parsed from markdown frontmatter (gray-matter): `src/agents/index.ts`
- Commands are parsed the same way: `src/commands/index.ts`
- Hooks export from `src/hooks/index.ts`, wired in `src/index.ts` event handlers
- Memory tools in `src/tools/` are library code used by hooks, not registered as agent tools
- Never force push without `--force-with-lease`

## Tilth Navigation Policy

When agents navigate files or search the codebase, use **tilth CLI first**.

Fallback order:

```text
tilth CLI → read → grep → glob
```

- Use `read` once the target file is narrowed and you need raw content
- Use `grep` for text-pattern fallback when tilth did not answer the question
- Use `glob` only for explicit path enumeration
- Use LSP after navigation when semantic confirmation is required

This is a documented agent rule, not a hard runtime block.

## Issue Tracking with Beads Rust (`br`)

**IMPORTANT**: This project now prefers **Beads Rust** (`br`) with local `.beads/` storage for persistent task tracking. Do NOT use markdown TODOs or ad-hoc task lists as the source of truth.

### Preferred Interface

| Interface | Who Uses It | How |
|-----------|-------------|-----|
| **`br` CLI** | User and agents | `br init`, `br ready --json`, `br create`, `br update`, `br close`, `br sync` |
| **`beads-village_*` MCP** | Optional legacy compatibility | Use only if already installed and explicitly needed for reservations/messages |

### Agent Core Cycle

```
br init → br ready --json → br show/list --json → br create (if needed) → br update --status in_progress --claim → work → verify → br close → br sync --flush-only
```

In compressed workflow, the execution unit is a **Task Packet**:
- one concern
- one verify bundle
- 1–3 files
- strict file scope

### Key Tool Reference (v1.3 API)

| Tool | Purpose |
|------|---------|
| `br init` | Initialize `.beads/` for the project |
| `br ready --json` | List unblocked claimable work |
| `br create --title ... --description ... --type ... --priority ...` | Create issue |
| `br update <id> --status in_progress --claim` | Claim / start work |
| `br show <id> --json` | Read task details |
| `br list --json` | Inspect task inventory |
| `br close <id> --reason "Completed" --json` | Close completed work |
| `br sync --flush-only` | Flush `.beads/` state before git commit/push |
| `br sync --import-only` | Re-import `.beads/` state after pull/rebase |

### Legacy compatibility note

- `beads-village_*` is no longer the default required workflow in this repo.
- If a local setup still depends on `beads-village` for reservations or inbox-style coordination, treat it as optional compatibility, not the primary task tracker.
- This repo does **not** currently provide a full MCP replacement for `br`; use the CLI-first workflow above.

### Policy

- Trivial (< 2 min, 1-line fix): skip Beads, just do it
- Non-trivial: prefer `br` issue first → claim/start → work → close
- `todowrite` = in-session UI display only — `.beads/` is the persistent execution state when task tracking is in use
- Work in the shared checkout on the repo default branch — no git worktrees or per-task branches unless the user explicitly requests them
- Check `git status --short --branch` before editing; if overlapping local changes already exist in your scope, stop and coordinate instead of isolating the work
- If optional `beads-village` reservations are available, you may use them to surface conflicts early in the shared workspace
- Otherwise coordinate through git state, handoffs, and explicit file scope instead of assuming reservations exist
- Call `br close` before ending a completed tracked session; for mid-task handoff, leave the issue open and hand off without closing it

### Nested Repository Note

- In this workspace, `.opencode/` is treated as its own nested git repository
- The outer repo often only shows `.opencode` as modified, while detailed diffs live inside the nested `.opencode` repo
- It is not currently configured as a normal `.gitmodules` submodule, so inspect both git layers when auditing docs or code changes
