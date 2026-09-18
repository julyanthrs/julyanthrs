import { contactCopy, contactLimits } from "@/data/contact";

export interface ContactInput {
  name: string;
  email: string;
  projectType: string;
  message: string;
  /** Honeypot. Real visitors never see or fill this field. */
  company: string;
}

export type ContactField = Exclude<keyof ContactInput, "company">;
export type ContactErrors = Partial<Record<ContactField, string>>;

export type SubmitChannel = "endpoint" | "email";

export class ContactSubmitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactSubmitError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Strips control characters (except tab/newline) that have no place in a contact message.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const REQUEST_TIMEOUT_MS = 10_000;

export const sanitizeContact = (input: ContactInput): ContactInput => ({
  name: input.name.replace(CONTROL_CHARS, "").trim(),
  email: input.email.replace(CONTROL_CHARS, "").trim().toLowerCase(),
  projectType: input.projectType.trim(),
  message: input.message.replace(CONTROL_CHARS, "").trim(),
  company: input.company.trim(),
});

export const validateContact = (input: ContactInput): ContactErrors => {
  const errors: ContactErrors = {};
  if (!input.name) errors.name = "Enter your name.";
  else if (input.name.length > contactLimits.nameMax) errors.name = `Use ${contactLimits.nameMax} characters or fewer.`;

  if (!input.email) errors.email = "Enter your email address.";
  else if (input.email.length > contactLimits.emailMax || !EMAIL_PATTERN.test(input.email))
    errors.email = "Enter an email like name@example.com.";

  if (!(contactCopy.projectTypes as readonly string[]).includes(input.projectType))
    errors.projectType = "Choose a project type.";

  if (input.message.length < contactLimits.messageMin)
    errors.message = `Add a little more detail (at least ${contactLimits.messageMin} characters).`;
  else if (input.message.length > contactLimits.messageMax)
    errors.message = `Keep it under ${contactLimits.messageMax} characters.`;

  return errors;
};

const postToEndpoint = async (endpoint: string, input: ContactInput): Promise<void> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const { company: _honeypot, ...payload } = input;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new ContactSubmitError(`The server responded with ${response.status}. Try again or email directly.`);
  } catch (error) {
    if (error instanceof ContactSubmitError) throw error;
    console.error("[contact] submission failed", error);
    throw new ContactSubmitError("The message couldn't be sent. Check your connection and try again.");
  } finally {
    window.clearTimeout(timeout);
  }
};

const openEmailDraft = (recipient: string, input: ContactInput): void => {
  const subject = `${input.projectType} enquiry from ${input.name}`;
  const body = `${input.message}\n\n${input.name}\n${input.email}`;
  const link = document.createElement("a");
  link.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  link.rel = "noopener";
  link.click();
};

/**
 * Sends the message to VITE_CONTACT_ENDPOINT when configured,
 * otherwise opens a prefilled draft in the visitor's email client.
 * Server-side validation is still required at the endpoint.
 */
export const submitContact = async (input: ContactInput, recipient: string): Promise<SubmitChannel> => {
  if (input.company) return "endpoint"; // Silently accept bot submissions without sending them.
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim();
  if (endpoint) {
    await postToEndpoint(endpoint, input);
    return "endpoint";
  }
  openEmailDraft(recipient, input);
  return "email";
};
