```md
# React Hook Form Rules

## Goal

Forms must be:

- type-safe
- lightweight
- modular
- aligned with feature-based architecture

The project uses:

- React Hook Form
- Yup or Zod
- TanStack Query for mutations

Shared inputs must live in SharedComponents.

Domain logic must live inside the feature.

---

# Folder Structure
```

src/
SharedComponents/
Molecules/
Inputs/
Controllerd.tsx
Primary.tsx

Modules/
Home/
components/
forms/
TestPage.tsx
api/
interfaces/
Interface.ts

ShareComponents/
Sections/
Layouts/
FormProvider.tsx

````

Shared inputs must remain UI-only.

Validation and domain logic must not live inside SharedComponents.

---

# Core Rules

1. Inputs must be UI-only components.
2. Form types must come from the schema whenever possible.
3. Use Controller only for controlled components.
4. Server validation errors must map to setError.
5. Avoid excessive use of watch.
6. Use handleSubmit(onValid, onInvalid) for submit pipeline.
7. Mutations must live in feature api layer.

---

# Form Provider Pattern

Custom FormProvider should wrap React Hook Form provider and the form element.

```tsx
"use client";

import React from "react";
import { FormProvider as RHFProvider } from "react-hook-form";

type Props<T> = {
  methods: any
  onSubmit: React.FormEventHandler<HTMLFormElement>
  className?: string
  children: React.ReactNode
}

function FormProviderInner<T>(
  { methods, onSubmit, className, children }: Props<T>,
  ref: React.Ref<HTMLFormElement>
) {
  return (
    <RHFProvider {...methods}>
      <form ref={ref} onSubmit={onSubmit} className={className} noValidate>
        {children}
      </form>
    </RHFProvider>
  )
}

const FormProvider = React.forwardRef(FormProviderInner) as <T>(
  p: Props<T> & { ref?: React.Ref<HTMLFormElement> }
) => JSX.Element

export default FormProvider
````

---

# Form Schema Pattern

Schemas must live in the feature.

Example:

```
Modules/Home/interfaces/Interface.ts
```

```ts
import * as yup from "yup";

export const HomeFormSchema = yup.object({
  name: yup.string().trim().required(),
  email: yup.string().email().required(),
});

export type HomeFormValues = yup.InferType<typeof HomeFormSchema>;
```

Form types should always match schema naming.

---

# Standard Form Implementation

```
Modules/Home/components/forms/TestPage.tsx
```

```tsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import FormProvider from "@/ShareComponents/Sections/Layouts/FormProvider";
import InputR from "@/ShareComponents/Molecules/Inputs/Controllerd";

import { HomeFormSchema, HomeFormValues } from "../Interfaces/Interface";

const TestPage = () => {
  const methods = useForm<HomeFormValues>({
    defaultValues: {
      name: "",
      email: "",
    },
    resolver: yupResolver(HomeFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (values: HomeFormValues) => {
    console.log(values);
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <InputR<HomeFormValues> name="name" label="Name" />
      <InputR<HomeFormValues> name="email" label="Email" />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </FormProvider>
  );
};

export default TestPage;
```

---

# Generic Controlled Input Pattern

All controlled inputs must follow the same pattern.

```
SharedComponents/Molecules/Inputs/Controllerd.tsx
```

```tsx
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

import InputPrimary from "./Primary";

function InputR({ name, rules, ...props }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <InputPrimary {...props} {...field} error={fieldState.error?.message} />
      )}
    />
  );
}

export default React.memo(InputR);
```

This pattern must be reused for:

- Select
- Checkbox
- DatePicker
- Custom UI inputs

---

# Server Error Mapping

Server validation errors must map to form fields.

Example:

```ts
async function onSubmit(values, setError) {
  try {
    await mutateAsync(values);
  } catch (err) {
    if (err.fields) {
      Object.entries(err.fields).forEach(([name, message]) => {
        setError(name, {
          message: String(message),
        });
      });
    }
  }
}
```

Services must not show UI side effects.

No toast inside service layer.

---

# Field Dependencies

Use useWatch with explicit paths.

Never watch the entire form.

Example:

```ts
import { useWatch, useFormContext } from "react-hook-form";

function DependentField() {
  const { control } = useFormContext();

  const country = useWatch({
    control,
    name: "country",
  });
}
```

---

# Dynamic Fields

Dynamic lists must use useFieldArray.

Example:

```tsx
import { useFieldArray, useFormContext } from "react-hook-form";

function Phones() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phones",
  });

  return (
    <>
      {fields.map((field, index) => (
        <InputR
          key={field.id}
          name={`phones.${index}.value`}
          label={`Phone ${index + 1}`}
        />
      ))}

      <button type="button" onClick={() => append({ value: "" })}>
        Add
      </button>
    </>
  );
}
```

---

# Reset With Server Data

Forms must reset when server data arrives.

```ts
const methods = useForm({ defaultValues });

useEffect(() => {
  if (serverData) {
    methods.reset(serverData);
  }
}, [serverData]);
```

---

# Do

- derive types from schema
- keep inputs reusable
- use Controller only when needed
- use useWatch with explicit paths
- map server errors with setError
- use isSubmitting to disable submit

---

# Don't

- do not use watch() without paths
- do not duplicate schema types
- do not connect UI directly to services
- do not place domain logic inside SharedComponents

---

# Pull Request Checklist

- form types match schema
- fields use InputR pattern
- server errors mapped to fields
- useWatch uses explicit paths
- reset used for async data
- feature owns domain logic

```

```
