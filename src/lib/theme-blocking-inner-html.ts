import type { Attribute } from "next-themes";

/**
 * Blocking theme script body from next-themes@0.4.6 (`var M=` in dist/index.mjs).
 * After upgrading next-themes, re-extract M and update NEXT_THEMES_INIT.
 */
const NEXT_THEMES_INIT = "(e,i,s,u,m,a,l,h)=>{let d=document.documentElement,w=[\"light\",\"dark\"];function p(n){(Array.isArray(e)?e:[e]).forEach(y=>{let k=y===\"class\",S=k&&a?m.map(f=>a[f]||f):m;k?(d.classList.remove(...S),d.classList.add(a&&a[n]?a[n]:n)):d.setAttribute(y,n)}),R(n)}function R(n){h&&w.includes(n)&&(d.style.colorScheme=n)}function c(){return window.matchMedia(\"(prefers-color-scheme: dark)\").matches?\"dark\":\"light\"}if(u)p(u);else try{let n=localStorage.getItem(i)||s,y=l&&n===\"system\"?c():n;p(y)}catch(n){}}";

export type ThemeBlockingOptions = {
  attribute: Attribute | Attribute[];
  storageKey: string;
  defaultTheme: string;
  forcedTheme?: string | null;
  themes: string[];
  value?: Record<string, string> | null;
  enableSystem: boolean;
  enableColorScheme: boolean;
};

/** Argument order matches next-themes ThemeScript (see dist). */
export function getThemeBlockingScriptInnerHtml(options: ThemeBlockingOptions): string {
  const {
    attribute,
    storageKey,
    defaultTheme,
    forcedTheme = null,
    themes,
    value = null,
    enableSystem,
    enableColorScheme,
  } = options;
  const p = JSON.stringify([
    attribute,
    storageKey,
    defaultTheme,
    forcedTheme,
    themes,
    value,
    enableSystem,
    enableColorScheme,
  ]).slice(1, -1);
  return `(${NEXT_THEMES_INIT})(${p})`;
}
