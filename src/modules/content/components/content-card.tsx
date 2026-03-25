"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { ContentDeleteButton } from "@/modules/content/components/content-delete-button";
import { ContentEditDialog } from "@/modules/content/components/content-edit-dialog";
import type { ContentListItem } from "@/modules/content/types/content-list-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/molecules/card/Card";
import { cn } from "@/lib/utils";

/** Stable pseudo-random entrance offset per item id (SSR-safe). */
const ENTRANCE_OFFSETS = [
  { x: -28, y: 0 },
  { x: 28, y: 0 },
  { x: 0, y: 22 },
  { x: -20, y: 16 },
  { x: 20, y: -12 },
  { x: -14, y: -18 },
] as const;

function hashToOffset(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) {
    n = (n * 31 + id.charCodeAt(i)) | 0;
  }
  return ENTRANCE_OFFSETS[Math.abs(n) % ENTRANCE_OFFSETS.length]!;
}

function formatWhen(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type ContentCardProps = {
  item: ContentListItem;
  variant?: "manage" | "public";
};

export function ContentCard({ item, variant = "manage" }: ContentCardProps) {
  const offset = useMemo(() => hashToOffset(item.id), [item.id]);
  const showActions = variant === "manage";

  const initial = { opacity: 0, x: offset.x, y: offset.y };

  return (
    <li className="list-none">
      <motion.div
        className="block"
        initial={initial}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Card
          className={cn(
            "border-border/70 bg-card/95 py-0 shadow-md shadow-black/6 ring-1 ring-black/4 backdrop-blur-sm",
            "transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10",
            "dark:shadow-black/40 dark:ring-white/6 dark:hover:shadow-black/60",
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/60 px-4 py-4 pb-4">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base tracking-tight">
                {item.name}
              </CardTitle>

              <CardDescription className="text-xs">
                {variant === "public" && item.authorLabel ? (
                  <>
                    <span className="text-foreground/85">
                      {item.authorLabel}
                    </span>
                    <span className="text-muted-foreground"> · </span>
                  </>
                ) : null}
                {formatWhen(item.createdAt)}
                <span className="text-muted-foreground"> · </span>
                {item.access}
                {item.isEarnable ? (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    Earnable
                  </>
                ) : null}
              </CardDescription>
            </div>

            {showActions ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <ContentEditDialog item={item} />
                <ContentDeleteButton contentId={item.id} />
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-3 px-4 pt-4 pb-4">
            {item.text ? (
              <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {item.text}
              </p>
            ) : null}

            {item.contentUrl && item.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.contentUrl}
                alt={item.name}
                className="max-h-72 w-full rounded-lg border border-border/60 object-contain shadow-sm"
              />
            ) : null}

            {item.contentUrl && item.type === "VIDEO" ? (
              <video
                src={item.contentUrl}
                controls
                className="max-h-96 w-full rounded-lg border border-border/60 shadow-sm"
              />
            ) : null}

            {item.contentUrl && item.type === "SOUND" ? (
              <audio src={item.contentUrl} controls className="w-full" />
            ) : null}

            {item.contentUrl && item.type === "FILE" ? (
              <a
                href={item.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium underline underline-offset-4"
              >
                Open file
              </a>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </li>
  );
}
