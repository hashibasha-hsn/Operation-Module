export interface AuditQuestionDraftDto {
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
  isCritical?: boolean;
  maxScore?: number;
  weight?: number;
}

export interface AuditSectionDraftDto {
  title: string;
  description?: string;
  displayOrder?: number;
  maxScore?: number;
  weight?: number;
  questions?: AuditQuestionDraftDto[];
}

export interface SaveAuditDraftDto {
  id?: string;
  title: string;
  description?: string;
  processTags?: string[];
  processTag?: string;
  organizationId: string;
  createdBy?: string;
  sections?: AuditSectionDraftDto[];
  properties?: Record<string, unknown>;
  frequency?: string;
  frequencyConfig?: Record<string, unknown>;
  reminderConfig?: Record<string, unknown>;
  scoringConfig?: Record<string, unknown>;
  passThreshold?: number;
  reviewLevels?: number;
  requiresApproval?: boolean;
  assigneeIds?: string[];
  storeIds?: string[];
}
