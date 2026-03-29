"use server"

import crypto from "node:crypto"
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  email: string
  token: string
  password: string
}

export type PasswordActionResult = {
  ok: boolean
  error?: string
}

function toSmtpConfig(raw: string) {
  const parsed = new URL(raw)
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : parsed.protocol === "smtps:" ? 465 : 587,
    secure: parsed.protocol === "smtps:",
    auth: {
      user: decodeURIComponent(parsed.username),
      pass: decodeURIComponent(parsed.password),
    },
    family: 4,
    connectionTimeout: 4_000,
    greetingTimeout: 4_000,
    socketTimeout: 4_000,
  }
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

async function sendResetEmail(params: { email: string; token: string }) {
  const emailServer = process.env.AUTH_EMAIL_SERVER
  const emailFrom = process.env.AUTH_EMAIL_FROM
  if (!emailServer || !emailFrom) {
    throw new Error("Email provider is not configured.")
  }

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(params.token)}&email=${encodeURIComponent(params.email)}`

  const transporter = nodemailer.createTransport(toSmtpConfig(emailServer))
  await transporter.sendMail({
    to: params.email,
    from: emailFrom,
    subject: "Reset your password",
    text: `Use this link to reset your password: ${resetUrl}`,
    html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  })
}

export async function requestPasswordResetAction(
  input: ForgotPasswordInput
): Promise<PasswordActionResult> {
  const email = input.email.trim().toLowerCase()
  if (!email) {
    return { ok: false, error: "Email is required." }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { ok: true }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)
  const expires = new Date(Date.now() + 1000 * 60 * 30)

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expires,
    },
  })

  try {
    await sendResetEmail({ email, token: rawToken })
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: "Email service is unreachable right now. Please try again later.",
    }
  }
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<PasswordActionResult> {
  const email = input.email.trim().toLowerCase()
  const token = input.token.trim()
  const password = input.password

  if (!email || !token || !password) {
    return { ok: false, error: "Invalid reset request." }
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { ok: false, error: "Reset link is invalid or expired." }
  }

  const tokenHash = hashToken(token)
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      expires: { gt: new Date() },
    },
  })
  if (!resetToken) {
    return { ok: false, error: "Reset link is invalid or expired." }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const ua = await prisma.userAuth.findUnique({
    where: { userId: user.id },
  })
  if (ua) {
    await prisma.userAuth.update({
      where: { id: ua.id },
      data: { passwordHash },
    })
  }
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  return { ok: true }
}
