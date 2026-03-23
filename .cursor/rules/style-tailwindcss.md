// rules/tailwind-conventions.js

export const tailwindCodeConventions = {
id: "tailwind-code-conventions",
title: "🌬️ TailwindCSS — Code Conventions",
description: `Goal: Consistent, readable, maintainable UI; no scattered colors/sizes, with standard light/dark theming.
 `,
files: [
"tailwind.config.ts",
"src/styles/globals.css",
"src/SharedComponents/utils/cn.ts"
],
docPath: "docs/code-conventions/tailwindcss.md",
configExample: `
/_ tailwind.config.ts _/
import type { Config } from "tailwindcss";

export default {
darkMode: "class",
content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
theme: {
container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
extend: {
colors: {
primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
background: "hsl(var(--background))",
foreground: "hsl(var(--foreground))",
border: "hsl(var(--border))",
input: "hsl(var(--input))",
ring: "hsl(var(--ring))",
},
borderRadius: { DEFAULT: "0.75rem", lg: "1rem", xl: "1.25rem", "2xl": "1.5rem" },
boxShadow: { soft: "0 2px 12px rgba(0,0,0,0.06)", lgsoft: "0 10px 30px rgba(0,0,0,0.08)" },
keyframes: { "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } } },
animation: { "fade-in": "fade-in .2s ease-out" },
},
},
plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
} satisfies Config;
`,
  globalsCSSExample: `
/_ src/styles/globals.css _/
@tailwind base;
@tailwind components;
@tailwind utilities;

/_ Light tokens _/
:root {
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;
--muted: 210 40% 96.1%;
--muted-foreground: 215 16.3% 46.9%;
--destructive: 0 84% 60%;
--destructive-foreground: 210 40% 98%;
--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 215 20.2% 65.1%;
}

/_ Dark tokens _/
.dark {
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--primary: 210 40% 98%;
--primary-foreground: 222.2 47.4% 11.2%;
--secondary: 217.2 32.6% 17.5%;
--secondary-foreground: 210 40% 98%;
--accent: 217.2 32.6% 17.5%;
--accent-foreground: 210 40% 98%;
--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
--destructive: 0 62.8% 30.6%;
--destructive-foreground: 210 40% 98%;
--border: 217.2 32.6% 17.5%;
--input: 217.2 32.6% 17.5%;
--ring: 212.7 26.8% 83.9%;
}

/_ Reusable utility _/
.focus-ring { @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2; }
`,
  rulesSummary: [
    "✅ Use tokens only (example: bg-primary text-primary-foreground)",
    "⛔ Do not use scattered HEX (bg-[#0099ff])",
    "Class order: layout → position → box-model → typography → visual → effects → interactivity → state → transform/transition → prefixes",
    "Mobile-first responsive: p-4 md:p-6 lg:p-8",
    "Dark Mode with .dark on root",
    "Standard spacing: gap-* and py-* / space-x-* / space-y-*",
    "@apply only for fundamental patterns",
    "Arbitrary values should be minimal with TODO comment",
    "Accessibility: use focus-visible and ring"
  ],
  uiPatterns: {
    button: `<button className="
  inline-flex items-center justify-center h-10 px-4 rounded-xl
  text-sm font-medium transition-colors
  bg-primary text-primary-foreground hover:opacity-90
  disabled:opacity-50 disabled:pointer-events-none
  focus-ring
">Button</button>`,
    input: `<input className="
  w-full h-10 rounded-lg border border-input bg-background px-3 text-sm
  placeholder:text-muted-foreground
  focus-ring
"/>`,
    card: `<section className="container py-8">

  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-soft p-6" />
  </div>
</section>`
  },
  suggestedTools: [
    "Prettier + prettier-plugin-tailwindcss",
    "ESLint + eslint-plugin-tailwindcss",
    "Plugins: @tailwindcss/forms, @tailwindcss/typography"
  ],
  exampleLintRule: `
{
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      { selector: "Literal[value=/\\\\#[0-9a-fA-F]{3,6}/]", message: "Use Tailwind tokens instead of scattered HEX values." }
    ]
  }
}
  `,
  prChecklist: [
    "Use tokens only (no HEX)",
    "Classes are ordered (or Prettier plugin active)",
    "Mobile-first and consistent responsive",
    "focus-visible and focus-ring applied",
    "@apply only for fundamental patterns",
    "Check dark mode (Storybook/page)"
  ]
};
