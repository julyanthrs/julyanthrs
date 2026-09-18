import { SITE } from '@/data/site';

export const PROJECT_TYPES = ['Website', 'Product design', 'Design system', 'Creative dev'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export interface ContactPayload {
  name: string;
  email: string;
  projectType: ProjectType | '';
  message: string;
}

export type ContactField = keyof ContactPayload;
export type ContactErrors = Partial<Record<ContactField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const CONTACT_LIMITS = { nameMin: 2, name: 80, email: 254, messageMin: 20, message: 2000 } as const;

export const EMPTY_CONTACT: ContactPayload = { name: '', email: '', projectType: '', message: '' };

export const normaliseContact = (payload: ContactPayload): ContactPayload => ({
  name: payload.name.trim().replace(/\s+/g, ' ').slice(0, CONTACT_LIMITS.name),
  email: payload.email.trim().toLowerCase().slice(0, CONTACT_LIMITS.email),
  projectType: PROJECT_TYPES.includes(payload.projectType as ProjectType) ? payload.projectType : '',
  message: payload.message.trim().slice(0, CONTACT_LIMITS.message),
});

export const validateContact = (raw: ContactPayload): ContactErrors => {
  const payload = normaliseContact(raw);
  const errors: ContactErrors = {};
  if (payload.name.length < CONTACT_LIMITS.nameMin) errors.name = 'Add your name so I know who to reply to.';
  if (!EMAIL_PATTERN.test(payload.email)) errors.email = 'Enter an email like you@studio.com.';
  if (!payload.projectType) errors.projectType = 'Pick the closest project type.';
  if (payload.message.length < CONTACT_LIMITS.messageMin)
    errors.message = `Tell me a little more: at least ${CONTACT_LIMITS.messageMin} characters.`;
  return errors;
};

export type SubmitResult = { ok: true; via: 'endpoint' | 'mail-client' } | { ok: false; reason: string };

/**
 * Sends JSON to VITE_CONTACT_ENDPOINT when configured (any form backend; it must
 * re-validate server-side). Without one, a pre-filled draft opens in the
 * visitor's mail client so the form still delivers a real message.
 */
export const submitContact = async (raw: ContactPayload): Promise<SubmitResult> => {
  const payload = normaliseContact(raw);
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error('[contact] endpoint rejected submission', response.status);
        return { ok: false, reason: `The server answered ${response.status}. Try again, or email ${SITE.email}.` };
      }
      return { ok: true, via: 'endpoint' };
    } catch (error) {
      console.error('[contact] submission failed', error);
      return { ok: false, reason: `The message could not be sent. Check your connection, or email ${SITE.email}.` };
    }
  }

  const subject = encodeURIComponent(`${payload.projectType} enquiry from ${payload.name}`);
  const body = encodeURIComponent(`${payload.message}\n\n${payload.name}\n${payload.email}`);
  window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  return { ok: true, via: 'mail-client' };
};
