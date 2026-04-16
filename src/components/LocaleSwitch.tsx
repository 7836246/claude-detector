import { useEffect, useState } from 'react';
import { SelectCompact } from './Select';
import { LOCALES, type Locale } from '../lib/i18n';

const OPTIONS = LOCALES.map((l) => ({ value: l.id, label: l.label }));

export default function LocaleSwitch() {
  const [locale, setLocale] = useState<Locale>('zh');

  useEffect(() => {
    setLocale((localStorage.getItem('locale') as Locale) ?? 'zh');
    const handler = () => setLocale((localStorage.getItem('locale') as Locale) ?? 'zh');
    window.addEventListener('locale-change', handler);
    return () => window.removeEventListener('locale-change', handler);
  }, []);

  function onChange(val: string) {
    setLocale(val as Locale);
    localStorage.setItem('locale', val);
    window.dispatchEvent(new Event('locale-change'));
  }

  return <SelectCompact options={OPTIONS} value={locale} onChange={onChange} />;
}
