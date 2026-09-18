import { useId, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CONTACT_LIMITS,
  EMPTY_CONTACT,
  PROJECT_TYPES,
  submitContact,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactPayload,
} from '@/lib/contact';
import { EASE } from '@/lib/motion';
import { SITE } from '@/data/site';
import { MagneticButton } from './MagneticButton';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface FloatingFieldProps {
  field: 'name' | 'email' | 'message';
  label: string;
  value: string;
  error?: string;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  maxLength: number;
  onChange: (field: ContactField, value: string) => void;
  onBlur: (field: ContactField) => void;
}

function FloatingField({
  field,
  label,
  value,
  error,
  multiline = false,
  type = 'text',
  autoComplete,
  maxLength,
  onChange,
  onBlur,
}: FloatingFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  const shared = {
    id,
    name: field,
    value,
    maxLength,
    autoComplete,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    onFocus: () => setFocused(true),
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(false);
      if (event.target.value) onBlur(field);
    },
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, event.target.value),
    className:
      'peer w-full resize-none bg-transparent pb-3 pt-8 font-display text-2xl text-white caret-hot outline-none placeholder:text-transparent focus-visible:outline-none md:text-3xl',
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-0 origin-left font-display transition-all duration-500 ease-out-expo ${
          raised ? 'top-0 text-xs uppercase tracking-[0.18em] text-hot' : 'top-8 text-2xl text-muted md:text-3xl'
        }`}
        // Label letters loosen slightly as the field fills, a small sign that it is listening.
        style={raised ? { letterSpacing: `${0.18 + Math.min(value.length, 40) * 0.004}em` } : undefined}
      >
        {label}
      </label>
      {multiline ? <textarea rows={4} {...shared} /> : <input type={type} {...shared} />}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-hot shadow-[0_0_18px_rgba(255,45,149,0.9)] transition-transform duration-700 ease-out-expo ${
          focused ? 'scale-x-100' : error ? 'scale-x-100 bg-flare/60' : 'scale-x-0'
        }`}
      />
      <div className="mt-2 flex min-h-5 justify-between gap-4 text-sm">
        <span id={errorId} role={error ? 'alert' : undefined} className="text-flare">
          {error}
        </span>
        {multiline && (
          <span className="annotation text-muted">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export function ContactForm() {
  const [values, setValues] = useState<ContactPayload>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const groupId = useId();

  const update = (field: ContactField, value: string) => {
    const next = { ...values, [field]: value } as ContactPayload;
    setValues(next);
    if (touched[field]) setErrors(validateContact(next));
    if (status === 'error') setStatus('idle');
  };

  const markTouched = (field: ContactField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validateContact(values));
  };

  const visibleError = (field: ContactField) => (touched[field] ? errors[field] : undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending' || status === 'sent') return;
    // Bots fill hidden fields; pretend success without sending anything.
    if (honeypot) {
      setStatus('sent');
      return;
    }
    const validation = validateContact(values);
    setErrors(validation);
    setTouched({ name: true, email: true, projectType: true, message: true });
    if (Object.keys(validation).length > 0) {
      const firstInvalid = Object.keys(validation)[0];
      document.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus('sending');
    const result = await submitContact(values);
    if (result.ok) {
      setStatus('sent');
      setValues(EMPTY_CONTACT);
      setTouched({});
    } else {
      setServerError(result.reason);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid gap-10" aria-describedby={`${groupId}-status`}>
      <div className="grid gap-10 md:grid-cols-2">
        <FloatingField
          field="name"
          label="Your name"
          value={values.name}
          error={visibleError('name')}
          autoComplete="name"
          maxLength={CONTACT_LIMITS.name}
          onChange={update}
          onBlur={markTouched}
        />
        <FloatingField
          field="email"
          label="Email"
          type="email"
          value={values.email}
          error={visibleError('email')}
          autoComplete="email"
          maxLength={CONTACT_LIMITS.email}
          onChange={update}
          onBlur={markTouched}
        />
      </div>

      <fieldset aria-describedby={visibleError('projectType') ? `${groupId}-type-error` : undefined}>
        <legend className="mb-4 font-display text-xs uppercase tracking-[0.18em] text-hot">Project type</legend>
        <div className="flex flex-wrap gap-3">
          {PROJECT_TYPES.map((type) => {
            const checked = values.projectType === type;
            return (
              <label
                key={type}
                className={`relative cursor-pointer rounded-full border px-5 py-3 text-sm font-semibold transition-all duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-flare ${
                  checked ? 'border-hot bg-hot text-void' : 'border-white/25 text-white hover:border-hot'
                }`}
              >
                <input
                  type="radio"
                  name="projectType"
                  value={type}
                  checked={checked}
                  onChange={() => {
                    update('projectType', type);
                    setTouched((current) => ({ ...current, projectType: true }));
                  }}
                  className="sr-only"
                />
                {type}
              </label>
            );
          })}
        </div>
        <p
          id={`${groupId}-type-error`}
          className="mt-2 min-h-5 text-sm text-flare"
          role={visibleError('projectType') ? 'alert' : undefined}
        >
          {visibleError('projectType')}
        </p>
      </fieldset>

      <FloatingField
        field="message"
        label="Tell me about the idea"
        multiline
        value={values.message}
        error={visibleError('message')}
        maxLength={CONTACT_LIMITS.message}
        onChange={update}
        onBlur={markTouched}
      />

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            name="company_website"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <MagneticButton
          type="submit"
          disabled={status === 'sending'}
          aria-live="polite"
          className={`min-w-[15rem] overflow-hidden !py-5 text-base ${status === 'sent' ? '!bg-petal' : ''}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={status === 'sent' ? 'sent' : status === 'sending' ? 'sending' : 'idle'}
              initial={{ y: '120%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE.outExpo }}
              className="inline-flex items-center gap-3 uppercase tracking-[0.12em]"
            >
              {status === 'sent' ? (
                <>
                  Message sent
                  <motion.svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <motion.path
                      d="M2 9.5l4.5 4.5L16 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </motion.svg>
                </>
              ) : status === 'sending' ? (
                'Sending…'
              ) : (
                <>
                  Send message <span aria-hidden="true">→</span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </MagneticButton>

        <p id={`${groupId}-status`} className="text-sm text-muted" role="status">
          {status === 'error' && <span className="text-flare">{serverError}</span>}
          {status === 'sent' && 'Thank you. I reply within two working days.'}
          {status === 'idle' && `Prefer email? ${SITE.email}`}
        </p>
      </div>
    </form>
  );
}
