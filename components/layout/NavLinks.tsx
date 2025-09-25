import Link from "next/link";

export default function NavLinks({
  items,
  className = "",
  linkClassName = "",
  onClick,
}: {
  items: Array<{ href: string; label: string }>;
  className?: string;
  linkClassName?: string;
  onClick?: () => void;
}) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={[
              "font-normal leading-none transition-opacity duration-150 hover:opacity-80 focus:opacity-80",
              linkClassName,
            ].join(" ")}
            onClick={onClick}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
