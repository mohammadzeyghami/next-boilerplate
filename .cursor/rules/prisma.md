حتماً — این هم نسخه‌اش به صورت **Cursor Rule** که مستقیم می‌تونی داخل Cursor بذاری:

````md
---
description: Prisma-first data access with TanStack Query in Next.js App Router
globs: "src/**/*.{ts,tsx}"
alwaysApply: false
---

# Cursor Rule — Prisma + TanStack Query Conventions

You must follow these conventions when generating code for this project.

The project uses:

- Next.js App Router
- Prisma
- TanStack Query
- Feature-based architecture

The data flow must always follow this rule:

```txt
Prisma -> Server Action / Route Handler -> Client Service -> TanStack Query -> UI Component
```
````

---

# Core Rule

Data must be fetched or mutated with **Prisma first**, on the **server**.

After that, the client must use **TanStack Query** to manage:

- caching
- loading state
- error state
- invalidation
- mutations
- optimistic updates

TanStack Query does **not** replace Prisma.

Prisma is the source of truth for database access.
TanStack Query is the client-side state and cache layer.

---

# Hard Rules

## 1) Prisma is server-only

Prisma must only be used in:

- Server Actions (`"use server"`)
- Route Handlers
- Server Components
- server-only utilities

Prisma must never be used in:

- `"use client"` files
- Client Components
- browser-only code
- TanStack Query hooks directly

Forbidden:

```ts
"use client";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
```

---

## 2) UI components must never call Prisma directly

UI components must only consume:

- feature query hooks
- feature mutation hooks

UI components must not contain:

- Prisma calls
- database logic
- raw fetch logic for feature CRUD
- raw mutation logic
- inline query keys

---

## 3) TanStack Query must be used after the server layer

Correct flow:

1. Prisma reads or writes data on the server
2. Server Action or Route Handler exposes that operation
3. Client service calls that server function
4. TanStack Query hook calls the client service
5. UI component consumes the hook

---

# Architecture

Each feature owns its own data layer.

Recommended structure:

```txt
src/
  Modules/
    <Feature>/
      actions/
        <feature>.actions.ts
      api/
        <feature>.client.ts
        keys.ts
        queries.ts
        mutations.ts
      components/
      hooks/
      store/
      index.ts

  lib/
    prisma.ts
    queryClient.ts
    react-query-provider.tsx
```

---

# Layer Responsibilities

## `actions/*.ts`

Server-only layer.

Responsibilities:

- `"use server"`
- use Prisma
- perform CRUD
- return JSON-serializable data only

Rules:

- never return raw `Date`
- convert dates to ISO strings
- no UI logic
- no toast logic
- no router logic

Example:

```ts
"use server";

import { prisma } from "@/lib/prisma";

export async function listUsersAction() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  }));
}
```

---

## `api/<feature>.client.ts`

Client bridge layer.

Responsibilities:

- `"use client"`
- call Server Actions or same-origin Route Handlers
- keep signatures clean and minimal
- no Prisma
- no axios for app-owned Prisma CRUD

Example:

```ts
"use client";

import { listUsersAction } from "../actions/users.actions";

export const usersClientService = {
  list: () => listUsersAction(),
};
```

---

## `api/keys.ts`

All TanStack Query keys must live here.

Rules:

- keys must be serializable
- keys must be stable
- keys must be composable
- never write raw query keys in components or hooks

Example:

```ts
export const usersKeys = {
  all: () => ["users"] as const,
  lists: () => [...usersKeys.all(), "list"] as const,
  list: (filters: { page?: number; q?: string } = {}) => [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all(), "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), { id }] as const,
};
```

---

## `api/queries.ts`

All query hooks must live here.

Rules:

- always use query keys from `keys.ts`
- always call the client service
- never call Prisma here
- never place raw data-fetching logic inside components
- use `enabled` for dependent queries
- use pagination/search params in query keys

Example:

