import { DEFAULT_TIMEZONE } from "@/lib/timezones";

const TIMEZONE_STORAGE_KEY = "appTimezone";

export function getStoredTimezone(): string {
  try {
    return localStorage.getItem(TIMEZONE_STORAGE_KEY) || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function setStoredTimezone(timezone: string) {
  localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
}
