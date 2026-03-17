# Chrome DevTools — Tool Reference

## Puppeteer MCP Tools

```
puppeteer_navigate(url)
puppeteer_screenshot(selector?)           # capture page or element
puppeteer_click(selector)
puppeteer_fill(selector, value)
puppeteer_evaluate(script)                # run JS, returns result
puppeteer_pdf(path)                       # save page as PDF
```

## Useful evaluate() Snippets

### Network timing
```js
puppeteer_evaluate(`
  JSON.stringify(
    performance.getEntriesByType('navigation')[0]
  )
`)
```

### Core Web Vitals
```js
puppeteer_evaluate(`
  new Promise(resolve => {
    new PerformanceObserver(list => {
      resolve(list.getEntries().map(e => ({name: e.name, value: e.value})))
    }).observe({entryTypes: ['largest-contentful-paint','first-input','layout-shift']})
  })
`)
```

### Console errors capture
```js
puppeteer_evaluate(`
  window.__errors = [];
  window.onerror = (msg, src, line) => window.__errors.push({msg,src,line});
  'listening'
`)
# ... navigate, interact ...
puppeteer_evaluate("JSON.stringify(window.__errors)")
```

### DOM state
```js
puppeteer_evaluate("document.querySelector('.component')?.innerHTML")
puppeteer_evaluate("getComputedStyle(document.querySelector('.btn')).backgroundColor")
```

## Debug Workflow

```
1. puppeteer_navigate(url)
2. puppeteer_evaluate(capture console errors)
3. puppeteer_screenshot()                  → baseline
4. puppeteer_click / puppeteer_fill
5. puppeteer_screenshot()                  → after interaction
6. puppeteer_evaluate(check state)
7. compare screenshots + state
```
