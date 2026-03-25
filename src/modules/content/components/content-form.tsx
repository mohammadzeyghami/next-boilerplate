"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/share-components/atoms/button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/share-components/molecules/card/Card";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
import { createContentAction } from "@/modules/content/actions/content.actions";
import { type ContentFormValues } from "@/modules/content/interfaces/content.schema";
import InputR from "@/share-components/molecules/inputs/Controllerd";
import TextareaR from "@/share-components/molecules/textArea/Controllerd";
import SelectR from "@/share-components/molecules/select/selectR";

export function ContentForm() {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(
    null,
  );
  const [isEarnable, setIsEarnable] = useState(false);
  const [metadataText, setMetadataText] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ContentFormValues>({
    // resolver: yupResolver(contentSchema),
    defaultValues: {
      name: "",
      text: "",
      access: "PRIVATE",
      type: "TEXT",
      isEarnable: false,
      // @ts-ignore
      metadata: null,
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFileChange() {
    const input = fileRef.current;
    const file = input?.files?.[0];

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

  const onSubmit = (values: ContentFormValues) => {
    setError(null);

    startTransition(async () => {
      const fd = new FormData();

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

      const file = fileRef.current?.files?.[0];
      if (file) {
        fd.append("file", file);
      }

      const res = await createContentAction(fd);

      if (!res.ok) {
        setError(res.error ?? "Failed to save.");
        return;
      }

      // ✅ RHF reset
      methods.reset({
        name: "",
        text: "",
        access: "PRIVATE",
        type: "TEXT",
        isEarnable: false,
        // @ts-ignore
        metadata: null,
      });

      // ✅ local states reset
      setMetadataText("");
      setIsEarnable(false);

      // ✅ file reset
      if (fileRef.current) {
        fileRef.current.value = "";
      }

      // ✅ preview reset
      setPreviewKind(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>New content</CardTitle>
        <CardDescription>
          Create text, image, video, sound, or file content.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* @ts-ignore */}
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            {error ? <FormError message={error} /> : null}

            <InputR<ContentFormValues>
              name="name"
              label="Name"
              placeholder="Content name"
            />

            <TextareaR<ContentFormValues>
              name="text"
              label="Text"
              placeholder="Content text"
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

            <TextareaR
              name={"metadata" as never}
              label="Metadata JSON"
              placeholder='{"category":"news","tags":["react","next"]}'
            />

            <div className="flex items-center gap-2">
              <input
                id="isEarnable"
                type="checkbox"
                checked={isEarnable}
                onChange={(e) => {
                  setIsEarnable(e.target.checked);
                  methods.setValue("isEarnable", e.target.checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
              <label htmlFor="isEarnable" className="text-sm font-medium">
                Is earnable
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="content-media" className="text-sm font-medium">
                Upload file (optional)
              </label>
              <input
                id="content-media"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/*,.pdf,.zip,.doc,.docx"
                onChange={onFileChange}
                className="text-muted-foreground file:me-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="text-muted-foreground text-xs">
                Optional file for image, video, audio, or generic file content.
              </p>
            </div>

            {previewUrl && previewKind === "image" ? (
              <div className="rounded-md border bg-muted/30 p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mx-auto max-h-48 max-w-full rounded object-contain"
                />
              </div>
            ) : null}

            {previewUrl && previewKind === "video" ? (
              <div className="rounded-md border bg-muted/30 p-2">
                <video
                  src={previewUrl}
                  controls
                  className="mx-auto max-h-48 max-w-full rounded"
                />
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add content"}
            </Button>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
