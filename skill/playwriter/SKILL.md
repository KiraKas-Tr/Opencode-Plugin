---
name: playwriter
description: Use when automating browser interactions, web scraping, or testing with existing Chrome sessions. 90% less context than traditional browser MCP.
---

# Playwriter Skill

Browser automation via Chrome extension integration. Provides a single `execute` tool with full Playwright API access while using your existing browser with all extensions, sessions, and cookies intact.

## Capabilities

- **Session Reuse**: Works with your logged-in browser sessions
- **Extension Support**: Full access to Chrome extensions during automation
- **Full Playwright API**: Navigation, clicks, inputs, screenshots, waits
- **Cookie Persistence**: No need to re-authenticate
- **Lightweight**: Minimal context usage compared to traditional browser MCPs

## When to Use

- Web scraping behind logins
- Automating repetitive browser tasks
- Testing web applications with existing sessions
- Taking screenshots of authenticated pages
- Form filling and submission
- Multi-step browser workflows

## Usage Pattern

```
Use the execute tool with Playwright-style commands:
- navigate(url)
- click(selector)
- fill(selector, value)
- screenshot()
- wait(selector)
- evaluate(script)
```

## Example

```javascript
execute({
  actions: [
    { type: "navigate", url: "https://example.com/dashboard" },
    { type: "wait", selector: ".data-table" },
    { type: "screenshot", path: "dashboard.png" }
  ]
})
```

## Notes

- Requires Chrome extension installation
- Browser must be running with remote debugging enabled
- Supports headless and headed modes
- Maintains state between execute calls
