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
        // shared layout width aligns with White Cube-style container
        "site-container",
        className
      )}
    >
      {children}
    </div>
  );
}
