import type { ThemeBlockingOptions } from "@/lib/theme-blocking-inner-html";

/**
 * Keep in sync with `<ThemeProvider />` in `src/app/layout.tsx` and with
 * `getThemeBlockingScriptInnerHtml` (storage key, themes, etc.).
 */
export const ROOT_THEME_BLOCKING: ThemeBlockingOptions = {
  attribute: "class",
  storageKey: "theme",
  defaultTheme: "system",
  forcedTheme: null,
  themes: ["light", "dark"],
  value: null,
  enableSystem: true,
  enableColorScheme: true,
};
