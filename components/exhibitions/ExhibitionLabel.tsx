import { createElement, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export const EXHIBITION_LABEL_BASE_CLASS =
  "text-[0.85rem] mb-2 font-semibold uppercase tracking-wider ";

type ExhibitionLabelProps = Omit<
  HTMLAttributes<HTMLElement>,
  "className" | "children"
> & {
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
};

export default function ExhibitionLabel({
  as = "span",
  children,
  className,
  ...rest
}: ExhibitionLabelProps) {
  return createElement(
    as,
    {
      className: clsx(EXHIBITION_LABEL_BASE_CLASS, className),
      ...rest,
    },
    children
  );
}
