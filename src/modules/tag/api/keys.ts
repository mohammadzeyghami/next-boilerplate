export const tagKeys = {
  all: () => ["tag"] as const,
  list: () => [...tagKeys.all(), "list"] as const,
  paginated: (page: number, pageSize: number) =>
    [...tagKeys.list(), page, pageSize] as const,
  contentOptions: () => [...tagKeys.all(), "content-options"] as const,
};
