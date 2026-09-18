import { Page } from '@/components/Page';
import { RevealText } from '@/components/RevealText';
import { FloatingElement } from '@/components/FloatingElement';
import { CursorGlow, DesignAnnotation } from '@/components/DesignDetails';
import { Notebook } from '@/components/Notebook';
import { SkillUniverse } from '@/components/SkillUniverse';
import { ProcessMap } from '@/components/ProcessMap';
import { Marquee } from '@/components/Marquee';
import { Footer } from '@/components/Footer';
import { SITE } from '@/data/site';

const BIO =
  "I'm a web developer and UI/UX designer who enjoys turning ideas into experiences that feel intentional, interactive, and memorable.";

const BIO_DETAIL = `For eight years I've worked between the design file and the codebase: running research, building design systems, and writing the TypeScript that ships them. Based in ${SITE.location}, working with teams everywhere.`;

const FACTS = ['8 years in product', '40+ launches', 'Figma to production', 'Speaks fluent easing curve'];

export default function AboutPage() {
  return (
    <Page title="About">
      <section data-section="About" aria-label="About me" className="shell relative overflow-hidden pb-24 pt-32 md:pt-40">
        <CursorGlow />
        <h1 className="sr-only">I design what I wish existed.</h1>
        <div aria-hidden="true" className="relative">
          <RevealText as="span" trigger="ready" lines={['I design']} className="display block text-[19vw] md:text-[12vw]" />
          <RevealText
            as="span"
            trigger="ready"
            effect="spread"
            delay={0.35}
            lines={['what I']}
            className="display display-wide text-outline ml-[10vw] block whitespace-nowrap text-[15vw] md:ml-[22vw] md:text-[12vw]"
          />
          <RevealText
            as="span"
            trigger="ready"
            delay={0.7}
            lines={['wish existed.']}
            className="display display-condensed block text-[19vw] text-hot md:text-[12vw]"
          />

          <FloatingElement depth={-30} scrollSpeed={-40} className="absolute right-[2vw] top-[4vw] hidden md:block" rotate={6}>
            <DesignAnnotation label="SELF_PORTRAIT" width={170} height={200} />
          </FloatingElement>
        </div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-12">
          <RevealText
            as="p"
            split="words"
            effect="blur"
            stagger={0.03}
            lines={[BIO]}
            className="font-serif text-3xl leading-snug text-petal md:col-span-7 md:text-5xl"
          />
          <div className="md:col-span-4 md:col-start-9">
            <p className="text-lg text-muted">{BIO_DETAIL}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {FACTS.map((fact) => (
                <li
                  key={fact}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:border-hot hover:text-hot"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="rotate-1 border-y border-white/10 bg-hot py-3 text-void">
        <Marquee
          items={['Curious', 'Precise', 'Playful', 'Accessible', 'Obsessive about details']}
          alternateOutline={false}
          separatorClassName="text-void"
          className="display display-condensed text-[10vw] md:text-[5vw]"
        />
      </div>

      <Notebook />
      <SkillUniverse />
      <ProcessMap />
      <Footer />
    </Page>
  );
}
