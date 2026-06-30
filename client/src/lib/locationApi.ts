export const LOCATION_API = import.meta.env.VITE_LOCATION_API || 'http://localhost:3009/api/location';

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

export async function fetchLocationStats() {
  const response = await fetch(`${LOCATION_API}/stats`);
  if (!response.ok) return null;
  return response.json();
}
