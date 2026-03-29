"use server"

import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { createUserWithAuthProfile } from "@/lib/user-auth/user-bootstrap"

export type RegisterInput = {
  name?: string
  email: string
  password: string
}

export type RegisterActionResult = {
  ok: boolean
  error?: string
}

export async function registerWithPasswordAction(
  input: RegisterInput
): Promise<RegisterActionResult> {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const name = input.name?.trim() ?? ""

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." }
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  const existing = await prisma.userAuth.findFirst({ where: { email } })
  if (existing) {
    return { ok: false, error: "An account with this email already exists." }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const ua = await createUserWithAuthProfile({
    email,
    passwordHash,
  })
  if (name) {
    await prisma.user.update({
      where: { id: ua.userId },
      data: { name },
    })
    await prisma.userProfile.updateMany({
      where: { userAuthId: ua.id },
      data: { displayName: name },
    })
  }

  return { ok: true }
}
