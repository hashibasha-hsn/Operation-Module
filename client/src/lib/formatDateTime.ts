import { DEFAULT_TIMEZONE } from "@/lib/timezones";
import { getStoredTimezone } from "@/lib/timezoneStorage";

function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDateTime(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
  timezone?: string,
): string {
  const date = parseDate(value);
  if (!date) return "—";

  const timeZone = timezone || getStoredTimezone() || DEFAULT_TIMEZONE;
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatDateTimeLong(
  value?: string | Date | null,
  timezone?: string,
): string {
  return formatDateTime(
    value,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
    timezone,
  );
}

export function formatNow(timezone?: string): string {
  return formatDateTime(new Date(), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }, timezone);
}
