# Vercel React — Extended Patterns

## Server vs Client Decision Tree

```
Does it need: onClick/onChange, useState/useEffect, browser-only APIs?
  YES → 'use client'
  NO  → Server Component (default)
```

## Streaming with Suspense

```jsx
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  );
}
```

## Error Boundaries

```jsx
// app/error.tsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Route Handlers (API Routes)

```ts
// app/api/users/route.ts
export async function GET(request: Request) {
  const users = await db.user.findMany();
  return Response.json(users);
}
```

## Metadata

```tsx
// Static
export const metadata: Metadata = { title: 'Page' };

// Dynamic
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await fetchProduct(params.id);
  return { title: product.name };
}
```

## Server Actions

```tsx
async function createUser(formData: FormData) {
  'use server';
  const name = formData.get('name');
  await db.user.create({ data: { name } });
  revalidatePath('/users');
}
```
