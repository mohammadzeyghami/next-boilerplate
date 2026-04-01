export const categoryKeys = {
  all: () => ["category"] as const,
  list: () => [...categoryKeys.all(), "list"] as const,
  paginated: (page: number, pageSize: number) =>
    [...categoryKeys.list(), page, pageSize] as const,
  contentOptions: () => [...categoryKeys.all(), "content-options"] as const,
};
