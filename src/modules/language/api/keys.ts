export const languageKeys = {
  all: () => ["language"] as const,
  list: () => [...languageKeys.all(), "list"] as const,
  contentOptions: () => [...languageKeys.all(), "content-options"] as const,
};
