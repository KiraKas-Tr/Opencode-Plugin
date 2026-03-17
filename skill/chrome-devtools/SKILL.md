---
name: chrome-devtools
description: Use for web debugging, performance analysis, network inspection, and runtime diagnostics via Chrome DevTools protocol.
---

# Chrome DevTools

## Capabilities

| Task | What to use |
|------|-------------|
| Network timing / payloads | Network panel → HAR export |
| JS breakpoints & call stack | Sources panel |
| Core Web Vitals / Lighthouse | Performance / Lighthouse audit |
| Console errors & JS execution | Console panel |
| DOM + computed styles | Elements panel |

## Workflow

1. Connect to target (URL or local dev server)
2. Choose panel: Network · Performance · Console · Elements
3. Inspect or profile
4. Export results (HAR / report) for analysis

## Best Practices

- Profile before optimizing — identify real bottlenecks, not guesses
- Use network throttling (Fast 3G / Slow 3G) to test real-world conditions
- Check both desktop and mobile viewports
- Export HAR for async network analysis

## References

- [Tool reference](references/tool-reference.md) — Puppeteer MCP tools, evaluate() snippets, debug workflow
- MCP: `puppeteer` — see [mcp.json](mcp.json)
