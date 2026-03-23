```md
# Yup Validation Rules

## Goal

Validation must be **type-safe, reusable, and testable**.

The project uses:

- Yup
- React Hook Form
- @hookform/resolvers/yup

Validation schemas must be colocated with their feature.

Schemas must be the **single source of truth** for form validation.

---

# Folder Structure

Schemas must live inside the feature.
```

src/
Modules/
Home/
interfaces/
home.schema.ts
home.types.ts

```

Shared input components must remain validation-agnostic.

```

SharedComponents/
Molecules/
Inputs/

```

---

# Schema Pattern

Every schema file must export:

- the Yup schema
- the inferred form type

Example:

```

Modules/Home/interfaces/home.schema.ts

````

```ts
import * as yup from "yup";

export const HomeFormSchema = yup.object({
  name: yup
    .string()
    .transform((v, o) => (typeof o === "string" ? o.trim() : v))
    .min(2)
    .max(50)
    .required(),

  email: yup.string().trim().email().required(),

  age: yup
    .number()
    .transform((v, o) => (o === "" || o === null ? undefined : Number(o)))
    .typeError("Age must be a number")
    .min(1)
    .max(120)
    .optional(),

  newsletter: yup.boolean().default(false),
});

export type HomeFormValues = yup.InferType<typeof HomeFormSchema>;
````

---

# Type Rules

Types must be inferred from the schema.

Allowed:

```
type FormValues = yup.InferType<typeof Schema>
```

Avoid manual duplication of form types.

---

# React Hook Form Integration

Forms must use Yup resolver.

Example:

```ts
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HomeFormSchema, type HomeFormValues } from "./home.schema";

const methods = useForm<HomeFormValues>({
  defaultValues: {
    name: "",
    email: "",
    age: undefined,
    newsletter: false,
  },
  resolver: yupResolver(HomeFormSchema),
  mode: "onSubmit",
  reValidateMode: "onChange",
});
```

---

# String Validation Rules

All strings must be trimmed.

Example:

```ts
yup.string().trim().required();
```

Conditional required example:

```ts
const schema = yup.object({
  title: yup.string().trim().required(),

  subtitle: yup
    .string()
    .trim()
    .when("title", ([title], s) =>
      title ? s.required("Subtitle required") : s.optional()
    ),
});
```

---

# Reusable Validators

Reusable validators must be exported.

Example:

```ts
export const emailSchema = yup.string().trim().email().required();

export const iranMobileSchema = yup
  .string()
  .trim()
  .matches(/^09\d{9}$/)
  .required();

export const urlSchema = yup.string().trim().url().optional();
```

---

# Number Validation

Numbers must transform empty values.

Example:

```ts
yup
  .number()
  .transform((v, o) => (o === "" ? undefined : Number(o)))
  .typeError("Must be a number")
  .min(0)
  .optional();
```

---

# Date Validation

Example:

```ts
const today = new Date();

yup.date().typeError("Invalid date").max(today).optional();
```

---

# Nested Object Validation

Objects must explicitly define fields.

Sensitive objects should block unknown keys.

Example:

```ts
export const addressSchema = yup
  .object({
    country: yup.string().required(),
    city: yup.string().required(),
    postalCode: yup
      .string()
      .matches(/^\d{10}$/)
      .required(),
  })
  .noUnknown(true)
  .required();
```

---

# Array Validation

Arrays must handle null/undefined values.

Example:

```ts
export const tagsSchema = yup
  .array(yup.string().trim().min(2))
  .ensure()
  .max(10)
  .test("unique", "Tags must be unique", (arr) => {
    if (!arr) return true;
    return new Set(arr.map((s) => s.toLowerCase())).size === arr.length;
  });
```

---

# Conditional Validation

Conditional validation must use `when`.

Example:

```ts
const paymentSchema = yup.object({
  method: yup
    .mixed<"card" | "cash" | "wallet">()
    .oneOf(["card", "cash", "wallet"])
    .required(),

  cardNumber: yup
    .string()
    .when("method", ([m], schema) =>
      m === "card" ? schema.required().matches(/^\d{16}$/) : schema.optional()
    ),

  walletId: yup
    .string()
    .when("method", ([m], schema) =>
      m === "wallet" ? schema.required() : schema.optional()
    ),
});
```

---

# File Validation

Example:

```ts
export const fileSchema = yup
  .mixed<File>()
  .test(
    "fileType",
    "Invalid file format",
    (f) => !f || ["image/png", "image/jpeg", "application/pdf"].includes(f.type)
  )
  .test("fileSize", "File too large", (f) => !f || f.size <= 2 * 1024 * 1024)
  .optional();
```

---

# Transform Rules

Schemas must normalize input values.

Common transformations:

- trim strings
- convert "" to undefined
- convert string numbers to number
- normalize optional values

Example helpers:

```ts
export const trimmed = (s: yup.StringSchema) =>
  s.transform((v, o) => (typeof o === "string" ? o.trim() : v));

export const optionalNumber = yup
  .number()
  .transform((v, o) => (o === "" || o === null ? undefined : Number(o)))
  .typeError("Invalid number")
  .optional();
```

---

# Server Error Mapping

Server validation errors must be mapped to form fields.

Example:

```ts
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields?: Record<string, string>
) {
  if (!fields) return;

  Object.entries(fields).forEach(([k, v]) => {
    setError(k as Path<T>, { message: String(v) });
  });
}
```

---

# Schema Testing

Schemas must be testable independently.

Example:

```ts
import { HomeFormSchema } from "./home.schema";

test("name required", async () => {
  await expect(
    HomeFormSchema.validate({ name: "", email: "" })
  ).rejects.toBeTruthy();
});

test("valid payload", async () => {
  const data = await HomeFormSchema.validate({
    name: "Ali",
    email: "a@b.com",
    age: "22",
  });

  expect(data.age).toBe(22);
});
```

---

# Dependency Rules

Allowed:

```
Modules/<Feature>/interfaces → Yup
Forms → Schema
React Hook Form → Schema
```

Forbidden:

```
Validation logic inside UI components
Schema importing UI components
Schema depending on React
```

---

# Do

- Use InferType for form types
- Normalize inputs using transform
- Use when() for conditional validation
- Use ensure() for arrays
- Use noUnknown() for strict objects

---

# Don't

- Put validation logic inside components
- Duplicate schema types manually
- Use watch() for validation conditions
- Use nullable() unless null is required

---

# Pull Request Checklist

- Form types use InferType
- Inputs use trim and transform
- Conditional validation uses when
- Array schemas use ensure
- Validation messages are consistent
- Schema is colocated with the feature
- Schema is used by React Hook Form

```

```
