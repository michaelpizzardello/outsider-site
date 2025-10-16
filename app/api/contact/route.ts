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

    await upsertContact(properties);

    const contactId = await getContactIdByEmail(email);
    const noteBody = `About page contact form submission:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    await createContactNote({ contactId, body: noteBody });
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
      await upsertMailchimpSubscriber({
        email,
        firstName,
        lastName,
      });
    } catch (error) {
      console.error("[contact][mailchimp]", error);
      outcomes.push(
        "We saved your enquiry but couldn't add you to the mailing list. Please try subscribing again later."
      );
    }
  }

  try {
    await sendContactNotificationEmail({ name, email, message });
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
