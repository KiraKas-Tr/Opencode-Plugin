---
name: tilth-reading
description: Use when reading files, exploring codebases, or searching content. Tries tilth first for smart outline/section-aware reading; falls back to glob → read → grep if tilth is unavailable or fails.
---

# Tilth-first Reading

When any task requires reading files or exploring a codebase, follow this priority chain — always try the higher-priority tool first, fall back only when blocked.

## Priority Chain

```
1. tilth      → smart, outline-aware, section-targeted reading
2. read       → raw file content (fallback for full-file needs)
3. glob       → fallback when you need to discover file paths
4. grep       → fallback when you need to search content patterns
```

## Workflow

### Step 1 — Try tilth (always first)

```bash
# Read a whole file (smart: outline or full depending on size)
tilth <path>

# Read a specific section by line range
tilth <path> --section 45-89

# Read a specific section by markdown heading
tilth <path> --section "## Installation"
```

**Tilth is available if:** `npx tilth --version` exits 0, or a local `tilth` binary is on PATH.

**When tilth succeeds:** use its output directly. Do not duplicate with `read`.

**When tilth fails or is unavailable:** immediately fall back — do not retry tilth for the same path.

---

### Step 2 — Fallback: read (full file content)

Use when you need complete, unprocessed file content and tilth is not available.

```
read <path>
```

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

| Need | Tool |
|------|------|
| Read a known file, outline/section | `tilth` |
| Read a known file, need full raw content | `tilth` → `read` |
| Find files matching a name/extension pattern | `tilth` → `glob` |
| Search for a symbol/pattern across files | `tilth` → `grep` |
| tilth unavailable or errored | `read` + `glob` + `grep` as needed |

---

## Fallback Rules

- **Never use `read` + `tilth` for the same path** — pick one.
- **Never use `glob` when you already know the path** — call `read`/`tilth` directly.
- **Never call `grep` for something `tilth --section` can already isolate.**
- **Log fallback reason** when possible (e.g. "tilth not found, using read").

## Red Flags

- Calling `read` on a large file (>500 lines) without first trying `tilth` — tilth's outline mode saves context.
- Using `grep` to extract a known section — use `tilth --section` instead.
- Ignoring tilth exit code and retrying without fallback.
- Calling `glob` to discover a path you already know.

## References

- [Fallback flow detail](references/fallback-flow.md) — full decision tree, tilth availability check, error codes
