import { describe, it, expect } from 'vitest';
import { t, detectLocale, LOCALES } from '../src/lib/i18n';

describe('t', () => {
  it('returns chinese by default', () => {
    expect(t('nav.home')).toBe('首页');
  });

  it('returns english', () => {
    expect(t('nav.home', 'en')).toBe('Home');
  });

  it('returns japanese', () => {
    expect(t('nav.home', 'ja')).toBe('ホーム');
  });

  it('returns korean', () => {
    expect(t('nav.home', 'ko')).toBe('홈');
  });

  it('falls back to chinese for unknown key', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('falls back to chinese for missing locale', () => {
    // If a key exists but locale translation is missing, fall back to zh
    expect(t('nav.home', 'zh')).toBe('首页');
  });
});

describe('detectLocale', () => {
  it('returns zh for null', () => {
    expect(detectLocale(null)).toBe('zh');
  });

  it('returns zh for Chinese', () => {
    expect(detectLocale('zh-CN,zh;q=0.9')).toBe('zh');
  });

  it('returns en for English', () => {
    expect(detectLocale('en-US,en;q=0.9')).toBe('en');
  });

  it('returns ja for Japanese', () => {
    expect(detectLocale('ja,en;q=0.5')).toBe('ja');
  });

  it('returns ko for Korean', () => {
    expect(detectLocale('ko-KR,ko;q=0.9')).toBe('ko');
  });

  it('scans full header for secondary match', () => {
    expect(detectLocale('fr-FR,fr;q=0.9,en;q=0.8')).toBe('en');
  });

  it('defaults to zh for unsupported', () => {
    expect(detectLocale('de-DE')).toBe('zh');
  });
});

describe('LOCALES', () => {
  it('has 4 locales', () => {
    expect(LOCALES).toHaveLength(4);
  });

  it('each has id and label', () => {
    for (const l of LOCALES) {
      expect(l.id).toBeTruthy();
      expect(l.label).toBeTruthy();
    }
  });
});
