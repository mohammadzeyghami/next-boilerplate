export function toFormData(obj: Record<string, any>) {
  const fd = new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      fd.append(key, ""); // مهم 👈
      return;
    }

    if (value instanceof File) {
      fd.append(key, value);
      return;
    }

    if (value instanceof Date) {
      fd.append(key, value.toISOString());
      return;
    }

    if (Array.isArray(value)) {
      fd.append(key, JSON.stringify(value));
      return;
    }

    if (typeof value === "object") {
      fd.append(key, JSON.stringify(value));
      return;
    }

    fd.append(key, String(value));
  });

  return fd;
}
