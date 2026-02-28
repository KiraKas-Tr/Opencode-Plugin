---
name: playwright
description: Use for browser automation, E2E testing, form filling, screenshots, and responsive design validation.
---

# Playwright Skill

You are running the **playwright** skill. Browser automation via Playwright MCP.

## Capabilities

| Action | Description |
|--------|-------------|
| Navigate pages | Load URLs, handle redirects, wait for content |
| Fill forms | Input text, select options, upload files |
| Take screenshots | Full page, element-specific, mobile viewports |
| Test responsive | Switch viewports, validate breakpoints |
| Validate UX | Check interactions, accessibility, flows |
| Test auth flows | Login sequences, session persistence |

## Usage

1. Specify the URL or local dev server
2. Define actions (navigate, click, fill, assert)
3. Set viewport if testing responsive design
4. Capture screenshots for verification

## MCP Loading

This skill loads the Playwright MCP server **only when used**. Clean browser context per session.

## Best Practices

- Use `await page.waitForLoadState('networkidle')` for dynamic content
- Take before/after screenshots for visual diffs
- Test both happy and error paths
- Clean up sessions to prevent resource leaks
