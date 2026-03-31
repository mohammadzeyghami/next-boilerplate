/** Serializable nav item (safe to pass from Server → Client). */
export type DashboardNavIconKey =
  | "categories"
  | "content"
  | "credits"
  | "currencies"
  | "events"
  | "languages"
  | "metas"
  | "tags"
  | "users";

export type DashboardNavItem = {
  title: string;
  url: string;
  iconKey: DashboardNavIconKey;
};

export const baseDashboardNavMain: DashboardNavItem[] = [
  {
    title: "Content",
    url: "/dashboard/content",
    iconKey: "content",
  },
  {
    title: "Languages",
    url: "/dashboard/languages",
    iconKey: "languages",
  },
  {
    title: "Tags",
    url: "/dashboard/tags",
    iconKey: "tags",
  },
  {
    title: "Categories",
    url: "/dashboard/categories",
    iconKey: "categories",
  },
];

/** Shown in the sidebar only for `ADMIN` / `SUPER_ADMIN` (see dashboard layout). */
export const dashboardUsersNavItem: DashboardNavItem = {
  title: "Users",
  url: "/dashboard/users",
  iconKey: "users",
};

export const dashboardUserEventsNavItem: DashboardNavItem = {
  title: "User Events",
  url: "/dashboard/user-events",
  iconKey: "events",
};

export const dashboardCreditsNavItem: DashboardNavItem = {
  title: "Credits",
  url: "/dashboard/credits",
  iconKey: "credits",
};

export const dashboardCurrenciesNavItem: DashboardNavItem = {
  title: "Currencies",
  url: "/dashboard/currencies",
  iconKey: "currencies",
};

export const dashboardMetasNavItem: DashboardNavItem = {
  title: "Metas",
  url: "/dashboard/metas",
  iconKey: "metas",
};
