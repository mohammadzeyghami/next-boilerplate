"use client"

import type { FieldValues, Path, RegisterOptions } from "react-hook-form"
import { Controller, useFormContext } from "react-hook-form"

import { Label } from "@/share-components/atoms/label/Label"
import { cn } from "@/lib/utils"

type ControlledTextareaFieldProps<T extends FieldValues> = {
  name: Path<T>
  label: string
  placeholder?: string
  rows?: number
  rules?: RegisterOptions<T, Path<T>>
  hint?: string
}

export function ControlledTextareaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 6,
  rules,
  hint,
}: ControlledTextareaFieldProps<T>) {
  const { control } = useFormContext<T>()

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={String(name)}>{label}</Label>
          <textarea
            id={String(name)}
            name={String(name)}
            rows={rows}
            placeholder={placeholder}
            value={typeof field.value === "string" ? field.value : ""}
            onBlur={field.onBlur}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
            required={Boolean(rules?.required)}
            className={cn(
              "field-sizing-content min-h-[120px] w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
            )}
          />
          {fieldState.error?.message ? (
            <p className="text-destructive text-xs">{fieldState.error.message}</p>
          ) : hint ? (
            <p className="text-muted-foreground text-xs">{hint}</p>
          ) : null}
        </div>
      )}
    />
  )
}
