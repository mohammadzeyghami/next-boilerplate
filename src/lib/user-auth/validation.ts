const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = value.trim().replace(/\s/g, "");
  return PHONE_RE.test(digits);
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/\s/g, "");
}
