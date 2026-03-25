import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <Suspense
        fallback={<div className="text-muted-foreground text-sm">Loading…</div>}
      >
        <LoginForm />
      </Suspense>
      <Link
        href="/"
        className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
