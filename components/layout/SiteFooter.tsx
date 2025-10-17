// components/layout/SiteFooter.tsx
"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import Link from "next/link";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";

const defaultLinks = [
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
  { href: "/about#contact", label: "Contact" },
];

type IconProps = ComponentPropsWithoutRef<"svg">;

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M8 2h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Zm0 2a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8Zm4 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm5.25-3.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
      />
    </svg>
  );
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 1 1-.001 5.001A2.5 2.5 0 0 1 4.98 3.5ZM3 9h3.96v12H3V9Zm6.602 0H14.4v1.64h.056c.534-1.013 1.836-2.084 3.78-2.084 4.043 0 4.784 2.66 4.784 6.118V21H19v-5.52c0-1.317-.025-3.01-1.836-3.01-1.84 0-2.122 1.435-2.122 2.915V21h-3.96V9Z"
      />
    </svg>
  );
}

export default function SiteFooter({
  links = defaultLinks,
}: {
  links?: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const hideOnArtworkPage = pathname?.startsWith("/exhibitions/") && pathname.includes("/artworks/");
  if (hideOnArtworkPage) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email }),
        });
        const json = await res.json().catch(() => ({}));
        const partial = Boolean(json?.partial);
        setStatus({
          ok: res.ok && !partial,
          msg:
            json?.message ||
            (res.ok
              ? "Thanks for joining our mailing list. We'll keep you updated."
              : "Something went wrong."),
        });
        if (res.ok && !partial) {
          setFirstName("");
          setLastName("");
          setEmail("");
        }
      } catch {
      setStatus({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <Container>
        <div className="py-10 md:py-14">
          {/* --- Newsletter (single section) --- */}
          <div className="max-w-2xl">
            <h2 className="text-lg md:text-2xl font-medium">Newsletter</h2>
            <p className="text-sm md:text-base text-neutral-600 mt-1">
              Join our monthly invitation list for openings and stay up to date on new exhibitions, artists and more
            </p>

            {/* Names row (md+), then email, then button */}
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs uppercase tracking-[0.2em] text-neutral-500"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 w-full h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs uppercase tracking-[0.2em] text-neutral-500"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-[0.2em] text-neutral-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <OutlineLabelButton
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6"
              >
                {loading ? "Submitting…" : "Subscribe"}
              </OutlineLabelButton>

              {status?.msg ? (
                <p
                  className={`text-sm ${status.ok ? "text-green-700" : "text-red-700"}`}
                  aria-live="polite"
                >
                  {status.msg}
                </p>
              ) : null}
            </form>
          </div>

          {/* --- Info BELOW newsletter with divider --- */}
          <div className="mt-10 pt-8 border-t border-neutral-200">
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Location</h3>
                <address className="not-italic mt-2 text-sm text-neutral-700 space-y-0.5">
                  <div>144 Commonwealth St</div>
                  <div>Surry Hills, NSW 2010</div>
                  <div>Australia</div>
                </address>
              </div>

              {/* Hours */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Hours</h3>
                <ul className="mt-2 text-sm text-neutral-700 space-y-0.5">
                  <li>Wed–Sat: 10am–6pm</li>
                  <li>Or by appointment</li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Contact</h3>
                <div className="mt-2 space-y-1">
                  <a
                    href="tel:+61422509508"
                    className="text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
                  >
                    Call
                  </a>
                  <a
                    href="mailto:info@outsidergallery.com.au"
                    className="block text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
                  >
                    Email
                  </a>
                </div>
              </div>

              {/* Social */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Social</h3>
                <div className="mt-2 flex flex-col gap-3">
                  <a
                    href="https://www.instagram.com/outsidergallery_"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                    aria-label="Follow Outsider Gallery on Instagram"
                  >
                    <InstagramIcon className="h-4 w-4" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://au.linkedin.com/company/outsider-gallery"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                    aria-label="Connect with Outsider Gallery on LinkedIn"
                  >
                    <LinkedinIcon className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>

              {/* Menu */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Menu</h3>
                <ul className="mt-2 space-y-1.5">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm underline underline-offset-4">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* no subfooter */}
        </div>
      </Container>
    </footer>
  );
}
