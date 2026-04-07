import { useEffect } from "react";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readCookieConsent,
  type CookieConsent,
} from "@/lib/privacy";

const ANALYTICS_SCRIPT_ID = "privacy-consent-analytics-placeholder";
const MARKETING_SCRIPT_ID = "privacy-consent-marketing-placeholder";

function setAnalyticsDisabledRuntimeState(): void {
  const runtime = window as unknown as Record<string, unknown>;
  runtime.__PB_ANALYTICS_ENABLED__ = false;
  runtime.pbAnalytics = {
    track: () => undefined,
    page: () => undefined,
  };
  delete runtime.__PB_ANALYTICS_QUEUE__;
}

function setMarketingDisabledRuntimeState(): void {
  const runtime = window as unknown as Record<string, unknown>;
  runtime.__PB_MARKETING_ENABLED__ = false;
  runtime.pbMarketing = {
    track: () => undefined,
  };
  delete runtime.__PB_MARKETING_QUEUE__;
}

function mountInlineScript(id: string, code: string): void {
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.type = "text/javascript";
  script.dataset.consentManaged = "true";
  script.text = code;
  document.head.appendChild(script);
}

function unmountInlineScript(id: string): void {
  const node = document.getElementById(id);
  if (node) node.remove();
}

function applyConsentScripts(consent: CookieConsent | null): void {
  if (!consent?.analytics) {
    unmountInlineScript(ANALYTICS_SCRIPT_ID);
    setAnalyticsDisabledRuntimeState();
  } else {
    mountInlineScript(
      ANALYTICS_SCRIPT_ID,
      `
      // Consent-managed analytics placeholder.
      // Replace this block with your analytics SDK bootstrap when needed.
      window.__PB_ANALYTICS_ENABLED__ = true;
      window.pbAnalytics = {
        track: function () {
          window.__PB_ANALYTICS_QUEUE__ = window.__PB_ANALYTICS_QUEUE__ || [];
          window.__PB_ANALYTICS_QUEUE__.push(Array.from(arguments));
        },
        page: function () {
          window.__PB_ANALYTICS_QUEUE__ = window.__PB_ANALYTICS_QUEUE__ || [];
          window.__PB_ANALYTICS_QUEUE__.push(["page"].concat(Array.from(arguments)));
        }
      };
      `
    );
  }

  if (!consent?.marketing) {
    unmountInlineScript(MARKETING_SCRIPT_ID);
    setMarketingDisabledRuntimeState();
  } else {
    mountInlineScript(
      MARKETING_SCRIPT_ID,
      `
      // Consent-managed marketing placeholder.
      // Replace this block with pixel/ad SDK bootstrap when needed.
      window.__PB_MARKETING_ENABLED__ = true;
      window.pbMarketing = {
        track: function () {
          window.__PB_MARKETING_QUEUE__ = window.__PB_MARKETING_QUEUE__ || [];
          window.__PB_MARKETING_QUEUE__.push(Array.from(arguments));
        }
      };
      `
    );
  }
}

export default function PrivacyScriptLoader() {
  useEffect(() => {
    applyConsentScripts(readCookieConsent());

    const onConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CookieConsent>;
      applyConsentScripts(customEvent.detail ?? readCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated as EventListener);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated as EventListener);
    };
  }, []);

  return null;
}
