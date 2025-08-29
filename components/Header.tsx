"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

import { NAV_LINKS } from "@/lib/nav";
import Logo from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import MobileMenu from "./MobileMenu";
import Container from "./Container";
import { usePathname } from "next/navigation";

// ======================================================
// PROPS
// ======================================================
type HeaderProps = {
  overlay?: boolean;
  withSpacer?: boolean;
  logoDarkSrc?: string;
  logoLightSrc?: string;
  logoAriaLabel?: string;
  nav?: Array<{ href: string; label: string }>;
};

// ======================================================
// MAIN HEADER COMPONENT
// ======================================================
export default function Header({
  overlay = true,
  withSpacer = false,
  logoDarkSrc = "/logo-black.svg",
  logoLightSrc = "/logo-white.svg",
  logoAriaLabel = "Outsider Gallery — Home",
  nav = NAV_LINKS,
}: HeaderProps) {
  // ======================================================
  // STATE
  // ======================================================
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const isTransparentRoute =
    pathname === "/" || pathname?.startsWith("/exhibitions/"); // detail pages only
  const overlayFinal = isTransparentRoute; // ignore the prop; default solid everywhere else

  // ======================================================
  // EFFECTS
  // ======================================================
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ======================================================
  // DERIVED VALUES
  // ======================================================
  const solid = open || !overlayFinal || scrolled;

  const transitionSmooth = "transition-all duration-500 ease-in-out";

  // Nav text sizes
  const NAV_TEXT_COMPACT = "text-[13px] md:text-[13px] lg:text-[15px]"; // after scroll
  const NAV_TEXT_LARGE = "text-sm md:text-[14px] lg:text-base"; // pre-scroll (smaller on md)
  const navLinkSize = scrolled ? NAV_TEXT_COMPACT : NAV_TEXT_LARGE;

  // Nav gaps (tighter on md so it sits farther from the logo)
  const navGap = "gap-x-8 lg:gap-x-10 xl:gap-x-16";

  const wrapClass = clsx(
    "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-in-out",
    solid
      ? "bg-white/95 backdrop-blur shadow-[0_6px_20px_rgba(0,0,0,.06)]"
      : "bg-transparent"
  );

  const textClass = solid ? "text-neutral-900" : "text-white";

  const headerPaddingDesktop = scrolled ? "py-2" : "py-10";
  const headerPaddingMobile = scrolled ? "py-2" : "py-4";

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <>
      {/* HEADER CONTAINER */}
      <header className={wrapClass}>
        <Container className={textClass}>
          {/* DESKTOP HEADER (iPad + desktop) */}
          <div
            className={`hidden md:grid grid-cols-3 items-center ${headerPaddingDesktop} ${transitionSmooth}`}
          >
            {/* LEFT NAV LINKS (first half) */}
            <nav aria-label="Primary" className="justify-self-start">
              <NavLinks
                items={nav.slice(0, 2)}
                className={`flex items-center ${navGap}`}
                linkClassName={navLinkSize}
              />
            </nav>

            {/* CENTER LOGO */}
            <div className="justify-self-center flex items-center">
              <Logo
                darkSrc={logoDarkSrc}
                lightSrc={logoLightSrc}
                solid={solid}
                ariaLabel={logoAriaLabel}
              />
            </div>

            {/* RIGHT NAV LINKS (second half) */}
            <nav aria-label="Secondary" className="justify-self-end">
              <NavLinks
                items={nav.slice(2)}
                className={`flex items-center ${navGap}`}
                linkClassName={navLinkSize}
              />
            </nav>
          </div>

          {/* MOBILE HEADER (phones only) */}
          <div
            className={`md:hidden flex items-center justify-between ${headerPaddingMobile} ${transitionSmooth}`}
          >
            {/* LEFT LOGO (mobile version) */}
            <Logo
              darkSrc={logoDarkSrc}
              lightSrc={logoLightSrc}
              solid={solid}
              ariaLabel={logoAriaLabel}
              className="block h-4 w-auto"
            />

            {/* BURGER MENU */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex flex-col justify-center space-y-1.5 h-8 w-8"
            >
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
            </button>
          </div>
        </Container>
      </header>

      {/* MOBILE MENU */}
      <MobileMenu open={open} onClose={() => setOpen(false)} nav={nav} />

      {/* OPTIONAL SPACER */}
      {withSpacer ? (
        <div className="h-[64px] lg:h-[76px]" aria-hidden="true" />
      ) : null}
    </>
  );
}
