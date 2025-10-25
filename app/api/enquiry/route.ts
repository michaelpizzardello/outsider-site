import { NextResponse } from "next/server";

import {
  createContactNote,
  getContactIdByEmail,
  upsertContact,
} from "@/lib/hubspot";
import { upsertMailchimpSubscriber } from "@/lib/mailchimp";
import { sendArtworkEnquiryNotificationEmail } from "@/lib/notifications";

type EnquiryBody = {
  name?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  subscribe?: unknown;
  artwork?: {
    title?: unknown;
    artist?: unknown;
    year?: unknown;
    medium?: unknown;
    dimensions?: unknown;
    price?: unknown;
  };
};

function normaliseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: EnquiryBody;
  try {
    payload = (await request.json()) as EnquiryBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const firstNameRaw = normaliseString(payload.firstName);
  const lastNameRaw = normaliseString(payload.lastName);
  let name = normaliseString(payload.name);
  if (!name) {
    name = [firstNameRaw, lastNameRaw].filter(Boolean).join(" ");
  }
  const email = normaliseString(payload.email).toLowerCase();
  const phone = normaliseString(payload.phone);
  const message = normaliseString(payload.message);
  const subscribe =
    typeof payload.subscribe === "boolean"
      ? payload.subscribe
      : payload.subscribe === "true";

  const artwork = payload.artwork ?? {};
  const title = normaliseString(artwork.title);
  if (!title) {
    return NextResponse.json(
      { message: "Artwork information is missing." },
      { status: 400 }
    );
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { message: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  const outcomes: string[] = [];
  const properties: Record<string, string> = { email };

  if (firstNameRaw) properties.firstname = firstNameRaw;
  if (lastNameRaw) properties.lastname = lastNameRaw;

  if (!properties.firstname || !properties.lastname) {
    const nameParts = name.split(/\s+/);
    if (nameParts.length) {
      if (!properties.firstname) properties.firstname = nameParts[0];
      if (nameParts.length > 1 && !properties.lastname) {
        properties.lastname = nameParts.slice(1).join(" ");
      }
    }
  }

  if (phone) {
    properties.phone = phone;
  }

  const sourceProperty = process.env.HUBSPOT_ENQUIRY_SOURCE_PROPERTY;
  if (sourceProperty) {
    properties[sourceProperty] = "artwork-enquiry";
  }
  if (subscribe) {
    const optInProperty = process.env.HUBSPOT_NEWSLETTER_OPT_IN_PROPERTY;
    if (optInProperty) {
      properties[optInProperty] = "true";
    }
  }

  const artworkDetails = {
    title,
    artist: normaliseString(artwork.artist),
    year: normaliseString(artwork.year),
    medium: normaliseString(artwork.medium),
    dimensions: normaliseString(artwork.dimensions),
    price: normaliseString(artwork.price),
  };

  // Debug: log request summary and env presence (not values)
  try {
    console.log("[enquiry] request", {
      name,
      email,
      subscribe,
      artwork: { title: artworkDetails.title },
      env: {
        resendKey: Boolean(process.env.RESEND_API_KEY),
        resendFrom: Boolean(process.env.RESEND_FROM_EMAIL),
        enquiryRecipient: Boolean(
          process.env.ENQUIRY_NOTIFICATION_EMAIL ||
            process.env.CONTACT_NOTIFICATION_EMAIL
        ),
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
    console.log("[enquiry][hubspot-contact] upsert attempt");
    await upsertContact(properties);
    console.log("[enquiry][hubspot-contact] upsert success");
    const contactId = await getContactIdByEmail(email);
    console.log("[enquiry][note] create attempt");
    const noteLines = [
      "Artwork enquiry received via website.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "",
      "",
      "Artwork:",
      artworkDetails.artist ? `  Artist: ${artworkDetails.artist}` : "",
      `  Title: ${artworkDetails.title}`,
      artworkDetails.year ? `  Year: ${artworkDetails.year}` : "",
      artworkDetails.medium ? `  Medium: ${artworkDetails.medium}` : "",
      artworkDetails.dimensions
        ? `  Dimensions: ${artworkDetails.dimensions}`
        : "",
      artworkDetails.price ? `  Price: ${artworkDetails.price}` : "",
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");
    await createContactNote({ contactId, body: noteLines });
    console.log("[enquiry][note] create success");
  } catch (error) {
    console.error("[enquiry][hubspot]", error);
    return NextResponse.json(
      { message: "Unable to send enquiry right now. Please try again later." },
      { status: 502 }
    );
  }

  if (subscribe) {
    try {
      console.log("[enquiry][mailchimp] attempt");
      await upsertMailchimpSubscriber({
        email,
        firstName: properties.firstname ?? "",
        lastName: properties.lastname ?? "",
      });
      console.log("[enquiry][mailchimp] success");
    } catch (error) {
      console.error("[enquiry][mailchimp]", error);
      outcomes.push(
        "We couldn't add you to the mailing list. Please try subscribing again later."
      );
    }
  }

  try {
    console.log("[enquiry][notify] attempt");
    await sendArtworkEnquiryNotificationEmail({
      name,
      email,
      phone,
      message,
      artwork: artworkDetails,
    });
    console.log("[enquiry][notify] success");
  } catch (error) {
    console.error("[enquiry][notify]", error);
    outcomes.push(
      "We logged your enquiry but couldn't send the internal notification email."
    );
  }

  return NextResponse.json({
    message:
      outcomes.length > 0
        ? outcomes.join(" ")
        : "Thanks for contacting our team. We will be in touch soon.",
    partial: outcomes.length > 0,
  });
}
