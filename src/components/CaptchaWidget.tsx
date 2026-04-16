import { useCallback, useEffect, useRef, useState } from 'react';

type Provider = 'none' | 'turnstile' | 'tencent' | 'hcaptcha' | 'recaptcha';

interface CaptchaConfig {
  provider: Provider;
  siteKey: string;
  scriptUrl: string;
  tencentAppId?: string;
}

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: any;
    hcaptcha?: any;
    grecaptcha?: any;
    TencentCaptcha?: any;
  }
}

export default function CaptchaWidget({ onVerify, onExpire }: Props) {
  const [config, setConfig] = useState<CaptchaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/captcha-config')
      .then((r) => r.json())
      .then((cfg: CaptchaConfig) => {
        setConfig(cfg);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-16 animate-pulse rounded-lg bg-cream-dark" />;
  if (!config || config.provider === 'none' || !config.siteKey) return null;

  switch (config.provider) {
    case 'turnstile':
      return <TurnstileWidget config={config} onVerify={onVerify} onExpire={onExpire} />;
    case 'hcaptcha':
      return <HcaptchaWidget config={config} onVerify={onVerify} onExpire={onExpire} />;
    case 'recaptcha':
      return <RecaptchaWidget config={config} onVerify={onVerify} />;
    case 'tencent':
      return <TencentWidget config={config} onVerify={onVerify} />;
    default:
      return null;
  }
}

// --- Script loader ---

function useScript(src: string): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!src) return;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (scriptReady(src)) { setReady(true); clearInterval(check); }
      }, 100);
      return () => clearInterval(check);
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => {
      const check = setInterval(() => {
        if (scriptReady(src)) { setReady(true); clearInterval(check); }
      }, 100);
    };
    document.head.appendChild(el);
  }, [src]);
  return ready;
}

function scriptReady(src: string): boolean {
  if (src.includes('turnstile')) return !!window.turnstile;
  if (src.includes('hcaptcha')) return !!window.hcaptcha;
  if (src.includes('recaptcha')) return !!window.grecaptcha?.execute;
  if (src.includes('TCaptcha')) return !!window.TencentCaptcha;
  return true;
}

// --- Turnstile ---

function TurnstileWidget({ config, onVerify, onExpire }: { config: CaptchaConfig; onVerify: (t: string) => void; onExpire?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const wid = useRef<string | null>(null);
  const ready = useScript(config.scriptUrl);

  useEffect(() => {
    if (!ready || !ref.current || !window.turnstile) return;
    wid.current = window.turnstile.render(ref.current, {
      sitekey: config.siteKey,
      callback: onVerify,
      'expired-callback': onExpire,
      theme: 'light',
    });
    return () => { if (wid.current) window.turnstile?.remove(wid.current); };
  }, [ready, config.siteKey]);

  return <div ref={ref} className="flex justify-center" />;
}

// --- hCaptcha ---

function HcaptchaWidget({ config, onVerify, onExpire }: { config: CaptchaConfig; onVerify: (t: string) => void; onExpire?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const wid = useRef<string | null>(null);
  const ready = useScript(config.scriptUrl);

  useEffect(() => {
    if (!ready || !ref.current || !window.hcaptcha) return;
    wid.current = window.hcaptcha.render(ref.current, {
      sitekey: config.siteKey,
      callback: onVerify,
      'expired-callback': onExpire,
      theme: 'light',
    });
    return () => { if (wid.current) window.hcaptcha?.remove(wid.current); };
  }, [ready, config.siteKey]);

  return <div ref={ref} className="flex justify-center" />;
}

// --- reCAPTCHA v3 (invisible — auto-executes) ---

function RecaptchaWidget({ config, onVerify }: { config: CaptchaConfig; onVerify: (t: string) => void }) {
  const ready = useScript(config.scriptUrl);
  const executed = useRef(false);

  useEffect(() => {
    if (!ready || executed.current || !window.grecaptcha) return;
    executed.current = true;
    window.grecaptcha.execute(config.siteKey, { action: 'detect' }).then(onVerify);
  }, [ready, config.siteKey]);

  return (
    <p className="text-center text-[11px] text-ink-tertiary">
      Protected by reCAPTCHA · <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener">Privacy</a>
    </p>
  );
}

// --- Tencent (popup — click to trigger) ---

function TencentWidget({ config, onVerify }: { config: CaptchaConfig; onVerify: (t: string) => void }) {
  const ready = useScript(config.scriptUrl);

  const handleClick = useCallback(() => {
    if (!window.TencentCaptcha) return;
    const captcha = new window.TencentCaptcha(
      config.tencentAppId ?? config.siteKey,
      (res: { ret: number; ticket: string; randstr: string }) => {
        if (res.ret === 0) {
          onVerify(`${res.ticket}:${res.randstr}`);
        }
      },
    );
    captcha.show();
  }, [ready, config.siteKey, config.tencentAppId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready}
      className="w-full rounded-lg border border-sand bg-cream-dark px-4 py-2.5 text-sm text-ink-secondary transition hover:border-sand-dark hover:text-ink disabled:opacity-50"
    >
      {ready ? '点击进行人机验证' : '加载验证码中...'}
    </button>
  );
}
