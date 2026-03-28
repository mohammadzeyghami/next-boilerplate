import { cn } from "@/lib/utils";
import * as React from "react";

export default function P({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6", className)} {...props} />;
}
