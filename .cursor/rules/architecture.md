# Architecture Rules

Feature-Based Architecture + Atomic Design UI System

## Goal

This project uses a **hybrid architecture**:

- **Feature-Based architecture** for the application structure.
- **Atomic Design** for the shared UI system.

This separation ensures scalability, maintainability, and clear domain boundaries.

---

# Architecture Overview

## 1. Feature-Based Architecture (Modules)

The application is organized by **business domains (features)**.

Each feature must be **self-contained** and include:

- API layer
- state management
- feature UI
- hooks
- tests
- stories

Examples:

```
Users
Auth
Dashboard
Billing
```

Each feature should expose a **public API** through its `index.ts`.

Example:

```
Modules/Users/index.ts
```

---

# 2. Shared UI System (Atomic Design)

The **Shared layer** contains the design system and reusable UI components.

This layer must contain **pure UI only** and follow **Atomic Design**.

Atomic layers:

- **Atoms** → smallest UI elements
- **Molecules** → small compositions of atoms
- **Organisms** → larger UI blocks
- **Templates** → layout skeletons

Shared components **must not contain domain logic**.

---

# Folder Structure

```
src/

Modules/
  Users/
    api/
    components/
    hooks/
    store/
    __tests__/
    __stories__/
    index.ts

  Auth/
  Dashboard/

Shared/
  components/
    atoms/
    molecules/
    organisms/
    templates/

  utils/
  hooks/
  index.ts
```

---

# Responsibilities

## Shared (Atomic UI System)

Allowed:

- Pure UI components
- styling
- accessibility
- reusable utilities
- generic hooks

Forbidden:

- API calls
- business logic
- domain models
- feature-specific state
- imports from Modules

Shared must remain **domain-agnostic**.

---

## Modules (Feature Layer)

Modules contain **business logic and domain UI**.

Allowed:

- TanStack Query
- API integrations
- Zustand / Context
- domain models
- feature UI
- data mapping

Modules can **use Shared components to build feature UIs**.

---

# Dependency Rules

Allowed dependencies:

```
Modules → Shared
Shared → Shared utils/hooks
```

Forbidden dependencies:

```
Shared → Modules
Module A → Module B
```

Modules must remain isolated.

If cross-feature communication is needed, it must go through **public APIs only**.

---

# Example Usage

Correct usage:

```
import { Button, EmptyState } from "@/Shared"
import { useUsersQuery } from "@/Modules/Users"
```

Example:

```
export function UsersTable() {
  const { data } = useUsersQuery()

  if (!data?.length) {
    return <EmptyState title="No users" />
  }

  return <Button>Refresh</Button>
}
```

---

# Responsibility Separation Example

## Shared (Reusable UI)

```
Shared/components/organisms/DataTableShell.tsx
```

Reusable table component without domain awareness.

---

## Feature Implementation

```
Modules/Users/components/UsersTable.tsx
```

Users feature connects domain data to shared UI.

---

# Testing Rules

Feature tests must be located inside the feature folder.

Example:

```
Modules/Users/__tests__
Modules/Users/__stories__
```

Shared component stories must be located near the component.

Example:

```
Shared/components/atoms/Button/Button.stories.tsx
```

---

# ESLint Dependency Rule

Shared components must never import Modules.

Example rule:

```
Shared must not import from Modules/*
```

This ensures architectural boundaries remain intact.

---

# PR Checklist

Before merging a pull request:

- Shared does not import from `Modules`
- Feature UI remains inside Modules
- Shared components remain domain-agnostic
- Query keys and API logic stay inside the feature
- Stories and tests are updated

---

# Decision Guide

Use this guide to decide component placement.

| Question                          | Shared | Module |
| --------------------------------- | ------ | ------ |
| Reusable without domain knowledge | Yes    | No     |
| Used across multiple features     | Yes    | No     |
| Requires API or domain models     | No     | Yes    |
| Contains feature-specific UI      | No     | Yes    |

---

# Summary

Feature-Based architecture provides:

- domain boundaries
- scalable team collaboration
- easier refactoring

Atomic Design in Shared provides:

- reusable UI system
- consistent design
- better testing and maintainability

Following these rules ensures a **clean, scalable, and maintainable codebase**.
