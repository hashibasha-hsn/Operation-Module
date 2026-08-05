const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when value looks like a UUID (with optional whitespace). */
export function isUuid(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return UUID_RE.test(value.trim());
}

/**
 * Prefer a human-readable label; never return a raw UUID to the UI.
 * Pass candidates in preference order (name, title, email, id…).
 */
export function humanLabel(
  ...candidates: Array<unknown>
): string {
  const fallback =
    (typeof candidates[candidates.length - 1] === 'string' &&
      !isUuid(candidates[candidates.length - 1]) &&
      String(candidates[candidates.length - 1]).trim()) ||
    '—';

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const text = String(candidate).trim();
    if (!text) continue;
    if (isUuid(text)) continue;
    return text;
  }

  return fallback === '—' ? '—' : fallback;
}

export function truncateLabel(label: string, max = 24): string {
  const text = String(label || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

export function buildIdLabelMap(
  rows: Array<Record<string, unknown>>,
  idKeys: string[],
  labelKeys: string[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows || []) {
    const id = idKeys.map((k) => row[k]).find((v) => typeof v === 'string' && v);
    if (!id || typeof id !== 'string') continue;
    const label = humanLabel(...labelKeys.map((k) => row[k]), '—');
    if (label !== '—') map[id] = label;
  }
  return map;
}

/** Store / entity display names — never stores a UUID as the label. */
export function buildStoreNameMap(
  entities: Array<Record<string, unknown>>,
): Record<string, string> {
  return buildIdLabelMap(
    entities,
    ['id', 'entityId', 'storeId'],
    ['storeName', 'entityName', 'name'],
  );
}

/** User display names from profile rows. */
export function buildUserNameMap(
  users: Array<Record<string, unknown>>,
): Record<string, string> {
  return buildIdLabelMap(
    users,
    ['userId', 'id'],
    ['name', 'fullName', 'email', 'employeeId'],
  );
}

/** Display names for removed (soft-deleted) user profiles, marked as deleted. */
export function buildRemovedUserNameMap(
  users: Array<Record<string, unknown>>,
  deletedSuffix = " (deleted)",
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of users || []) {
    const id = row.userId || row.id;
    if (!id || typeof id !== 'string') continue;
    const label = humanLabel(
      row.name,
      row.fullName,
      row.email,
      row.employeeId,
      '—',
    );
    if (label === '—') continue;
    map[id] = `${label}${deletedSuffix}`;
  }
  return map;
}
