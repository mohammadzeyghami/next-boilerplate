"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/atoms/button/Button";
import { deleteContentAction } from "@/modules/content/actions/content.actions";

type ContentDeleteButtonProps = {
  contentId: string;
};

export function ContentDeleteButton({ contentId }: ContentDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      className="text-destructive hover:bg-destructive/10"
      onClick={() =>
        startTransition(async () => {
          const res = await deleteContentAction(contentId);
          if (res.ok) router.refresh();
        })
      }
    >
      {isPending ? "…" : "Delete"}
    </Button>
  );
}
