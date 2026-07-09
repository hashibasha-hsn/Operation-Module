import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCountries,
  fetchStates,
  fetchCities,
  type Country,
  type LocationState,
  type LocationCity,
} from "@/lib/locationApi";
import { useLanguage } from "@/contexts/LanguageContext";

/** Return the translated string, or fall back to the English default if i18next
 *  hasn't loaded the key yet (it returns the key itself in that case). */
function tr(translated: string, fallback: string): string {
  return translated === fallback || !translated ? fallback : translated;
}

function displayName(
  item: { name: string; nameAr?: string },
  preferArabic: boolean,
) {
  if (preferArabic && item.nameAr) return item.nameAr;
  return item.name;
}

export type CountryStateCitySelection = {
  countryId: string;
  stateId: string;
  cityId: string;
  country: Country | null;
  state: LocationState | null;
  city: LocationCity | null;
};

type Props = {
  value: Pick<CountryStateCitySelection, "countryId" | "stateId" | "cityId">;
  onChange: (selection: CountryStateCitySelection) => void;
  preferArabic?: boolean;
  disabled?: boolean;
};

const popperProps = {
  position: "popper" as const,
  side: "bottom" as const,
  align: "start" as const,
  sideOffset: 4,
  avoidCollisions: false,
  className: "w-[var(--radix-select-trigger-width)]",
};

export default function CountryStateCitySelectors({
  value,
  onChange,
  preferArabic = false,
  disabled = false,
}: Props) {
  const { t } = useLanguage();

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<LocationState[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load countries once on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  // Reload states when country changes
  useEffect(() => {
    if (!value.countryId) {
      setStates([]);
      setCities([]);
      return;
    }
    setLoadingStates(true);
    fetchStates(value.countryId)
      .then(setStates)
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, [value.countryId]);

  // Reload cities when state changes
  useEffect(() => {
    if (!value.stateId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    fetchCities(value.stateId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [value.stateId]);

  const emit = (next: Partial<CountryStateCitySelection>) => {
    const countryId = next.countryId ?? value.countryId;
    const stateId   = next.stateId   ?? value.stateId;
    const cityId    = next.cityId    ?? value.cityId;
    onChange({
      countryId,
      stateId,
      cityId,
      country:  next.country  ?? countries.find((c)  => c.id === countryId) ?? null,
      state:    next.state    ?? states.find((s)     => s.id === stateId)   ?? null,
      city:     next.city     ?? cities.find((ci)    => ci.id === cityId)   ?? null,
    });
  };

  const unavailable = !loadingCountries && countries.length === 0;

  // Resolved labels — use hard-coded English fallbacks so i18next key lookup
  // delay never surfaces raw key names like "selectCountry" to the user.
  const labels = {
    country:           tr(t("country"),           "Country"),
    state:             tr(t("state"),             "State"),
    city:              tr(t("city"),              "City"),
    selectCountry:     tr(t("selectCountry"),     "Select country"),
    selectState:       tr(t("selectState"),       "Select state"),
    selectCity:        tr(t("selectCity"),        "Select city"),
    selectCountryFirst:tr(t("selectCountryFirst"),"Select country first"),
    selectStateFirst:  tr(t("selectStateFirst"),  "Select state first"),
    loading:           tr(t("loading"),           "Loading…"),
    unavailableMsg:    tr(t("locationDataUnavailable"), "Location data unavailable"),
  };

  return (
    <div className="space-y-2">
      {unavailable && (
        <p className="text-xs text-amber-700">{labels.unavailableMsg}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* ── Country ── */}
        <div className="space-y-2">
          <Label htmlFor="csc-country">{labels.country}</Label>
          <Select
            value={value.countryId || undefined}
            onValueChange={(countryId) => {
              const country = countries.find((c) => c.id === countryId) ?? null;
              emit({ countryId, stateId: "", cityId: "", country, state: null, city: null });
            }}
            disabled={disabled || loadingCountries}
          >
            <SelectTrigger id="csc-country" className="w-full">
              <SelectValue
                placeholder={loadingCountries ? labels.loading : labels.selectCountry}
              />
            </SelectTrigger>
            <SelectContent {...popperProps}>
              {countries.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {displayName(c, preferArabic)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── State ── */}
        <div className="space-y-2">
          <Label htmlFor="csc-state">{labels.state}</Label>
          <Select
            value={value.stateId || undefined}
            onValueChange={(stateId) => {
              const state = states.find((s) => s.id === stateId) ?? null;
              emit({ stateId, cityId: "", state, city: null });
            }}
            disabled={disabled || !value.countryId || loadingStates}
          >
            <SelectTrigger id="csc-state" className="w-full">
              <SelectValue
                placeholder={
                  !value.countryId
                    ? labels.selectCountryFirst
                    : loadingStates
                    ? labels.loading
                    : labels.selectState
                }
              />
            </SelectTrigger>
            <SelectContent {...popperProps}>
              {states.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {displayName(s, preferArabic)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── City ── */}
        <div className="space-y-2">
          <Label htmlFor="csc-city">{labels.city}</Label>
          <Select
            value={value.cityId || undefined}
            onValueChange={(cityId) => {
              const city = cities.find((ci) => ci.id === cityId) ?? null;
              emit({ cityId, city });
            }}
            disabled={disabled || !value.stateId || loadingCities}
          >
            <SelectTrigger id="csc-city" className="w-full">
              <SelectValue
                placeholder={
                  !value.stateId
                    ? labels.selectStateFirst
                    : loadingCities
                    ? labels.loading
                    : labels.selectCity
                }
              />
            </SelectTrigger>
            <SelectContent {...popperProps}>
              {cities.map((ci) => (
                <SelectItem key={ci.id} value={ci.id}>
                  {displayName(ci, preferArabic)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}
