"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"

import { Button } from "@/share-components/atoms/button/Button"
import { Label } from "@/share-components/atoms/label/Label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/share-components/molecules/card/Card"
import { FormError } from "@/modules/auth/components/atoms/form-error"
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider"
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field"
import { createContentAction } from "@/modules/content/actions/content.actions"
import { ControlledTextareaField } from "@/modules/content/components/molecules/controlled-textarea-field"
import {
  contentSchema,
  type ContentFormValues,
} from "@/modules/content/interfaces/content.schema"

export function ContentForm() {
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const methods = useForm<ContentFormValues>({
    resolver: yupResolver(contentSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  })

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function onFileChange() {
    const input = fileRef.current
    const f = input?.files?.[0]
    setPreviewKind(
      f?.type.startsWith("video/") ? "video" : f ? "image" : null,
    )
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
  }

  function onSubmit(values: ContentFormValues) {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("title", values.title)
      fd.append("body", values.body)
      const file = fileRef.current?.files?.[0]
      if (file) fd.append("file", file)

      const res = await createContentAction(fd)
      if (!res.ok) {
        setError(res.error ?? "Failed to save.")
        return
      }
      methods.reset()
      if (fileRef.current) fileRef.current.value = ""
      setPreviewKind(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New content</CardTitle>
        <CardDescription>
          Title, text, and optionally an image or video (JPEG/PNG/GIF/WebP, MP4/WebM/MOV).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="content-media">Image or video (optional)</Label>
              <input
                id="content-media"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={onFileChange}
                className="text-muted-foreground file:me-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="text-muted-foreground text-xs">
                Max ~8 MB images, ~50 MB videos.
              </p>
            </div>
            {previewUrl && previewKind === "image" ? (
              <div className="rounded-md border bg-muted/30 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
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
              {isPending ? "Saving…" : "Add content"}
            </Button>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
