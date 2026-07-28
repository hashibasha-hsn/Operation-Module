export type PriorityLevelConfig = {
  key: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  label: string;
  enabled: boolean;
  defaultDueDays: number;
  color: string;
};

export const DEFAULT_PRIORITY_LEVELS: PriorityLevelConfig[] = [
  { key: 'highest', label: 'Highest', enabled: true, defaultDueDays: 1, color: '#dc2626' },
  { key: 'high', label: 'High', enabled: true, defaultDueDays: 2, color: '#ea580c' },
  { key: 'medium', label: 'Medium', enabled: true, defaultDueDays: 3, color: '#ca8a04' },
  { key: 'low', label: 'Low', enabled: true, defaultDueDays: 5, color: '#2563eb' },
  { key: 'lowest', label: 'Lowest', enabled: true, defaultDueDays: 7, color: '#6b7280' },
];

export function normalizePriorityLevels(
  levels?: Partial<PriorityLevelConfig>[] | null,
): PriorityLevelConfig[] {
  const byKey = new Map(
    (levels || [])
      .filter((level) => level?.key)
      .map((level) => [level.key as string, level]),
  );

  return DEFAULT_PRIORITY_LEVELS.map((defaults) => {
    const override = byKey.get(defaults.key) || {};
    return {
      key: defaults.key,
      label: String(override.label || defaults.label),
      enabled: override.enabled ?? defaults.enabled,
      defaultDueDays:
        typeof override.defaultDueDays === 'number'
          ? override.defaultDueDays
          : defaults.defaultDueDays,
      color: String(override.color || defaults.color),
    };
  });
}
