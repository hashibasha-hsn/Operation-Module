import type { ReviewConfig } from './reviewConfig';
import { defaultReviewConfig, isReviewConfigComplete, mergeReviewConfig } from './reviewConfig';

export type ReminderEntry = {
  id: string;
  hours: number;
  minutes: number;
  anchor: 'before-start' | 'after-start' | 'before-end' | 'after-end';
};

export type PeriodicityType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type MonthlyPeriodicityConfig = {
  mode: 'by-date' | 'by-interval';
  months: number[];
  days: number[];
  intervalMonths: number;
  dayOfMonth: number;
};

export type YearlyPeriodicityConfig = {
  mode: 'specific-date' | 'custom-rule';
  month: number;
  day: number;
  weekOfMonth: number;
  dayOfWeek: number;
};

export type ProcessProperties = {
  occurrence: 'one-time' | 'recurring';
  responsesAfterEndTime: 'accept' | 'reject';
  numberOfResponses: 'one-per-user' | 'multiple-per-user';
  submissionBy: 'anyone' | 'everyone';
  dateRangeSelection: 'allowed' | 'restricted';

  periodicityType: PeriodicityType;
  startTime: string;
  endTime: string;
  weeklyDays: string[];
  monthlyStart: MonthlyPeriodicityConfig;
  monthlyEnd: MonthlyPeriodicityConfig;
  yearlyStart: YearlyPeriodicityConfig;
  yearlyEnd: YearlyPeriodicityConfig;

  emailAlerts: boolean;
  mobileNotifications: boolean;
  reportUrlSharing: boolean;
  reminders: ReminderEntry[];

  reportTiming: 'on-submission' | 'after-review';
  reportRecipients: {
    submitter: boolean;
    storeManager: boolean;
    custom: boolean;
    hierarchical: boolean;
    storeHierarchical: boolean;
    customUserIds: string[];
    customDesignationIds: string[];
  };
  reportLinkInActionPointSummary: boolean;

  processWithReview: boolean;
  reviewConfig: ReviewConfig;

  geoFence: boolean;
  captureGeoTag: boolean;
  hideScoresCompliance: boolean;
  trackVisualMerchandising: boolean;
  dynamicAssignment: boolean;
  carryForwardActionPoints: boolean;
  createActionPointsFromReports: boolean;
  allowOfflineSubmission: boolean;
  reportConfidentiality: 'none' | 'admin-only' | 'submitter-and-admin';
  processPriority: '1' | '2' | '3' | '4' | '5';
  pageCount: number;

  publicFormEnabled: boolean;

  defaultLanguage: string;
  supportedLanguages: string[];
};

export const WEEK_DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const COMMON_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
];

const ALLOWED_LANGUAGE_VALUES = new Set(COMMON_LANGUAGES.map((lang) => lang.value));

const defaultMonthly = (): MonthlyPeriodicityConfig => ({
  mode: 'by-date',
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  days: [1],
  intervalMonths: 1,
  dayOfMonth: 1,
});

const defaultYearly = (): YearlyPeriodicityConfig => ({
  mode: 'specific-date',
  month: 1,
  day: 1,
  weekOfMonth: 1,
  dayOfWeek: 1,
});

export const defaultProcessProperties = (): ProcessProperties => ({
  occurrence: 'recurring',
  responsesAfterEndTime: 'accept',
  numberOfResponses: 'one-per-user',
  submissionBy: 'anyone',
  dateRangeSelection: 'allowed',

  periodicityType: 'daily',
  startTime: '09:00',
  endTime: '17:00',
  weeklyDays: ['mon', 'wed', 'fri'],
  monthlyStart: defaultMonthly(),
  monthlyEnd: defaultMonthly(),
  yearlyStart: defaultYearly(),
  yearlyEnd: defaultYearly(),

  emailAlerts: false,
  mobileNotifications: false,
  reportUrlSharing: false,
  reminders: [],

  reportTiming: 'on-submission',
  reportRecipients: {
    submitter: true,
    storeManager: false,
    custom: false,
    hierarchical: false,
    storeHierarchical: false,
    customUserIds: [],
    customDesignationIds: [],
  },
  reportLinkInActionPointSummary: false,

  processWithReview: false,
  reviewConfig: defaultReviewConfig(),

  geoFence: false,
  captureGeoTag: false,
  hideScoresCompliance: false,
  trackVisualMerchandising: false,
  dynamicAssignment: false,
  carryForwardActionPoints: false,
  createActionPointsFromReports: false,
  allowOfflineSubmission: false,
  reportConfidentiality: 'none',
  processPriority: '2',
  pageCount: 0,

  publicFormEnabled: false,

  defaultLanguage: 'english',
  supportedLanguages: ['english'],
});

