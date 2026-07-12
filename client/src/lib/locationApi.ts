import { LOCATION_API } from './apiConfig';
export { LOCATION_API };


// ── SA-specific types (regions / cities / districts) ────────────────────────

export type SaRegion = {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
};

export type SaCity = {
  id: string;
  regionId: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
};

export type SaDistrict = {
  id: string;
  cityId: string;
  name: string;
  nameAr?: string;
  code?: string;
  postalCode?: string;
  isActive?: boolean;
  city?: SaCity & { region?: SaRegion };
};

// ── Generic Country / State / City types ─────────────────────────────────────

export type Country = {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;    // ISO-2 e.g. "SA"
  code3?: string;   // ISO-3 e.g. "SAU"
  phoneCode?: string;
  isActive?: boolean;
};

export type LocationState = {
  id: string;
  countryId: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
};

export type LocationCity = {
  id: string;
  stateId: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive?: boolean;
};

// ── SA-specific fetchers ──────────────────────────────────────────────────────

export async function fetchSaRegions(): Promise<SaRegion[]> {
  const response = await fetch(`${LOCATION_API}/regions`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchSaCities(regionId?: string): Promise<SaCity[]> {
  const url = regionId
    ? `${LOCATION_API}/regions/${regionId}/cities`
    : `${LOCATION_API}/cities`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchSaDistricts(cityId?: string, search?: string): Promise<SaDistrict[]> {
  if (search?.trim()) {
    const params = new URLSearchParams({ search: search.trim() });
    const response = await fetch(`${LOCATION_API}/districts?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
  if (!cityId) return [];
  const response = await fetch(`${LOCATION_API}/cities/${cityId}/districts`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// ── Generic Country / State / City fetchers ───────────────────────────────────

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch(`${LOCATION_API}/locations/countries`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchStates(countryId?: string): Promise<LocationState[]> {
  const url = countryId
    ? `${LOCATION_API}/locations/countries/${countryId}/states`
    : `${LOCATION_API}/locations/states`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchCities(stateId?: string): Promise<LocationCity[]> {
  const url = stateId
    ? `${LOCATION_API}/locations/states/${stateId}/cities`
    : `${LOCATION_API}/locations/cities`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchLocationStats() {
  const response = await fetch(`${LOCATION_API}/stats`);
  if (!response.ok) return null;
  return response.json();
}
