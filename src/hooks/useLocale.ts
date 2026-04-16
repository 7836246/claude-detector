import { useEffect, useState } from 'react';
import { t as translate, type Locale } from '../lib/i18n';

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>('zh');

  useEffect(() => {
    setLocale((localStorage.getItem('locale') as Locale) ?? 'zh');
    const handler = () =>
      setLocale((localStorage.getItem('locale') as Locale) ?? 'zh');
    window.addEventListener('locale-change', handler);
    return () => window.removeEventListener('locale-change', handler);
  }, []);

  return locale;
}

export function useT(): (key: string) => string {
  const locale = useLocale();
  return (key: string) => translate(key, locale);
}
