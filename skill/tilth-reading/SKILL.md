---
name: tilth-reading
description: Use when reading files, exploring codebases, or searching content. Tries tilth first for smart outline/section-aware reading; falls back to glob → read → grep if tilth is unavailable or fails.
---

# Tilth-first Reading

When any task requires reading files or exploring a codebase, follow this priority chain — always try the higher-priority tool first, fall back only when blocked.

## Priority Chain

```
1. bash: tilth <path>    → smart, outline-aware, section-targeted reading
2. read <path>           → raw file content (auto-enhanced by hook when tilth available)
3. glob <pattern>        → fallback when you need to discover file paths
4. grep <pattern>        → fallback when you need to search content patterns
```

## Two Paths — Know Which to Use

| Situation | How to invoke tilth |
|-----------|-------------------|
| Want smart full read or outline | `bash: tilth <path>` |
| Want a specific section or heading | `bash: tilth <path> --section "## Heading"` |
| Want a line range | `bash: tilth <path> --section 45-89` |
| Tilth unavailable or bash not permitted | `read <path>` (hook auto-enhances when possible) |
| Need to discover paths first | `glob pattern="…"` |
| Need content pattern search | `grep pattern="…"` |

> **Runtime hook:** the `tilth_reading` hook already enhances `read` tool output via tilth when tilth is on PATH.  
> So `read` alone is often sufficient for full-file reads — use explicit `bash: tilth` when you need section targeting or outline-only mode.

## Workflow

### Step 1 — Try tilth via bash (always first for large/unknown files)

```bash
# Check tilth is available (cache result — don't repeat every call)
tilth --version

# Read a whole file (smart: outline or full depending on size)
tilth <path>

# Read a specific section by markdown heading
tilth <path> --section "## Installation"

# Read a specific section by line range
tilth <path> --section 45-89
```

**When tilth succeeds:** use its output directly. Do not duplicate with `read`.

**When tilth fails or is unavailable:** fall back immediately — do not retry tilth for the same path.

---

### Step 2 — Fallback: read (full file content, hook-enhanced)

Use when tilth bash is unavailable or you need raw content.

```
read <path>
```

The `tilth_reading` runtime hook automatically runs tilth on the output when available.

Use `read` with `offset` + `limit` to scope large files:
```
read <path> offset=<line> limit=<n>
```

---

### Step 3 — Fallback: glob (file discovery)

Use when you need to find files by pattern before reading.

```
glob pattern="**/*.ts" path="<dir>"
glob pattern="**/SKILL.md"
```

Always narrow the pattern as much as possible — avoid `**/*` without extension filtering.

---

### Step 4 — Fallback: grep (content search)

Use when you need to find symbols, usages, or patterns across files.

```
grep pattern="<regex>" include="*.ts" path="<dir>"
```

Combine with `glob` results when searching a pre-discovered set of files.

---

## Decision Table

| Need | Primary | Fallback |
|------|---------|---------|
| Read known file — smart outline | `bash: tilth <path>` | `read <path>` |
| Read known file — specific section | `bash: tilth <path> --section "…"` | `read <path> offset=X limit=N` |
| Discover file paths | `glob pattern="…"` | — |
| Search content patterns | `bash: tilth <path>` then `grep` | `grep pattern="…"` |
| tilth unavailable / bash denied | `read <path>` | `glob` + `grep` |

---

## Fallback Rules

- **Never use `read` + `tilth` for the same path** — pick one.
- **Never use `glob` when you already know the path** — call `read`/`tilth` directly.
- **Never call `grep` for something `tilth --section` can already isolate.**
- **Never assume bash: tilth works** — verify permission first (`tilth*: allow` in agent frontmatter).

## Red Flags

- Calling `read` on a large file (>500 lines) without first trying `bash: tilth` — tilth's outline mode saves context.
- Using `grep` to extract a known section — use `tilth --section` instead.
- Agent has `bash: "*": deny` without `tilth*: allow` — tilth is silently blocked; fallback to `read`.
- Assuming `read` is not enhanced — the hook runs tilth on `read` output automatically.

## References

- [Fallback flow detail](references/fallback-flow.md) — full decision tree, tilth availability check, error codes
