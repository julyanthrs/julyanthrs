import { Page } from '@/components/Page';
import { RevealText } from '@/components/RevealText';
import { ContactForm } from '@/components/ContactForm';
import { CursorGlow, DesignAnnotation } from '@/components/DesignDetails';
import { FloatingElement } from '@/components/FloatingElement';
import { Footer } from '@/components/Footer';
import { SITE, SOCIAL_LINKS } from '@/data/site';

const HEADLINE: readonly { text: string; className: string }[] = [
  { text: "Let's", className: 'text-white' },
  { text: 'make', className: 'display-wide ml-[10vw] text-outline md:ml-[24vw]' },
  { text: 'something', className: 'display-condensed text-white' },
  { text: 'weird.', className: 'ml-[18vw] text-hot md:ml-[40vw]' },
];

export default function ContactPage() {
  return (
    <Page title="Contact">
      <section data-section="Hello" aria-label="Contact" className="relative overflow-hidden pb-20 pt-32 md:pt-36">
        <CursorGlow size={820} />
        <h1 className="sr-only">Let's make something weird.</h1>
        <div aria-hidden="true" className="shell relative">
          {HEADLINE.map((line, index) => (
            <div key={line.text} className="group">
              <RevealText
                as="span"
                trigger="ready"
                delay={index * 0.12}
                lines={[line.text]}
                className={`display type-stretch block text-[21vw] leading-[0.8] md:text-[14vw] ${line.className}`}
              />
            </div>
          ))}
          <FloatingElement depth={26} scrollSpeed={30} className="absolute right-[6vw] top-[10vw] hidden md:block" rotate={-8}>
            <div className="rounded-2xl bg-hot px-5 py-4 text-void shadow-[0_30px_80px_-20px_rgba(255,45,149,0.7)]">
              <p className="display display-condensed text-3xl">Open for work</p>
              <p className="text-sm">{SITE.availability}</p>
            </div>
          </FloatingElement>
          <DesignAnnotation label="CTA_FINAL_v7" width={180} height={70} className="absolute bottom-[6vw] right-[10vw] hidden lg:block" />
        </div>
      </section>

      <section data-section="Links" aria-label="Contact links" className="shell">
        <ul className="border-t border-white/15">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
                className="group relative flex items-center justify-between gap-6 overflow-hidden border-b border-white/15 py-6 md:py-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-bottom scale-y-0 bg-hot/10 transition-transform duration-700 ease-out-expo group-hover:scale-y-100 group-focus-visible:scale-y-100"
                />
                <span className="relative flex flex-col gap-1 md:flex-row md:items-baseline md:gap-8">
                  <span className="display type-stretch origin-left text-5xl text-white group-hover:text-hot md:text-8xl">
                    {link.label}
                  </span>
                  <span className="annotation text-muted">{link.handle}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 text-2xl text-white transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-hot group-hover:bg-hot group-hover:text-void md:h-20 md:w-20 md:text-3xl"
                >
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section data-section="Form" aria-labelledby="contact-form-title" className="shell grid gap-12 py-28 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 id="contact-form-title" className="display display-condensed text-6xl md:text-7xl">
            Start a project
          </h2>
          <p className="mt-6 text-lg text-muted">
            A few details help me reply with something useful: what you are making, who it is for, and when you need it.
          </p>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <ContactForm />
        </div>
      </section>

      <Footer showCallToAction={false} />
    </Page>
  );
}
