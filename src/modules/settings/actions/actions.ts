"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  deleteContentMediaFile,
  saveContentMediaFile,
} from "@/lib/content-media";
import {
  editProfileSchema,
  type EditProfileInput,
} from "../interface/validation";

type ProfileData = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userAuth: {
    id: string;
    name: string | null;
    lastName: string | null;
    username: string | null;
    email: string | null;
    phoneNumber: string | null;
    born: Date | null;
    metadata: unknown;
  } | null;
};

type ActionResult =
  | {
      success: true;
      message: string;
      data: ProfileData;
    }
  | {
      success: false;
      message: string;
      errors?: Record<string, string[]>;
    };

type GetMyProfileResult =
  | {
      success: true;
      data: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        role: string;
        userAuth: {
          id: string;
          name: string | null;
          lastName: string | null;
          username: string | null;
          email: string | null;
          phoneNumber: string | null;
          born: Date | null;
          status: string;
          profileRole: string;
          metadata: unknown;
        } | null;
      };
    }
  | {
      success: false;
      message: string;
    };

export type ProfileImageActionResult =
  | {
      ok: true;
      imageUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeNullableString(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function fileFromFormData(formData: FormData): File | null {
  const value = formData.get("file");
  if (value instanceof File && value.size > 0) return value;
  return null;
}

function normalizeBorn(
  value: string | Date | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function getCurrentSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized." as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userAuth: true },
  });

  if (!user) {
    return { error: "User not found." as const };
  }

  return { user };
}

function mapProfileData(user: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userAuth: {
    id: string;
    name: string | null;
    lastName: string | null;
    username: string | null;
    email: string | null;
    phoneNumber: string | null;
    born: Date | null;
    metadata: unknown;
  } | null;
}): ProfileData {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    userAuth: user.userAuth
      ? {
          id: user.userAuth.id,
          name: user.userAuth.name,
          lastName: user.userAuth.lastName,
          username: user.userAuth.username,
          email: user.userAuth.email,
          phoneNumber: user.userAuth.phoneNumber,
          born: user.userAuth.born,
          metadata: user.userAuth.metadata,
        }
      : null,
  };
}

export async function uploadProfileImageAction(
  formData: FormData,
): Promise<ProfileImageActionResult> {
  try {
    const current = await getCurrentSessionUser();

    if ("error" in current) {
      return { ok: false, error: current.error };
    }

    const file = fileFromFormData(formData);

    if (!file) {
      return { ok: false, error: "Image file is required." };
    }

    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Only image files are allowed." };
    }

    const saved = await saveContentMediaFile(file, current.user.id);

    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }

    if (saved.mediaKind !== "image") {
      await deleteContentMediaFile(saved.mediaUrl);
      return { ok: false, error: "Uploaded file must be an image." };
    }

    return {
      ok: true,
      imageUrl: saved.mediaUrl,
    };
  } catch (error) {
    console.error("uploadProfileImageAction error:", error);

    return {
      ok: false,
      error: "Something went wrong while uploading the image.",
    };
  }
}

