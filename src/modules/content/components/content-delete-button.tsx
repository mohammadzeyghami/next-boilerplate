"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteContentAction } from "@/modules/content/actions/content.actions";

type ContentDeleteButtonProps = {
  contentId: string;
};

export function ContentDeleteButton({ contentId }: ContentDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label="Delete content"
      title="Delete"
      className="inline-flex size-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          const res = await deleteContentAction(contentId);
          if (res.ok) router.refresh();
        })
      }
    >
      {isPending ? <span className="text-sm">…</span> : <Trash2 className="size-4" />}
    </button>
  );
}
