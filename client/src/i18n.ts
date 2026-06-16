import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback translations for immediate use
const fallbackTranslations = {
  en: {
    activityOverview: "Activity Overview",
    viewActivityOverview: "View Activity Overview",
    summaryAnalytics: "Summary Analytics",
    viewSummaryAnalytics: "View Summary Analytics",
    customReports: "Custom Reports",
    viewCustomReports: "View Custom Reports",
    processAndWorkflow: "Process and Workflow",
    actionPoint: "Action Point",
    learning: "Learning",
    ticket: "Ticket",
    moreInfoAbout: "More info about",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    assigned: "Assigned",
    tasksInQueue: "Tasks in Queue",
    seeAll: "See All",
    viewAllTasksInQueue: "View All Tasks in Queue",
    previousDates: "Previous Dates",
    nextDates: "Next Dates",
    viewTaskDetails: "View Task Details",
    noticeBoard: "Notice Board",
    viewAllNotices: "View All Notices",
    alertsAndActivity: "Alerts and Activity",
    noData: "No data",
    summaryAnalyticsContentComingSoon: "Summary Analytics Content Coming Soon",
    customReportsContentComingSoon: "Custom Reports Content Coming Soon",
  },
  ar: {
    activityOverview: "نظرة عامة على النشاط",
    viewActivityOverview: "عرض نظرة عامة على النشاط",
    summaryAnalytics: "التحليلات الملخصة",
    viewSummaryAnalytics: "عرض التحليلات الملخصة",
    customReports: "التقارير المخصصة",
    viewCustomReports: "عرض التقارير المخصصة",
    processAndWorkflow: "العمليات وسير العمل",
    actionPoint: "نقطة العمل",
    learning: "التعلم",
    ticket: "تذكرة",
    moreInfoAbout: "مزيد من المعلومات حول",
    pending: "قيد الانتظار",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
    assigned: "مسند",
    tasksInQueue: "المهام في قائمة الانتظار",
    seeAll: "عرض الكل",
    viewAllTasksInQueue: "عرض جميع المهام في قائمة الانتظار",
    previousDates: "التواريخ السابقة",
    nextDates: "التواريخ التالية",
    viewTaskDetails: "عرض تفاصيل المهمة",
    noticeBoard: "لوحة الإعلانات",
    viewAllNotices: "عرض جميع الإشعارات",
    alertsAndActivity: "التنبيهات والنشاط",
    noData: "لا توجد بيانات",
    summaryAnalyticsContentComingSoon: "محتوى التحليلات الملخصة قادم قريباً",
    customReportsContentComingSoon: "محتوى التقارير المخصصة قادم قريباً",
  },
};

// Custom backend to fetch translations from API
const CustomBackend = {
  type: 'backend' as const,
  read: async (language: string, namespace: string, callback: any) => {
    try {
      console.log(`Loading translations for language: ${language}`);
      
      // Skip cache for now to force API fetch
      console.log(`Fetching translations from API for ${language}`);
      const response = await fetch(`http://localhost:3009/api/translations/${language}`);
      if (!response.ok) {
        console.log(`API request failed with status: ${response.status}, using fallback`);
        throw new Error(`Failed to fetch translations: ${response.status}`);
      }
      
      const translations = await response.json();
      console.log(`Received ${Object.keys(translations).length} translations for ${language}`);
      
      // Cache in localStorage
      const cacheKey = `translations_${language}`;
      localStorage.setItem(cacheKey, JSON.stringify(translations));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      callback(null, translations);
    } catch (error) {
      console.error('Error loading translations:', error);
      // Use fallback translations on error
      console.log(`Using fallback translations for ${language}`);
      callback(null, fallbackTranslations[language as keyof typeof fallbackTranslations] || fallbackTranslations.en);
    }
  },
};

i18n
  .use(CustomBackend as any)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    debug: true,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
