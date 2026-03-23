/** Google/CDN avatars often need this so the `<img>` request is not blocked. */
export function avatarImageReferrerPolicy(src: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return "no-referrer" as const;
  }
  return undefined;
}
