export const GATEWAY = (import.meta.env.VITE_USER_API || 'http://localhost:3009/api/user').replace('/api/user', '').replace(/\/$/, '');

export const AUTH_API = `${GATEWAY}/api/auth`;
export const USER_API = import.meta.env.VITE_USER_API || `${GATEWAY}/api/user`;
export const ORG_API = import.meta.env.VITE_ORG_API || `${GATEWAY}/api/org`;
export const NOTIFICATION_API = import.meta.env.VITE_NOTIFICATION_API || `${GATEWAY}/api/notification`;
export const ATTENDANCE_API = import.meta.env.VITE_ATTENDANCE_API || `${GATEWAY}/api/attendance`;
export const LOCATION_API = import.meta.env.VITE_LOCATION_API || `${GATEWAY}/api/location`;
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || `${GATEWAY}`;
