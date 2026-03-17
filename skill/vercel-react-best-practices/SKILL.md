---
name: vercel-react-best-practices
description: Use when writing, reviewing, or refactoring React/Next.js code. Enforces Server Components first, parallel fetching, and bundle optimization.
---

# Vercel React Best Practices

## Component Rules

**Default to Server Components.** Use `'use client'` only when you need interactivity, browser APIs, or hooks.

**Composition over prop explosion:**
```jsx
// Good
function Card({ header, children, footer }) { … }

// Bad
function Card({ headerTitle, headerSubtitle, footerText, … }) { … }
```

**Colocate files:**
```
Card/
  index.tsx       Card.tsx       Card.test.tsx       styles.ts
```

## Performance

```jsx
// Dynamic import for heavy components
const HeavyChart = dynamic(() => import('./Chart'), { loading: () => <Skeleton />, ssr: false });

// next/image — always, no raw <img>
<Image src="/hero.jpg" width={1200} height={600} priority />

// next/font — always
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

## Data Fetching

```jsx
// Parallel — always
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);

// Cache strategies
fetch(url, { next: { revalidate: 60 } });   // ISR
fetch(url, { cache: 'no-store' });           // SSR
fetch(url, { cache: 'force-cache' });        // static
```

## Rendering Strategy

| Use When | Strategy |
|----------|----------|
| Content rarely changes | SSG (static) |
| Per-request data | SSR (dynamic) |
| Periodic updates | ISR |
| Global low-latency | Edge |

## State

- Keep state as **local as possible** — no global store until proven necessary
- Use URL state (`useSearchParams`) for shareable/filterable state

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| `'use client'` on static content | Remove — use Server Component |
| `import { everything } from 'lib'` | Use tree-shaking or dynamic import |
| Raw `<img>` | `next/image` |
| Sequential `await` for independent data | `Promise.all` |
| Prop drilling 3+ levels | Composition or context |

## Pre-ship Checklist

- [ ] Server Components by default
- [ ] `next/image` for all images
- [ ] `next/font` for all fonts
- [ ] Parallel data fetching
- [ ] Dynamic imports for heavy code
- [ ] Correct caching strategy per route

See [references/patterns.md](references/patterns.md) for extended examples.
