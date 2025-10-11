"use client";

import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariantProps = {
  as?: "button";
} & ButtonHTMLAttributes<HTMLButtonElement>;

type AnchorVariantProps = {
  as: "a";
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type OutlineLabelButtonProps = {
  children: ReactNode;
  className?: string;
} & (ButtonVariantProps | AnchorVariantProps);

const BASE_CLASS =
  "inline-flex h-9 cursor-pointer items-center justify-center border border-neutral-900 bg-transparent px-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-neutral-900 transition hover:border-neutral-700 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

export default function OutlineLabelButton({
  as = "button",
  className,
  children,
  ...rest
}: OutlineLabelButtonProps) {
  if (as === "a") {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={clsx(BASE_CLASS, className)} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={type ?? "button"}
      className={clsx(BASE_CLASS, className)}
      {...buttonRest}
    >
      {children}
    </button>
  );
}