export async function editProfileAction(
  rawData: EditProfileInput,
): Promise<ActionResult> {
  try {
    const current = await getCurrentSessionUser();

    if ("error" in current) {
      return {
        success: false,
        message: current.error,
      };
    }

    const parsed = editProfileSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const userId = current.user.id;

    const name =
      normalizeNullableString(parsed.data.name as string | null | undefined) ??
      null;
    const lastName = normalizeNullableString(
      parsed.data.lastName as string | null | undefined,
    );
    const username = normalizeNullableString(
      parsed.data.username as string | null | undefined,
    );
    const email = normalizeNullableString(
      parsed.data.email as string | null | undefined,
    );
    const phoneNumber = normalizeNullableString(
      parsed.data.phoneNumber as string | null | undefined,
    );
    const image = normalizeNullableString(
      parsed.data.image as string | null | undefined,
    );
    const metadata =
      (parsed.data.metadata as Record<string, unknown> | null | undefined) ??
      undefined;
    const bornDate = normalizeBorn(
      parsed.data.born as string | Date | null | undefined,
    );

    if (username) {
      const existingUsername = await prisma.userAuth.findFirst({
        where: {
          username,
          NOT: {
            userId,
          },
        },
        select: { id: true },
      });

      if (existingUsername) {
        return {
          success: false,
          message: "Username already exists.",
          errors: {
            username: ["Username already exists."],
          },
        };
      }
    }

    if (email) {
      const existingUserEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: userId,
          },
        },
        select: { id: true },
      });

      if (existingUserEmail) {
        return {
          success: false,
          message: "Email already exists.",
          errors: {
            email: ["Email already exists."],
          },
        };
      }

      const existingAuthEmail = await prisma.userAuth.findFirst({
        where: {
          email,
          NOT: {
            userId,
          },
        },
        select: { id: true },
      });

      if (existingAuthEmail) {
        return {
          success: false,
          message: "Email already exists.",
          errors: {
            email: ["Email already exists."],
          },
        };
      }
    }

    if (phoneNumber) {
      const existingPhone = await prisma.userAuth.findFirst({
        where: {
          phoneNumber,
          NOT: {
            userId,
          },
        },
        select: { id: true },
      });

      if (existingPhone) {
        return {
          success: false,
          message: "Phone number already exists.",
          errors: {
            phoneNumber: ["Phone number already exists."],
          },
        };
      }
    }

    const previousImage = current.user.image;
    const nextImage = image === undefined ? current.user.image : image;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name,
          email: email ?? current.user.email ?? null,
          image: nextImage,
        },
      });

      const userAuth = current.user.userAuth
        ? await tx.userAuth.update({
            where: { userId },
            data: {
              name,
              lastName:
                lastName === undefined
                  ? current.user.userAuth.lastName
                  : lastName,
              username:
                username === undefined
                  ? current.user.userAuth.username
                  : username,
              email: email === undefined ? current.user.userAuth.email : email,
              phoneNumber:
                phoneNumber === undefined
                  ? current.user.userAuth.phoneNumber
                  : phoneNumber,
              born:
                bornDate === undefined ? current.user.userAuth.born : bornDate,
              metadata:
                metadata === undefined
                  ? current.user.userAuth.metadata
                  : metadata,
            },
          })
        : await tx.userAuth.create({
            data: {
              userId,
              inviteCode: crypto.randomUUID(),
              name,
              lastName: lastName ?? null,
              username: username ?? null,
              email: email ?? null,
              phoneNumber: phoneNumber ?? null,
              born: bornDate ?? null,
              metadata: metadata ?? null,
            },
          });

      return {
        ...user,
        userAuth,
      };
    });

    if (
      previousImage &&
      nextImage !== undefined &&
      previousImage !== nextImage
    ) {
      await deleteContentMediaFile(previousImage);
    }

    return {
      success: true,
      message: "Profile updated successfully.",
      data: mapProfileData(updatedUser),
    };
  } catch (error) {
    console.error("editProfileAction error:", error);

    return {
      success: false,
      message: "Something went wrong while updating profile.",
    };
  }
}

export async function getMyProfileAction(): Promise<GetMyProfileResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      userAuth: true,
    },
  });

  if (!user) {
    return {
      success: false,
      message: "User not found.",
    };
  }

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      userAuth: user.userAuth
        ? {
            id: user.userAuth.id,
            name: user.userAuth.name,
            lastName: user.userAuth.lastName,
            username: user.userAuth.username,
            email: user.userAuth.email,
            phoneNumber: user.userAuth.phoneNumber,
            born: user.userAuth.born,
            status: user.userAuth.status,
            profileRole: user.userAuth.profileRole,
            metadata: user.userAuth.metadata,
          }
        : null,
    },
  };
}
