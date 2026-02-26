---
name: vercel-react-best-practices
description: Use when writing, reviewing, or refactoring React/Next.js code. Performance optimization patterns from Vercel Engineering.
---

# Vercel React Best Practices Skill

You are running the **vercel-react-best-practices** skill. Optimize React and Next.js applications.

## Core Principles

From Vercel Engineering team's production experience.

## Component Patterns

### 1. Composition Over Inheritance
```jsx
// Good: Composition
function Card({ header, children, footer }) {
  return (
    <div className="card">
      {header}
      <div className="content">{children}</div>
      {footer}
    </div>
  );
}

// Avoid: Prop explosion
function Card({ headerTitle, headerSubtitle, footerText, ... }) {}
```

### 2. Colocate Components
```
/components/
  Card/
    index.tsx      # Export
    Card.tsx       # Component
    Card.test.tsx  # Test
    styles.ts      # Styles
```

### 3. Server Components First
```jsx
// Default to Server Component
async function UserProfile({ id }) {
  const user = await fetchUser(id); // Direct DB access
  return <div>{user.name}</div>;
}

// Use 'use client' only when needed
'use client';
function InteractiveButton() {
  const [count, setCount] = useState(0);
  // ...
}
```

## Performance Patterns

### 1. Dynamic Imports
```jsx
// Lazy load heavy components
const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### 2. Image Optimization
```jsx
import Image from 'next/image';

// Automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Above fold
/>
```

### 3. Font Optimization
```jsx
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap'
});
```

## Data Fetching

### 1. Parallel Requests
```jsx
// Good: Parallel
async function Page() {
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts()
  ]);
  // ...
}

// Avoid: Waterfall
async function Page() {
  const user = await fetchUser();
  const posts = await fetchPosts(); // Waits for user
}
```

### 2. Cache Strategies
```jsx
// Revalidate periodically
fetch(url, { next: { revalidate: 60 } });

// Skip cache
fetch(url, { cache: 'no-store' });

// Force cache
fetch(url, { cache: 'force-cache' });
```

## Rendering Strategies

| Strategy | Use When |
|----------|----------|
| Static (SSG) | Content doesn't change often |
| Dynamic (SSR) | Per-request data needed |
| ISR | Periodic updates needed |
| Edge | Low latency globally |

## State Management

### 1. Start Local
```jsx
// Keep state as local as possible
function FilterableList({ items }) {
  const [filter, setFilter] = useState('');
  // Not in global store
}
```

### 2. URL State
```jsx
// For shareable state
import { useSearchParams } from 'next/navigation';

function Search() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
}
```

## Common Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| Client components for static content | Use Server Components |
| Large bundle imports | Use tree-shaking or dynamic imports |
| Unoptimized images | Use next/image |
| Blocking requests | Use Promise.all |
| Prop drilling | Use composition or context |

## Checklist

- [ ] Default to Server Components
- [ ] Images use next/image
- [ ] Fonts are optimized
- [ ] Parallel data fetching
- [ ] Dynamic imports for heavy code
- [ ] Proper caching strategy
