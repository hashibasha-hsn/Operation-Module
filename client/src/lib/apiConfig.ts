/**
 * Central API base URLs for local + cloud (Azure / Railway) deployments.
 *
 * Set at build time (Vite):
 *   VITE_API_GATEWAY_URL=https://your-api-gateway.azurewebsites.net
 *
 * Local default remains http://localhost:3009
 */
const rawGateway =
  (import.meta.env.VITE_API_GATEWAY_URL as string | undefined)?.trim() ||
  "http://localhost:3009";

export const API_GATEWAY_URL = rawGateway.replace(/\/$/, "");

export const ORG_API = `${API_GATEWAY_URL}/api/org`;
export const AUTH_API = `${API_GATEWAY_URL}/api/auth`;
export const USER_API = `${API_GATEWAY_URL}/api/user`;
export const LOCATION_API = `${API_GATEWAY_URL}/api/location`;
export const LANGUAGE_API = `${API_GATEWAY_URL}/api/language`;
export const TRANSLATIONS_API = `${API_GATEWAY_URL}/api/translations`;
export const MEDIA_BASE = API_GATEWAY_URL;

/** Build an absolute URL under the API gateway. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_GATEWAY_URL}${normalized}`;
}
