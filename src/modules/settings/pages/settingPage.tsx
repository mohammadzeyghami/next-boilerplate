"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editProfileSchema,
  type EditProfileInput,
} from "@/modules/settings/interface/validation";
import {
  editProfileAction,
  getMyProfileAction,
  uploadProfileImageAction,
} from "@/modules/settings/actions/actions";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import { Button } from "@/shared/components/atoms/button";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";

export default function EditProfileForm() {
  const [isPending, startTransition] = useTransition();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      image: "",
      born: null,
      metadata: {},
    },
  });

  const watchedImage = form.watch("image");

  const imagePreview = useMemo(() => {
    if (localPreview) return localPreview;
    if (!watchedImage || typeof watchedImage !== "string") return "";
    return watchedImage.trim();
  }, [localPreview, watchedImage]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getMyProfileAction();

        if (!res.success || !res.data) {
          return;
        }

        form.reset({
          name: res.data.userAuth?.name ?? res.data.name ?? "",
          lastName: res.data.userAuth?.lastName ?? "",
          username: res.data.userAuth?.username ?? "",
          email: res.data.userAuth?.email ?? res.data.email ?? "",
          phoneNumber: res.data.userAuth?.phoneNumber ?? "",
          image: res.data.image ?? "",
          born: res.data.userAuth?.born
            ? new Date(res.data.userAuth.born).toISOString().split("T")[0]
            : null,
          metadata:
            res.data.userAuth?.metadata &&
            typeof res.data.userAuth.metadata === "object" &&
            !Array.isArray(res.data.userAuth.metadata)
              ? (res.data.userAuth.metadata as Record<string, unknown>)
              : {},
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [form]);

  useEffect(() => {
    setImageError(false);
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handlePickImage = () => {
    if (isUploadingImage || isLoadingProfile) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });

    setImageError(false);
    setIsUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadProfileImageAction(fd);

      if (!result.ok || !result.imageUrl) {
        toast({
          title: "Upload failed",
          description: result.ok ? "No image URL returned." : result.error,
        });
        return;
      }

      form.setValue("image", result.imageUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      setLocalPreview("");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const onSubmit = (values: EditProfileInput) => {
    startTransition(async () => {
      const res = await editProfileAction(values);

      if (!res.success) {
        toast({
          title: "Could not save profile",
          description: res.message,
        });
        return;
      }

      form.reset({
        name: res.data.userAuth?.name ?? res.data.name ?? "",
        lastName: res.data.userAuth?.lastName ?? "",
        username: res.data.userAuth?.username ?? "",
        email: res.data.userAuth?.email ?? res.data.email ?? "",
        phoneNumber: res.data.userAuth?.phoneNumber ?? "",
        image: res.data.image ?? "",
        born: res.data.userAuth?.born
          ? new Date(res.data.userAuth.born).toISOString().split("T")[0]
          : null,
        metadata:
          res.data.userAuth?.metadata &&
          typeof res.data.userAuth.metadata === "object" &&
          !Array.isArray(res.data.userAuth.metadata)
            ? (res.data.userAuth.metadata as Record<string, unknown>)
            : {},
      });

      setLocalPreview("");
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-md rounded-lg border p-4 shadow-md">
        <FormProvider methods={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handlePickImage}
                disabled={isUploadingImage || isLoadingProfile}
                className="relative h-24 w-24 overflow-hidden rounded-full border bg-muted transition hover:opacity-90 disabled:cursor-not-allowed"
              >
                {imagePreview && !imageError ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No Image
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs text-white opacity-0 transition hover:opacity-100">
                  {isUploadingImage ? "Uploading..." : "Change"}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <InputR<EditProfileInput> name="name" label="Name" />
            <InputR<EditProfileInput> name="lastName" label="Last name" />
            <InputR<EditProfileInput> name="username" label="Username" />
            <InputR<EditProfileInput> name="email" label="Email" />
            <InputR<EditProfileInput> name="phoneNumber" label="Phone number" />

            <Button
              type="submit"
              disabled={isPending || isLoadingProfile || isUploadingImage}
            >
              {isLoadingProfile
                ? "Loading..."
                : isUploadingImage
                  ? "Uploading image..."
                  : isPending
                    ? "Saving..."
                    : "Save"}
            </Button>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
