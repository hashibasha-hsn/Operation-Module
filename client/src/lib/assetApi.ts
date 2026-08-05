import { getOrganizationId, getCurrentUserId } from "@/lib/authStorage";

const ORG_API = import.meta.env.VITE_ORG_API || "/api/org";

async function assetRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ORG_API}/assets${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }
  return data as T;
}

export function getAssetOrganizationId() {
  return getOrganizationId() || "default-org";
}

export interface AssetFilters {
  search?: string;
  tableId?: string;
  status?: string;
  condition?: string;
  storeId?: string;
  userId?: string;
  expiryFrom?: string;
  expiryTo?: string;
  customFields?: Record<string, string>;
}

export async function fetchAssets(filters: AssetFilters = {}): Promise<any[]> {
  const params = new URLSearchParams({ organizationId: getAssetOrganizationId() });
  if (filters.search) params.set("search", filters.search);
  if (filters.tableId) params.set("tableId", filters.tableId);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.condition && filters.condition !== "all") params.set("condition", filters.condition);
  if (filters.storeId && filters.storeId !== "all") params.set("storeId", filters.storeId);
  if (filters.userId && filters.userId !== "all") params.set("userId", filters.userId);
  if (filters.expiryFrom) params.set("expiryFrom", filters.expiryFrom);
  if (filters.expiryTo) params.set("expiryTo", filters.expiryTo);
  if (filters.customFields && Object.keys(filters.customFields).length) {
    params.set("customFields", JSON.stringify(filters.customFields));
  }
  const response = await fetch(`${ORG_API}/assets?${params.toString()}`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function fetchDeletedAssets(): Promise<any[]> {
  const response = await fetch(`${ORG_API}/assets/deleted?organizationId=${encodeURIComponent(getAssetOrganizationId())}`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function fetchAssetById(id: string): Promise<any> {
  return assetRequest(`/${id}`);
}

export async function createAsset(payload: any): Promise<any> {
  return assetRequest("/", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || getAssetOrganizationId(),
      createdBy: payload.createdBy || getCurrentUserId(),
    }),
  });
}

export async function saveAssetDraft(payload: any): Promise<any> {
  return assetRequest("/draft", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || getAssetOrganizationId(),
      createdBy: payload.createdBy || getCurrentUserId(),
    }),
  });
}

export async function updateAsset(id: string, payload: any): Promise<any> {
  return assetRequest(`/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      updatedBy: payload.updatedBy || getCurrentUserId(),
    }),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  await assetRequest(`/${id}`, { method: "DELETE" });
}

export async function restoreAsset(id: string): Promise<any> {
  return assetRequest(`/${id}/restore`, {
    method: "PUT",
    body: JSON.stringify({ actor: getCurrentUserId() }),
  });
}

export async function transferAsset(id: string, newOwnerId: string): Promise<any> {
  return assetRequest(`/${id}/transfer`, {
    method: "PUT",
    body: JSON.stringify({ newOwnerId, actor: getCurrentUserId() }),
  });
}

export async function updateAssetStatus(id: string, status: string): Promise<any> {
  return assetRequest(`/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, actor: getCurrentUserId() }),
  });
}

export async function bulkUploadAssets(rows: any[]): Promise<any> {
  return assetRequest("/bulk-upload", {
    method: "POST",
    body: JSON.stringify({
      organizationId: getAssetOrganizationId(),
      rows,
      createdBy: getCurrentUserId(),
    }),
  });
}

export interface TableCustomField {
  fieldName: string;
  fieldType: string;
  isRequired?: boolean;
  options?: string[];
  visibility?: string;
  renewalReminder?: { enabled: boolean; daysBefore: number };
  showInList?: boolean;
}

export async function fetchAssetTables(): Promise<any[]> {
  const response = await fetch(`${ORG_API}/assets/tables?organizationId=${encodeURIComponent(getAssetOrganizationId())}`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function fetchAssetTableById(id: string): Promise<any> {
  return assetRequest(`/tables/${id}`);
}

export async function createAssetTable(payload: any): Promise<any> {
  return assetRequest("/tables", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || getAssetOrganizationId(),
      createdBy: payload.createdBy || getCurrentUserId(),
    }),
  });
}

export async function updateAssetTable(id: string, payload: any): Promise<any> {
  return assetRequest(`/tables/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      updatedBy: payload.updatedBy || getCurrentUserId(),
    }),
  });
}

export async function publishAssetTable(id: string): Promise<any> {
  return assetRequest(`/tables/${id}/publish`, { method: "PUT" });
}

export async function archiveAssetTable(id: string): Promise<any> {
  return assetRequest(`/tables/${id}/archive`, { method: "PUT" });
}

export async function deleteAssetTable(id: string): Promise<void> {
  await assetRequest(`/tables/${id}`, { method: "DELETE" });
}

export async function fetchAssetFilters(userId?: string): Promise<any[]> {
  const params = new URLSearchParams({ organizationId: getAssetOrganizationId() });
  if (userId) params.set("userId", userId);
  const response = await fetch(`${ORG_API}/assets/filters?${params.toString()}`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function createAssetFilter(payload: any): Promise<any> {
  return assetRequest("/filters", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || getAssetOrganizationId(),
      createdBy: payload.createdBy || getCurrentUserId(),
    }),
  });
}

export async function updateAssetFilter(id: string, payload: any): Promise<any> {
  return assetRequest(`/filters/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteAssetFilter(id: string): Promise<void> {
  await assetRequest(`/filters/${id}`, { method: "DELETE" });
}

export async function uploadAssetFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${ORG_API}/assets/upload`, { method: "POST", body: formData });
  const data = await response.json().catch(() => null);
  if (!response.ok) return null;
  return data?.url ?? null;
}

export const ASSET_STATUSES = ["active", "inactive", "maintenance", "retired", "disposed"];
export const ASSET_CONDITIONS = ["excellent", "good", "fair", "poor"];
export const ASSET_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "file", label: "File" },
  { value: "image", label: "Image" },
];
