import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type LogoProps = {
  href?: string;
  ariaLabel?: string;
  darkSrc: string;
  lightSrc: string;
  solid: boolean; // determines whether to use dark or light logo
  className?: string; // lets parent control sizing (h-5, xl:h-6, etc.)
};

export default function Logo({
  href = "/",
  ariaLabel = "Outsider Gallery — Home",
  darkSrc,
  lightSrc,
  solid,
  className = "block h-4 w-auto xl:h-4",
}: LogoProps) {
  const [logoError, setLogoError] = useState(false);
  const logoSrc = solid ? darkSrc : lightSrc;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center"
    >
      {!logoError ? (
        <Image
          src={logoSrc}
          alt="Outsider Gallery"
          width={235}
          height={18}
          priority
          className={className}
          onError={() => setLogoError(true)}
        />
      ) : (
        <span className="select-none text-sm uppercase tracking-[.35em]">
          OUTSIDER GALLERY
        </span>
      )}
    </Link>
  );
}
