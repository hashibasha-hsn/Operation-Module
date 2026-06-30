export type ActionPointMode = 'none' | 'manual' | 'auto';

export type QuestionAddonConfig = {
  attachFile?: boolean;
  questionReferenceFile?: string;
  markNA?: boolean;
  actionPoint?: ActionPointMode;
  actionPointAutoTriggers?: string[];
  allowComment?: boolean;
  commentRequired?: boolean;
  answerAttachment?: boolean;
  answerAttachmentRequired?: boolean;
  timestamp?: boolean;
  instructionText?: string;
  instructionAttachment?: string;
  questionTag?: string;
  [key: string]: unknown;
};

export type FormElementWithAddons = {
  id: string;
  type: string;
  label: string;
  config?: QuestionAddonConfig;
};

export const QUESTION_TYPES_WITH_OPTIONS = new Set([
  'single-answer',
  'multiple-answers',
  'dropdown',
  'scoring-dropdown',
  'adv-dropdown',
]);

export function hasPredefinedOptions(type: string) {
  return QUESTION_TYPES_WITH_OPTIONS.has(type);
}

export function getOptionLabels(config?: QuestionAddonConfig): string[] {
  const options = config?.options;
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => (typeof option === 'object' && option && 'label' in option ? String(option.label) : ''))
    .filter(Boolean);
}

export function patchElementConfig<T extends FormElementWithAddons>(
  elements: T[],
  elementId: string,
  patch: Partial<QuestionAddonConfig>,
): T[] {
  return elements.map((element) =>
    element.id === elementId
      ? { ...element, config: { ...element.config, ...patch } }
      : element,
  );
}
