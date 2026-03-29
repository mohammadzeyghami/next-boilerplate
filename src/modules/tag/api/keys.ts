export const tagKeys = {
  all: () => ["tag"] as const,
  list: () => [...tagKeys.all(), "list"] as const,
  contentOptions: () => [...tagKeys.all(), "content-options"] as const,
};