function sanitizeLanguageSettings(input?: Partial<ProcessProperties>) {
  const defaults = defaultProcessProperties();
  const supportedLanguages = (input?.supportedLanguages?.length
    ? input.supportedLanguages
    : defaults.supportedLanguages
  ).filter((language) => ALLOWED_LANGUAGE_VALUES.has(language));

  const nextSupported = supportedLanguages.length ? supportedLanguages : ['english'];
  const defaultLanguage = ALLOWED_LANGUAGE_VALUES.has(input?.defaultLanguage ?? '')
    ? String(input?.defaultLanguage)
    : nextSupported.includes(defaults.defaultLanguage)
      ? defaults.defaultLanguage
      : nextSupported[0];

  return { defaultLanguage, supportedLanguages: nextSupported };
}

export function mergeProcessProperties(input?: Partial<ProcessProperties> | null): ProcessProperties {
  const defaults = defaultProcessProperties();
  if (!input) return defaults;
  const languageSettings = sanitizeLanguageSettings(input);
  return {
    ...defaults,
    ...input,
    ...languageSettings,
    monthlyStart: { ...defaults.monthlyStart, ...input.monthlyStart },
    monthlyEnd: { ...defaults.monthlyEnd, ...input.monthlyEnd },
    yearlyStart: { ...defaults.yearlyStart, ...input.yearlyStart },
    yearlyEnd: { ...defaults.yearlyEnd, ...input.yearlyEnd },
    reportRecipients: { ...defaults.reportRecipients, ...input.reportRecipients },
    reminders: input.reminders ?? defaults.reminders,
    weeklyDays: input.weeklyDays?.length ? input.weeklyDays : defaults.weeklyDays,
    reviewConfig: mergeReviewConfig(input.reviewConfig),
  };
}

export function propertiesFromApiProcess(process: any): ProcessProperties {
  if (process?.properties && typeof process.properties === 'object') {
    return mergeProcessProperties(process.properties);
  }
  return mergeProcessProperties({
    periodicityType: process?.frequency ?? undefined,
    startTime: process?.frequencyConfig?.startTime,
    endTime: process?.frequencyConfig?.endTime,
    emailAlerts: process?.reminderConfig?.emailAlerts,
    mobileNotifications: process?.reminderConfig?.mobileNotifications,
    reportUrlSharing: process?.reminderConfig?.reportUrlSharing,
    reminders: process?.reminderConfig?.reminders,
  });
}

export function propertiesToApiPayload(properties: ProcessProperties) {
  return {
    properties,
    frequency: properties.periodicityType,
    frequencyConfig: {
      startTime: properties.startTime,
      endTime: properties.endTime,
      weeklyDays: properties.weeklyDays,
      monthlyStart: properties.monthlyStart,
      monthlyEnd: properties.monthlyEnd,
      yearlyStart: properties.yearlyStart,
      yearlyEnd: properties.yearlyEnd,
    },
    reminderConfig: {
      emailAlerts: properties.emailAlerts,
      mobileNotifications: properties.mobileNotifications,
      reportUrlSharing: properties.reportUrlSharing,
      reminders: properties.reminders,
    },
    requiresApproval: properties.processWithReview,
  };
}

export function getSectionStatus(properties: ProcessProperties) {
  const periodicityComplete =
    properties.occurrence === 'one-time' ||
    (Boolean(properties.startTime) && Boolean(properties.endTime));

  return {
    process: 'completed' as const,
    periodicity: periodicityComplete ? ('completed' as const) : ('warning' as const),
    reminders: 'completed' as const,
    submissionReport: 'completed' as const,
    review: (() => {
      if (!properties.processWithReview) return 'completed' as const;
      return isReviewConfigComplete(properties.reviewConfig) ? ('completed' as const) : ('warning' as const);
    })(),
    advanceSettings: 'completed' as const,
    language: 'completed' as const,
    publicForm: 'completed' as const,
  };
}

export function createReminder(): ReminderEntry {
  return {
    id: `reminder-${Date.now()}`,
    hours: 0,
    minutes: 15,
    anchor: 'before-end',
  };
}
