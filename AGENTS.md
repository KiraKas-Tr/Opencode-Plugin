# CliKit

An OpenCode plugin that provides agents, commands, skills, hooks, and a memory system for AI-assisted development. Built with TypeScript and Bun.

## How It Works

The plugin (`src/index.ts`) loads agents from `src/agents/*.md`, commands from `command/*.md`, and skills from `skill/*/SKILL.md`. Runtime hooks in `src/hooks/` intercept tool execution for safety (git guard, security scan) and quality (typecheck, formatting). Configuration lives in `clikit.config.json`.

## Workflow

```
/create → /plan → /start → /verify → /ship
```

Always verify before claiming done. Run typecheck + lint + test before commit.

## Where to Find Things

- **Agent behavior**: Read the specific agent's `.md` file in `src/agents/` — each has full instructions in its prompt.
- **Commands**: `command/*.md` — each slash command's template and instructions.
- **Skills**: `skill/*/SKILL.md` — load relevant skills before tasks. List available skills with `ls skill/`.
- **Schemas**: `@.opencode/schemas.md` — canonical schemas for tasks, beads, delegation, artifacts.
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
