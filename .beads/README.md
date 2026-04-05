# Beads Rust Workspace

This repository now prefers **Beads Rust** (`br`) for local issue tracking.

## Quick Start

```bash
# Initialize tracker metadata if needed
br init

# See actionable work
br ready --json

# Create a new task
br create --title "Example task" --description "Context" --type task --priority 2

# Start work
br update <issue-id> --status in_progress --claim

# Finish work
br close <issue-id> --reason "Completed" --json

# Flush tracker state before commit/push
br sync --flush-only
```

## Files in this directory

- `metadata.json` — tracker metadata (`beads.db` + `issues.jsonl` paths)
- `config.yaml` — optional tracker configuration
- `issues.jsonl` — git-friendly exported issue state
- `deletions.jsonl` — tombstones / deletion log when used
- `.gitignore` — local runtime files that should stay untracked

## Migration notes

- Legacy `bd` / Dolt artifacts may still appear in ignored files or historical backups.
- `beads-village_*` MCP is now optional compatibility only; `br` is the default workflow.
- If you pull newer tracker state from git, run `br sync --import-only`.
