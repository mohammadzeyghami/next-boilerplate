import { ContentCard } from "@/modules/content/components/content-card"
import type { ContentListItem } from "@/modules/content/types/content-list-item"

export type { ContentListItem } from "@/modules/content/types/content-list-item"

type ContentListProps = {
  items: ContentListItem[]
  /** `public` = read-only feed; `manage` = delete actions (dashboard). */
  variant?: "manage" | "public"
}

export function ContentList({ items, variant = "manage" }: ContentListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {variant === "public"
          ? "No posts yet. Sign in and add content from your dashboard."
          : "No items yet. Add your first piece of content above."}
      </p>
    )
  }

  return (
    <ul className="space-y-5">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} variant={variant} />
      ))}
    </ul>
  )
}
