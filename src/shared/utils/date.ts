/**
 * Date formatting utility functions
 */

/**
 * Checks if a value is a valid date string or Date object
 */
export function isValidDate(value: unknown): boolean {
  if (value == null) return false;

  // Check if it's already a Date object
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  // Check if it's a string that looks like a date
  if (typeof value === "string") {
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoPattern.test(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // Check if it's a timestamp number
  if (typeof value === "number") {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  return false;
}

export type DateFormatOptions = {
  /**
   * Locale string for formatting (e.g., "en-GB", "fa-IR", "en-US")
   * @default "en-GB"
   */
  locale?: string;
  /**
   * Intl.DateTimeFormat options for custom formatting
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /**
   * Fallback value when date is null/undefined/invalid
   * @default "—"
   */
  fallback?: string;
};

/**
 * Default date format options used across the application
 */
export const DEFAULT_DATE_FORMAT: DateFormatOptions = {
  locale: "en-GB",
  fallback: "—",
};

/**
 * Converts a date value to a formatted string
 *
 * @param date - Date value (Date object, string, or number)
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * dateConverter("2024-01-15T10:30:00Z")
 * // => "15/01/2024, 10:30:00"
 *
 * dateConverter("2024-01-15", { locale: "fa-IR" })
 * // => "۱۴۰۲/۱۰/۲۵"
 *
 * dateConverter("2024-01-15", {
 *   formatOptions: {
 *     year: 'numeric',
 *     month: 'long',
 *     day: 'numeric'
 *   }
 * })
 * // => "15 January 2024"
 * ```
 */
export function dateConverter(
  date: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  const { locale, formatOptions, fallback } = {
    ...DEFAULT_DATE_FORMAT,
    ...options,
  };

  // Handle null/undefined
  if (date == null) {
    return fallback!;
  }

  try {
    const dateObj = typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback!;
    }

    // Format with custom options or default toLocaleString
    if (formatOptions) {
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    }

    return dateObj.toLocaleString(locale);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return fallback!;
  }
}

/**
 * Preset date formatters for common use cases
 */
export const dateFormatters = {
  /**
   * Full date and time (e.g., "15/01/2024, 10:30:00")
   */
  dateTime: (date: Date | string | number | null | undefined) =>
    dateConverter(date),

  /**
   * Date only (e.g., "15/01/2024")
   */
  dateOnly: (date: Date | string | number | null | undefined) =>
    dateConverter(date, {
      formatOptions: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    }),

  /**
   * Time only (e.g., "10:30:00")
   */
  timeOnly: (date: Date | string | number | null | undefined) =>
    dateConverter(date, {
      formatOptions: {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    }),

  /**
   * Long format (e.g., "15 January 2024")
   */
  long: (date: Date | string | number | null | undefined) =>
    dateConverter(date, {
      formatOptions: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    }),

  /**
   * Short format (e.g., "15 Jan 2024")
   */
  short: (date: Date | string | number | null | undefined) =>
    dateConverter(date, {
      formatOptions: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    }),

  /**
   * Relative time (e.g., "2 hours ago", "in 3 days")
   * Note: This uses Intl.RelativeTimeFormat with auto selection
   */
  relative: (date: Date | string | number | null | undefined, locale = "en-GB"): string => {
    if (date == null) return DEFAULT_DATE_FORMAT.fallback!;

    try {
      const dateObj = typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;

      if (isNaN(dateObj.getTime())) {
        return DEFAULT_DATE_FORMAT.fallback!;
      }

      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

      if (Math.abs(diffSec) < 60) {
        return rtf.format(diffSec, "second");
      } else if (Math.abs(diffMin) < 60) {
        return rtf.format(diffMin, "minute");
      } else if (Math.abs(diffHour) < 24) {
        return rtf.format(diffHour, "hour");
      } else if (Math.abs(diffDay) < 30) {
        return rtf.format(diffDay, "day");
      } else {
        // Fall back to absolute date for dates > 30 days
        return dateConverter(date, { locale });
      }
    } catch (error) {
      console.warn("Relative date formatting error:", error);
      return DEFAULT_DATE_FORMAT.fallback!;
    }
  },
};
