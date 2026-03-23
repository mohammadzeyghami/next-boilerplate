export const authKeys = {
  all: () => ["auth"] as const,
  session: () => [...authKeys.all(), "session"] as const,
  forgotPassword: () => [...authKeys.all(), "forgot-password"] as const,
  resetPassword: () => [...authKeys.all(), "reset-password"] as const,
}
