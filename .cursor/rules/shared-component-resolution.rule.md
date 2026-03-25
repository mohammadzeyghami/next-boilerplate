# Cursor Rule — Component Architecture and Shared Resolution

## Goal

Enforce a scalable frontend component architecture by:

- Reusing existing shared components first
- Preventing duplicate components
- Keeping business logic out of shared components
- Allowing new shared components only when no existing internal or Shadcn component fits

---

## Core Principles

1. Shared components = reusable UI structure
2. Module components = domain/business logic
3. NEVER duplicate an existing shared component
4. NEVER create a new component before searching existing sources
5. New shared components may only be added when both:
   - internal shared components do not satisfy the need
   - Shadcn does not provide a suitable base component

---

## Real Project Paths

Internal shared components are located in:

- `src@/shared/atoms`
- `src@/shared/molecules`
- `src@/shared/organisms`

Module components are located in:

- `src/modules/<module-name>/components`

---

## Mandatory Component Resolution Order

Before creating any component, Cursor MUST follow this exact order:

### Step 1 — Search Internal Shared Components First

Search in:

- `src@/shared/atoms`
- `src@/shared/molecules`
- `src@/shared/organisms`

If a matching or close-enough component exists:

- REUSE it
- EXTEND it only if it stays generic
- COMPOSE it inside the module if domain logic is required
- DO NOT create a duplicate component

---

### Step 2 — Search Shadcn Component Library

If no suitable internal shared component exists, search for an appropriate Shadcn component pattern.

Examples:

- button
- input
- dialog
- drawer
- sheet
- table
- select
- dropdown-menu
- tabs
- form
- tooltip
- popover

If a suitable Shadcn component exists:

- use it as the base implementation
- adapt it to the project's architecture and design conventions
- place the final reusable abstraction in the correct `share-components` layer if needed
- DO NOT create a completely custom component when Shadcn already provides a suitable foundation

---

### Step 3 — Create a New Shared Component Only as Last Resort

A new shared component may be created ONLY when:

1. No suitable component exists in `src@/shared`
2. No suitable Shadcn component exists
3. The need is generic and reusable
4. The component has no domain/business meaning
5. The component is expected to be reused across multiple modules/projects

If all conditions are not met, DO NOT create it in shared.
Keep it inside the module instead.

---

## Component Classification

### 1. Atom (Shared ✅)

Examples:

- Button
- Input
- Badge
- Icon
- Spinner

Location:
`src@/shared/atoms`

Rules:

- smallest reusable UI unit
- no business logic
- no API calls
- no domain naming

---

### 2. Molecule (Shared ✅)

Examples:

- FormField
- SearchInput
- Pagination
- EmptyState
- SelectField

Location:
`src@/shared/molecules`

Rules:

- combination of atoms
- may contain light UI logic
- must stay generic
- no API calls
- no domain-specific behavior

---

### 3. Organism (Shared ⚠️ Limited)

Examples:

- DataTable
- BaseModal
- BaseDrawer
- Generic filter bar
- Generic form section

Location:
`src@/shared/organisms`

Rules:

- must be configurable via props
- must remain generic
- must not contain domain/business logic
- must not hardcode business data
- must not call APIs directly

Forbidden examples:

- UsersTable
- OrdersTable
- PatientCard
- InvoiceSummary

---

### 4. Module Component (Not Shared ❌)

Examples:

- UsersTable
- PatientHistoryCard
- InsurancePlanForm
- ProductFilters

Location:
`src/modules/<module-name>/components`

Rules:

- contains business/domain meaning
- may use API hooks
- may use business rules
- may compose shared components
- must not be moved into shared

---

## Dependency Rule

Modules may import from share-components ✅  
Share-components must never import from modules ❌

---

## Strict Naming Rule

If the component name includes domain meaning, it is NOT a shared component.

Shared ✅

- Button
- DataTable
- FormField
- BaseDialog

Not Shared ❌

- UserTable
- PatientCard
- OrderSummary
- InsuranceSelector

---

## Shared Usage Rule

When generating UI:

- ALWAYS prefer internal shared components first
- if not found, ALWAYS check Shadcn
- only then consider creating a new shared component
- NEVER use raw HTML elements if an internal shared or Shadcn-based component exists

Example:

Wrong:

```tsx
<button className="...">Save</button>
```
