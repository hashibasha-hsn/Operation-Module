import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { formatDateTime, formatDateTimeLong, formatNow } from "@/lib/formatDateTime";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";
import { getStoredTimezone, setStoredTimezone } from "@/lib/timezoneStorage";

type TimezoneContextType = {
  timezone: string;
  setTimezone: (timezone: string) => void;
  formatDateTime: (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTimeLong: (value?: string | Date | null) => string;
  formatNow: () => string;
};

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState(() => getStoredTimezone() || DEFAULT_TIMEZONE);

  useEffect(() => {
    const handleTimezoneChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next) setTimezoneState(next);
    };

    window.addEventListener("timezonechange", handleTimezoneChange);
    return () => window.removeEventListener("timezonechange", handleTimezoneChange);
  }, []);

  const setTimezone = useCallback((nextTimezone: string) => {
    setStoredTimezone(nextTimezone);
    setTimezoneState(nextTimezone);
    window.dispatchEvent(new CustomEvent("timezonechange", { detail: nextTimezone }));
  }, []);

  const formatInTimezone = useCallback(
    (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(value, options, timezone),
    [timezone],
  );

  const formatLongInTimezone = useCallback(
    (value?: string | Date | null) => formatDateTimeLong(value, timezone),
    [timezone],
  );

  const formatNowInTimezone = useCallback(() => formatNow(timezone), [timezone]);

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        setTimezone,
        formatDateTime: formatInTimezone,
        formatDateTimeLong: formatLongInTimezone,
        formatNow: formatNowInTimezone,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}
