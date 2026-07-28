export const ENTITY_INFO_TABLE_COLUMNS = [
  { key: 'storeName', label: 'Store name', labelKey: 'storeName' },
  { key: 'entityId', label: 'Entity ID', labelKey: 'entityId' },
  { key: 'region', label: 'Region', labelKey: 'region' },
  { key: 'city', label: 'City', labelKey: 'city' },
  { key: 'area', label: 'District', labelKey: 'area' },
  { key: 'staff', label: 'Staff count', labelKey: 'staff' },
  { key: 'storeStatus', label: 'Store status', labelKey: 'storeStatus' },
  { key: 'status', label: 'Active status', labelKey: 'status' },
] as const;

export type EntityInfoTableColumnKey = (typeof ENTITY_INFO_TABLE_COLUMNS)[number]['key'];

export const DEFAULT_ENTITY_TABLE_COLUMNS: EntityInfoTableColumnKey[] = [
  'storeName',
  'entityId',
  'region',
  'city',
  'area',
  'staff',
];

export const MAX_ENTITY_TABLE_COLUMNS = 8;

export function formatEntityColumnValue(entity: Record<string, unknown>, column: EntityInfoTableColumnKey) {
  switch (column) {
    case 'status':
      return entity.status ? 'Active' : 'Inactive';
    case 'staff':
      return entity.staff != null ? String(entity.staff) : '-';
    default:
      return entity[column] != null && entity[column] !== '' ? String(entity[column]) : '-';
  }
}

export function getEntityColumnLabel(
  column: (typeof ENTITY_INFO_TABLE_COLUMNS)[number],
  translate?: (key: string) => string,
) {
  if (translate) {
    const translated = translate(column.labelKey);
    if (translated && translated !== column.labelKey) {
      return translated;
    }
  }
  return column.label;
}
