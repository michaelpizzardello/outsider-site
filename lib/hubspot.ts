const HUBSPOT_BASE_URL = "https://api.hubapi.com";

function requireToken() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_PRIVATE_APP_TOKEN is not set");
  }
  return token;
}

export class HubspotError extends Error {
  status: number;
  responseText: string;

  constructor(message: string, status: number, responseText: string) {
    super(message);
    this.name = "HubspotError";
    this.status = status;
    this.responseText = responseText;
  }
}

export async function hubspotRequest<T>(
  path: string,
  init: RequestInit & { skipJson?: boolean } = {}
): Promise<T | undefined> {
  const token = requireToken();
  const { headers, skipJson, ...rest } = init;

  const res = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new HubspotError(
      `HubSpot request failed: ${res.status} ${res.statusText}`,
      res.status,
      text
    );
  }

  if (skipJson || res.status === 204) {
    return undefined;
  }

  return (await res.json()) as T;
}

type ContactProperties = Record<string, unknown>;

export async function upsertContact(properties: ContactProperties) {
  const email = properties.email;
  if (!email || typeof email !== "string") {
    throw new Error("upsertContact requires an email string");
  }

  try {
    await hubspotRequest(
      `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
      {
      method: "PATCH",
      body: JSON.stringify({ properties }),
      }
    );
    return;
  } catch (error) {
    if (error instanceof HubspotError && error.status === 404) {
      await hubspotRequest("/crm/v3/objects/contacts", {
        method: "POST",
        body: JSON.stringify({ properties }),
      });
      return;
    }
    throw error;
  }
}

export async function updateEmailSubscriptionStatus({
  email,
  subscriptionId,
  legalBasis,
  legalBasisExplanation,
}: {
  email: string;
  subscriptionId: number;
  legalBasis?: string;
  legalBasisExplanation?: string;
}) {
  if (!email) throw new Error("email is required");

  const status: {
    id: number;
    subscribed: boolean;
    legalBasis?: string;
    legalBasisExplanation?: string;
  } = {
    id: subscriptionId,
    subscribed: true,
  };

  if (legalBasis) status.legalBasis = legalBasis;
  if (legalBasisExplanation) status.legalBasisExplanation = legalBasisExplanation;

  await hubspotRequest(
    `/communication-preferences/v3/status/email/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        subscriptionStatuses: [status],
      }),
    }
  );
}

type HubspotContactResponse = {
  id: string;
};

export async function getContactIdByEmail(
  email: string
): Promise<string | null> {
  try {
    const contact = await hubspotRequest<HubspotContactResponse>(
      `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
      { method: "GET" }
    );
    return contact?.id ?? null;
  } catch (error) {
    if (error instanceof HubspotError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createContactNote({
  contactId,
  body,
}: {
  contactId: string | null;
  body: string;
}) {
  const payload: Record<string, unknown> = {
    properties: {
      hs_note_body: body,
      hs_timestamp: new Date().toISOString(),
    },
  };

  if (contactId) {
    payload.associations = [
      {
        to: { id: contactId },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 202,
          },
        ],
      },
    ];
  }

  await hubspotRequest("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
