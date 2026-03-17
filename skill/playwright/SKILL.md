---
name: playwright
description: Use for browser automation, E2E testing, form filling, screenshots, and responsive design validation via Playwright MCP.
---

# Playwright

## Capabilities

| Task | Action |
|------|--------|
| Navigate | Load URLs, handle redirects, wait for content |
| Fill forms | Input text, select options, upload files |
| Screenshots | Full page, element-specific, mobile viewport |
| Responsive testing | Switch viewports, validate breakpoints |
| Auth flows | Login sequences, session persistence |
| Assertions | Text content, visibility, element state |

## Workflow

1. Specify URL or local dev server
2. Define action sequence (navigate → interact → assert)
3. Set viewport for responsive tests
4. Capture before/after screenshots as evidence

## Best Practices

- `waitForLoadState('networkidle')` before interacting with dynamic content
- Take before/after screenshots for visual diffs
- Test both happy path and error path
- Clean up sessions to prevent resource leaks

## Red Flags

- Assertions before content has loaded
- Only testing happy path
- No cleanup after session

## References

- [Tool reference](references/tool-reference.md) — full tool signatures and common patterns
- MCP: `playwright` — see [mcp.json](mcp.json)
