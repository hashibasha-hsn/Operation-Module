export type TimezoneOption = {
  value: string;
  label: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Riyadh", label: "Riyadh" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export const DEFAULT_TIMEZONE = "UTC";

export function getTimezoneLabel(value: string) {
  return TIMEZONE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
