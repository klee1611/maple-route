"use client";

import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Cloudflare Turnstile (explicit rendering). Tokens are single-use, so the parent resets after each submit.
 *  Without a site key (local development) it reports an empty token as ready. */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(
  function Turnstile({ onToken }, ref) {
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    const render = useCallback(() => {
      if (!SITE_KEY || !window.turnstile || !container.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        size: "flexible",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }, [onToken]);

    useEffect(() => {
      if (!SITE_KEY) onToken("");
    }, [onToken]);

    useEffect(() => {
      if (loaded) render();
      return () => {
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      };
    }, [loaded, render]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (!SITE_KEY) return;
        onToken(null);
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      },
    }));

    if (!SITE_KEY) return null;
    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setLoaded(true)}
        />
        <div ref={container} className="min-h-[65px]" />
      </>
    );
  },
);
