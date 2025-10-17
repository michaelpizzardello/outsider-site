"use client";

import { useState } from "react";
import clsx from "clsx";
import OutlineLabelButton from "@/components/ui/OutlineLabelButton";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ state: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, subscribe }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          state: "error",
          message:
            json?.message ??
            "We couldn't send your enquiry just now. Please try again.",
        });
        return;
      }

      setStatus({
        state: json?.partial ? "error" : "success",
        message:
          json?.message ??
          "Thank you for your message. Our team will reply soon.",
      });
      if (!json?.partial) {
        setName("");
        setEmail("");
        setMessage("");
        setSubscribe(true);
      }
    } catch {
      setStatus({
        state: "error",
        message:
          "We couldn't send your enquiry due to a network issue. Please try again.",
      });
    }
  };

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6" noValidate>
      <label className="flex flex-col text-sm font-medium text-neutral-700">
        Name
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 border border-neutral-300 bg-white px-4 py-3 text-base font-normal text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </label>

      <label className="flex flex-col text-sm font-medium text-neutral-700">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 border border-neutral-300 bg-white px-4 py-3 text-base font-normal text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </label>

      <label className="flex flex-col text-sm font-medium text-neutral-700">
        Message
        <textarea
          name="message"
          rows={6}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 border border-neutral-300 bg-white px-4 py-3 text-base font-normal text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </label>

      <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={subscribe}
          onChange={(event) => setSubscribe(event.target.checked)}
        />
        <span>Subscribe to newsletter</span>
      </label>

      {status.state === "error" || status.state === "success" ? (
        <p
          className={clsx(
            "text-sm",
            status.state === "success" ? "text-green-700" : "text-red-700"
          )}
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <OutlineLabelButton
          type="submit"
          disabled={isSubmitting}
          className="px-6"
        >
          {isSubmitting ? "Sending…" : "Send"}
        </OutlineLabelButton>
      </div>
    </form>
  );
}
