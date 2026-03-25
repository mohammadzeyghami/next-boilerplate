import P from "./P";

export default function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <P role="alert" className="text-xs text-destructive mt-0.5">
      {message}
    </P>
  );
}
