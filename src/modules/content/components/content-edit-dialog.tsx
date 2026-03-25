"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Pencil, X } from "lucide-react";

import { avatarImageReferrerPolicy } from "@/lib/avatar-referrer-policy";
import { updateContentAction } from "@/modules/content/actions/content.actions";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
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
import InputR from "@/share-components/molecules/inputs/Controllerd";
import TextareaR from "@/share-components/molecules/textArea/Controllerd";
import SelectR from "@/share-components/molecules/select/selectR";

type ContentEditDialogProps = {
  item: ContentListItem;
};

export function ContentEditDialog({ item }: ContentEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(
    null,
  );
  const [metadataText, setMetadataText] = useState(
    // @ts-ignore
    item.metadata ? JSON.stringify(item.metadata, null, 2) : "",
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ContentFormValues>({
    // resolver: yupResolver(contentSchema),
    defaultValues: {
      name: item.name,
      text: item.text ?? "",
      access: item.access,
      type: item.type,
      isEarnable: item.isEarnable,
      // @ts-ignore
      metadata: item.metadata ?? null,
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setRemoveFile(false);
    setMetadataText(
      // @ts-ignore
      item.metadata ? JSON.stringify(item.metadata, null, 2) : "",
    );

    methods.reset({
      name: item.name,
      text: item.text ?? "",
      access: item.access,
      type: item.type,
      isEarnable: item.isEarnable,
      // @ts-ignore
      metadata: item.metadata ?? null,
    });

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setPreviewKind(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [
    open,
    item.id,
    item.name,
    item.text,
    item.access,
    item.type,
    item.isEarnable,
    // @ts-ignore
    item.metadata,
    methods,
  ]);

  const hasExistingFile = Boolean(item.contentUrl?.trim());

  function onFileChange() {
    const file = fileRef.current?.files?.[0];

    if (file) {
      setRemoveFile(false);
    } else if (hasExistingFile) {
      setRemoveFile(true);
    }

    setPreviewKind(
      file?.type.startsWith("video/") ? "video" : file ? "image" : null,
    );

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });

    if (file?.type.startsWith("image/")) {
      methods.setValue("type", "IMAGE", { shouldDirty: true });
    } else if (file?.type.startsWith("video/")) {
      methods.setValue("type", "VIDEO", { shouldDirty: true });
    } else if (file?.type.startsWith("audio/")) {
      methods.setValue("type", "SOUND", { shouldDirty: true });
    } else if (file) {
      methods.setValue("type", "FILE", { shouldDirty: true });
    }
  }

  function clearSelectedFile() {
    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setPreviewKind(null);

    if (hasExistingFile) {
      setRemoveFile(true);
    }
  }

  function onSubmit(values: ContentFormValues) {
    setError(null);

    startTransition(async () => {
      const fd = new FormData();

      fd.append("id", item.id);
      fd.append("name", values.name);
      fd.append("text", values.text ?? "");
      fd.append("access", values.access);
      fd.append("type", values.type);
      fd.append("isEarnable", String(values.isEarnable));

      try {
        const parsedMetadata = metadataText.trim()
          ? JSON.parse(metadataText)
          : null;

        fd.append("metadata", JSON.stringify(parsedMetadata));
      } catch {
        setError("Metadata must be valid JSON.");
        return;
      }

      if (removeFile) {
        fd.append("removeFile", "true");
      }

      const file = fileRef.current?.files?.[0];
      if (file) {
        fd.append("file", file);
      }

      const res = await updateContentAction(fd);

      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  const showCurrentAttachment =
    hasExistingFile && item.contentUrl && !removeFile && !previewUrl;

  const showRemovedHint = hasExistingFile && removeFile && !previewUrl;

  const showUploadControl =
    !hasExistingFile || removeFile || Boolean(previewUrl);

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

      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit content</DialogTitle>
          <DialogDescription>
            Update content details or replace the attachment.
          </DialogDescription>
        </DialogHeader>

        {/* @ts-ignore */}
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="grid gap-4 py-2">
            {error ? <FormError message={error} /> : null}

            <InputR<ContentFormValues>
              name="name"
              label="Name"
              placeholder="Content name"
            />

            <TextareaR<ContentFormValues>
              name="text"
              label="Text"
              placeholder="Write your content..."
            />

            <SelectR<ContentFormValues>
              name="access"
              label="Access"
              options={[
                { label: "Private", value: "PRIVATE" },
                { label: "Public", value: "PUBLIC" },
              ]}
            />

            <SelectR<ContentFormValues>
              name="type"
              label="Type"
              options={[
                { label: "Text", value: "TEXT" },
                { label: "Image", value: "IMAGE" },
                { label: "Video", value: "VIDEO" },
                { label: "Sound", value: "SOUND" },
                { label: "File", value: "FILE" },
              ]}
            />

            <div className="space-y-2">
              <Label htmlFor={`content-metadata-${item.id}`}>
                Metadata JSON
              </Label>
              <textarea
                id={`content-metadata-${item.id}`}
                value={metadataText}
                onChange={(e) => setMetadataText(e.target.value)}
                rows={5}
                placeholder='{"category":"news","tags":["react","next"]}'
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id={`is-earnable-${item.id}`}
                type="checkbox"
                checked={methods.watch("isEarnable")}
                onChange={(e) =>
                  methods.setValue("isEarnable", e.target.checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <Label htmlFor={`is-earnable-${item.id}`}>Is earnable</Label>
            </div>

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

                  {item.type === "IMAGE" ? (
                    <img
                      src={item.contentUrl!}
                      alt={item.name}
                      referrerPolicy={avatarImageReferrerPolicy(
                        item.contentUrl!,
                      )}
                      className="max-h-56 w-full object-contain"
                    />
                  ) : item.type === "VIDEO" ? (
                    <video
                      src={item.contentUrl!}
                      controls
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="relative z-0 max-h-56 w-full object-contain"
                    />
                  ) : item.type === "SOUND" ? (
                    <div className="p-4">
                      <audio
                        src={item.contentUrl!}
                        controls
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="p-4">
                      <a
                        href={item.contentUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4"
                      >
                        Open current file
                      </a>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground text-xs">
                  Click the X button to remove the current attachment.
                </p>
              </div>
            ) : null}

            {showRemovedHint ? (
              <p className="rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
                Attachment removed. You can upload a new file below or save
                without any attachment.
              </p>
            ) : null}

            {showUploadControl ? (
              <div className="space-y-2">
                <Label htmlFor={`content-edit-media-${item.id}`}>
                  Upload new file (optional)
                </Label>
                <input
                  id={`content-edit-media-${item.id}`}
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/*,.pdf,.zip,.doc,.docx"
                  onChange={onFileChange}
                  className="text-muted-foreground file:me-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                />
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
