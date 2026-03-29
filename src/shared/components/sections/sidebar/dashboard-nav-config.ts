/** Serializable nav item (safe to pass from Server → Client). */
export type DashboardNavIconKey = "content" | "languages" | "users";

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
];

export const dashboardUsersNavItem: DashboardNavItem = {
  title: "Users",
  url: "/dashboard/users",
  iconKey: "users",
};
