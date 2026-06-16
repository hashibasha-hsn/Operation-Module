import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import '../i18n';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(i18n.language as Language || 'en');

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // Update document language when language changes
    document.documentElement.lang = language;
  }, [language]);

  // Sync local state with i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng as Language);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleSetLanguage = (lang: Language) => {
    console.log('Changing language to:', lang);
    setLanguage(lang);
    i18n.changeLanguage(lang).then(() => {
      console.log('Language changed to:', i18n.language);
      console.log('Current translations:', i18n.store.data[i18n.language]);
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
