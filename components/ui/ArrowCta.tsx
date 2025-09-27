import Link, { type LinkProps } from "next/link";
import clsx from "clsx";
import { forwardRef } from "react";

type BaseProps = {
  label: string;
  align?: "start" | "center";
  className?: string;
  underline?: boolean;
};

const baseClasses = "group inline-flex items-center gap-4 text-sm font-medium md:text-base";

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={clsx("fill-current", className)}
      width="15"
      height="12"
      viewBox="0 0 15 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.951 1.22621L11.5547 4.82909L0.257681 4.82892L0.257682 6.50579L11.5547 6.50562L7.951 10.1085L9.12473 11.2822L14.7388 5.66732L9.12473 0.0524227L7.951 1.22621Z" />
    </svg>
  );
}

function ArrowCtaContent({
  label,
  align = "start",
  underline = true,
}: Pick<BaseProps, "label" | "align" | "underline">) {
  return (
    <>
      <ArrowIcon className="flex-shrink-0" />
      <span
        className={clsx(
          "underline-offset-[6px]",
          underline
            ? "underline decoration-1"
            : "group-hover:underline group-focus-visible:underline"
        )}
      >
        {label}
      </span>
      {align === "center" ? (
        <span aria-hidden className="block h-[12px] w-[15px] flex-shrink-0" />
      ) : null}
    </>
  );
}

export const ArrowCtaLink = forwardRef<HTMLAnchorElement, LinkProps & BaseProps>(
  function ArrowCtaLink({
    label,
    align = "start",
    className,
    underline = true,
    ...linkProps
  }, ref) {
    return (
      <Link
        ref={ref}
        {...linkProps}
        className={clsx(
          baseClasses,
          align === "center" && "justify-center",
          className
        )}
      >
        <ArrowCtaContent label={label} align={align} underline={underline} />
      </Link>
    );
  }
);

export function ArrowCtaInline({
  label,
  align = "start",
  className,
  underline = true,
}: BaseProps) {
  return (
    <span
      className={clsx(
        baseClasses,
        align === "center" && "justify-center",
        className
      )}
    >
      <ArrowCtaContent label={label} align={align} underline={underline} />
    </span>
  );
}
