---
description: Initialize CliKit plugin and generate a well-crafted AGENTS.md for the project.
agent: build
---

You are the **Build Agent**. Execute the `/init` command.

## Your Task

Set up CliKit AND generate a high-quality `AGENTS.md` file. The AGENTS.md is the highest-leverage file in the project — it goes into every single session. Craft it carefully.

## Process

### 1. Check Prerequisites

```bash
ls -la .opencode/ 2>/dev/null
ls package.json 2>/dev/null
ls bun.lockb pnpm-lock.yaml yarn.lock 2>/dev/null
```

If `.opencode/` already exists with CliKit files, warn user and ask before overwriting.

### 2. Install Plugin

```bash
bun add -d clikit-plugin 2>/dev/null || \
pnpm add -D clikit-plugin 2>/dev/null || \
npm install -D clikit-plugin 2>/dev/null
```

### 3. Create Plugin Entry Point

Create `.opencode/index.ts`:

```typescript
import CliKitPlugin from "clikit-plugin";
export default CliKitPlugin;
```

### 4. Create Default Configuration

Create `.opencode/clikit.config.json` with sensible defaults (see existing template).

### 5. Create Memory Directory Structure

```bash
mkdir -p .opencode/memory/{specs,plans,research,reviews,handoffs,prds,beads,_templates}
```

### 6. Generate AGENTS.md

**This is the most important step.** The AGENTS.md file goes into EVERY session. Follow these principles:

#### 6a. Explore the Project First (parallel)

Fire these immediately to understand the project:

```
Explore: "Identify: 1) Language/runtime (check package.json, Cargo.toml, go.mod, pyproject.toml, etc.) 2) Framework (Next.js, Express, FastAPI, etc.) 3) Package manager (bun, pnpm, npm, yarn, cargo, pip) 4) Build command 5) Test command 6) Lint command"
Explore: "Map top-level structure. What are the main directories? Is this a monorepo? What are the apps vs packages vs shared code?"
Explore: "Find entry points, main config files, and any existing AGENTS.md/CLAUDE.md/CONTRIBUTING.md/README.md with project conventions."
```

#### 6b. Write AGENTS.md Following Best Practices

Write to `AGENTS.md` in the project root. Follow these rules strictly:

**TARGET: Under 60 lines. Every line must be universally applicable to every session.**

**Structure — WHAT / WHY / HOW:**

```markdown
# [Project Name]

[1-2 sentences: WHAT this project is and WHY it exists. Be specific — not "a web app" but "a real-time collaboration platform for design teams using WebSocket sync".]

## Stack

[Language, runtime, framework, key libraries. One line each, no fluff.]

## Project Structure

[Map the top-level directories. For monorepos, explain what each app/package does. Use a compact tree — max 10-15 lines. Focus on WHERE things are, not what every file does.]

## Development

[Only the commands an agent needs for ANY task. Build, test, typecheck, lint, dev server. Nothing task-specific.]

```bash
[package-manager] install
[package-manager] run build
[package-manager] run test
[package-manager] run lint
```

## Where to Find More

[Progressive disclosure — point to files, don't inline their contents. Only include files that actually exist in the project.]

- Architecture decisions: [path or "ask the team"]
- API patterns: [path]
- Testing conventions: [path]
- Contributing guide: [path]
```

#### 6c. What NOT to Include

Applying the blog's principles strictly:

- ❌ **No code style rules** — that's what linters and formatters do. Hooks handle auto-format and typecheck.
- ❌ **No task-specific instructions** — "how to create a database migration" doesn't belong. Put that in a separate doc and point to it.
- ❌ **No model/agent details** — agents know their own config. Don't list all 10 agents and their models.
- ❌ **No inline code snippets** — they go stale. Use `file:line` pointers instead.
- ❌ **No exhaustive command lists** — agent can discover commands. Only include the core workflow.
- ❌ **No "rules" that are just good engineering** — "write clean code" wastes instruction budget. The agent already knows.
- ❌ **No skill recommendations** — that's task-specific. Skills are discovered at task time.

#### 6d. What TO Include (universally applicable)

- ✅ **What the project IS** — 1-2 sentences, specific.
- ✅ **Tech stack** — language, runtime, framework, key deps.
- ✅ **Project map** — where things live (especially monorepos).
- ✅ **Essential commands** — build, test, lint, dev server.
- ✅ **Progressive disclosure pointers** — "Read X for Y" references to existing docs.
- ✅ **Non-obvious conventions** — only things the agent would get WRONG without being told (e.g., "We use Bun, not Node" or "Database migrations use Drizzle push, not migrate").
- ✅ **Verification commands** — how to confirm changes work.

### 7. If AGENTS.md Already Exists

If the project already has an `AGENTS.md` or `CLAUDE.md`:

1. Read it first
2. Audit it against the blog principles (concise? universally applicable? progressive disclosure?)
3. Propose improvements to the user — don't overwrite without asking
4. If user approves, rewrite following the principles above

### 8. Verify Setup

- Check that plugin loads correctly
- Verify agents are available
- Verify AGENTS.md exists and is under 60 lines
- Count instructions in AGENTS.md — warn if over 30 (LLMs reliably follow ~150 instructions, Claude Code's system prompt already uses ~50)

### 9. Report

```
## CliKit Initialized

✅ Plugin installed
✅ Entry point: .opencode/index.ts
✅ Config: .opencode/clikit.config.json
✅ Memory directories created
✅ AGENTS.md generated ([N] lines, [M] instructions)

### AGENTS.md Quality
- Lines: [N] (target: <60)
- Instructions: [M] (target: <30, budget shared with system prompt)
- Progressive disclosure: [Y/N]
- Task-specific content: [none found / WARNING: found N task-specific items]

### Next Steps
1. Review AGENTS.md — every line matters, it affects every session
2. Run `/create` to start a new feature
3. Customize `.opencode/clikit.config.json` as needed
```

## AGENTS.md Quality Principles (from humanlayer.dev)

1. **Less is more** — frontier models follow ~150 instructions reliably. System prompt uses ~50. Your AGENTS.md gets ~100 max. Each unnecessary instruction degrades ALL instructions uniformly.
2. **Universally applicable only** — if it doesn't matter for EVERY session, it doesn't belong here.
3. **Progressive disclosure** — point to detailed docs, don't inline them. The agent reads them only when relevant.
4. **Not a linter** — never put code style in AGENTS.md. Use formatters, hooks, and tooling.
5. **Pointers over copies** — reference `file:line`, not code snippets. Snippets go stale.
6. **Carefully crafted** — this is the highest leverage point. Every line either helps or hurts.

## Rules

- ✅ ALWAYS explore the project before generating AGENTS.md
- ✅ ALWAYS keep AGENTS.md under 60 lines
- ✅ ALWAYS use WHAT/WHY/HOW structure
- ✅ ALWAYS use progressive disclosure (pointers, not copies)
- ✅ ALWAYS verify the final instruction count
- ✅ ALWAYS check for existing AGENTS.md before overwriting
- ❌ NEVER put code style rules in AGENTS.md
- ❌ NEVER put task-specific instructions in AGENTS.md
- ❌ NEVER inline code snippets (they go stale)
- ❌ NEVER generate more than 30 instructions
- ❌ NEVER overwrite existing AGENTS.md without asking
