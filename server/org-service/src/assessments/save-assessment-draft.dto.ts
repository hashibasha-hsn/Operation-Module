export interface AssessmentQuestionDraftDto {
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
  instructionText?: string;
  attachmentUrl?: string;
}

export interface AssessmentSectionDraftDto {
  title: string;
  description?: string;
  displayOrder?: number;
  subsections?: AssessmentSectionDraftDto[];
  questions?: AssessmentQuestionDraftDto[];
}

export interface SaveAssessmentDraftDto {
  id?: string;
  title: string;
  description?: string;
  organizationId: string;
  sections?: AssessmentSectionDraftDto[];
  passingScore?: number;
  duration?: number;
  maxAttempts?: number;
  allowRetake?: boolean;
  startDate?: string;
  expiresAt?: string;
  visible?: boolean;
  showResult?: boolean;
  showCorrectAnswer?: boolean;
  dynamicAssignment?: boolean;
  generateCertificate?: boolean;
  properties?: Record<string, unknown>;
  certificateSettings?: Record<string, unknown>;
  assigneeIds?: string[];
  storeIds?: string[];
  assigneeProfiles?: Record<string, unknown>;
}
