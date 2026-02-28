# Agents

Each `.md` file in this directory defines an agent. The frontmatter sets model, tools, and permissions. The markdown body becomes the agent's system prompt. Loaded by `index.ts` using gray-matter.

## Delegation

- @build — implements features. Default for all implementation work.
- @plan — creates specs and plans. Default for planning. Has `bash: false` — delegates git history to @explore.
- @vision — prompt-to-UI, image-to-code, variant exploration. Loads skills like `frontend-aesthetics` and `mockup-to-code`.
- @explore — fast read-only codebase navigation. Has restricted bash (grep, find, git read-only).
- @review — code review and security audit. Use before merging.
- @oracle — merged deep analysis + architecture advisor (from previous oracle + looker).
- @research — merged external research + GitHub evidence specialist (from previous scout + librarian).

## Rules

- Primary agents (@build, @plan) can delegate to subagents.
- Subagents should NOT delegate to other subagents.
- Read the specific agent's `.md` file before modifying its behavior.
