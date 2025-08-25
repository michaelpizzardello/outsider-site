"use client";

import clsx from "clsx";
import { ReactNode } from "react";

export default function Container({
  className = "",
  children,
}: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        // same nice gutters as mid viewport
        "mx-auto px-4 sm:px-6 lg:px-8",
        // stop capping on very large screens so desktop isn’t pulled in
        "max-w-7xl 2xl:max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
