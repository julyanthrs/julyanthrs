import { Page } from '@/components/Page';
import { RevealText } from '@/components/RevealText';
import { FloatingElement } from '@/components/FloatingElement';
import { CursorGlow, DesignAnnotation } from '@/components/DesignDetails';
import { HorizontalShowcase } from '@/components/HorizontalShowcase';
import { ProjectArchive } from '@/components/ProjectArchive';
import { Marquee } from '@/components/Marquee';
import { Footer } from '@/components/Footer';
import { PROJECTS } from '@/data/projects';
import { ProjectVisual } from '@/visuals/ProjectVisual';

const HEADER_STACK = PROJECTS.slice(0, 3);
const DISCIPLINE_WORDS = ['Fintech', 'Commerce', 'AI tools', 'Festivals', 'Mobile', 'Design systems'];

export default function WorkPage() {
  return (
    <Page title="Work">
      <section
        data-section="Work"
        aria-label="Work overview"
        className="shell relative flex min-h-[90svh] flex-col justify-end overflow-hidden pb-16 pt-32"
      >
        <CursorGlow />
        <div className="pointer-events-none absolute right-[4vw] top-[14svh] hidden h-[46svh] w-[30vw] md:block" aria-hidden="true">
          {HEADER_STACK.map((project, index) => (
            <FloatingElement
              key={project.slug}
              depth={16 + index * 14}
              scrollSpeed={20 + index * 25}
              floatSeconds={7 + index}
              className="absolute inset-0"
              style={{ transform: `translate(${index * -9}%, ${index * 14}%)` }}
              rotate={-8 + index * 7}
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 shadow-[0_40px_90px_-30px_rgba(255,45,149,0.5)]">
                <ProjectVisual variant={project.visual} label="" />
              </div>
            </FloatingElement>
          ))}
        </div>

        <DesignAnnotation label="WORK_INDEX" width={220} height={64} className="absolute left-[var(--gutter)] top-28 hidden md:block" />

        <RevealText
          as="h1"
          trigger="ready"
          lines={['Work']}
          className="display display-condensed relative text-[42vw] leading-[0.78] md:text-[30vw]"
        />
        <div className="relative mt-8 grid gap-6 md:grid-cols-12">
          <p className="font-serif text-2xl leading-snug text-petal md:col-span-5 md:text-3xl">
            Products for money, jewellery, research, music and running. Each one designed, prototyped and built with the same care.
          </p>
          <p className="annotation self-end text-muted md:col-span-3 md:col-start-10 md:text-right">
            {PROJECTS.length} case studies, {new Set(PROJECTS.map((project) => project.year)).size} years
          </p>
        </div>
      </section>

      <HorizontalShowcase />

      <div aria-hidden="true" className="border-y border-white/10 py-4">
        <Marquee items={DISCIPLINE_WORDS} className="display display-wide text-[9vw] md:text-[5vw]" />
      </div>

      <ProjectArchive />
      <Footer />
    </Page>
  );
}
