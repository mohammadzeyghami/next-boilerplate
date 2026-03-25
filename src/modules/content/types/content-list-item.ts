export type ContentListItem = {
  id: string;
  name: string;
  text?: string | null;
  createdAt: Date;
  contentUrl?: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE";
  access: "PRIVATE" | "PUBLIC";
  isEarnable: boolean;
  /** Shown on public feed (e.g. author name). */
  authorLabel?: string | null;
};
