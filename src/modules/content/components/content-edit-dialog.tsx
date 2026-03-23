"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";

import { avatarImageReferrerPolicy } from "@/lib/avatar-referrer-policy";
import { updateContentAction } from "@/modules/content/actions/content.actions";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field";
import { ControlledTextareaField } from "@/modules/content/components/molecules/controlled-textarea-field";
import {
  contentSchema,
  type ContentFormValues,
} from "@/modules/content/interfaces/content.schema";
import type { ContentListItem } from "@/modules/content/types/content-list-item";
import { Button } from "@/share-components/atoms/button/Button";
import { Label } from "@/share-components/atoms/label/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/share-components/molecules/dialog/Dialog";

type ContentEditDialogProps = {
  item: ContentListItem;
};

export function ContentEditDialog({ item }: ContentEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ContentFormValues>({
    resolver: yupResolver(contentSchema),
    defaultValues: {
      title: item.title,
      body: item.body,
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (open) {
      setError(null);
      setRemoveMedia(false);
      methods.reset({ title: item.title, body: item.body });
      if (fileRef.current) fileRef.current.value = "";
      setPreviewKind(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, item.id, item.title, item.body, methods]);

  function onFileChange() {
    const f = fileRef.current?.files?.[0];
    if (f) {
      setRemoveMedia(false);
    } else if (hasExistingMedia) {
      setRemoveMedia(true);
    }
    setPreviewKind(
      f?.type.startsWith("video/") ? "video" : f ? "image" : null,
    );
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  function onSubmit(values: ContentFormValues) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", item.id);
      fd.append("title", values.title);
      fd.append("body", values.body);
      if (removeMedia) fd.append("removeMedia", "true");
      const file = fileRef.current?.files?.[0];
      if (file) fd.append("file", file);

      const res = await updateContentAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const hasExistingMedia = Boolean(item.mediaUrl?.trim());
  const showCurrentAttachment =
    hasExistingMedia &&
    item.mediaUrl &&
    !removeMedia &&
    !previewUrl;
  const showRemovedHint =
    hasExistingMedia && removeMedia && !previewUrl;
  /** No file picker until old media is cleared (X), or while a new file is chosen */
  const showUploadControl =
    !hasExistingMedia || removeMedia || Boolean(previewUrl);

  function clearSelectedFile() {
    if (fileRef.current) fileRef.current.value = "";
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewKind(null);
    if (hasExistingMedia) setRemoveMedia(true);
  }

  const removeAttachmentButtonClass =
    "absolute top-2 right-2 z-50 flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive dark:ring-white/10";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Button>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>
            Update title, text, or replace the attachment.
          </DialogDescription>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid gap-4 py-2">
            {error ? <FormError message={error} /> : null}
            <ControlledInputField<ContentFormValues>
              name="title"
              label="Title"
              placeholder="Short headline"
            />
            <ControlledTextareaField<ContentFormValues>
              name="body"
              label="Body"
              placeholder="Write your content…"
            />
            {showCurrentAttachment ? (
              <div className="space-y-2">
                <Label>Current attachment</Label>
                <div className="relative isolate max-w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    className={removeAttachmentButtonClass}
                    onClick={clearSelectedFile}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                  {item.mediaKind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- app upload or external URL
                    <img
                      src={item.mediaUrl!}
                      alt=""
                      referrerPolicy={avatarImageReferrerPolicy(item.mediaUrl!)}
                      className="max-h-56 w-full object-contain"
                    />
                  ) : (
                    <video
                      src={item.mediaUrl!}
                      controls
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="relative z-0 max-h-56 w-full object-contain"
                    />
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Click the X button to remove, then you can attach a new file
                  below.
                </p>
              </div>
            ) : null}
            {showRemovedHint ? (
              <p className="rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
                Attachment removed. Pick a new file below (optional), or save to
                leave this post without media.
              </p>
            ) : null}
            {showUploadControl ? (
              <div className="space-y-2">
                <Label htmlFor={`content-edit-media-${item.id}`}>
                  {hasExistingMedia
                    ? "New image or video (optional)"
                    : "Image or video (optional)"}
                </Label>
                <input
                  id={`content-edit-media-${item.id}`}
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={onFileChange}
                  className="text-muted-foreground file:me-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                />
                <p className="text-muted-foreground text-xs">
                  {hasExistingMedia
                    ? "Max ~8 MB images, ~50 MB videos."
                    : "Optional. Max ~8 MB images, ~50 MB videos."}
                </p>
              </div>
            ) : null}
            {previewUrl && previewKind ? (
              <div className="space-y-2">
                <Label>New attachment preview</Label>
                <div className="relative isolate overflow-hidden rounded-md border bg-muted/30 p-2">
                  <button
                    type="button"
                    aria-label="Remove selected file"
                    className={removeAttachmentButtonClass}
                    onClick={clearSelectedFile}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                  {previewKind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="relative z-0 mx-auto max-h-40 max-w-full rounded object-contain"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="relative z-0 mx-auto max-h-40 max-w-full rounded"
                    />
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
