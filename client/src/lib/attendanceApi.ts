import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

const ATTENDANCE_API =
  import.meta.env.VITE_ATTENDANCE_API || '/api/attendance';

export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  employeeId?: string;
  email?: string;
  store: string;
  storeId?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  expectedHours?: number;
  deviation?: number;
  selfieUrl?: string;
  punchOutImage?: string;
  deviceInfo?: string;
  status?: string;
  organizationId?: string;
  source?: string;
};

export type AttendanceConfig = {
  status: boolean;
  geolocation: boolean;
  checkInImage: boolean;
  checkOutImage: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  dailyWorkingHours: number;
  calculateOvertime: boolean;
  designation: boolean;
  users: boolean;
  usersOutsideEntity: boolean;
  removeInactiveUsers: boolean;
  primaryAssignee: boolean;
  notify: boolean;
  autoCheckInOnLogin: boolean;
  autoCheckOutOnLogout: boolean;
  assignedStoreIds?: string[];
  assignedUserIds?: string[];
};

function getContext() {
  const user = getStoredUser();
  return {
    organizationId: getOrganizationId(),
    userId: (user.userId ?? user.id ?? '') as string,
    userName:
      (user.name as string) ||
      (user.fullName as string) ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      (user.email as string) ||
      'User',
    employeeId: (user.employeeId as string) || undefined,
    email: (user.email as string) || '',
    store: (user.storeName as string) || (user.entityId as string) || 'Unassigned',
    storeId: (user.storeId as string) || (user.entityId as string) || undefined,
  };
}

export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return `${navigator.userAgent} | ${navigator.platform}`;
}

export async function fetchAttendanceConfig(): Promise<AttendanceConfig> {
  const { organizationId } = getContext();
  const res = await fetch(
    `${ATTENDANCE_API}/config?organizationId=${encodeURIComponent(organizationId)}`,
  );
  if (!res.ok) throw new Error('Failed to load attendance config');
  return res.json();
}

export async function saveAttendanceConfig(
  config: Partial<AttendanceConfig>,
): Promise<AttendanceConfig> {
  const { organizationId } = getContext();
  const res = await fetch(`${ATTENDANCE_API}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, organizationId }),
  });
  if (!res.ok) throw new Error('Failed to save attendance config');
  return res.json();
}

export async function fetchAttendanceRecords(filters?: {
  startDate?: string;
  endDate?: string;
  store?: string;
  userId?: string;
}): Promise<AttendanceRecord[]> {
  const { organizationId } = getContext();
  const params = new URLSearchParams({ organizationId });
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.store) params.set('store', filters.store);
  if (filters?.userId) params.set('userId', filters.userId);

  const res = await fetch(`${ATTENDANCE_API}/records?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load attendance records');
  return res.json();
}

export async function fetchTodayAttendance(
  userId?: string,
): Promise<AttendanceRecord | null> {
  const id = userId || getContext().userId;
  if (!id) return null;
  const res = await fetch(`${ATTENDANCE_API}/today?userId=${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

export async function recordLoginAttendance(): Promise<AttendanceRecord | null> {
  const ctx = getContext();
  if (!ctx.userId) return null;

  try {
    const res = await fetch(`${ATTENDANCE_API}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ctx,
        deviceInfo: getDeviceInfo(),
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function recordLogoutAttendance(): Promise<AttendanceRecord | null> {
  const ctx = getContext();
  if (!ctx.userId) return null;

  try {
    const res = await fetch(`${ATTENDANCE_API}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        deviceInfo: getDeviceInfo(),
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
