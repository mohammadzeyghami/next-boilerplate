export const creditKeys = {
  all: () => ["credit"] as const,
  list: () => [...creditKeys.all(), "list"] as const,
  lifetimes: () => [...creditKeys.all(), "lifetimes"] as const,
  paginated: (page: number, pageSize: number) =>
    [...creditKeys.list(), page, pageSize] as const,
  lifetimesPaginated: (page: number, pageSize: number) =>
    [...creditKeys.lifetimes(), page, pageSize] as const,
  contentOptions: () => [...creditKeys.all(), "content-options"] as const,
};
