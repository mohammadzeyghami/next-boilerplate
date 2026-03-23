import type { Metadata } from "next"
import Link from "next/link"

import { ForgotPasswordForm } from "@/modules/auth"

export const metadata: Metadata = {
  title: "Forgot password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <ForgotPasswordForm />
      <Link
        href="/"
        className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  )
}
