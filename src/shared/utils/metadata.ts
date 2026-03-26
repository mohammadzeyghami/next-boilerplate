import type { MetadataEntry } from "../components/molecules/inputs/MetadataEditorR";

const isRecord = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null && !Array.isArray(val);

export function toMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === "string") {
    const trimmed = metadata.trim();
    if (!trimmed) return {};
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isRecord(metadata) ? metadata : {};
}

export function metadataValueToString(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function metadataEntriesFromUnknown(
  metadata: unknown,
  { includeEmptyRow = true }: { includeEmptyRow?: boolean } = {}
): MetadataEntry[] {
  const record = toMetadataRecord(metadata);
  const entries = Object.keys(record).length
    ? Object.entries(record).map(([key, value]) => ({
        key,
        value: metadataValueToString(value),
      }))
    : [];

  if (entries.length) return entries;
  return includeEmptyRow ? [{ key: "", value: "" }] : [];
}

export function parseMetadataValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const first = trimmed[0];
  const looksLikeJson =
    first === "{" ||
    first === "[" ||
    first === '"' ||
    first === "-" ||
    (first >= "0" && first <= "9") ||
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null";

  if (looksLikeJson) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }

  return raw;
}

export function metadataObjectFromEntries(
  entries: Array<Pick<MetadataEntry, "key" | "value">> | undefined | null
): Record<string, unknown> | undefined {
  const metadata: Record<string, unknown> = {};

  for (const entry of entries ?? []) {
    const key = entry.key.trim();
    const value = entry.value?.trim() ?? "";
    if (!key && !value) continue;
    if (!key) continue;
    metadata[key] = parseMetadataValue(entry.value ?? "");
  }

  return Object.keys(metadata).length ? metadata : undefined;
}

