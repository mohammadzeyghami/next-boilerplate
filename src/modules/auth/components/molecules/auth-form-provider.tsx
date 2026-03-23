"use client"

import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form"
import { FormProvider as RHFFormProvider } from "react-hook-form"

type FormProviderProps<TFormValues extends FieldValues> = {
  methods: UseFormReturn<TFormValues>
  onSubmit: SubmitHandler<TFormValues>
  children: React.ReactNode
}

export function FormProvider<TFormValues extends FieldValues,>({
  methods,
  onSubmit,
  children,
}: FormProviderProps<TFormValues>) {
  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </RHFFormProvider>
  )
}
