export const normalizeOptionalString = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const normalizeStringArray = (values: string[]): string[] =>
  Array.isArray(values) ? values.map((value) => value.trim()).filter(Boolean) : [];
