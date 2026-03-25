type FormErrorProps = {
  message: string | null;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className="text-destructive text-sm" role="alert">
      {message}
    </p>
  );
}
