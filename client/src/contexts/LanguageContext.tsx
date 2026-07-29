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

function applyDocumentLanguage(lang: Language) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.body.dir = dir;
  return dir;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const initialLanguage = (localStorage.getItem('i18nextLng') as Language) || 'en';
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    i18n.reloadResources();
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const next = (lng === 'ar' ? 'ar' : 'en') as Language;
      setLanguage(next);
      applyDocumentLanguage(next);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    applyDocumentLanguage(lang);
    localStorage.removeItem(`translations_${lang}`);
    localStorage.removeItem(`translations_${lang}_timestamp`);
    await i18n.changeLanguage(lang);
    await i18n.reloadResources(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      <div dir={dir} className="min-h-full">
        {children}
      </div>
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
