import crypto from "node:crypto";

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_DC =
  process.env.MAILCHIMP_DC ?? MAILCHIMP_API_KEY?.split("-").at(-1);

if (MAILCHIMP_API_KEY && !MAILCHIMP_DC) {
  throw new Error("MAILCHIMP_DC is required when MAILCHIMP_API_KEY is set");
}

function getConfig() {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_DC) {
    throw new Error("Mailchimp environment variables are not fully configured");
  }
  return {
    apiKey: MAILCHIMP_API_KEY,
    audienceId: MAILCHIMP_AUDIENCE_ID,
    dc: MAILCHIMP_DC,
  };
}

function hashEmail(email: string) {
  return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}

export async function upsertMailchimpSubscriber({
  email,
  firstName,
  lastName,
  status,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  status?: "subscribed" | "pending";
}) {
  const { apiKey, audienceId, dc } = getConfig();
  const subscriberHash = hashEmail(email);

  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
    {
      method: "PUT",
      headers: {
        Authorization: `apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: status ?? "subscribed",
        merge_fields: {
          FNAME: firstName ?? "",
          LNAME: lastName ?? "",
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Mailchimp request failed: ${response.status} ${response.statusText} - ${text}`
    );
  }

  return response.json() as Promise<unknown>;
}
