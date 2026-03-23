## 📁 ساختار پوشه‌ها (بدون ui/)

```bash
src/
  SharedComponents/
    Atoms/
      Button/
        Default.tsx          # دکمه‌ی تیمی (shadcn سفارشی‌شده)
        index.ts
      Input/
        Default.tsx
      # ...
    Molecules/
      # ex: InputWithLabel/
    Organisms/
      # ex: DataTableShell/
    Templates/
      # ex: AppLayout/
    utils/
      cn.ts                  # helper کلاس‌ها
      a11y.ts                # helperهای دسترس‌پذیری (اختیاری)
    index.ts                 # barrel exports برای کل SharedComponents
```

## 🧭 اصول

- **SharedComponents = UI خالص**: اینجا API call/Query/Store دامنه‌ای ممنوعه.
- **Atomic**: Atoms → Molecules → Organisms → Templates.
- **Composition > Props**: تا حد امکان با ترکیب‌پذیری حل کنید، نه پراپ‌های خاص هر دامنه.
- **a11y اولویت دارد**: `aria-*`, `role`, `focus-visible`‌ها رعایت شوند.
- **Theme/Token**: فقط از Tailwind و CSS vars استفاده کنید؛ رنگ هگز پراکنده نگذارید.
- **Imports تمیز**:
  - از `@/SharedComponents/Atoms/*` برای اتم‌ها
  - از `@/SharedComponents/utils/*` برای `cn` و …

- **نام‌گذاری**:
  - کامپوننت‌ها: `PascalCase` (مثل `Default.tsx`, `IconButton.tsx`)
  - هوک‌ها: `useX`
  - پوشهٔ کامپوننت = نام جزء (Button, Input, …)

## 🧪 تست/استوری

- **Storybook** و **RTL/Jest** کنار همان جزء یا در پوشهٔ خودش.
- استوری‌ها روی API عمومی هر کامپوننت تمرکز داشته باشن (variant/size/states).

## 🚦 قوانین وابستگی

- SharedComponents → **هیچ وابستگی به Modules ندارد** (⛔ import از `@/Modules/*`)
- Modules → آزاد است از SharedComponents استفاده کند (✅)

---

## 🧩 الگوی Button تیمی (قابل کپی)

**مسیر:** `src/SharedComponents/Atoms/Button/Default.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/SharedComponents/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "bg-transparent hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        icon: "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild,
      leftIcon,
      rightIcon,
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled || undefined}
        disabled={isDisabled}
        {...props}
      >
        {/* Left icon / spinner */}
        {isLoading ? (
          <span
            className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>
        )}

        {/* Content */}
        <span className="inline-flex">
          {isLoading && loadingText ? loadingText : children}
        </span>

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
```

**Barrel export** — `src/SharedComponents/Atoms/Button/index.ts`

```ts
export { Button } from "./Default";
```

**Helper کلاس‌ها** — `src/SharedComponents/utils/cn.ts`

```ts
export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}
```

### نکات این پیاده‌سازی

- `cva` برای **variants/size/fullWidth** و سفارشی‌پذیری استاندارد.
- `asChild` برای ترکیب با لینک‌ها/slotها بدون شکستن semantics.
- `isLoading` + spinner سبک با `aria-busy`.
- **هیچ** منطق دامنه‌ای، متن/آیکن از بیرون تزریق می‌شود.

---

## ✅ الگوی استفاده در Module

```tsx
// Modules/Users/components/UsersToolbar.tsx
import { Button } from "@/SharedComponents/Atoms/Button";

export function UsersToolbar() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="default">New User</Button>
      <Button variant="outline">Export</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  );
}
```
