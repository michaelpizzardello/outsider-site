"use client";

import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

import { NAV_LINKS } from "@/lib/nav";
import Logo from "@/components/layout/Logo";
import NavLinks from "@/components/layout/NavLinks";
import MobileMenu from "@/components/layout/MobileMenu";
import Container from "@/components/layout/Container";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { CartIcon } from "@/components/cart/CartToggle";

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
  const hideHeader = Boolean(pathname?.includes("/artworks/"));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { cart, openCart, status } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;
  const showCartIcon = cartCount > 0;
  const isCartLoading = status === "loading";
  const cartLabel =
    cartCount === 1
      ? "Open cart with 1 item"
      : `Open cart with ${cartCount} items`;

  // ---------------------------------------------------------------------------
  // Determine header styling for transparent vs. solid backgrounds
  // ---------------------------------------------------------------------------
  const isTransparentRoute = pathname === "/" || pathname?.startsWith("/exhibitions/");
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
  const navLinkSize = "text-sm tracking-tight md:text-base lg:text-lg";
  const navGap = "gap-x-8 lg:gap-x-12";
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
  const headerPaddingDesktop = scrolled ? "py-4 md:py-5" : "py-8 md:py-12";
  const headerPaddingMobile = scrolled ? "py-3" : "py-5";
  const cartButtonClass = clsx(
    "relative inline-flex h-11 w-11 items-center justify-center transition focus:outline-none focus-visible:ring-2",
    solid
      ? "text-neutral-900 hover:text-black focus-visible:ring-neutral-800 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      : "text-white hover:text-white focus-visible:ring-white focus-visible:ring-offset-0"
  );
  const cartBadgeClass = clsx(
    "absolute right-0 top-0 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white",
    "bg-[#e63946]"
  );
  const cartBadgeText = isCartLoading ? "…" : cartCount > 99 ? "99+" : String(cartCount);

  // ---------------------------------------------------------------------------
  // Track the rendered header height for layout spacing on transparent routes
  // ---------------------------------------------------------------------------
  const headerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (hideHeader) return;
    const el = headerRef.current;
    if (!el || typeof window === "undefined") return;

    const root = document.documentElement;

    const measureTightHeight = () => {
      if (!el) return;
      const remToPx = (rem: number) => {
        const base = parseFloat(getComputedStyle(root).fontSize || "16");
        return rem * (Number.isNaN(base) ? 16 : base);
      };

      let maxHeight = 0;
      const measureRow = (selector: string, paddingRem: number) => {
        const row = el.querySelector<HTMLElement>(selector);
        if (!row) return;
        const styles = window.getComputedStyle(row);
        const paddingTop = parseFloat(styles.paddingTop) || 0;
        const paddingBottom = parseFloat(styles.paddingBottom) || 0;
        const contentHeight = row.clientHeight - paddingTop - paddingBottom;
        if (contentHeight <= 0) return;
        const tightPadding = remToPx(paddingRem);
        const total = contentHeight + tightPadding * 2;
        if (total > maxHeight) maxHeight = total;
      };

      measureRow('[data-header-row="mobile"]', 0.75);
      measureRow('[data-header-row="desktop"]', 1.25);

      if (maxHeight > 0) {
        root.style.setProperty("--header-tight-h", `${Math.round(maxHeight)}px`);
      }
    };

    const setVars = () => {
      if (!el) return;
      root.style.setProperty("--header-h", `${el.offsetHeight}px`);
      measureTightHeight();
    };

    const raf = requestAnimationFrame(setVars);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(setVars) : null;
    ro?.observe(el);
    window.addEventListener("resize", setVars);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", setVars);
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
            data-header-row="desktop"
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
              className="hidden min-w-0 md:flex md:items-center md:justify-end md:gap-6"
            >
              <NavLinks
                items={secondaryNav}
                className={clsx("flex items-center", navGap)}
                linkClassName={navLinkSize}
              />
              {showCartIcon ? (
                <button
                  type="button"
                  onClick={openCart}
                  aria-label={cartLabel}
                  className={cartButtonClass}
                >
                  <CartIcon className="h-6 w-6" />
                  <span className={cartBadgeClass}>{cartBadgeText}</span>
                  <span className="sr-only">{cartLabel}</span>
                </button>
              ) : null}
            </nav>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Mobile layout: logo + hamburger toggle */}
          {/* --------------------------------------------------------------- */}
          <div
            className={clsx(
              "flex items-center justify-between md:hidden -mr-4 sm:-mr-6 pr-1 sm:pr-2",
              headerPaddingMobile,
              transitionSmooth
            )}
            data-header-row="mobile"
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
