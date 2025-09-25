"use client";

import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

import { NAV_LINKS } from "@/lib/nav";
import Logo from "@/components/layout/Logo";
import NavLinks from "@/components/layout/NavLinks";
import MobileMenu from "@/components/layout/MobileMenu";
import Container from "@/components/layout/Container";
import { usePathname } from "next/navigation";

type HeaderProps = {
  overlay?: boolean;
  withSpacer?: boolean;
  logoDarkSrc?: string;
  logoLightSrc?: string;
  logoAriaLabel?: string;
  nav?: Array<{ href: string; label: string }>;
};

export default function Header({
  overlay = true,
  withSpacer = false,
  logoDarkSrc = "/logo-black.svg",
  logoLightSrc = "/logo-white.svg",
  logoAriaLabel = "Outsider Gallery - Home",
  nav = NAV_LINKS,
}: HeaderProps) {
  const pathname = usePathname();
  const hideHeader =
    pathname?.startsWith("/exhibitions/") && (pathname?.split("/")?.length ?? 0) >= 5;

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const isTransparentRoute =
    pathname === "/" || pathname?.startsWith("/exhibitions/");
  const overlayFinal = isTransparentRoute;

  useEffect(() => {
    if (hideHeader) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideHeader]);

  const solid = open || !overlayFinal || scrolled;
  const transitionSmooth = "transition-all duration-500 ease-in-out";
  const NAV_TEXT_COMPACT = "text-[13px] md:text-[13px] lg:text-[15px]";
  const NAV_TEXT_LARGE = "text-sm md:text-[14px] lg:text-base";
  const navLinkSize = scrolled ? NAV_TEXT_COMPACT : NAV_TEXT_LARGE;
  const navGap = "gap-x-8 lg:gap-x-10 xl:gap-x-16";
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
  const headerPaddingDesktop = scrolled ? "py-2" : "py-10";
  const headerPaddingMobile = scrolled ? "py-2" : "py-4";

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

  if (hideHeader) return null;

  return (
    <>
      <header ref={headerRef} className={wrapClass}>
        <Container className={textClass}>
          <div
            className={`hidden md:grid w-full items-center grid-cols-[max-content_auto_max-content] gap-x-12 lg:gap-x-16 xl:gap-x-20 ${headerPaddingDesktop} ${transitionSmooth}`}
          >
            <nav aria-label="Primary" className="justify-self-start">
              <NavLinks
                items={nav.slice(0, 2)}
                className={`flex items-center ${navGap}`}
                linkClassName={navLinkSize}
              />
            </nav>
            <div className="justify-self-center flex items-center">
              <Logo
                darkSrc={logoDarkSrc}
                lightSrc={logoLightSrc}
                solid={solid}
                ariaLabel={logoAriaLabel}
              />
            </div>
            <nav aria-label="Secondary" className="justify-self-end">
              <NavLinks
                items={nav.slice(2)}
                className={`flex items-center ${navGap}`}
                linkClassName={navLinkSize}
              />
            </nav>
          </div>

          <div
            className={`md:hidden flex items-center justify-between ${headerPaddingMobile} ${transitionSmooth}`}
          >
            <Logo
              darkSrc={logoDarkSrc}
              lightSrc={logoLightSrc}
              solid={solid}
              ariaLabel={logoAriaLabel}
              className="block h-4 w-auto"
            />
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

      {withSpacer ? (
        <div className="h-[64px] lg:h-[76px]" aria-hidden="true" />
      ) : null}

      <MobileMenu open={open} onClose={() => setOpen(false)} nav={nav} />
    </>
  );
}
