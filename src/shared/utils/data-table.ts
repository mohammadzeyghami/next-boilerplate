import { type SortingState } from "@tanstack/react-table";

export function getSortingFromUrl(searchParams: URLSearchParams): SortingState {
    const sort = searchParams.get("sort");
    const order = searchParams.get("order");
    if (sort) {
        return [{ id: sort, desc: order === "DESC" }];
    }
    return [];
}
