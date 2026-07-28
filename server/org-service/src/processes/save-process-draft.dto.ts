export interface ProcessQuestionDraftDto {
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
}

export interface ProcessSectionDraftDto {
  title: string;
  description?: string;
  displayOrder?: number;
  questions?: ProcessQuestionDraftDto[];
}

export interface SaveProcessDraftDto {
  id?: string;
  title: string;
  description?: string;
  processTags?: string[];
  organizationId: string;
  createdBy?: string;
  sections?: ProcessSectionDraftDto[];
  properties?: Record<string, unknown>;
  frequency?: string;
  frequencyConfig?: Record<string, unknown>;
  reminderConfig?: Record<string, unknown>;
  requiresApproval?: boolean;
  assigneeIds?: string[];
  storeIds?: string[];
}
