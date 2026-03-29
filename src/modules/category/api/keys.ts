export const categoryKeys = {
  all: () => ["category"] as const,
  list: () => [...categoryKeys.all(), "list"] as const,
  contentOptions: () => [...categoryKeys.all(), "content-options"] as const,
};
