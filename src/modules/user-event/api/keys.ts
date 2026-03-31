export const userEventKeys = {
  all: () => ["user-event"] as const,
  events: (page: number, pageSize: number) =>
    [...userEventKeys.all(), "events", page, pageSize] as const,
  statistics: (page: number, pageSize: number) =>
    [...userEventKeys.all(), "statistics", page, pageSize] as const,
};
