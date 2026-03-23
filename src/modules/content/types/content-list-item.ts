export type ContentListItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  mediaUrl?: string | null;
  mediaKind?: string | null;
  /** Shown on public feed (e.g. author name). */
  authorLabel?: string | null;
};
