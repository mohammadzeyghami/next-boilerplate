function envOr(value: string | undefined, fallback: string) {
  const t = value?.trim();
  return t && t.length > 0 ? t : fallback;
}

/** Public app name (sidebar, landing, metadata). Set `NEXT_PUBLIC_APP_NAME`. */
export const siteName = envOr(
  process.env.NEXT_PUBLIC_APP_NAME,
  "Next Boilerplate",
);

/** Default meta description. Set `NEXT_PUBLIC_APP_DESCRIPTION`. */
export const siteDescription = envOr(
  process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  "Landing and dashboard starter with Next.js and shadcn UI.",
);
