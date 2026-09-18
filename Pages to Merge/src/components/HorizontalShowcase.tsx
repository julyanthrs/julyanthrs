import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PROJECTS, type Project } from '@/data/projects';
import { TransitionLink } from '@/providers/TransitionProvider';
import { MEDIA } from '@/lib/motion';
import { padIndex } from '@/lib/math';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import type { VisualVariant } from '@/visuals/types';

type Treatment = 'browser' | 'poster' | 'phone' | 'polaroid' | 'raw';

const TREATMENT_BY_VISUAL: Record<VisualVariant, Treatment> = {
  ledger: 'browser',
  atelier: 'polaroid',
  synapse: 'raw',
  noir: 'poster',
  pocket: 'phone',
};

const FRAME_SIZE: Record<Treatment, string> = {
  browser: 'h-[58svh] w-[82vw] md:w-[62vw] lg:w-[54vw]',
  poster: 'h-[64svh] w-[70vw] md:w-[40vw] lg:w-[34vw] md:-rotate-3',
  phone: 'h-[66svh] w-[62vw] md:w-[26vw] lg:w-[22vw]',
  polaroid: 'h-[56svh] w-[78vw] md:w-[44vw] lg:w-[38vw] md:rotate-2',
  raw: 'h-[62svh] w-[86vw] md:w-[64vw] lg:w-[58vw]',
};

function Frame({ treatment, project, children }: { treatment: Treatment; project: Project; children: ReactNode }) {
  const media = (
    <div data-transition-origin className="relative h-full w-full overflow-hidden">
      <div
        data-showcase-parallax
        className="absolute inset-y-0 -left-[8%] w-[116%] transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
      >
        {children}
      </div>
    </div>
  );

  switch (treatment) {
    case 'browser':
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-carbon">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-hot" />
            <span className="h-2.5 w-2.5 rounded-full bg-blush" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
            <span className="annotation ml-3 text-muted">{project.slug}.app</span>
          </div>
          <div className="min-h-0 flex-1">{media}</div>
        </div>
      );
    case 'phone':
      return (
        <div className="h-full overflow-hidden rounded-[3rem] border-[10px] border-carbon shadow-[0_0_0_1px_rgba(255,193,220,0.35)]">
          {media}
        </div>
      );
    case 'polaroid':
      return (
        <div className="flex h-full flex-col bg-petal p-4 pb-0 text-void shadow-2xl">
          <div className="min-h-0 flex-1">{media}</div>
          <p className="py-4 font-serif text-2xl italic">{project.tagline.split(' ').slice(0, 5).join(' ')}…</p>
        </div>
      );
    case 'poster':
      return <div className="h-full overflow-hidden outline outline-1 outline-offset-8 outline-hot">{media}</div>;
    default:
      return <div className="h-full overflow-hidden rounded-sm">{media}</div>;
  }
}

function ShowcaseItem({ project, index }: { project: Project; index: number }) {
  const treatment = TREATMENT_BY_VISUAL[project.visual];
  const titleAbove = index % 2 === 1;

  return (
    <TransitionLink
      to={`/work/${project.slug}`}
      visual={project.visual}
      data-cursor="view"
      className={`group relative flex shrink-0 snap-center flex-col gap-4 ${titleAbove ? 'md:flex-col-reverse md:pb-[6svh]' : 'md:pt-[6svh]'}`}
    >
      <div className={`relative ${FRAME_SIZE[treatment]}`}>
        <Frame treatment={treatment} project={project}>
          <ProjectVisual variant={project.visual} label={`Artwork for ${project.name}`} />
        </Frame>
        <span
          className="display display-condensed pointer-events-none absolute -top-[0.45em] right-4 text-7xl text-hot md:text-8xl"
          aria-hidden="true"
        >
          {padIndex(index + 1)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="display type-stretch text-4xl text-white group-hover:text-hot md:text-6xl">{project.name}</h3>
        <span className="annotation whitespace-nowrap text-muted">
          {project.disciplines[0]} / {project.year}
        </span>
      </div>
    </TransitionLink>
  );
}

export function HorizontalShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.tablet} and ${MEDIA.motionOk}`, () => {
        const track = trackRef.current;
        const section = sectionRef.current;
        if (!track || !section) return;
        const distance = () => track.scrollWidth - window.innerWidth;

        const horizontal = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        gsap.utils.toArray<HTMLElement>('[data-showcase-parallax]').forEach((layer) => {
          gsap.fromTo(
            layer,
            { xPercent: 6 },
            {
              xPercent: -6,
              ease: 'none',
              scrollTrigger: { trigger: layer, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true },
            },
          );
        });

        gsap.to('[data-showcase-progress]', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      data-section="Showcase"
      aria-label="Project showcase"
      className="relative overflow-hidden bg-void md:h-[100svh]"
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex h-full snap-x snap-mandatory items-center gap-[8vw] overflow-x-auto px-[var(--gutter)] py-16 will-change-transform md:snap-none md:overflow-visible md:py-0 md:pr-[20vw]"
      >
        <div className="flex shrink-0 snap-start flex-col justify-center md:w-[34vw]">
          <p className="annotation text-hot">SHOWCASE.canvas</p>
          <h2 className="display display-condensed mt-4 text-[22vw] md:text-[11vw]">
            Sideways
            <br />
            <span className="text-outline">on purpose</span>
          </h2>
          <p className="mt-6 max-w-xs font-serif text-xl italic text-petal">Keep scrolling down. The work moves across.</p>
        </div>

        {PROJECTS.map((project, index) => (
          <ShowcaseItem key={project.slug} project={project} index={index} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-8 hidden h-px bg-white/10 md:block" aria-hidden="true">
        <div data-showcase-progress className="h-full origin-left scale-x-0 bg-hot" />
      </div>
    </section>
  );
}
