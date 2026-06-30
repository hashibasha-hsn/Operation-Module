export type ReviewConfig = {
  levels: number;
  assignees: Record<string, string>;
};

export const defaultReviewConfig = (): ReviewConfig => ({
  levels: 1,
  assignees: {},
});

export function mergeReviewConfig(input?: Partial<ReviewConfig> | null): ReviewConfig {
  const base = defaultReviewConfig();
  if (!input) return base;
  return {
    levels: Math.max(1, input.levels ?? base.levels),
    assignees: { ...base.assignees, ...(input.assignees ?? {}) },
  };
}

export function hasDuplicateReviewers(config: ReviewConfig): boolean {
  const ids = Object.keys(config.assignees)
    .filter((k) => Number(k) <= config.levels)
    .map((k) => config.assignees[k])
    .filter(Boolean);
  return new Set(ids).size !== ids.length;
}

export function isReviewConfigComplete(config: ReviewConfig): boolean {
  if (config.levels < 1) return false;
  for (let i = 1; i <= config.levels; i++) {
    if (!config.assignees[String(i)]) return false;
  }
  return !hasDuplicateReviewers(config);
}

export function setReviewLevelCount(config: ReviewConfig, levels: number): ReviewConfig {
  const next = Math.max(1, Math.min(100, levels));
  const assignees = { ...config.assignees };
  Object.keys(assignees).forEach((key) => {
    if (Number(key) > next) delete assignees[key];
  });
  return { levels: next, assignees };
}

export function setReviewAssignee(
  config: ReviewConfig,
  level: number,
  userId: string,
): ReviewConfig {
  return {
    ...config,
    assignees: { ...config.assignees, [String(level)]: userId },
  };
}

export function reviewerLabel(level: number): string {
  return `Level ${level} reviewer`;
}

export function reviewLevelSummary(config?: Partial<ReviewConfig> | null): string {
  const merged = mergeReviewConfig(config);
  if (!isReviewConfigComplete(merged)) return "Review not configured";
  const levels = Array.from({ length: merged.levels }, (_, i) => `L${i + 1}`).join(" → ");
  return `${levels} (${merged.levels} level${merged.levels === 1 ? "" : "s"})`;
}
