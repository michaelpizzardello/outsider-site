"use client";

import { useRouter } from "next/navigation";
import { MouseEvent } from "react";

type Props = {
  fallbackHref: string;
  className?: string;
};

export default function CloseArtworkButton({ fallbackHref, className = "" }: Props) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      const root = document.documentElement;
      const hadInlineBehavior = root.style.scrollBehavior !== "";
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      const restoreBehavior = () => {
        if (hadInlineBehavior) {
          root.style.scrollBehavior = previousBehavior;
        } else {
          root.style.removeProperty("scroll-behavior");
        }
      };

      const handlePopState = () => {
        window.clearTimeout(timeoutId);
        restoreBehavior();
      };

      window.addEventListener("popstate", handlePopState, { once: true });

      const timeoutId = window.setTimeout(() => {
        window.removeEventListener("popstate", handlePopState);
        restoreBehavior();
      }, 1000);

      router.back();
      return;
    }

    router.push(fallbackHref, { scroll: true });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Close artwork detail"
      className={`cursor-pointer select-none ${className}`.trim()}
    >
      &times;
    </button>
  );
}
