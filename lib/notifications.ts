const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const CONTACT_NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL;
const NEWSLETTER_NOTIFICATION_EMAIL =
  process.env.NEWSLETTER_NOTIFICATION_EMAIL ?? CONTACT_NOTIFICATION_EMAIL;
const ENQUIRY_NOTIFICATION_EMAIL =
  process.env.ENQUIRY_NOTIFICATION_EMAIL ?? CONTACT_NOTIFICATION_EMAIL;

function ensureResendConfigured(to?: string) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !to) {
    console.warn(
      "[notify] Missing Resend configuration, skipping email notification."
    );
    return false;
  }
  return true;
}

async function sendResendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!ensureResendConfigured(to)) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: to.split(",").map((addr) => addr.trim()),
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend email failed: ${response.status} ${response.statusText} - ${body}`
    );
  }
}

export async function sendNewsletterNotificationEmail({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "N/A";
  await sendResendEmail({
    to: NEWSLETTER_NOTIFICATION_EMAIL ?? "",
    subject: "New newsletter subscriber",
    text: `A new subscriber just joined the list.\n\nName: ${name}\nEmail: ${email}`,
    html: `<p>A new subscriber just joined the list.</p>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`,
  });
}

export async function sendContactNotificationEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const safeMessage = message.replace(/\n/g, "<br />");
  await sendResendEmail({
    to: CONTACT_NOTIFICATION_EMAIL ?? "",
    subject: "New website contact enquiry",
    text: `New enquiry submitted on the website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<p>New enquiry submitted on the website.</p>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>Message:</strong></p>
<p>${safeMessage}</p>`,
  });
}

export async function sendArtworkEnquiryNotificationEmail({
  name,
  email,
  phone,
  message,
  artwork,
}: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  artwork: {
    title: string;
    artist?: string;
    year?: string;
    medium?: string;
    dimensions?: string;
    price?: string;
  };
}) {
  const safeMessage = message.replace(/\n/g, "<br />");
  const { title, artist, year, medium, dimensions, price } = artwork;

  const artworkLines = [
    artist ? `<p><strong>Artist:</strong> ${artist}</p>` : "",
    `<p><strong>Title:</strong> ${title}</p>`,
    year ? `<p><strong>Year:</strong> ${year}</p>` : "",
    medium ? `<p><strong>Medium:</strong> ${medium}</p>` : "",
    dimensions ? `<p><strong>Dimensions:</strong> ${dimensions}</p>` : "",
    price ? `<p><strong>Price:</strong> ${price}</p>` : "",
  ]
    .filter(Boolean)
    .join("");

  await sendResendEmail({
    to: ENQUIRY_NOTIFICATION_EMAIL ?? "",
    subject: `New artwork enquiry: ${title}`,
    text: `New artwork enquiry received.\n\nName: ${name}\nEmail: ${email}\nPhone: ${
      phone || "N/A"
    }\n\nArtwork:\n${artist ? `${artist}\n` : ""}${title}${
      year ? `, ${year}` : ""
    }\n${medium || ""}\n${dimensions || ""}\n${price || ""}\n\nMessage:\n${message}`,
    html: `<p>New artwork enquiry received.</p>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>Phone:</strong> ${phone || "N/A"}</p>
<div>${artworkLines}</div>
<p><strong>Message:</strong></p>
<p>${safeMessage}</p>`,
  });
}
