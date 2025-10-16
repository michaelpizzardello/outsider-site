// components/layout/SiteFooter.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import Link from "next/link";

const defaultLinks = [
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
  { href: "/visit", label: "Visit" },
  { href: "/contact", label: "Contact" },
];

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

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full md:w-auto px-6 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {loading ? "Submitting…" : "Subscribe"}
              </button>

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
            <div className="grid gap-8 sm:grid-cols-3">
              {/* Visit */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">Visit</h3>
                <address className="not-italic mt-2 text-sm text-neutral-700 space-y-0.5">
                  <div>144 Commonwealth St</div>
                  <div>Surry Hills, NSW 2010</div>
                  <div>Australia</div>
                </address>
                <div className="mt-2 space-y-0.5">
                  <a href="tel:+61422509508" className="text-sm underline underline-offset-4">
                    +61 422 509 508
                  </a>
                  <div>
                    <a
                      href="mailto:info@outsidergallery.com.au"
                      className="text-sm underline underline-offset-4"
                    >
                      info@outsidergallery.com.au
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">Hours</h3>
                <ul className="mt-2 text-sm text-neutral-700 space-y-0.5">
                  <li>Wed–Sat: 10am–6pm</li>
                  <li>Or by appointment</li>
                </ul>
              </div>

              {/* Menu */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">Menu</h3>
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
