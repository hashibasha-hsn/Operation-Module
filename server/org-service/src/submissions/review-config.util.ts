import { Process } from '../processes/process.entity';
import { Audit } from '../audits/audit.entity';

export type ReviewConfig = {
  enabled: boolean;
  levels: number;
  assignees: Record<string, string>;
};

export function getReviewConfigFromProcess(process: Process | null | undefined): ReviewConfig {
  if (!process) return { enabled: false, levels: 0, assignees: {} };
  const props = (process.properties ?? {}) as Record<string, unknown>;
  const rc = (props.reviewConfig ?? {}) as Record<string, unknown>;
  const processWithReview = Boolean(props.processWithReview || process.requiresApproval);
  const levels = Number(rc.levels ?? (processWithReview ? 1 : 0));
  return {
    enabled: processWithReview && levels > 0,
    levels,
    assignees: (rc.assignees as Record<string, string>) ?? {},
  };
}

export function getReviewConfigFromAudit(audit: Audit | null | undefined): ReviewConfig {
  if (!audit) return { enabled: false, levels: 0, assignees: {} };
  const props = (audit.properties ?? {}) as Record<string, unknown>;
  const rc = (props.reviewConfig ?? {}) as Record<string, unknown>;
  const processWithReview = Boolean(props.processWithReview || audit.requiresApproval);
  const levels = Number(rc.levels ?? audit.reviewLevels ?? (processWithReview ? 1 : 0));
  return {
    enabled: processWithReview && levels > 0,
    levels,
    assignees: (rc.assignees as Record<string, string>) ?? {},
  };
}

export function getReviewerForLevel(config: ReviewConfig, level: number): string | null {
  if (level < 1) return null;
  return config.assignees[String(level)] ?? null;
}
