# Tilth-reading: Fallback Flow Reference

Full decision tree for the tilth-reading skill, including availability checks, error codes, and fallback triggers.

---

## Availability Check

Before using tilth in a new session, verify it is available:

```bash
# Option A: local install
tilth --version

# Option B: via npx
npx tilth --version
```

| Exit code | Meaning | Action |
|-----------|---------|--------|
| 0 | tilth available | Proceed with tilth |
| 1 / non-zero | tilth error | Fall back immediately |
| command not found | not installed | Fall back immediately |

> Cache the availability result within a session — do not re-check on every file read.

---

## Full Decision Tree

```
Need to read / search files?
│
├─► tilth available?
│    │
│    ├─► YES
│    │    │
│    │    ├─► Known path + section target?
│    │    │    └─► tilth <path> --section "…"
│    │    │
│    │    ├─► Known path, want smart summary/outline?
│    │    │    └─► tilth <path>
│    │    │
│    │    ├─► Need to discover paths first?
│    │    │    └─► glob → then tilth <each-path>
│    │    │
│    │    └─► Need to find symbol/pattern?
│    │         └─► tilth <path> --section <heading>
│    │             (or grep if heading unknown)
│    │
│    └─► NO / tilth errored
│         │
│         ├─► Need raw full file?  → read <path>
│         ├─► Need file discovery? → glob pattern="…"
│         └─► Need pattern search? → grep pattern="…"
│
└─► Combine fallbacks as needed:
     glob (discover) → read (content) → grep (pattern)
```

---

## Error Codes from tilth

| Error | Cause | Fallback |
|-------|-------|---------|
| Binary file detected | file is not text | `read` (confirms binary) or skip |
| Generated file skipped | auto-generated file | proceed, check `read` if needed |
| File too large (>500KB) | outline only mode triggered | use tilth output (outline) or `read` with `offset`+`limit` |
| Non-zero exit, stderr | any runtime error | fall back to `read` + `grep` |

---

## Tilth Flags Reference

```bash
tilth <path>                        # smart read: full or outline based on size
tilth <path> --section 45-89        # line range
tilth <path> --section "## Heading" # markdown heading
```

Key internal thresholds (from tilth source):
- `TOKEN_THRESHOLD = 6000` — above this, tilth switches to outline mode
- `FILE_SIZE_CAP = 500_000 bytes` — above this, outline only

---

## Fallback Chain Examples

### Example 1: Explore an unfamiliar directory

```
1. glob pattern="src/**/*.ts"              # discover files
2. tilth src/hooks/truncator.ts            # read key file (smart)
3. tilth src/index.ts --section "tool.execute.after"  # targeted section
```

### Example 2: tilth unavailable

```
1. tilth --version                         # fails: not found
2. glob pattern="src/**/*.ts"              # discover paths
3. read src/hooks/truncator.ts             # full content
4. grep pattern="shouldTruncate" include="*.ts"   # pattern search
```

### Example 3: Large file, want section only

```
1. tilth src/index.ts --section "## Phase 3"   # tilth sections it
   (if unavailable)
2. read src/index.ts offset=820 limit=60       # manual offset fallback
```

---

## Combining with Other Skills

| If also using | Note |
|---------------|------|
| `deep-research` | Use tilth-reading for local navigation; deep-research for external docs |
| `source-code-research` | tilth-reading replaces raw `read` calls in that skill when tilth is available |
| `systematic-debugging` | Use tilth --section to isolate the failing function before adding diagnostics |
