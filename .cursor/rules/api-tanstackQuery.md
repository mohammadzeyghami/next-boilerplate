```md
# Cursor Rule — TanStack Query Conventions

You must follow these conventions when generating code that uses TanStack Query in this project.

The project uses:

- TanStack Query
- Axios
- Next.js App Router
- Feature-based architecture

All data-fetching logic must follow the rules below.

---

# Architecture

Every feature owns its own API layer.

Folder structure:
```

src/
Modules/ <Feature>/
api/
client.ts
keys.ts
queries.ts
mutations.ts
components/
store/
index.ts
lib/
api.ts
queryClient.ts
react-query-provider.tsx

````

Never place queries or mutations inside UI components.

---

# Query Keys

All query keys must be defined in `keys.ts`.

Keys must be:

- serializable
- stable
- composable

Example:

```ts
export const usersKeys = {
  all: () => ['users'] as const,
  lists: () => [...usersKeys.all(), 'list'] as const,
  list: (filters: { page?: number; q?: string } = {}) =>
    [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all(), 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), { id }] as const,
}
````

Never write raw query keys inside components.

Always use the factory.

---

# Queries

Queries must live inside:

```
Modules/<Feature>/api/queries.ts
```

Example pattern:

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usersKeys } from "./keys";

export function useUsersQuery(params) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => api.get("/users", { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}
```

Rules:

- always use `queryKey` from keys factory
- always colocate query with the feature
- always use `enabled` when query depends on a variable
- never call axios directly in UI components

Example dependency query:

```ts
useQuery({
  queryKey: usersKeys.detail(id ?? ""),
  queryFn: () => fetchUser(id),
  enabled: Boolean(id),
});
```

---

# Mutations

Mutations must live inside:

```
Modules/<Feature>/api/mutations.ts
```

Example:

```ts
export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto) => api.post("/users", dto).then((r) => r.data),

    onSettled: () => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
```

Rules:

- mutations must invalidate affected queries
- always use query keys factory
- never mutate query cache without rollback

---

# Optimistic Updates

Optimistic updates must use:

- `onMutate`
- `onError`
- `onSettled`

Pattern:

```ts
onMutate: async (payload) => {
  await qc.cancelQueries({ queryKey: usersKeys.lists() });

  const previous = qc.getQueryData(usersKeys.list({}));

  qc.setQueryData(usersKeys.list({}), (old) => {
    return [...old, payload];
  });

  return { previous };
};

onError: (_err, _payload, ctx) => {
  if (ctx?.previous) {
    qc.setQueryData(usersKeys.list({}), ctx.previous);
  }
};

onSettled: () => {
  qc.invalidateQueries({ queryKey: usersKeys.lists() });
};
```

Rollback must always be implemented.

---

# Axios Usage

All API calls must use the shared axios instance:

```
src/lib/api.ts
```

Example:

```ts
import { api } from "@/lib/api";

api.get("/users");
api.post("/users", payload);
```

Never import axios directly inside feature code.

---

# Error Handling

Errors must be mapped inside the API layer.

Mutation or query hooks should handle UI effects such as:

- toast
- field errors
- redirects

Services must not contain UI logic.

---

# Pagination and Filters

Query keys must include parameters.

Example:

```
usersKeys.list({ page, q })
```

Rules:

- pagination must use `keepPreviousData`
- search queries must include search string in key
- UI must debounce search input

---

# Cache Invalidation Rules

After mutations:

| Operation | Invalidate           |
| --------- | -------------------- |
| create    | lists()              |
| update    | lists() + detail(id) |
| delete    | lists()              |

Example:

```ts
qc.invalidateQueries({ queryKey: usersKeys.lists() });
```

---

# Query Client Rules

QueryClient must be created in:

```
src/lib/queryClient.ts
```

Never create a QueryClient inside components.

Use the shared provider:

```
src/lib/react-query-provider.tsx
```

---

# Do

- colocate API logic inside feature modules
- use query key factories
- use `enabled` for conditional queries
- implement optimistic updates with rollback
- invalidate queries after mutations
- use shared axios client

---

# Don't

- do not write raw query keys
- do not fetch data inside components
- do not share QueryClient between server and client
- do not put API logic inside UI components
- do not use unstable objects in query keys

---

# Code Generation Instructions

When generating code:

- always create `keys.ts`
- always place queries in `queries.ts`
- always place mutations in `mutations.ts`
- always import axios from `@/lib/api`
- always invalidate queries after mutations
- always colocate API logic inside the feature module

Never violate these conventions unless explicitly requested.

```

```
