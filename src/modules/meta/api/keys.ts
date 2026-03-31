export const metaKeys = {
  all: () => ["meta"] as const,
  list: (page: number, pageSize: number) =>
    [...metaKeys.all(), "list", page, pageSize] as const,
};