```ts
"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { usersClientService } from "./users.client";
import { usersKeys } from "./keys";

export function useUsersQuery(params: { page?: number; q?: string }) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersClientService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUserDetailQuery(id?: string) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ""),
    queryFn: () => usersClientService.getById(id as string),
    enabled: Boolean(id),
  });
}
```

---

## `api/mutations.ts`

All mutation hooks must live here.

Rules:

- always call the client service
- always invalidate affected queries
- never call Prisma here
- optimistic updates must implement rollback

### Invalidation Rules

| Operation | Invalidate           |
| --------- | -------------------- |
| create    | lists()              |
| update    | lists() + detail(id) |
| delete    | lists()              |

Example:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersClientService } from "./users.client";
import { usersKeys } from "./keys";

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersKeys.lists(),
      });
    },
  });
}
```

---

# Optimistic Updates

Optimistic updates must use all of:

- `onMutate`
- `onError`
- `onSettled`

Rollback is mandatory.

Example:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersClientService } from "./users.client";
import { usersKeys } from "./keys";

type User = {
  id: string;
  name: string;
  email: string;
};

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersClientService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: usersKeys.list({}),
      });

      const previousUsers = queryClient.getQueryData<User[]>(usersKeys.list({}));

      queryClient.setQueryData<User[]>(usersKeys.list({}), (old = []) =>
        old.filter((user) => user.id !== id),
      );

      return { previousUsers };
    },

    onError: (_error, _id, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.list({}), context.previousUsers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: usersKeys.lists(),
      });
    },
  });
}
```

---

# Server Actions vs Route Handlers

## Prefer Server Actions when:

- the project is fully inside Next.js
- the feature uses app-owned database CRUD
- you want a direct bridge from client service to server
- you want simpler internal architecture

## Prefer Route Handlers when:

- you need standard HTTP endpoints
- the endpoint may be reused by multiple clients
- you want REST-like API boundaries

Both are valid, as long as Prisma stays server-side.

---

# Serialization Rules

Server Actions and Route Handlers must return JSON-serializable data only.

Convert values like:

- `Date` -> ISO string
- Prisma records -> plain DTO objects

Do not return:

- raw `Date`
- `Map`
- `Set`
- class instances
- non-serializable complex objects

---

# Do

- fetch and mutate app-owned data with Prisma on the server
- expose server operations through Server Actions or Route Handlers
- call those operations through a client service
- use TanStack Query on the client for query/mutation state
- define all query keys in `keys.ts`
- invalidate queries after mutations
- use `enabled` for dependent queries
- implement rollback for optimistic updates
- keep UI components free from data-layer logic

---

# Don't

- do not import `@prisma/client` in `"use client"` files
- do not call Prisma directly inside client components
- do not write raw query keys in components
- do not place queries or mutations inside UI components
- do not return non-serializable values from server functions
- do not put database logic in the UI layer
- do not use axios for app-owned CRUD backed by Prisma

---

# Example of Correct End-to-End Flow

## Server Action

```ts
"use server";

import { prisma } from "@/lib/prisma";

export async function listUsersAction() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  }));
}
```

## Client Service

```ts
"use client";

import { listUsersAction } from "../actions/users.actions";

export const usersClientService = {
  list: () => listUsersAction(),
};
```

## Query Keys

```ts
export const usersKeys = {
  all: () => ["users"] as const,
  lists: () => [...usersKeys.all(), "list"] as const,
  list: () => [...usersKeys.lists()] as const,
};
```

## Query Hook

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { usersClientService } from "./users.client";
import { usersKeys } from "./keys";

export function useUsersQuery() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: () => usersClientService.list(),
  });
}
```

## Component

```tsx
"use client";

import { useUsersQuery } from "../api/queries";

export function UsersList() {
  const { data, isLoading, isError } = useUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error while loading users</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}
```

---

# Final Rule

Always generate code so that:

- Prisma performs the real data access on the server
- TanStack Query manages the client-side state after that
- UI components remain unaware of Prisma
- the flow stays:

```txt
Prisma -> Server Action / Route Handler -> Client Service -> TanStack Query -> Component
```

```

```
