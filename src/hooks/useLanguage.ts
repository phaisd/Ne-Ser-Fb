'use client';

import { useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

export function useLanguage() {
  const [lang, setLangState] = useState<Language>('th');

  useEffect(() => {
    const updateLang = () => {
      try {
        const cookies = document.cookie.split(';');
        const gtCookie = cookies.find((c) => c.trim().startsWith('googtrans='));
        if (gtCookie) {
          const rawVal = decodeURIComponent(gtCookie.split('=')[1]?.trim() || '');
          const segments = rawVal.split('/').filter(Boolean);
          const code = segments.length > 0 ? segments[segments.length - 1] : 'th';
          if (code === 'en' || code === 'th') {
            setLangState(code);
            return;
          }
        }
        const saved = (localStorage.getItem('mcu_lang') as Language) || 'th';
        setLangState(saved === 'en' ? 'en' : 'th');
      } catch (e) {
        setLangState('th');
      }
    };

    updateLang();

    const handleLangChanged = (e: any) => {
      if (e?.detail) {
        setLangState(e.detail === 'en' ? 'en' : 'th');
      } else {
        updateLang();
      }
    };

    window.addEventListener('mcu_lang_changed', handleLangChanged);
    window.addEventListener('storage', updateLang);

    return () => {
      window.removeEventListener('mcu_lang_changed', handleLangChanged);
      window.removeEventListener('storage', updateLang);
    };
  }, []);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('mcu_lang', newLang);
      window.dispatchEvent(new CustomEvent('mcu_lang_changed', { detail: newLang }));
    } catch (e) {}
  };

  return {
    lang,
    setLanguage,
    t: translations[lang] || translations.th,
    isEn: lang === 'en',
    isThai: lang === 'th',
  };
}
