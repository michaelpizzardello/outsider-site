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

  // Debug: log request summary and env presence (not values)
  try {
    console.log("[subscribe] request", {
      email,
      hasFirstName: Boolean(firstName),
      hasLastName: Boolean(lastName),
      env: {
        notifyViaResend: process.env.NOTIFY_VIA_RESEND === "true",
        resendKey: Boolean(process.env.RESEND_API_KEY),
        resendFrom: Boolean(process.env.RESEND_FROM_EMAIL),
        newsletterRecipient: Boolean(
          process.env.NEWSLETTER_NOTIFICATION_EMAIL ||
            process.env.CONTACT_NOTIFICATION_EMAIL
        ),
        hubspotToken: Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN),
        mailchimpKey: Boolean(process.env.MAILCHIMP_API_KEY),
        mailchimpAudience: Boolean(process.env.MAILCHIMP_AUDIENCE_ID),
        mailchimpDc: Boolean(
          process.env.MAILCHIMP_DC || process.env.MAILCHIMP_API_KEY
        ),
        hsSubIdNumeric: Number.isFinite(
          Number(process.env.HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID || "")
        ),
      },
    });
  } catch {}

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
      console.log("[subscribe][mailchimp] attempt");
      await upsertMailchimpSubscriber({
        email,
        firstName,
        lastName,
      });
      console.log("[subscribe][mailchimp] success");
    } catch (mailchimpError) {
      console.error("[subscribe][mailchimp]", mailchimpError);
      partialMessages.push(
        "We couldn't add you to the mailing list right now. Please try again later."
      );
    }

    console.log("[subscribe][hubspot-contact] upsert attempt");
    await upsertContact(properties);
    console.log("[subscribe][hubspot-contact] upsert success");

    try {
      console.log("[subscribe][note] create attempt");
      const contactId = await getContactIdByEmail(email);
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "N/A";
      await createContactNote({
        contactId,
        body: `Newsletter subscription via website footer.\n\nName: ${fullName}\nEmail: ${email}`,
      });
      console.log("[subscribe][note] create success");
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
        console.log("[subscribe][hubspot-subscription] update attempt", {
          subscriptionId,
          hasLegalBasis: Boolean(process.env.HUBSPOT_NEWSLETTER_LEGAL_BASIS),
          hasExplanation: Boolean(
            process.env.HUBSPOT_NEWSLETTER_LEGAL_BASIS_EXPLANATION
          ),
        });
        await updateEmailSubscriptionStatus({
          email,
          subscriptionId,
          legalBasis,
          legalBasisExplanation,
        });
        console.log("[subscribe][hubspot-subscription] update success");
      } else {
        console.warn(
          "[subscribe] HUBSPOT_NEWSLETTER_SUBSCRIPTION_ID is not numeric"
        );
      }
    }

    try {
      console.log("[subscribe][notify] attempt");
      const notifyDirect = process.env.NOTIFY_VIA_RESEND === "true";
      if (notifyDirect) {
        await sendNewsletterNotificationEmail({
          firstName,
          lastName,
          email,
        });
        console.log("[subscribe][notify] success");
      } else {
        console.log(
          "[subscribe][notify] skipped (NOTIFY_VIA_RESEND not enabled)"
        );
      }
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

  try {
    console.log("[subscribe] response", {
      partial,
      messages: partialMessages,
    });
  } catch {}

  return NextResponse.json({
    message: partial
      ? partialMessages.join(" ")
      : "Thanks for joining our mailing list. We'll keep you updated.",
    partial,
  });
}
