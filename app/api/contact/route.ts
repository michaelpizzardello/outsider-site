import { NextResponse } from "next/server";

import {
  createContactNote,
  getContactIdByEmail,
  upsertContact,
} from "@/lib/hubspot";
import { sendContactNotificationEmail } from "@/lib/notifications";
import { upsertMailchimpSubscriber } from "@/lib/mailchimp";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  subscribe?: unknown;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  let payload: ContactBody;
  try {
    payload = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const name =
    typeof payload.name === "string" ? payload.name.trim() : "";
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const subscribe =
    typeof payload.subscribe === "boolean"
      ? payload.subscribe
      : payload.subscribe === "true";

  if (!name || !email || !message) {
    return NextResponse.json(
      { message: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  const { firstName, lastName } = splitName(name);

  // Debug: log request summary and env presence (not values)
  try {
    console.log("[contact] request", {
      name,
      email,
      subscribe,
      env: {
        resendKey: Boolean(process.env.RESEND_API_KEY),
        resendFrom: Boolean(process.env.RESEND_FROM_EMAIL),
        contactRecipient: Boolean(process.env.CONTACT_NOTIFICATION_EMAIL),
        hubspotToken: Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN),
        mailchimpKey: Boolean(process.env.MAILCHIMP_API_KEY),
        mailchimpAudience: Boolean(process.env.MAILCHIMP_AUDIENCE_ID),
        mailchimpDc: Boolean(
          process.env.MAILCHIMP_DC || process.env.MAILCHIMP_API_KEY
        ),
      },
    });
  } catch {}

  try {
    const properties: Record<string, string> = {
      email,
    };
    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;
    const sourceProperty = process.env.HUBSPOT_CONTACT_SOURCE_PROPERTY;
    if (sourceProperty) {
      properties[sourceProperty] = "about-contact-form";
    }
    if (subscribe) {
      const optInProperty = process.env.HUBSPOT_NEWSLETTER_OPT_IN_PROPERTY;
      if (optInProperty) {
        properties[optInProperty] = "true";
      }
    }

    console.log("[contact][hubspot-contact] upsert attempt");
    await upsertContact(properties);
    console.log("[contact][hubspot-contact] upsert success");

    console.log("[contact][note] create attempt");
    const contactId = await getContactIdByEmail(email);
    const noteBody = `About page contact form submission:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    await createContactNote({ contactId, body: noteBody });
    console.log("[contact][note] create success");
  } catch (error) {
    console.error("[contact][hubspot]", error);
    return NextResponse.json(
      { message: "Unable to send enquiry right now. Please try again later." },
      { status: 502 }
    );
  }

  const outcomes: string[] = [];

  if (subscribe) {
    try {
      console.log("[contact][mailchimp] attempt");
      await upsertMailchimpSubscriber({
        email,
        firstName,
        lastName,
      });
      console.log("[contact][mailchimp] success");
    } catch (error) {
      console.error("[contact][mailchimp]", error);
      outcomes.push(
        "We saved your enquiry but couldn't add you to the mailing list. Please try subscribing again later."
      );
    }
  }

  try {
    console.log("[contact][notify] attempt");
    const notifyDirect = process.env.NOTIFY_VIA_RESEND === "true";
    if (notifyDirect) {
      await sendContactNotificationEmail({ name, email, message });
      console.log("[contact][notify] success");
    } else {
      console.log(
        "[contact][notify] skipped (NOTIFY_VIA_RESEND not enabled)"
      );
    }
  } catch (error) {
    console.error("[contact][notify]", error);
    outcomes.push(
      "We saved your enquiry but couldn't send the internal notification email."
    );
  }

  return NextResponse.json({
    message:
      outcomes.length > 0
        ? outcomes.join(" ")
        : "Thank you for reaching out. Our team will reply soon.",
    partial: outcomes.length > 0,
  });
}
