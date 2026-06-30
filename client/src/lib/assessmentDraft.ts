export type AssessmentQuestionDraft = {
  id?: string;
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  displayOrder?: number;
  instructionText?: string;
  attachmentUrl?: string;
};

export type AssessmentSectionDraft = {
  clientId: string;
  title: string;
  description?: string;
  displayOrder: number;
  questions: AssessmentQuestionDraft[];
};

export type AssessmentCertificateSettings = {
  primaryColor?: string;
  certificateHeader?: { enabled: boolean; text: string };
  assessmentName?: { enabled: boolean; text: string };
  trainerName?: { enabled: boolean; text: string };
  issuedDate?: { enabled: boolean };
  customFields?: Array<{ label: string; value: string }>;
  validityType?: 'duration' | 'fixed' | 'none';
  validityDuration?: string;
  fixedExpiryDate?: string;
  userTags?: string[];
};

export type AssessmentDraftState = {
  id?: string;
  title: string;
  description: string;
  sections: AssessmentSectionDraft[];
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
  certificateSettings?: AssessmentCertificateSettings;
  assigneeIds?: string[];
  storeIds?: string[];
  assignBy?: 'store' | 'designation' | 'profile';
  assigneeProfileIds?: string[];
  designationNames?: string[];
};

export type FormElementDraft = {
  id: string;
  type: string;
  label: string;
  config?: Record<string, unknown>;
};

const STORAGE_KEY = 'taqtics_assessment_draft';

export const emptyAssessmentDraft = (): AssessmentDraftState => ({
  title: '',
  description: '',
  passingScore: 30,
  duration: 60,
  maxAttempts: 1,
  allowRetake: false,
  visible: true,
  showResult: true,
  showCorrectAnswer: false,
  dynamicAssignment: false,
  generateCertificate: false,
  certificateSettings: {
    primaryColor: '#0284c7',
    certificateHeader: { enabled: true, text: 'Certificate of Achievement' },
    assessmentName: { enabled: true, text: '' },
    trainerName: { enabled: false, text: '' },
    issuedDate: { enabled: true },
    customFields: [],
    validityType: 'duration',
    validityDuration: '1 year',
    userTags: [],
  },
  sections: [
    {
      clientId: 'section-1',
      title: 'Section 1',
      description: '',
      displayOrder: 0,
      questions: [],
    },
  ],
  assigneeIds: [],
  storeIds: [],
  assignBy: 'store',
  assigneeProfileIds: [],
  designationNames: [],
});

export function loadAssessmentDraft(): AssessmentDraftState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAssessmentDraft();
    const parsed = JSON.parse(raw) as AssessmentDraftState;
    return {
      ...emptyAssessmentDraft(),
      ...parsed,
      sections: parsed.sections?.length ? parsed.sections : emptyAssessmentDraft().sections,
      certificateSettings: {
        ...emptyAssessmentDraft().certificateSettings,
        ...(parsed.certificateSettings ?? {}),
      },
    };
  } catch {
    return emptyAssessmentDraft();
  }
}

export function saveAssessmentDraftLocal(draft: AssessmentDraftState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearAssessmentDraftLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formElementsToAssessmentQuestions(elements: FormElementDraft[]): AssessmentQuestionDraft[] {
  return elements.map((element, index) => ({
    id: element.id,
    questionText: element.label,
    questionType: element.type,
    options: (element.config as Record<string, unknown>) ?? {},
    isRequired: Boolean(element.config?.required),
    instructionText:
      typeof element.config?.instructionText === 'string' ? element.config.instructionText : undefined,
    attachmentUrl:
      typeof element.config?.instructionAttachment === 'string'
        ? element.config.instructionAttachment
        : undefined,
    displayOrder: index,
  }));
}

export function assessmentQuestionsToFormElements(sections: AssessmentSectionDraft[]): FormElementDraft[] {
  const questions = sections.flatMap((section) => section.questions ?? []);
  return questions.map((question, index) => ({
    id: question.id || `q-${index}-${Date.now()}`,
    type: question.questionType,
    label: question.questionText,
    config: {
      ...((question.options as Record<string, unknown>) ?? {}),
      required: question.isRequired,
      instructionText: question.instructionText,
      instructionAttachment: question.attachmentUrl,
    },
  }));
}

export function apiAssessmentToDraft(data: any): AssessmentDraftState {
  const sectionsRaw = Array.isArray(data?.questions) ? data.questions : [];
  const sections: AssessmentSectionDraft[] = sectionsRaw.length
    ? sectionsRaw.map((section: any, index: number) => ({
        clientId: section.clientId || `section-${index + 1}`,
        title: section.title || `Section ${index + 1}`,
        description: section.description || '',
        displayOrder: section.displayOrder ?? index,
        questions: Array.isArray(section.questions) ? section.questions : [],
      }))
    : emptyAssessmentDraft().sections;

  return {
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    sections,
    passingScore: data.passingScore ?? 30,
    duration: data.duration ?? 60,
    maxAttempts: data.maxAttempts ?? 1,
    allowRetake: data.allowRetake ?? false,
    startDate: data.startDate ? String(data.startDate).slice(0, 16) : '',
    expiresAt: data.expiresAt ? String(data.expiresAt).slice(0, 16) : '',
    visible: data.visible ?? true,
    showResult: data.showResult ?? true,
    showCorrectAnswer: data.showCorrectAnswer ?? false,
    dynamicAssignment: data.dynamicAssignment ?? false,
    generateCertificate: data.generateCertificate ?? false,
    certificateSettings: data.certificateSettings ?? emptyAssessmentDraft().certificateSettings,
    assigneeIds: data.assigneeIds ?? [],
    storeIds: data.storeIds ?? [],
    assigneeProfileIds: data.assigneeProfiles?.profileIds ?? [],
    designationNames: data.assigneeProfiles?.designationNames ?? [],
    assignBy: data.assigneeProfiles?.assignBy ?? 'store',
  };
}

export function buildAssessmentDraftPayload(draft: AssessmentDraftState) {
  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    organizationId: 'default-org',
    sections: draft.sections.map((section, index) => ({
      title: section.title,
      description: section.description,
      displayOrder: section.displayOrder ?? index,
      questions: section.questions ?? [],
    })),
    passingScore: draft.passingScore ?? 30,
    duration: draft.duration ?? 60,
    maxAttempts: draft.maxAttempts ?? 1,
    allowRetake: draft.allowRetake ?? false,
    startDate: draft.startDate || undefined,
    expiresAt: draft.expiresAt || undefined,
    visible: draft.visible ?? true,
    showResult: draft.showResult ?? true,
    showCorrectAnswer: draft.showCorrectAnswer ?? false,
    dynamicAssignment: draft.dynamicAssignment ?? false,
    generateCertificate: draft.generateCertificate ?? false,
    certificateSettings: draft.certificateSettings,
    assigneeIds: draft.assigneeIds ?? [],
    storeIds: draft.storeIds ?? [],
    assigneeProfiles: {
      assignBy: draft.assignBy ?? 'store',
      profileIds: draft.assigneeProfileIds ?? [],
      designationNames: draft.designationNames ?? [],
    },
  };
}
