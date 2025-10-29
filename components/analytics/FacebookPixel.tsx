"use client";

import Script from "next/script";

export type FacebookPixelProps = {
  pixelId?: string | null;
};

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  if (!pixelId) return null;

  const id = pixelId.trim();
  if (!id) return null;

  const inlineScript = `!function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${id}');
  fbq('track', 'PageView');`;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {inlineScript}
      </Script>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" />`,
        }}
      />
    </>
  );
}
