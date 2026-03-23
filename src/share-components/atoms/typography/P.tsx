import { cn } from "@/lib/utils";

type PProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLParagraphElement>,
  HTMLParagraphElement
> & {
  variant?: "default" | "danger"; // Add more variants if needed
};

const P = ({ children, className, variant = "default", ...rest }: PProps) => {
  return (
    <p
      className={cn(
        "text-[12px] lg:text-sm",
        {
          "text-red-600": variant === "danger",
          // Add other variants here, e.g.:
          "text-gray-800": variant === "default",
        },
        className
      )}
      {...rest}
    >
      {children}
    </p>
  );
};

export default P;
