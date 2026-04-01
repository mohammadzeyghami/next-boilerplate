export const adminUserKeys = {
  all: () => ["admin-users"] as const,
  list: () => [...adminUserKeys.all(), "list"] as const,
  paginated: (page: number, pageSize: number) =>
    [...adminUserKeys.list(), page, pageSize] as const,
};
