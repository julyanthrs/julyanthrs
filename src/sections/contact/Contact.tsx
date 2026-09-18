import { useRef } from "react";
import { contactCopy, contactLimits } from "@/data/contact";
import { site, socialLinks } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { BREAKPOINT, DURATION, EASE, REVEAL_START, STAGGER } from "@/lib/motion";
import { useParallax } from "@/hooks/useParallax";
import { usePointerDepth } from "@/hooks/usePointerDepth";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CrossMark, InterfaceLabel, SectionIndex, SelectionHandles } from "@/components/ui/Decorations";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";
import { useContactForm } from "./useContactForm";

/** Horizontal drift (px) each headline line travels while the section scrolls past. */
const LINE_DRIFT_PX = [-24, 36, -12] as const;
/** Remaining characters below which the message counter turns pink. */
const MESSAGE_COUNTER_WARNING = 200;

const SENT_NOTE = {
  endpoint: "Thanks! Your message is in. Expect a reply within two working days.",
  email: "Your email app opened with the message ready. Hit send there to finish.",
} as const;

const ContactHeadline = () => (
  <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-[0.98] [font-variation-settings:'wdth'_82]">
    {contactCopy.headlineLines.map((line, index) => (
      <span key={line} data-line-drift={index} className="block will-transform">
        <span className="block overflow-hidden pb-[0.06em]">
          <span data-line className={`block will-transform ${index === contactCopy.headlineLines.length - 1 ? "text-hot" : ""}`}>
            {line}
          </span>
        </span>
      </span>
    ))}
  </h2>
);

const SocialList = () => (
  <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
    {socialLinks.map((link) => (
      <li key={link.label} data-contact-item>
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="hover"
          className="group flex h-full items-center justify-between gap-3 bg-ink px-4 py-4 transition-colors duration-300 hover:bg-surface-raised focus-visible:bg-surface-raised"
        >
          <span className="flex flex-col">
            <span className="text-sm text-paper transition-transform duration-300 group-hover:translate-x-1">{link.label}</span>
            <span className="meta mt-0.5 text-faint transition-colors duration-300 group-hover:text-blush">{link.handle}</span>
          </span>
          <span className="grid size-7 place-items-center rounded-full border border-line text-muted transition-all duration-300 group-hover:rotate-45 group-hover:border-hot group-hover:bg-hot group-hover:text-ink">
            <ArrowIcon direction="up-right" className="size-3" />
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
    ))}
  </ul>
);

const ContactForm = () => {
  const form = useContactForm();
  const { values, errors, status } = form;
  const remaining = contactLimits.messageMax - values.message.length;

  return (
    <form noValidate onSubmit={form.handleSubmit} className="relative flex flex-col gap-6" aria-describedby="contact-form-status">
      <div className="grid gap-6 sm:grid-cols-2">
        <div data-field>
          <FormField kind="input" type="text" name="name" label="Name" autoComplete="name" maxLength={contactLimits.nameMax} value={values.name} error={errors.name} onChange={form.handleChange} onBlur={form.handleBlur} />
        </div>
        <div data-field>
          <FormField kind="input" type="email" name="email" label="Email" autoComplete="email" maxLength={contactLimits.emailMax} value={values.email} error={errors.email} onChange={form.handleChange} onBlur={form.handleBlur} />
        </div>
      </div>
      <div data-field>
        <FormField kind="select" name="projectType" label="Project type" options={contactCopy.projectTypes} value={values.projectType} error={errors.projectType} onChange={form.handleChange} onBlur={form.handleBlur} />
      </div>
      <div data-field className="relative">
        <FormField kind="textarea" name="message" label="Message" maxLength={contactLimits.messageMax} value={values.message} error={errors.message} onChange={form.handleChange} onBlur={form.handleBlur} />
        <span aria-hidden="true" className={`meta absolute right-0 top-0 transition-colors ${remaining < MESSAGE_COUNTER_WARNING ? "text-hot" : "text-faint"}`}>
          {values.message.length}/{contactLimits.messageMax}
        </span>
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to naive bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={values.company} onChange={form.handleChange} />
      </div>

      <div data-field className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
        <SubmitButton status={status} />
        <p id="contact-form-status" role="status" aria-live="polite" className="min-h-5 max-w-xs text-xs text-muted">
          {status === "sent" && form.channel && SENT_NOTE[form.channel]}
          {status === "error" && <span className="text-hot">{form.submitError}</span>}
        </p>
        {status === "sent" && (
          <button type="button" onClick={form.reset} className="link-underline meta text-blush" data-cursor="hover">
            Send another
          </button>
        )}
      </div>
    </form>
  );
};

