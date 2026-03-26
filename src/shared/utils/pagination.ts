/**
 * Builds a page-number sequence with optional ellipsis.
 * Example output:
 * - [1, 2, 3, 4, 5]
 * - [1, "dots", 4, 5, 6, "dots", 10]
 */
export function getPaginationRange(
  current: number,
  total: number,
  delta = 1
): (number | "dots")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const range: (number | "dots")[] = [];
  const push = (v: number | "dots") => range.push(v);

  const first = 1;
  const last = total;

  const left = Math.max(current - delta, 2);
  const right = Math.min(current + delta, total - 1);

  push(first);

  if (left > 2) push("dots");

  for (let p = left; p <= right; p++) push(p);

  if (right < total - 1) push("dots");

  push(last);

  return range;
}
