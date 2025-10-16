import { NextResponse } from "next/server";

import {
  upsertContact,
  updateEmailSubscriptionStatus,
  getContactIdByEmail,
  createContactNote,
} from "@/lib/hubspot";
import { upsertMailchimpSubscriber } from "@/lib/mailchimp";
import { sendNewsletterNotificationEmail } from "@/lib/notifications";

type SubscribeBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  let data: SubscribeBody;
  try {
    data = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const firstName =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const partialMessages: string[] = [];

  try {
    const properties: Record<string, string> = { email };
    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;
    const optInProperty = process.env.HUBSPOT_NEWSLETTER_OPT_IN_PROPERTY;
    if (optInProperty) {
      properties[optInProperty] = "true";
    }
    const sourceProperty = process.env.HUBSPOT_NEWSLETTER_SOURCE_PROPERTY;
    if (sourceProperty) {
      properties[sourceProperty] = "newsletter-footer";
    }

    try {
      await upsertMailchimpSubscriber({
        email,
        firstName,
        lastName,
      });
    } catch (mailchimpError) {
      console.error("[subscribe][mailchimp]", mailchimpError);
      partialMessages.push(
        "We couldn't add you to the mailing list right now. Please try again later."
      );
    }

    await upsertContact(properties);

    try {
      const contactId = await getContactIdByEmail(email);
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "N/A";
      await createContactNote({
        contactId,
        body: `Newsletter subscription via website footer.\n\nName: ${fullName}\nEmail: ${email}`,
      });
    } catch (error) {
      console.error("[subscribe][note]", error);
      partialMessages.push(
        "We captured your email but couldn't log the subscription note."
      );
    }

    const subscriptionIdRaw =
      process.env.HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID;
    if (subscriptionIdRaw) {
      const subscriptionId = Number(subscriptionIdRaw);
      if (Number.isFinite(subscriptionId)) {
        const legalBasis = process.env.HUBSPOT_NEWSLETTER_LEGAL_BASIS;
        const legalBasisExplanation =
          process.env.HUBSPOT_NEWSLETTER_LEGAL_BASIS_EXPLANATION;
        await updateEmailSubscriptionStatus({
          email,
          subscriptionId,
          legalBasis,
          legalBasisExplanation,
        });
      } else {
        console.warn(
          "[subscribe] HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID is not numeric"
        );
      }
    }

    try {
      await sendNewsletterNotificationEmail({
        firstName,
        lastName,
        email,
      });
    } catch (error) {
      console.error("[subscribe][notify]", error);
      partialMessages.push(
        "We couldn’t send the internal subscription alert, but your details were captured."
      );
    }
  } catch (error) {
    console.error("[subscribe][hubspot]", error);
    return NextResponse.json(
      { message: "Unable to subscribe right now. Please try again later." },
      { status: 502 }
    );
  }

  const partial = partialMessages.length > 0;

  return NextResponse.json({
    message: partial
      ? partialMessages.join(" ")
      : "Thanks for joining our mailing list. We'll keep you updated.",
    partial,
  });
}