export const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  useParallax(sectionRef);
  usePointerDepth(sectionRef, !prefersReducedMotion);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      const section = sectionRef.current;
      const revealTrigger = { trigger: section, start: REVEAL_START, once: true };

      const intro = gsap.timeline({ scrollTrigger: revealTrigger, defaults: { ease: EASE.outExpo } });
      intro
        .from("[data-line]", { yPercent: 115, rotate: 3, duration: DURATION.reveal, stagger: STAGGER.items })
        .from("[data-contact-item]", { y: 24, opacity: 0, duration: DURATION.base, stagger: STAGGER.items / 2 }, "-=0.8")
        .fromTo(
          "[data-form-card]",
          { clipPath: "inset(18% 10% 18% 10% round 28px)", opacity: 0 },
          { clipPath: "inset(0% 0% 0% 0% round 28px)", opacity: 1, duration: DURATION.reveal, ease: EASE.inOut },
          0.2,
        )
        .from("[data-field]", { y: 20, opacity: 0, duration: DURATION.base, stagger: STAGGER.items }, 0.6);

      // Sideways drift reads as editorial on wide screens but as misalignment on phones.
      gsap.matchMedia().add(BREAKPOINT.desktop, () => {
        gsap.utils.toArray<HTMLElement>("[data-line-drift]").forEach((line, index) => {
          gsap.fromTo(
            line,
            { x: -(LINE_DRIFT_PX[index] ?? 0) },
            { x: LINE_DRIFT_PX[index] ?? 0, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
      });

      gsap.fromTo(
        "[data-form-stage]",
        { rotateX: 12, transformPerspective: 1400, transformOrigin: "50% 100%" },
        { rotateX: 0, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: true } },
      );
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section id="contact" ref={sectionRef} className="relative isolate overflow-hidden py-24 md:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div data-speed="0.7" className="absolute inset-0">
          {/* Pointer depth (inline transform) and CSS drift (keyframed transform) sit on separate nodes so neither overrides the other. */}
          <div data-depth="1.4" className="absolute -right-32 top-1/4 size-[36rem]">
            <div className="size-full rounded-full bg-hot/20 blur-[120px] animate-glow-drift" />
          </div>
          <div data-depth="0.8" className="absolute -left-40 bottom-0 size-[28rem]">
            <div className="size-full rounded-full bg-blush/10 blur-[110px] animate-glow-drift [animation-delay:-6s]" />
          </div>
        </div>
        <div className="grid-backdrop absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_70%_50%,black,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
      </div>

      <div className="container-frame grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <SectionIndex index={8} label="Contact" />
          <ContactHeadline />
          <p data-contact-item className="mt-6 max-w-sm text-muted">
            {contactCopy.message}
          </p>
          <div data-contact-item className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-paper">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-hot animate-blink" />
              {site.availability}
            </span>
            <a href={`mailto:${site.email}`} className="link-underline text-sm text-blush" data-cursor="hover">
              {site.email}
            </a>
          </div>
          <SocialList />
        </div>

        <div className="relative lg:col-span-5 lg:col-start-8" data-speed="1.06">
          <div data-form-stage className="relative">
            <CrossMark className="absolute -left-4 -top-4" />
            <CrossMark className="absolute -bottom-4 -right-4" />
            <div data-form-card className="glass group/form relative rounded-[28px] p-6 transition-shadow duration-500 focus-within:shadow-[0_0_60px_-12px_rgb(255_46_136/0.45)] sm:p-9">
              <SelectionHandles className="opacity-0 transition-opacity duration-300 group-focus-within/form:opacity-100" />
              <div className="mb-4 flex items-center justify-between">
                <InterfaceLabel>FORM_08 / new_message</InterfaceLabel>
                <InterfaceLabel>{site.location}</InterfaceLabel>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
