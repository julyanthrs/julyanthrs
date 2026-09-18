import { useCallback, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import {
  ContactSubmitError,
  sanitizeContact,
  submitContact,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactInput,
  type SubmitChannel,
} from "@/lib/contact";
import { site } from "@/data/site";

export type SubmitStatus = "idle" | "submitting" | "sent" | "error";

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const EMPTY_FORM: ContactInput = { name: "", email: "", projectType: "", message: "", company: "" };
const GENERIC_ERROR = "Something went wrong. Please try again or email me directly.";

const isFormKey = (name: string): name is keyof ContactInput => Object.hasOwn(EMPTY_FORM, name);
const isValidatedField = (name: keyof ContactInput): name is ContactField => name !== "company";

export interface ContactFormState {
  values: ContactInput;
  errors: ContactErrors;
  status: SubmitStatus;
  channel: SubmitChannel | null;
  submitError: string | null;
  handleChange: (event: ChangeEvent<FieldElement>) => void;
  handleBlur: (event: FocusEvent<FieldElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
}

/**
 * Owns the contact form lifecycle: controlled values, validation on blur/submit,
 * async submission with a guarded single in-flight request, and result state.
 */
export const useContactForm = (): ContactFormState => {
  const [values, setValues] = useState<ContactInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [channel, setChannel] = useState<SubmitChannel | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const touchedRef = useRef<Set<ContactField>>(new Set());
  const inFlightRef = useRef(false);

  const revalidateField = useCallback((field: ContactField, next: ContactInput) => {
    const message = validateContact(sanitizeContact(next))[field];
    setErrors((current) => {
      if (current[field] === message) return current;
      const updated = { ...current };
      if (message) updated[field] = message;
      else delete updated[field];
      return updated;
    });
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<FieldElement>) => {
      const { name, value } = event.target;
      if (!isFormKey(name)) return;
      const next = { ...values, [name]: value };
      setValues(next);
      // Only re-check fields the visitor already left, so errors don't appear mid-typing.
      if (isValidatedField(name) && touchedRef.current.has(name)) revalidateField(name, next);
      if (status === "error") setStatus("idle");
    },
    [revalidateField, status, values],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<FieldElement>) => {
      const { name } = event.target;
      if (!isFormKey(name) || !isValidatedField(name)) return;
      touchedRef.current.add(name);
      revalidateField(name, values);
    },
    [revalidateField, values],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (inFlightRef.current || status === "sent") return;

      const clean = sanitizeContact(values);
      const validation = validateContact(clean);
      setErrors(validation);
      const invalidFields = Object.keys(validation) as ContactField[];
      invalidFields.forEach((field) => touchedRef.current.add(field));

      const firstInvalid = invalidFields[0];
      if (firstInvalid) {
        event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
        return;
      }

      inFlightRef.current = true;
      setStatus("submitting");
      setSubmitError(null);
      try {
        const result = await submitContact(clean, site.email);
        setChannel(result);
        setStatus("sent");
      } catch (error) {
        setSubmitError(error instanceof ContactSubmitError ? error.message : GENERIC_ERROR);
        setStatus("error");
      } finally {
        inFlightRef.current = false;
      }
    },
    [status, values],
  );

  const reset = useCallback(() => {
    touchedRef.current.clear();
    setValues(EMPTY_FORM);
    setErrors({});
    setChannel(null);
    setSubmitError(null);
    setStatus("idle");
  }, []);

  return { values, errors, status, channel, submitError, handleChange, handleBlur, handleSubmit, reset };
};
