"use client";

import type { MouseEvent, ReactNode } from "react";

interface HeroScrollArrowProps {
  targetId: string;
  className?: string;
  children: ReactNode;
}

export default function HeroScrollArrow({ targetId, className = "", children }: HeroScrollArrowProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);

    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = targetId;
      window.history.pushState({}, "", url);
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={handleClick}
      aria-label="Scroll to next section"
    >
      {children}
    </a>
  );
}
