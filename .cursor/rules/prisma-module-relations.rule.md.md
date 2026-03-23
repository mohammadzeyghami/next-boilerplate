# 📄 `prisma-module-relations.rule.md`

````md
# Prisma Module Relations Rule

## 🎯 Overview

This document defines how **database relationships must be handled** in a full-stack architecture using:

- Prisma
- PostgreSQL
- Module / Feature-based structure

The system enforces **strict module isolation** to ensure:

- Scalability
- Maintainability
- Low coupling
- Reusable module boilerplates
- Safe schema evolution

---

## 🧠 Core Rule

> ❗ Prisma models from different modules MUST NOT have direct relationships

This means:

- ❌ No `@relation` across modules
- ❌ No foreign keys across modules
- ❌ No Prisma `include` across modules
- ❌ No SQL JOIN across modules
- ❌ No direct Prisma model dependency between modules

---

## 🧱 Module Ownership

Each Prisma model MUST belong to exactly one module.

Example:

| Model        | Module   |
| ------------ | -------- |
| User         | users    |
| UserCurrency | users    |
| Currency     | currency |
| Content      | content  |

---

## ✅ Allowed Relationships (Same Module Only)

Models inside the SAME module can have full Prisma relations.

```prisma
model UserCurrency {
  id         String   @id @default(uuid())
  userId     String
  currencyId String

  user       User     @relation(fields: [userId], references: [id])
  currency   Currency @relation(fields: [currencyId], references: [id])
}
```
````

✔ Allowed because all models belong to the same module

---

## ❌ Forbidden Relationships (Cross Module)

### ❌ Cross-module relation

```prisma
model Currency {
  id        String   @id @default(uuid())
  contents  Content[]  // ❌ NOT allowed
}
```

---

### ❌ Cross-module Foreign Key

```prisma
model UserCurrency {
  currencyId String

  currency Currency @relation(fields: [currencyId], references: [id]) // ❌
}
```

---

## 🔁 Cross-Module Communication

> Modules must communicate ONLY via service layer

### ❌ Forbidden

- Importing another module's Prisma model
- Using Prisma relation across modules
- Using include/join across modules

---

### ✅ Correct Pattern

```ts
// modules/users/application/get-user-currency.ts

import { getCurrencyById } from "@/modules/currency/application/get-currency-by-id";

const currency = await getCurrencyById(currencyId);
```

---

## 🧩 Reference Pattern (Instead of Relation)

When referencing another module:

### ✅ Store ID only

```prisma
model UserCurrency {
  id         String @id @default(uuid())
  userId     String
  currencyId String  // reference only
  value      Int
}
```

✔ No relation
✔ No foreign key
✔ No include

---

## 🧠 Populate Concept (Critical)

> Populate happens in service layer, NOT in Prisma

### Definition

- Database → stores only IDs
- API → returns full object

---

### Example

#### Database (PostgreSQL)

```json
{
  "currencyId": "uuid-1"
}
```

---

#### API Response

```json
{
  "currency": {
    "id": "uuid-1",
    "name": "Gold"
  }
}
```

---

## 🛠 Populate Implementation (Service Layer)

```ts
export async function getUserCurrency(id: string) {
  const uc = await prisma.userCurrency.findUnique({
    where: { id },
  });

  const currency = await currencyService.getById(uc.currencyId);

  return {
    id: uc.id,
    value: uc.value,
    currency,
  };
}
```

---

## 🚫 Forbidden Patterns

### ❌ Prisma include across modules

```ts
await prisma.userCurrency.findMany({
  include: {
    currency: true, // ❌ forbidden
  },
});
```

---

### ❌ Cross-module relation

```prisma
currency Currency @relation(...) // ❌
```

---

### ❌ Raw SQL JOIN across modules

```ts
await prisma.$queryRaw`SELECT * FROM user_currency JOIN currency ...`; // ❌
```

---

### ❌ Importing another module model

```ts
import { Currency } from "@/modules/currency/model"; // ❌
```

---

## ✅ Allowed Patterns

### ✅ Store reference only

```prisma
currencyId String
```

---

### ✅ Service-based populate

```ts
const currency = await currencyService.getById(currencyId);
```

---

### ✅ DTO Mapping

```ts
type UserCurrencyDto = {
  id: string;
  value: number;
  currency: CurrencyDto;
};
```

---

## 🧪 Design Benefits

- Loose coupling between modules
- Independent module evolution
- Easier refactoring
- No circular dependencies
- Better scalability
- Microservice-ready architecture
- Works well with AI-driven development (Cursor)

---

## 🧩 Recommended Architecture

### Module Structure

```bash
src/modules/<module-name>/
  ui/
  application/
  domain/
  infrastructure/
```

---

### Responsibility Breakdown

| Layer          | Responsibility |
| -------------- | -------------- |
| UI             | Components     |
| Application    | Use-cases      |
| Domain         | Types & DTO    |
| Infrastructure | Prisma access  |

---

## 🏁 Golden Rules

1. ❗ No cross-module Prisma relation
2. ❗ No cross-module foreign key
3. ❗ No Prisma include across modules
4. ❗ No direct model dependency between modules
5. ❗ Store only IDs for cross-module references
6. ❗ Populate only in service layer
7. ❗ API returns full object, DB stores only IDs

---

## 📊 Summary

| Rule                             | Allowed |
| -------------------------------- | ------- |
| Same module relation             | ✅ Yes  |
| Cross-module relation            | ❌ No   |
| Prisma @relation (cross-module)  | ❌ No   |
| ForeignKey (cross-module)        | ❌ No   |
| Store ID reference               | ✅ Yes  |
| Populate in service layer        | ✅ Yes  |
| Service-to-service communication | ✅ Yes  |

---

## 🧠 Final Principle

Database = IDs
Service Layer = Composition
API = Fully populated objects

NEVER mix module boundaries inside Prisma schema.

```

---
```
