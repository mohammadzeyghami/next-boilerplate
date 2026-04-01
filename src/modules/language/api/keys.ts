export const languageKeys = {
  all: () => ["language"] as const,
  list: () => [...languageKeys.all(), "list"] as const,
  paginated: (page: number, pageSize: number) =>
    [...languageKeys.list(), page, pageSize] as const,
  contentOptions: () => [...languageKeys.all(), "content-options"] as const,
};
