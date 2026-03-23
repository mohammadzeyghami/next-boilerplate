/** True when `pathname` should highlight a nav item pointing at `href`. */
export function isActiveNavPath(pathname: string, href: string) {
  if (!href.startsWith("/")) return false;
  const p = pathname.replace(/\/$/, "") || "/";
  const u = href.replace(/\/$/, "") || "/";
  if (u === "/dashboard") return p === "/dashboard";
  return p === u || p.startsWith(`${u}/`);
}
