import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchSaCities,
  fetchSaDistricts,
  fetchSaRegions,
  type SaCity,
  type SaDistrict,
  type SaRegion,
} from "@/lib/locationApi";
import { useLanguage } from "@/contexts/LanguageContext";

function displayName(item: { name: string; nameAr?: string }, preferArabic: boolean) {
  if (preferArabic && item.nameAr) return item.nameAr;
  return item.name;
}

function isSummaryRegion(region: SaRegion) {
  const name = `${region.name} ${region.nameAr ?? ""}`.toLowerCase();
  return name.includes("total") || name.includes("الإجمالي");
}

export type SaLocationSelection = {
  regionId: string;
  cityId: string;
  districtId: string;
  region: SaRegion | null;
  city: SaCity | null;
  district: SaDistrict | null;
};

type SaLocationSelectorsProps = {
  value: Pick<SaLocationSelection, "regionId" | "cityId" | "districtId">;
  onChange: (selection: SaLocationSelection) => void;
  preferArabic?: boolean;
  disabled?: boolean;
};

const selectContentProps = {
  position: "popper" as const,
  side: "bottom" as const,
  align: "start" as const,
  sideOffset: 4,
  avoidCollisions: false,
  className: "w-[var(--radix-select-trigger-width)]",
};

export default function SaLocationSelectors({
  value,
  onChange,
  preferArabic = false,
  disabled = false,
}: SaLocationSelectorsProps) {
  const { t } = useLanguage();
  const [regions, setRegions] = useState<SaRegion[]>([]);
  const [cities, setCities] = useState<SaCity[]>([]);
  const [districts, setDistricts] = useState<SaDistrict[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const visibleRegions = useMemo(
    () => regions.filter((region) => !isSummaryRegion(region)),
    [regions],
  );

  const regionsUnavailable = !loadingRegions && visibleRegions.length === 0;

  useEffect(() => {
    setLoadingRegions(true);
    fetchSaRegions()
      .then((items) => setRegions(items.filter((region) => !isSummaryRegion(region))))
      .catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false));
  }, []);

  useEffect(() => {
    if (!value.regionId) {
      setCities([]);
      setDistricts([]);
      return;
    }
    setLoadingCities(true);
    fetchSaCities(value.regionId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [value.regionId]);

  useEffect(() => {
    if (!value.cityId) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    fetchSaDistricts(value.cityId)
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [value.cityId]);

  const emitChange = (next: Partial<SaLocationSelection>) => {
    onChange({
      regionId: next.regionId ?? value.regionId,
      cityId: next.cityId ?? value.cityId,
      districtId: next.districtId ?? value.districtId,
      region:
        next.region ??
        visibleRegions.find((item) => item.id === (next.regionId ?? value.regionId)) ??
        null,
      city: next.city ?? cities.find((item) => item.id === (next.cityId ?? value.cityId)) ?? null,
      district:
        next.district ??
        districts.find((item) => item.id === (next.districtId ?? value.districtId)) ??
        null,
    });
  };

  return (
    <div className="space-y-2">
      {regionsUnavailable ? (
        <p className="text-xs text-amber-700">{t('locationDataUnavailable')}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="sa-region">{t('region')}</Label>
        <Select
          value={value.regionId || undefined}
          onValueChange={(regionId) => {
            const region = visibleRegions.find((item) => item.id === regionId) ?? null;
            emitChange({ regionId, cityId: "", districtId: "", region, city: null, district: null });
          }}
          disabled={disabled || loadingRegions}
        >
          <SelectTrigger id="sa-region" className="w-full">
            <SelectValue placeholder={loadingRegions ? t('loadingRegions') : t('selectRegion')} />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            {visibleRegions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {displayName(region, preferArabic)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-city">{t('city')}</Label>
        <Select
          value={value.cityId || undefined}
          onValueChange={(cityId) => {
            const city = cities.find((item) => item.id === cityId) ?? null;
            emitChange({ cityId, districtId: "", city, district: null });
          }}
          disabled={disabled || !value.regionId || loadingCities}
        >
          <SelectTrigger id="sa-city" className="w-full">
            <SelectValue
              placeholder={
                !value.regionId
                  ? t('selectRegionFirst')
                  : loadingCities
                    ? t('loadingCities')
                    : t('selectCity')
              }
            />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {displayName(city, preferArabic)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sa-district">{t('district')}</Label>
        <Select
          value={value.districtId || undefined}
          onValueChange={(districtId) => {
            const district = districts.find((item) => item.id === districtId) ?? null;
            emitChange({ districtId, district });
          }}
          disabled={disabled || !value.cityId || loadingDistricts}
        >
          <SelectTrigger id="sa-district" className="w-full">
            <SelectValue
              placeholder={
                !value.cityId
                  ? t('selectCityFirst')
                  : loadingDistricts
                    ? t('loadingDistricts')
                    : t('selectDistrict')
              }
            />
          </SelectTrigger>
          <SelectContent {...selectContentProps}>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {displayName(district, preferArabic)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    </div>
  );
}
