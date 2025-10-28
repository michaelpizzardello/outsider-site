"use client";

import NextTopLoader from "nextjs-toploader";

export default function TopLoader() {
  return (
    <NextTopLoader
      color="#000000"
      initialPosition={0.1}
      crawlSpeed={300}
      height={2}
      showSpinner={false}
    />
  );
}
