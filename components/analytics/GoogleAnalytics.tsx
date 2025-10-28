"use client";

import Script from "next/script";

type GtagCommand = [string, ...unknown[]];

export type GoogleAnalyticsProps = {
  measurementId?: string | null;
};

declare global {
  interface Window {
    dataLayer?: GtagCommand[];
    gtag?: (...args: GtagCommand) => void;
  }
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId) {
    return null;
  }

  const measurement = measurementId.trim();
  if (!measurement) return null;

  const inlineScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    window.gtag('js', new Date());
    window.gtag('config', '${measurement}');
  `;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurement}`}
        strategy="beforeInteractive"
      />
      <Script id="ga4-inline" strategy="beforeInteractive">
        {inlineScript}
      </Script>
    </>
  );
}
