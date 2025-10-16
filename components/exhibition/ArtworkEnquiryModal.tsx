"use client";

import { useEffect, useId, useRef, useState } from "react";
import type {
  FormEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Image from "next/image";
import clsx from "clsx";

type ArtworkSummary = {
  title: string;
  artist?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  price?: string;
  additionalHtml?: string;
  image?: { url: string; alt?: string };
};

type Props = {
  open: boolean;
  onClose: () => void;
  artwork: ArtworkSummary;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export default function ArtworkEnquiryModal({ open, onClose, artwork }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    ok: boolean;
    message: string;
  }>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    queueMicrotask(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const subscribe = formData.get("newsletter") === "yes";

    const firstName = formData.get("firstName")?.toString().trim() ?? "";
    const lastName = formData.get("lastName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const phone = formData.get("phone")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ");

    const payload = {
      name,
      firstName,
      lastName,
      email,
      phone,
      message,
      subscribe,
      artwork: {
        title: artwork.title,
        artist: artwork.artist,
        year: artwork.year,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        price: artwork.price,
      },
    };

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res
        .json()
        .catch(() => ({ message: "Something went wrong. Please try again." }));

      if (!res.ok) {
        setFeedback({
          ok: false,
          message:
            json?.message ?? "Something went wrong. Please try again.",
        });
        return;
      }

      setFeedback({
        ok: !json?.partial,
        message:
          json?.message ??
          "Thanks for contacting our team. We will be in touch soon.",
      });
      if (!json?.partial) {
        form.reset();
      }
    } catch (error) {
      console.error("Failed to send enquiry", error);
      setFeedback({
        ok: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: string) => `${formId}-${name}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-[2px]">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className="relative w-full bg-white shadow-2xl focus:outline-none"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 text-2xl text-neutral-500 transition hover:text-black"
            aria-label="Close enquiry"
          >
            &times;
          </button>

          <div className="grid gap-6">
            <header className="bg-white px-6 pt-12 text-center sm:px-8">
              <h2 className="text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
                Artwork Enquiry
              </h2>
            </header>

            {/* <div className="mx-6 h-px bg-neutral-300 sm:mx-8" /> */}

            <section className="grid gap-6 lg:grid-cols-[minmax(220px,0.42fr)_minmax(0,0.58fr)]">
              <aside className="bg-neutral-100 px-6 pb-9 pt-9 text-neutral-900 sm:px-8 lg:px-10 lg:pt-11">
                {artwork.image ? (
                  <div className="relative max-w-[280px] bg-white">
                    <Image
                      src={artwork.image.url}
                      alt={artwork.image.alt || artwork.title}
                      width={560}
                      height={560}
                      className="h-auto w-full object-contain"
                      sizes="(min-width:1024px) 240px, 60vw"
                    />
                  </div>
                ) : null}

                <div className="mt-6 space-y-6 text-sm text-neutral-900 [&_*]:text-neutral-900">
                  <div className="space-y-[0.25rem] leading-[1.08]">
                    {artwork.artist && (
                      <p className="font-medium leading-[1.08]">
                        {artwork.artist}
                      </p>
                    )}
                    <p className="italic leading-[1.08]">{artwork.title}</p>
                    {artwork.year && (
                      <p className="leading-[1.08]">{artwork.year}</p>
                    )}
                  </div>

                  {(artwork.medium ||
                    artwork.dimensions ||
                    artwork.additionalHtml) && (
                    <div className="space-y-[0.25rem] leading-[1.08] lg:mt-2">
                      {artwork.medium && (
                        <p className="leading-[1.08]">{artwork.medium}</p>
                      )}
                      {artwork.dimensions && (
                        <p className="leading-[1.08]">{artwork.dimensions}</p>
                      )}
                      {artwork.additionalHtml && (
                        <div
                          className="space-y-[0.25rem] leading-[1.08] [&_*]:m-0 [&_*]:leading-[1.08]"
                          dangerouslySetInnerHTML={{
                            __html: artwork.additionalHtml,
                          }}
                        />
                      )}
                    </div>
                  )}

                  {artwork.price && (
                    <p className="text-base font-medium leading-[1.08]">
                      {artwork.price}
                    </p>
                  )}
                </div>
              </aside>

              <section className="px-6 pb-12 pt-2 sm:px-8 lg:px-12 lg:pt-5">
                <p className="text-sm text-neutral-900">
                  * indicates a mandatory field
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-5"
                  aria-live="polite"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabelledInput
                      id={field("first-name")}
                      name="firstName"
                      label="First name"
                      required
                    />
                    <LabelledInput
                      id={field("last-name")}
                      name="lastName"
                      label="Last name"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabelledInput
                      id={field("email")}
                      name="email"
                      type="email"
                      label="Email address"
                      autoComplete="email"
                      required
                    />
                    <LabelledInput
                      id={field("phone")}
                      name="phone"
                      type="tel"
                      label="Phone number"
                      autoComplete="tel"
                    />
                  </div>

                  <LabelledInput
                    id={field("newsletter")}
                    name="newsletter"
                    type="checkbox"
                    value="yes"
                    label="Receive newsletter"
                  />

                  <LabelledTextarea
                    id={field("message")}
                    name="message"
                    label="Message"
                    rows={4}
                  />

                  {feedback && (
                    <div
                      className={clsx(
                        "border px-4 py-3 text-sm",
                        feedback.ok
                          ? "border-green-300 bg-green-50 text-green-800"
                          : "border-red-300 bg-red-50 text-red-700"
                      )}
                    >
                      {feedback.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 w-full items-center justify-center bg-black px-6 text-sm font-medium uppercase tracking-[0.25em] text-white transition hover:bg-black/90 disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Sending…" : "Send enquiry"}
                  </button>
                </form>
              </section>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelledInput({
  label,
  id,
  required,
  type = "text",
  className,
  ...rest
}: InputProps) {
  const isCheckbox = type === "checkbox";
  if (isCheckbox) {
    return (
      <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-900">
        <input
          id={id}
          type="checkbox"
          className={clsx("h-4 w-4", className)}
          {...rest}
        />
        <span>
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </span>
      </label>
    );
  }

  return (
    <label className="flex flex-col text-xs uppercase tracking-[0.2em] text-neutral-900">
      <span>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        id={id}
        type={type}
        required={required}
        className={clsx(
          "mt-1 h-11 w-full border border-neutral-300 bg-white px-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/15",
          className
        )}
        {...rest}
      />
    </label>
  );
}

function LabelledTextarea({
  label,
  id,
  required,
  className,
  ...rest
}: TextareaProps) {
  return (
    <label className="flex flex-col text-xs uppercase tracking-[0.2em] text-neutral-900">
      {label}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
      <textarea
        id={id}
        required={required}
        className={clsx(
          "mt-1 w-full border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/15",
          className
        )}
        {...rest}
      />
    </label>
  );
}
