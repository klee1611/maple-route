"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useSyncExternalStore } from "react";

/**
 * Google Analytics, loaded only after the visitor allows it.
 * The choice lives in this browser only. Questions are never sent to Google:
 * they go in a POST body, not the URL, and no custom events are recorded.
 */

const GA_ID = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "") ? process.env.NEXT_PUBLIC_GA_ID! : null;
const KEY = "maple-route:analytics";
const CHANGED = "maple-route:analytics-changed";

export type Choice = "granted" | "denied" | null;

function read(): Choice {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null; // storage blocked: ask again, never assume consent
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useAnalyticsChoice(): Choice | "unknown" {
  // "unknown" during server rendering, so nothing analytics-related is in the HTML.
  return useSyncExternalStore(subscribe, read, () => "unknown");
}

export function saveAnalyticsChoice(choice: Choice) {
  try {
    if (choice) localStorage.setItem(KEY, choice);
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  if (choice === "granted" && GA_ID) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false;
  } else if (GA_ID) {
    // Withdrawn: stop sending and remove Google's cookies.
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim();
      if (name.startsWith("_ga")) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    }
  }
  window.dispatchEvent(new Event(CHANGED));
}

export const analyticsEnabled = GA_ID !== null;

export function Analytics() {
  const choice = useAnalyticsChoice();
  if (!GA_ID || choice === "unknown" || choice === "denied") return null;

  if (choice === "granted") return <GoogleAnalytics gaId={GA_ID} />;

  return (
    <section
      aria-label="Analytics choice"
      className="sticky bottom-0 z-10 border-t border-rule bg-field px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          Can we use Google Analytics to count visits? It sets cookies. Your questions are never sent to Google.{" "}
          <a href="/privacy" className="underline">
            Privacy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => saveAnalyticsChoice("granted")}
            className="rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-paper hover:opacity-90"
          >
            Allow analytics
          </button>
          <button
            type="button"
            onClick={() => saveAnalyticsChoice("denied")}
            className="rounded-sm border border-rule px-4 py-2 text-sm text-ink hover:border-ink"
          >
            No thanks
          </button>
        </div>
      </div>
    </section>
  );
}

/** Lets a visitor change their answer later (used on /privacy). */
export function AnalyticsSettings() {
  const choice = useAnalyticsChoice();
  if (!analyticsEnabled || choice === "unknown") return null;
  const label = choice === "granted" ? "allowed" : choice === "denied" ? "declined" : "not chosen yet";
  return (
    <p>
      Your current choice: <strong>{label}</strong>.{" "}
      {choice === "granted" ? (
        <button type="button" onClick={() => saveAnalyticsChoice("denied")} className="underline">
          Turn analytics off
        </button>
      ) : (
        <button type="button" onClick={() => saveAnalyticsChoice("granted")} className="underline">
          Allow analytics
        </button>
      )}
    </p>
  );
}
