# Project Gotchas

> Lessons learned and known pitfalls for this project. Updated as issues are discovered.

---

## DCP Beta (`@tarquinen/opencode-dcp@beta`)

### Single compress tool — no prune, no distill

DCP beta ships with **one tool: `compress`**. The old 3-tool system (`distill`, `compress`, `prune`) is gone.

```
❌ /dcp prune     → does not exist in beta
❌ /dcp distill   → does not exist in beta
✅ /dcp compress  → the only compression tool
✅ /dcp sweep     → aggressive compress variant
✅ /dcp stats     → token breakdown
✅ /dcp context   → full context breakdown
```

If you encounter guidance mentioning `prune` or `distill`, it is outdated.

---

### Config location

DCP reads config in this priority order (highest last):

1. `~/.config/opencode/dcp.jsonc` (global)
2. `$OPENCODE_CONFIG_DIR/dcp.jsonc` (if env set)
3. `.opencode/dcp.jsonc` ← **project level, highest priority**

DCP's own code lives at: `~/.cache/opencode/node_modules/@tarquinen/opencode-dcp/`  
Do not edit files there — they get overwritten on reinstall.

---

### Auto-protected tools

DCP will **never** prune output from these tools (hardcoded in beta):

| Tool | Reason protected |
|------|-----------------|
| `task` | Subagent results are always critical |
| `skill` | Skill content must persist for active use |
| `todowrite` | In-session task state |
| `todoread` | In-session task state |
| `compress` | DCP's own operations |
| `batch` | Batched tool call containers |
| `plan_enter` | Plan mode boundary markers |
| `plan_exit` | Plan mode boundary markers |

These are also listed in `.opencode/dcp.jsonc → protectedToolNames`.

---

### Nudge configuration

Current project config (`.opencode/dcp.jsonc`):

```jsonc
"nudgeFrequency": 5,           // suggest after every 5 iterations
"iterationNudgeThreshold": 15, // become more insistent after 15 iterations
"nudgeForce": "soft"           // suggests, does not force auto-compress
```

- `nudgeForce: "soft"` = DCP nudges but **you** trigger compress.  
- If you want DCP to auto-compress: change to `"nudgeForce": "auto"` (not recommended for default).

---

### Reduced cache invalidation

Beta has reduced cache invalidation compared to v2. This improves performance but means:
- Config changes in `dcp.jsonc` may not take effect until OpenCode restarts.
- If compress behavior seems wrong after config edit → restart OpenCode.

---

### compress.permission: "ask"

Default config uses `"permission": "ask"` — DCP will prompt before compressing.  
If you want silent auto-compress: change to `"permission": "auto"`.

Avoid `"permission": "deny"` unless debugging — it disables all compression.

---

### Installing alongside CliKit

DCP beta is installed automatically by CliKit when you run:

```bash
bun x clikit-plugin install
```

This adds **both** entries to `opencode.json`:
- `clikit-plugin@latest`
- `@tarquinen/opencode-dcp@beta`

Restart OpenCode after install to activate.
