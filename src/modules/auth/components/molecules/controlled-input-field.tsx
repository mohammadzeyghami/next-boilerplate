"use client";

import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import type { ComponentProps } from "react";
import type { FieldValues, Path, RegisterOptions } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";

type ControlledInputFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: ComponentProps<typeof Input>["type"];
  autoComplete?: string;
  placeholder?: string;
  rules?: RegisterOptions<T, Path<T>>;
  hint?: string;
};

export function ControlledInputField<T extends FieldValues>({
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  rules,
  hint,
}: ControlledInputFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={typeof field.value === "string" ? field.value : ""}
            onBlur={field.onBlur}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
            required={Boolean(rules?.required)}
          />
          {fieldState.error?.message ? (
            <p className="text-destructive text-xs">
              {fieldState.error.message}
            </p>
          ) : hint ? (
            <p className="text-muted-foreground text-xs">{hint}</p>
          ) : null}
        </div>
      )}
    />
  );
}
