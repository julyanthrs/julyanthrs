import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PROJECTS, type Project } from '@/data/projects';
import { TransitionLink } from '@/providers/TransitionProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { padIndex } from '@/lib/math';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import { RevealText } from './RevealText';
import { TiltCard } from './TiltCard';
import { MechanicalCounter } from './DesignDetails';

type PanelLayout = 'right' | 'left' | 'full' | 'offset';

/** Each project gets its own composition so the stack never repeats itself. */
const LAYOUTS: readonly PanelLayout[] = ['right', 'left', 'full', 'offset', 'right'];

const VISUAL_WRAPPER: Record<PanelLayout, string> = {
  right: 'md:col-start-6 md:col-span-7 md:row-start-1 aspect-[16/11] md:rotate-[1.5deg]',
  left: 'md:col-start-1 md:col-span-7 md:row-start-1 aspect-[16/11] md:-rotate-[1.5deg]',
  full: 'md:col-span-12 md:row-start-1 aspect-[16/9] md:aspect-[21/9]',
  offset: 'md:col-start-4 md:col-span-6 md:row-start-1 aspect-[4/5] md:aspect-[5/6] md:max-h-[72svh] md:justify-self-center',
};

const TEXT_WRAPPER: Record<PanelLayout, string> = {
  right: 'md:col-start-1 md:col-span-5 md:row-start-1 md:self-end',
  left: 'md:col-start-8 md:col-span-5 md:row-start-1 md:self-start md:text-right',
  full: 'md:col-span-12 md:row-start-1 md:self-end md:mix-blend-difference md:p-10',
  offset: 'md:col-start-1 md:col-span-12 md:row-start-1 md:self-center',
};

function ProjectPanel({ project, index }: { project: Project; index: number }) {
  const layout = LAYOUTS[index % LAYOUTS.length] as PanelLayout;
  const label = `${project.name} case study`;

  return (
    <article
      data-gallery-panel
      className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden border-t border-white/10 bg-void transition-colors duration-700 hover:bg-[#12050c]"
      style={{ zIndex: index + 1 }}
      aria-labelledby={`project-title-${project.slug}`}
    >
      <div data-gallery-inner className="shell relative w-full origin-top py-20 will-change-transform">
        <div data-gallery-dim aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 bg-void opacity-0" />

        <TransitionLink
          to={`/work/${project.slug}`}
          visual={project.visual}
          className="group grid gap-6 md:grid-cols-12 md:gap-8"
          data-cursor="view"
          aria-label={label}
        >
          <div className={`relative w-full ${VISUAL_WRAPPER[layout]}`}>
            <TiltCard maxTilt={6} className="h-full w-full">
              <div
                data-transition-origin
                className="relative h-full w-full overflow-hidden rounded-[1.25rem] border border-white/10 shadow-[0_40px_120px_-40px_rgba(255,45,149,0.45)]"
              >
                <div className="h-full w-full transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]">
                  <ProjectVisual variant={project.visual} label={`Abstract artwork for ${project.name}`} />
                </div>
              </div>
            </TiltCard>
          </div>

          <div className={`relative z-20 ${TEXT_WRAPPER[layout]} ${layout === 'offset' ? 'pointer-events-none' : ''}`}>
            <div className={`flex items-baseline gap-4 ${layout === 'left' ? 'md:justify-end' : ''}`}>
              <MechanicalCounter value={padIndex(index + 1)} className="display display-condensed text-5xl text-hot md:text-7xl" />
              <span className="annotation text-muted">/ {padIndex(PROJECTS.length)}</span>
            </div>
            <h3
              id={`project-title-${project.slug}`}
              className={`display type-stretch mt-3 text-[15vw] text-white transition-transform duration-700 ease-out-expo group-hover:translate-x-6 md:text-[7.5vw] ${
                layout === 'offset' ? 'md:text-center md:text-[11vw] md:mix-blend-difference' : ''
              }`}
            >
              {project.name}
            </h3>
            <div
              className={`mt-5 flex flex-wrap gap-2 ${layout === 'left' ? 'md:justify-end' : ''} ${layout === 'offset' ? 'md:justify-center' : ''}`}
            >
              {project.disciplines.map((discipline) => (
                <span key={discipline} className="rounded-full border border-blush/40 px-3 py-1 text-xs text-petal">
                  {discipline}
                </span>
              ))}
              <span className="rounded-full bg-hot px-3 py-1 text-xs font-semibold text-void">{project.year}</span>
            </div>
            <p
              className={`mt-5 max-w-md text-muted ${layout === 'left' ? 'md:ml-auto' : ''} ${layout === 'offset' ? 'md:mx-auto md:text-center' : ''}`}
            >
              {project.tagline}
            </p>
          </div>
        </TransitionLink>
      </div>
    </article>
  );
}

export function ProjectGallery() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const panels = gsap.utils.toArray<HTMLElement>('[data-gallery-panel]');
      // As the next panel slides over, the covered one recedes into depth.
      panels.slice(0, -1).forEach((panel, index) => {
        const next = panels[index + 1];
        gsap
          .timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } })
          .to(panel.querySelector('[data-gallery-inner]'), { scale: 0.88, yPercent: -4, rotate: index % 2 ? 1.5 : -1.5, ease: 'none' }, 0)
          .to(panel.querySelector('[data-gallery-dim]'), { opacity: 0.7, ease: 'none' }, 0);
      });
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section ref={rootRef} data-section="Selected work" aria-label="Selected work" className="relative z-30 bg-void">
      <header className="shell flex flex-col gap-6 pb-16 pt-28 md:flex-row md:items-end md:justify-between">
        <RevealText
          as="h2"
          lines={['Selected', 'work']}
          lineClassName={(index) => (index === 1 ? 'ml-[12vw] text-outline' : '')}
          className="display text-[20vw] md:text-[13vw]"
        />
        <div className="max-w-xs md:pb-6">
          <p className="font-serif text-2xl italic text-petal">Five products, each built from first sketch to shipped code.</p>
        </div>
      </header>

      <div className="relative">
        {PROJECTS.map((project, index) => (
          <ProjectPanel key={project.slug} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
