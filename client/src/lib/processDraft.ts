import { getOrganizationId } from '@/lib/authStorage';
import type { ProcessProperties } from './processProperties';
import { mergeProcessProperties, propertiesFromApiProcess, propertiesToApiPayload } from './processProperties';
import { getCurrentUserDisplayName } from './processSubmission';

export type ProcessQuestionDraft = {
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
};

export type ProcessSectionDraft = {
  clientId: string;
  title: string;
  description?: string;
  displayOrder: number;
  questions: ProcessQuestionDraft[];
};

export type ProcessDraftState = {
  id?: string;
  title: string;
  description: string;
  processTags: string[];
  sections: ProcessSectionDraft[];
  properties?: ProcessProperties;
  assigneeIds?: string[];
  storeIds?: string[];
  assignBy?: 'user' | 'store' | 'profile' | 'bulk';
  assigneeProfileIds?: string[];
};

export type FormElementDraft = {
  id: string;
  type: string;
  label: string;
  config?: Record<string, unknown>;
};

const STORAGE_KEY = 'taqtics_process_draft';

export const emptyProcessDraft = (): ProcessDraftState => ({
  title: '',
  description: '',
  processTags: [],
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

export function loadProcessDraft(): ProcessDraftState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProcessDraft();
    const parsed = JSON.parse(raw) as ProcessDraftState;
    return {
      ...emptyProcessDraft(),
      ...parsed,
      sections: parsed.sections?.length ? parsed.sections : emptyProcessDraft().sections,
    };
  } catch {
    return emptyProcessDraft();
  }
}

export function saveProcessDraftLocal(draft: ProcessDraftState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearProcessDraftLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formElementsToQuestions(elements: FormElementDraft[]): ProcessQuestionDraft[] {
  return elements.map((element, index) => ({
    questionText: element.label,
    questionType: element.type,
    options: (element.config as Record<string, unknown>) ?? {},
    isRequired: Boolean(element.config?.required),
    validationRules: element.config?.rangeValidation
      ? { rangeValidation: element.config.rangeValidation }
      : element.config?.validations
        ? { validations: element.config.validations }
        : undefined,
    displayOrder: index,
  }));
}

export function questionsToFormElements(sections: ProcessSectionDraft[]): FormElementDraft[] {
  const questions = sections.flatMap((section) => section.questions ?? []);
  return questions.map((question, index) => ({
    id: `q-${index}-${Date.now()}`,
    type: question.questionType,
    label: question.questionText,
    config: (question.options as Record<string, unknown>) ?? {},
  }));
}

export function apiProcessToDraft(process: any): ProcessDraftState {
  return {
    id: process.id,
    title: process.title ?? '',
    description: process.description ?? '',
    processTags: process.processTags ?? (process.processTag ? [process.processTag] : []),
    properties: propertiesFromApiProcess(process),
    assigneeIds: process.assigneeIds ?? [],
    storeIds: process.storeIds ?? [],
    sections: (process.sections ?? []).map((section: any, index: number) => ({
      clientId: section.id ?? `section-${index + 1}`,
      title: section.title ?? `Section ${index + 1}`,
      description: section.description ?? '',
      displayOrder: section.displayOrder ?? index,
      questions: (section.questions ?? []).map((question: any, qIndex: number) => ({
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ?? {},
        isRequired: question.isRequired ?? false,
        validationRules: question.validationRules ?? undefined,
        displayOrder: question.displayOrder ?? qIndex,
      })),
    })),
  };
}

export function buildDraftPayload(
  draft: ProcessDraftState,
  organizationId = getOrganizationId(),
) {
  const properties = mergeProcessProperties(draft.properties);
  const apiProperties = propertiesToApiPayload(properties);

  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    processTags: draft.processTags,
    organizationId,
    createdBy: getCurrentUserDisplayName(),
    assigneeIds: draft.assigneeIds ?? [],
    storeIds: draft.storeIds ?? [],
    sections: draft.sections.map((section, index) => ({
      title: section.title,
      description: section.description ?? '',
      displayOrder: section.displayOrder ?? index,
      questions: section.questions,
    })),
    ...apiProperties,
  };
}
