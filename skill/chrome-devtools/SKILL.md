---
name: chrome-devtools
description: Use for web debugging, performance analysis, network inspection, and runtime diagnostics.
---

# Chrome DevTools Skill

You are running the **chrome-devtools** skill. Deep debugging via embedded Chrome DevTools MCP.

## Capabilities

| Action | Description |
|--------|-------------|
| Inspect network | Request/response headers, timing, payloads |
| Debug web apps | Breakpoints, call stacks, variable inspection |
| Analyze performance | Lighthouse audits, Core Web Vitals, profiling |
| Console access | Execute JS, log analysis, error tracing |
| DOM inspection | Element selection, computed styles, layout |

## Usage

1. Connect to target page (URL or local dev server)
2. Select tool: Network, Performance, Console, Elements
3. Perform inspection or profiling
4. Export results for analysis

## MCP Loading

This skill uses an embedded Chrome DevTools protocol connection. No external MCP server required.

## Best Practices

- Profile before optimizing to identify real bottlenecks
- Use network throttling to test slow connections
- Check both desktop and mobile viewports
- Export HAR files for network analysis
