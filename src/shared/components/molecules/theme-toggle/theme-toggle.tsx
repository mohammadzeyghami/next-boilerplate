import { Button } from "../../atoms/button/Button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import * as React from "react";

const THEME_STORAGE_KEY = "theme";
type ThemeOption = "light" | "dark" | "system";

const isThemeOption = (value: string | null): value is ThemeOption =>
  value === "light" || value === "dark" || value === "system";

const getInitialTheme = (): ThemeOption => {
  if (typeof window === "undefined") return "system";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeOption(storedTheme)) return storedTheme;
  if (document.documentElement.classList.contains("dark")) return "dark";
  return "light";
};

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<ThemeOption>(getInitialTheme);

  const applyTheme = React.useCallback((newTheme: ThemeOption) => {
    const root = document.documentElement;
    if (newTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  React.useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <DropdownMenu.Item
            className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onSelect={() => setTheme("light")}
          >
            <Sun className="size-4" /> Light
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onSelect={() => setTheme("dark")}
          >
            <Moon className="size-4" /> Dark
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onSelect={() => setTheme("system")}
          >
            <Monitor className="size-4" /> System
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
