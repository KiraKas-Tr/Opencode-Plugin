# Playwright MCP — Tool Reference

## Core Tools

### Navigation
```
playwright_navigate(url, waitUntil?)
  waitUntil: "load" | "domcontentloaded" | "networkidle" (default: "load")
```

### Interaction
```
playwright_click(selector)
playwright_fill(selector, value)
playwright_select(selector, value)         # <select> elements
playwright_evaluate(script)                # run JS in page context
playwright_wait_for_selector(selector, timeout?)
```

### Capture
```
playwright_screenshot(fullPage?, selector?)
playwright_get_text(selector?)             # get visible text
```

### Session
```
playwright_close()                         # always call when done
```

## Common Patterns

### Auth flow
```
playwright_navigate("http://localhost:3000/login")
playwright_fill("#email", "test@example.com")
playwright_fill("#password", "secret")
playwright_click("[type=submit]")
playwright_wait_for_selector(".dashboard")
playwright_screenshot()
```

### Responsive test
```
playwright_navigate("http://localhost:3000")
playwright_evaluate("window.innerWidth")   # check viewport
playwright_screenshot(true)               # full page
```

### Assert text
```
playwright_get_text(".status")
# compare returned text to expected value
```

## Viewport Sizes

| Breakpoint | Width |
|------------|-------|
| Mobile | 375px |
| Tablet | 768px |
| Desktop | 1280px |

Set via `playwright_evaluate("Object.assign(window, {innerWidth: 375})")` or configure in setup.
