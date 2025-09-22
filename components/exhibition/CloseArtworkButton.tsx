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
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Close artwork detail"
      className={className}
    >
      &times;
    </button>
  );
}
