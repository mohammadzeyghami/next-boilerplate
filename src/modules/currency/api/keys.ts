export const currencyKeys = {
  all: () => ["currency"] as const,
  list: (page: number, pageSize: number) =>
    [...currencyKeys.all(), "list", page, pageSize] as const,
};
