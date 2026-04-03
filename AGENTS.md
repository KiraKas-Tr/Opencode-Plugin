# Agent Instructions

This workspace uses **bd / Beads** for persistent issue tracking and **beads-village MCP tools** for AI-agent execution. Run `bd onboard` if you are setting up the terminal CLI for the first time.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

**AI-agent note:** humans use the `bd` CLI in a terminal; OpenCode agents must use `beads-village_*` MCP tools for init / claim / reserve / done.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Version-controlled: Built on Dolt with cell-level merge
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Two Interfaces

| Interface | Who Uses It | How |
|-----------|-------------|-----|
| **`bd` CLI** | Human in terminal | `bd ready`, `bd create`, `bd close` |
| **`beads-village_*` MCP** | AI agents in OpenCode | `beads-village_init`, `beads-village_claim`, `beads-village_reserve`, `beads-village_done` |

**AI agents must use `beads-village_*` MCP tools — never shell `bd` commands for claim / lock / close.**

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

For **non-trivial work**, AI agents follow the Beads Village execution loop:

1. `beads-village_init(team="project")` — join workspace first
2. `beads-village_status(include_agents=true)` + `beads-village_inbox(unread=true)` — inspect active agents and blockers
3. `beads-village_ls(status="ready")` — find ready work
4. `beads-village_show(<id>)` — read task context before claiming
5. `beads-village_claim()` — claim the next ready task in queue order
6. `beads-village_reservations()` + `beads-village_reserve(paths, reason)` — check and lock files before editing
7. Implement and verify inside the reserved file scope
8. `beads-village_done(id, msg)` — close the task and auto-release locks
9. `beads-village_sync()` — sync shared task state after completion

If new follow-up work is discovered, create a linked issue with `discovered-from:<parent-id>`.

**Trivial work** (< 2 minutes, one-line / one-file fix) may skip Beads and execute directly.

### Compressed Workflow Model

- **Mode:** `compressed`
- **Active roles:** `build`, `plan`, `review`, `coordinator`
- **Execution unit:** **Task Packet** (1 concern, 1–3 files, one verify bundle)
- **Source of truth:** Beads live task state; `todowrite` is informational only
- **Subagent budget per packet:** 2
- **`/start`:** execute + verify loop for the next packet
- **`/verify`:** optional deeper audit / pre-ship confidence pass

Non-trivial implementation should follow the packet model above instead of ad-hoc multi-file editing.

### Shared Workspace Policy

This repo now uses a **shared checkout** workflow for agents.

- ✅ Work in the existing repository checkout
- ✅ Coordinate with Beads and file reservations, then land changes directly on the repo's shared default branch
- ✅ Pull/rebase frequently so conflicts surface immediately instead of being hidden in isolated workspaces
- ❌ Do NOT create git worktrees for routine agent execution
- ❌ Do NOT create per-task branches unless the user explicitly asks for an exception

### Nested Repository Note

- `.opencode/` is currently treated as its **own nested git repository** in this workspace
- The outer repo may only show `.opencode` as modified, while the detailed file diffs live inside the nested `.opencode` repo
- It is **not** configured as a normal `.gitmodules` submodule in the current workspace, so inspect both git layers when auditing documentation or code changes

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Use `beads-village_reserve` before editing files in multi-agent work
- ✅ Work one Task Packet at a time for non-trivial changes
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Navigation & Context Rules

### Tilth-first reading

When reading files or exploring code, prefer this order:

1. `tilth <path>` / `tilth <path> --section ...` — default file and section navigation
2. `read <path>` — raw content fallback when tilth is unavailable or insufficient
3. `grep <pattern>` — cross-file text search when needed
4. `glob <pattern>` — only for explicit path enumeration

Use LSP tools for semantic confirmation after narrowing the target.

### Context management

- Manage context continuously in compressed mode
- Use the `compress` tool to summarize closed exploration / implementation ranges
- Keep active work uncompressed; compress stale, high-signal sections once they are no longer needed verbatim

## Landing the Plane (Session Completion)

**When ending a work session with landed code**, you MUST complete ALL steps below. If you are pausing without landing, create/update the issue state and hand off clearly instead of pushing partial work.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - Mandatory only when you are landing completed work:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches if applicable
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- If you are landing completed work, it is NOT complete until `git push` succeeds
- Do not stop before pushing when the task is in a landed/ship state — that leaves completed work stranded locally
- NEVER say "ready to push when you are" for completed work — YOU must push it
- If push fails during landing, resolve and retry until it succeeds
- If you are pausing mid-task, do **not** pretend the work is complete — leave the issue open and hand off explicitly

<!-- END BEADS INTEGRATION -->
