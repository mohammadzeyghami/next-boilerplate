import "server-only";

function requireSecret(name: string, value: string | undefined): Uint8Array {
  if (!value || value.length < 16) {
    throw new Error(
      `${name} must be set and at least 16 characters (use AUTH_SECRET or set explicitly).`,
    );
  }
  return new TextEncoder().encode(value);
}

export function getJwtSecretBytes(): Uint8Array {
  return requireSecret(
    "USER_AUTH_JWT_SECRET or AUTH_SECRET",
    process.env.USER_AUTH_JWT_SECRET ?? process.env.AUTH_SECRET,
  );
}

export function getOtpJwtSecretBytes(): Uint8Array {
  return requireSecret(
    "USER_AUTH_OTP_SECRET or AUTH_SECRET",
    process.env.USER_AUTH_OTP_SECRET ?? process.env.AUTH_SECRET,
  );
}
