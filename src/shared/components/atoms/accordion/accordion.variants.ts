import { cva } from "class-variance-authority";

export const accordionVariants = cva(
    "border-b last:border-none",
    {
        variants: {
            variant: {
                default: "",
                ghost: "bg-transparent border-none",
            },
            size: {
                sm: "py-2 text-sm",
                md: "py-3 text-base",
                lg: "py-4 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
);
