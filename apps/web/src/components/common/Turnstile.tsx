import * as React from 'react';
import { env } from '@/lib/env';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  return new Promise((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement('script'), { src: SCRIPT_SRC, async: true, defer: true });
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('turnstile')));
    if (!existing) document.head.appendChild(script);
  });
}

export interface TurnstileHandle {
  reset: () => void;
}

/**
 * Cloudflare Turnstile (captcha sem rastreamento publicitário).
 * Sem VITE_TURNSTILE_SITE_KEY (desenvolvimento), não renderiza nada.
 */
export const Turnstile = React.forwardRef<TurnstileHandle, { onToken: (token: string) => void; language?: string }>(
  function Turnstile({ onToken, language }, ref) {
    const container = React.useRef<HTMLDivElement>(null);
    const widgetId = React.useRef<string | undefined>(undefined);
    const onTokenRef = React.useRef(onToken);
    onTokenRef.current = onToken;

    React.useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenRef.current('');
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
      },
    }));

    React.useEffect(() => {
      if (!env.turnstileSiteKey || !container.current) return;
      let cancelled = false;
      loadScript()
        .then(() => {
          if (cancelled || !container.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(container.current, {
            sitekey: env.turnstileSiteKey,
            language: language ?? 'pt-br',
            callback: (token: string) => onTokenRef.current(token),
            'expired-callback': () => onTokenRef.current(''),
            'error-callback': () => onTokenRef.current(''),
          });
        })
        .catch(() => onTokenRef.current(''));
      return () => {
        cancelled = true;
        if (widgetId.current) window.turnstile?.remove(widgetId.current);
      };
    }, [language]);

    if (!env.turnstileSiteKey) return null;
    return <div ref={container} className="min-h-[65px]" />;
  },
);

export const captchaEnabled = () => Boolean(env.turnstileSiteKey);
