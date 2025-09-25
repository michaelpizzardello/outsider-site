"use client";

import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

import { NAV_LINKS } from "@/lib/nav";
import Logo from "@/components/layout/Logo";
import NavLinks from "@/components/layout/NavLinks";
import MobileMenu from "@/components/layout/MobileMenu";
import Container from "@/components/layout/Container";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------
type HeaderProps = {
  withSpacer?: boolean;
  logoDarkSrc?: string;
  logoLightSrc?: string;
  logoAriaLabel?: string;
  nav?: Array<{ href: string; label: string }>;
};

export default function Header({
  withSpacer = false,
  logoDarkSrc = "/logo-black.svg",
  logoLightSrc = "/logo-white.svg",
  logoAriaLabel = "Outsider Gallery - Home",
  nav = NAV_LINKS,
}: HeaderProps) {
  // ---------------------------------------------------------------------------
  // Routing context and visibility logic
  // ---------------------------------------------------------------------------
  const pathname = usePathname();
  const hideHeader =
    pathname?.startsWith("/exhibitions/") &&
    (pathname?.split("/")?.length ?? 0) >= 5;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Determine header styling for transparent vs. solid backgrounds
  // ---------------------------------------------------------------------------
  const isTransparentRoute =
    pathname === "/" || pathname?.startsWith("/exhibitions/");
  const overlayFinal = isTransparentRoute;

  // ---------------------------------------------------------------------------
  // Sync scroll state so the header tightens and gains shadow when scrolling
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (hideHeader) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideHeader]);

  // ---------------------------------------------------------------------------
  // Derived presentation classes for the header shell
  // ---------------------------------------------------------------------------
  const solid = open || !overlayFinal || scrolled;
  const transitionSmooth = "transition-all duration-500 ease-in-out";
  const NAV_TEXT_COMPACT = "text-[13px] md:text-[13px] lg:text-[15px]";
  const NAV_TEXT_LARGE = "text-[15px] md:text-[16px] lg:text-[18px]";
  const navLinkSize = scrolled ? NAV_TEXT_COMPACT : NAV_TEXT_LARGE;
  const navGap = scrolled ? "gap-x-8 lg:gap-x-12" : "gap-x-12 lg:gap-x-18";
  const bgClass = solid ? "bg-white/95 backdrop-blur" : "bg-transparent";
  const shadowClass = scrolled
    ? "shadow-[0_6px_20px_rgba(0,0,0,.06)]"
    : "shadow-none";
  const borderClass = solid ? "border-b border-neutral-200" : "border-b-0";
  const wrapClass = clsx(
    "fixed inset-x-0 top-0 z-40 transition-shadow duration-300 ease-in-out",
    bgClass,
    shadowClass,
    borderClass
  );
  const textClass = solid ? "text-neutral-900" : "text-white";
  const headerPaddingDesktop = scrolled ? "py-5 md:py-6" : "py-9 md:py-[60px]";
  const headerPaddingMobile = scrolled ? "py-3" : "py-5";

  // ---------------------------------------------------------------------------
  // Track the rendered header height for layout spacing on transparent routes
  // ---------------------------------------------------------------------------
  const headerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (hideHeader) return;
    const el = headerRef.current;
    if (!el || typeof window === "undefined") return;
    const setVar = () => {
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`
      );
    };
    const raf = requestAnimationFrame(setVar);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(setVar) : null;
    ro?.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [hideHeader, scrolled, open, solid]);

  // ---------------------------------------------------------------------------
  // Close the mobile menu whenever navigation path changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (hideHeader) return null;

  // ---------------------------------------------------------------------------
  // Split navigation into left (primary) and right (secondary) clusters
  // ---------------------------------------------------------------------------
  const primaryNav = nav.slice(0, 2);
  const secondaryNav = nav.slice(2);

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* Fixed header container */}
      {/* ------------------------------------------------------------------- */}
      <header ref={headerRef} className={wrapClass}>
        <Container className={textClass}>
          {/* --------------------------------------------------------------- */}
          {/* Desktop layout: three-column grid with nav + logo + nav */}
          {/* --------------------------------------------------------------- */}
          <div
            className={clsx(
              "hidden w-full items-center md:grid md:grid-cols-[1fr_auto_1fr]",
              "md:gap-y-0",
              headerPaddingDesktop,
              transitionSmooth
            )}
          >
            {/* Left column: primary navigation links */}
            <nav
              aria-label="Primary navigation"
              className="hidden min-w-0 md:flex md:items-center md:justify-start"
            >
              <NavLinks
                items={primaryNav}
                className={clsx("flex items-center", navGap)}
                linkClassName={navLinkSize}
              />
            </nav>

            {/* Center column: responsive logo */}
            <div className="flex items-center justify-center">
              <Logo
                darkSrc={logoDarkSrc}
                lightSrc={logoLightSrc}
                solid={solid}
                ariaLabel={logoAriaLabel}
                // Logo styling
                className="h-auto max-w-[150px] md:max-w-[235px] lg:max-w-[300px]"
              />
            </div>

            {/* Right column: secondary navigation links */}
            <nav
              aria-label="Secondary navigation"
              className="hidden min-w-0 md:flex md:items-center md:justify-end"
            >
              <NavLinks
                items={secondaryNav}
                className={clsx("flex items-center", navGap)}
                linkClassName={navLinkSize}
              />
            </nav>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Mobile layout: logo + hamburger toggle */}
          {/* --------------------------------------------------------------- */}
          <div
            className={clsx(
              "flex items-center justify-between md:hidden",
              headerPaddingMobile,
              transitionSmooth
            )}
          >
            <Logo
              darkSrc={logoDarkSrc}
              lightSrc={logoLightSrc}
              solid={solid}
              ariaLabel={logoAriaLabel}
              className="block h-4 w-auto"
            />
            <button
              // Toggles the mobile navigation drawer
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-8 w-8 flex-col justify-center space-y-1.5"
            >
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
            </button>
          </div>
        </Container>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Optional spacer maintains layout when header is fixed */}
      {/* ------------------------------------------------------------------- */}
      {withSpacer ? (
        <div className="h-[64px] lg:h-[76px]" aria-hidden="true" />
      ) : null}

      {/* ------------------------------------------------------------------- */}
      {/* Mobile drawer menu rendered outside the header for layering */}
      {/* ------------------------------------------------------------------- */}
      <MobileMenu open={open} onClose={() => setOpen(false)} nav={nav} />
    </>
  );
}
