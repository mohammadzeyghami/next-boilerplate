export const creditKeys = {
  all: () => ["credit"] as const,
  list: () => [...creditKeys.all(), "list"] as const,
  lifetimes: () => [...creditKeys.all(), "lifetimes"] as const,
};
