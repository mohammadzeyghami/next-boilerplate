import type { FieldValues, UseFormReturn } from "react-hook-form";
import { FormProvider as RHFormProvider } from "react-hook-form";

interface FormProviderProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
}

const FormProvider = <T extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
}: FormProviderProps<T>) => {
  return (
    <RHFormProvider {...methods}>
      <form onSubmit={onSubmit} className={className}>
        {children}
      </form>
    </RHFormProvider>
  );
};

export default FormProvider;
