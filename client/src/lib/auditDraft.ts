import { getOrganizationId } from '@/lib/authStorage';
import type { ProcessProperties } from './processProperties';
import { mergeProcessProperties, propertiesFromApiProcess, propertiesToApiPayload } from './processProperties';

export type AuditQuestionDraft = {
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
  isCritical?: boolean;
  maxScore?: number;
  weight?: number;
};

export type AuditSectionDraft = {
  clientId: string;
  title: string;
  description?: string;
  displayOrder: number;
  maxScore?: number;
  weight?: number;
  questions: AuditQuestionDraft[];
};

export type AuditDraftState = {
  id?: string;
  title: string;
  description: string;
  processTags: string[];
  sections: AuditSectionDraft[];
  properties?: ProcessProperties;
  passThreshold?: number;
  reviewLevels?: number;
  scoringConfig?: Record<string, unknown>;
  assigneeIds?: string[];
  storeIds?: string[];
  assignBy?: 'user' | 'store';
};

export type FormElementDraft = {
  id: string;
  type: string;
  label: string;
  config?: Record<string, unknown>;
};

const STORAGE_KEY = 'taqtics_audit_draft';

export const emptyAuditDraft = (): AuditDraftState => ({
  title: '',
  description: '',
  processTags: [],
  passThreshold: 70,
  reviewLevels: 1,
  sections: [
    {
      clientId: 'section-1',
      title: 'Section 1',
      description: '',
      displayOrder: 0,
      questions: [],
    },
  ],
});

export function loadAuditDraft(): AuditDraftState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAuditDraft();
    const parsed = JSON.parse(raw) as AuditDraftState;
    return {
      ...emptyAuditDraft(),
      ...parsed,
      sections: parsed.sections?.length ? parsed.sections : emptyAuditDraft().sections,
    };
  } catch {
    return emptyAuditDraft();
  }
}

export function saveAuditDraftLocal(draft: AuditDraftState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearAuditDraftLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formElementsToAuditQuestions(elements: FormElementDraft[]): AuditQuestionDraft[] {
  return elements.map((element, index) => ({
    questionText: element.label,
    questionType: element.type,
    options: (element.config as Record<string, unknown>) ?? {},
    isRequired: Boolean(element.config?.required),
    isCritical: Boolean(element.config?.isCritical),
    maxScore: typeof element.config?.maxScore === 'number' ? element.config.maxScore : undefined,
    weight: typeof element.config?.weight === 'number' ? element.config.weight : undefined,
    validationRules: element.config?.rangeValidation
      ? { rangeValidation: element.config.rangeValidation }
      : undefined,
    displayOrder: index,
  }));
}

export function auditQuestionsToFormElements(sections: AuditSectionDraft[]): FormElementDraft[] {
  const questions = sections.flatMap((section) => section.questions ?? []);
  return questions.map((question, index) => ({
    id: `q-${index}-${Date.now()}`,
    type: question.questionType,
    label: question.questionText,
    config: {
      ...((question.options as Record<string, unknown>) ?? {}),
      isCritical: question.isCritical,
      maxScore: question.maxScore,
      weight: question.weight,
    },
  }));
}

export function apiAuditToDraft(audit: any): AuditDraftState {
  return {
    id: audit.id,
    title: audit.title ?? '',
    description: audit.description ?? '',
    processTags: audit.processTags ?? (audit.processTag ? [audit.processTag] : []),
    properties: propertiesFromApiProcess(audit),
    passThreshold: audit.passThreshold ?? 70,
    reviewLevels: audit.reviewLevels ?? 1,
    scoringConfig: audit.scoringConfig ?? {},
    assigneeIds: audit.assigneeIds ?? [],
    storeIds: audit.storeIds ?? [],
    sections: (audit.sections ?? []).map((section: any, index: number) => ({
      clientId: section.id ?? `section-${index + 1}`,
      title: section.title ?? `Section ${index + 1}`,
      description: section.description ?? '',
      displayOrder: section.displayOrder ?? index,
      maxScore: section.maxScore ?? undefined,
      weight: section.weight ?? undefined,
      questions: (section.questions ?? []).map((question: any, qIndex: number) => ({
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ?? {},
        isRequired: question.isRequired ?? false,
        isCritical: question.isCritical ?? false,
        maxScore: question.maxScore ?? undefined,
        weight: question.weight ?? undefined,
        validationRules: question.validationRules ?? undefined,
        displayOrder: question.displayOrder ?? qIndex,
      })),
    })),
  };
}

export function buildAuditDraftPayload(draft: AuditDraftState, organizationId = getOrganizationId()) {
  const properties = mergeProcessProperties(draft.properties);
  const apiProperties = propertiesToApiPayload(properties);

  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    processTags: draft.processTags,
    organizationId,
    assigneeIds: draft.assigneeIds ?? [],
    storeIds: draft.storeIds ?? [],
    passThreshold: draft.passThreshold ?? 70,
    reviewLevels: draft.properties?.reviewConfig?.levels ?? draft.reviewLevels ?? 1,
    scoringConfig: draft.scoringConfig ?? {},
    requiresApproval: true,
    sections: draft.sections.map((section, index) => ({
      title: section.title,
      description: section.description ?? '',
      displayOrder: section.displayOrder ?? index,
      maxScore: section.maxScore,
      weight: section.weight,
      questions: section.questions,
    })),
    ...apiProperties,
  };
}
