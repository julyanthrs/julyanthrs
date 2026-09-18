import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { getNextProject, getProjectBySlug, type Project } from '@/data/projects';
import { TransitionLink } from '@/providers/TransitionProvider';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { padIndex } from '@/lib/math';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import { Page } from '@/components/Page';
import { RevealText } from '@/components/RevealText';
import { SectionReveal } from '@/components/SectionReveal';
import { TiltCard } from '@/components/TiltCard';
import { FloatingElement } from '@/components/FloatingElement';
import { CountUp, DesignAnnotation, MechanicalCounter } from '@/components/DesignDetails';
import { Footer } from '@/components/Footer';
import NotFoundPage from './NotFoundPage';

/* ---------------- Shared ---------------- */

function SectionHeading({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <MechanicalCounter value={padIndex(index)} className="display display-condensed text-4xl text-hot md:text-5xl" />
      <h2 className="display display-wide text-2xl text-white md:text-3xl">{title}</h2>
    </div>
  );
}

/* ---------------- Hero + meta ---------------- */

function CaseHero({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap
        .timeline({ scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true } })
        .fromTo(
          '[data-case-media]',
          { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
          { clipPath: 'inset(8% 5% 0% 5% round 36px)', ease: 'none' },
          0,
        )
        .fromTo('[data-case-media-inner]', { scale: 1 }, { scale: 1.18, ease: 'none' }, 0)
        .to('[data-case-title]', { yPercent: -60, ease: 'none' }, 0);
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section ref={rootRef} data-section="Intro" aria-label={`${project.name} introduction`} className="relative h-[100svh] overflow-hidden">
      <div data-case-media className="absolute inset-0 will-change-transform">
        <div data-case-media-inner className="h-full w-full">
          <ProjectVisual variant={project.visual} label={`Hero artwork for ${project.name}`} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" aria-hidden="true" />
      </div>
      <div data-case-title className="shell absolute inset-x-0 bottom-0 pb-10 will-change-transform">
        <p className="annotation text-petal">Case study, {project.year}</p>
        <RevealText as="h1" trigger="ready" lines={[project.name]} className="display mt-2 text-[19vw] text-white md:text-[13vw]" />
        <p className="mt-4 max-w-2xl font-serif text-2xl leading-snug text-petal md:text-3xl">{project.tagline}</p>
      </div>
    </section>
  );
}

function MetaStrip({ project }: { project: Project }) {
  const items = [
    { label: 'Role', value: project.role },
    { label: 'Year', value: String(project.year) },
    { label: 'Tools', value: project.tools.join(', ') },
    { label: 'Timeline', value: project.timeline },
  ];
  return (
    <dl className="shell grid grid-cols-2 gap-y-8 border-b border-white/10 py-10 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="group pr-6">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="mt-2 font-display text-lg text-white transition-colors group-hover:text-hot md:text-xl">{item.value}</dd>
          <span
            aria-hidden="true"
            className="mt-4 block h-px origin-left scale-x-[0.2] bg-hot transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
          />
        </div>
      ))}
    </dl>
  );
}

/* ---------------- Overview & problem ---------------- */

function Overview({ project }: { project: Project }) {
  return (
    <section data-section="Overview" aria-label="Overview" className="shell grid gap-10 py-28 md:grid-cols-12">
      <div className="md:sticky md:top-28 md:col-span-4 md:self-start">
        <SectionHeading index={1} title="Overview" />
      </div>
      <RevealText
        as="p"
        split="words"
        effect="blur"
        stagger={0.02}
        lines={[project.overview]}
        className="font-serif text-3xl leading-[1.2] text-white md:col-span-8 md:text-5xl"
      />
    </section>
  );
}

function Problem({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionPreferences();
  const words = project.problem.statement.split(' ');

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.fromTo(
        '[data-highlight-word]',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: '[data-highlight-root]', start: 'top 80%', end: 'bottom 45%', scrub: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section ref={rootRef} data-section="Problem" aria-label="Problem" className="shell relative overflow-hidden py-28">
      <SectionHeading index={2} title="Problem" />
      <p data-highlight-root className="display display-condensed mt-10 text-[14vw] leading-[0.88] md:text-[8.5vw]">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} data-highlight-word className="mr-[0.2em] inline-block">
            {word}
          </span>
        ))}
      </p>
      <p className="mt-10 max-w-xl text-lg text-muted md:ml-[40%]">{project.problem.detail}</p>
    </section>
  );
}

/* ---------------- Research ---------------- */

function Research({ project }: { project: Project }) {
  return (
    <section data-section="Research" aria-label="Research" className="shell relative py-28">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <SectionHeading index={3} title="Research" />
          <p className="mt-6 font-serif text-2xl text-petal md:text-3xl">{project.research.method}</p>
          <DesignAnnotation label="INSIGHTS" width={160} height={50} className="mt-10 hidden md:block" />
        </div>
        <ul className="grid gap-6 md:col-span-7">
          {project.research.findings.map((finding, index) => (
            <li key={finding} className={index === 1 ? 'md:ml-16' : index === 2 ? 'md:ml-8' : ''}>
              <FloatingElement depth={10 + index * 8} scrollSpeed={10 + index * 20} floatSeconds={0}>
                <TiltCard maxTilt={5}>
                  <div
                    className={`rounded-2xl border p-7 ${index === 1 ? 'border-transparent bg-hot text-void' : 'border-white/15 bg-carbon text-white'}`}
                  >
                    <span className={`annotation ${index === 1 ? 'text-void/70' : 'text-hot'}`}>Finding {padIndex(index + 1)}</span>
                    <p className="mt-3 font-display text-2xl leading-tight md:text-3xl">{finding}</p>
                  </div>
                </TiltCard>
              </FloatingElement>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Wireframes ---------------- */

function Wireframe({ kind }: { kind: 'phone' | 'desktop' | 'panel' }) {
  const stroke = { fill: 'none', stroke: '#FFC1DC', strokeWidth: 2, pathLength: 1, strokeDasharray: 1, 'data-wire': '' } as const;
  if (kind === 'phone') {
    return (
      <svg viewBox="0 0 200 400" className="h-full w-full" aria-hidden="true">
        <rect x="4" y="4" width="192" height="392" rx="28" {...stroke} />
        <rect x="24" y="44" width="152" height="90" rx="10" {...stroke} stroke="#FF2D95" />
        {[160, 200, 240, 280].map((y) => (
          <path key={y} d={`M24 ${y} H176 M24 ${y + 18} H120`} {...stroke} />
        ))}
        <rect x="24" y="336" width="152" height="36" rx="18" {...stroke} stroke="#FF2D95" />
      </svg>
    );
  }
  if (kind === 'desktop') {
    return (
      <svg viewBox="0 0 400 260" className="h-full w-full" aria-hidden="true">
        <rect x="4" y="4" width="392" height="252" rx="12" {...stroke} />
        <path d="M4 34 H396 M90 34 V256" {...stroke} />
        {[60, 90, 120, 150].map((y) => (
          <path key={y} d={`M20 ${y} H70`} {...stroke} />
        ))}
        <path d="M110 200 L160 150 L210 170 L270 100 L370 120" {...stroke} stroke="#FF2D95" strokeWidth={3} />
        <rect x="110" y="54" width="120" height="30" rx="6" {...stroke} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 260 220" className="h-full w-full" aria-hidden="true">
      <rect x="4" y="4" width="252" height="212" rx="16" {...stroke} />
      <circle cx="50" cy="50" r="22" {...stroke} stroke="#FF2D95" />
      <path d="M86 42 H220 M86 62 H170 M24 110 H236 M24 134 H200 M24 158 H236" {...stroke} />
      <rect x="140" y="178" width="96" height="26" rx="13" {...stroke} stroke="#FF2D95" />
    </svg>
  );
}

function Wireframes({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.fromTo(
        '[data-wire]',
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          stagger: 0.04,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 70%', end: 'center 45%', scrub: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section ref={rootRef} data-section="Wireframes" aria-label="Wireframes" className="relative overflow-hidden bg-ink py-28">
      <div className="shell grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <SectionHeading index={4} title="Wireframes" />
          <p className="mt-6 text-lg text-muted">{project.wireframes}</p>
        </div>
        <div className="relative h-[70svh] md:col-span-8 md:h-[60vh]" data-cursor="select">
          <div className="absolute left-0 top-[8%] h-[80%] w-[34%] -rotate-6">
            <Wireframe kind="phone" />
          </div>
          <div className="absolute right-0 top-0 w-[62%] rotate-2">
            <Wireframe kind="desktop" />
          </div>
          <div className="absolute bottom-0 right-[12%] w-[44%] rotate-[-3deg]">
            <Wireframe kind="panel" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Design system ---------------- */

const COPIED_RESET_MS = 1600;

function DesignSystem({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.fromTo(
        '[data-specimen]',
        { fontVariationSettings: "'wdth' 62" },
        {
          fontVariationSettings: "'wdth' 125",
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      window.setTimeout(() => setCopied((current) => (current === hex ? null : current)), COPIED_RESET_MS);
    } catch (error) {
      console.error('[design-system] clipboard unavailable', error);
    }
  };

  return (
    <section ref={rootRef} data-section="Design system" aria-label="Design system" className="shell py-28">
      <SectionHeading index={5} title="Design system" />
      <ul className="mt-12 flex h-72 gap-2 md:h-96" aria-label="Colour palette">
        {project.designSystem.swatches.map((swatch) => (
          <li
            key={swatch.hex}
            className="flex flex-1 transition-[flex-grow] duration-700 ease-out-expo hover:flex-[2.4] has-[:focus-visible]:flex-[2.4]"
          >
            <button
              type="button"
              onClick={() => copy(swatch.hex)}
              aria-label={`${swatch.name} ${swatch.hex}. Copy hex value.`}
              className="group relative flex w-full flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-4 text-left"
              style={{ backgroundColor: swatch.hex }}
            >
              <span className="w-max rounded-full bg-void/80 px-3 py-1 font-display text-sm text-white backdrop-blur" aria-live="polite">
                {copied === swatch.hex ? 'Copied' : swatch.name}
              </span>
              <span className="annotation mt-2 w-max rounded bg-void/80 px-2 py-0.5 text-petal opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {swatch.hex}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-16 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <p data-specimen className="display text-[38vw] leading-[0.75] text-white md:text-[20vw]" aria-hidden="true">
            Aa
          </p>
          <p className="mt-4 text-muted">{project.designSystem.typeface}</p>
        </div>
        <ul className="flex flex-wrap content-end gap-3 md:col-span-5">
          {project.designSystem.components.map((component, index) => (
            <li
              key={component}
              className={`cursor-default rounded-full px-5 py-3 font-display text-lg transition-transform duration-500 ease-out-expo hover:-translate-y-1 hover:rotate-[-3deg] ${index % 2 ? 'border border-hot text-hot' : 'bg-white text-void'}`}
            >
              {component}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Final UI: depth planes separate ---------------- */

function FinalUI({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap
        .timeline({ scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
        .fromTo('[data-depth-stage]', { rotateX: 28, rotateZ: -6, scale: 0.8 }, { rotateX: 12, rotateZ: 0, scale: 0.9, ease: 'none' }, 0)
        .to('[data-layer="back"]', { z: -220, y: 60, opacity: 0.75, ease: 'none' }, 0)
        .to('[data-layer="mid"]', { z: 40, ease: 'none' }, 0)
        .to('[data-layer="front"]', { z: 260, y: -80, x: 40, ease: 'none' }, 0)
        .fromTo('[data-depth-label]', { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.1, ease: 'none' }, 0.3);
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section ref={rootRef} data-section="Final UI" aria-label="Final UI" className="relative h-[240svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="shell relative z-10 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading index={6} title="Final UI" />
            <p className="mt-6 text-lg text-muted">{project.finalUI}</p>
            <ul className="annotation mt-8 space-y-2" aria-hidden="true">
              {['front: interaction layer', 'mid: content layer', 'back: atmosphere'].map((label) => (
                <li key={label} data-depth-label className="text-petal">
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[16/10] [perspective:1600px] md:col-span-8">
            <div data-depth-stage className="absolute inset-0 [transform-style:preserve-3d]">
              <div className="h-full w-full overflow-visible rounded-3xl [transform-style:preserve-3d] [&>div]:[transform-style:preserve-3d]">
                <ProjectVisual layered variant={project.visual} label={`Layered final interface for ${project.name}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Prototype ---------------- */

function Prototype({ project }: { project: Project }) {
  return (
    <section data-section="Prototype" aria-label="Prototype" className="shell grid items-center gap-16 py-28 md:grid-cols-12">
      <div className="order-2 md:order-1 md:col-span-5 md:col-start-2">
        <TiltCard maxTilt={10} className="mx-auto w-[260px]">
          <div className="relative h-[540px] overflow-hidden rounded-[2.6rem] border-[10px] border-carbon bg-void shadow-[0_0_0_1px_rgba(255,193,220,0.3),0_50px_120px_-30px_rgba(255,45,149,0.5)]">
            <div className="absolute inset-x-0 top-0 h-[200%] animate-[prototype-pan_9s_ease-in-out_infinite_alternate]">
              <div className="h-1/2">
                <ProjectVisual variant={project.visual} label={`Prototype screen for ${project.name}`} />
              </div>
              <div className="h-1/2 -scale-x-100">
                <ProjectVisual variant={project.visual} label="" />
              </div>
            </div>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-2/3 h-10 w-10 rounded-full border-2 border-petal [animation:pulse-ring_1.6s_ease-out_infinite]"
            />
          </div>
        </TiltCard>
      </div>
      <div className="order-1 md:order-2 md:col-span-5">
        <SectionHeading index={7} title="Prototype" />
        <RevealText
          as="p"
          split="words"
          effect="blur"
          lines={[project.prototype]}
          className="mt-6 font-serif text-3xl leading-snug text-petal md:text-4xl"
        />
      </div>
    </section>
  );
}

/* ---------------- Development ---------------- */

function Development({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionPreferences();
  const snippet = project.development.snippet;

  useGSAP(
    () => {
      const code = codeRef.current;
      if (!code || reducedMotion) return;
      const progress = { value: 0 };
      code.textContent = '';
      gsap.to(progress, {
        value: 1,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 70%', end: 'center 40%', scrub: true },
        onUpdate: () => {
          code.textContent = snippet.slice(0, Math.round(progress.value * snippet.length));
        },
      });
    },
    { scope: rootRef, dependencies: [reducedMotion, snippet] },
  );

  return (
    <section ref={rootRef} data-section="Development" aria-label="Development" className="relative bg-ink py-28">
      <div className="shell grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <SectionHeading index={8} title="Development" />
          <p className="mt-6 text-lg text-muted">{project.development.summary}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {project.development.stack.map((item) => (
              <li key={item} className="rounded-full border border-blush/40 px-3 py-1 text-sm text-petal">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-7">
          <TiltCard maxTilt={4}>
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-void shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-hot" />
                <span className="h-2.5 w-2.5 rounded-full bg-blush" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                <span className="annotation ml-3 text-muted">{project.slug}/core.ts</span>
              </div>
              <pre className="sr-only">{snippet}</pre>
              <pre aria-hidden="true" className="min-h-[18rem] overflow-x-auto p-6 font-mono text-sm leading-relaxed text-petal">
                <code ref={codeRef}>{snippet}</code>
                <span className="caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-hot" />
              </pre>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Results, lessons, next ---------------- */

function Results({ project }: { project: Project }) {
  return (
    <section data-section="Results" aria-label="Results" className="shell py-28">
      <SectionHeading index={9} title="Results" />
      <dl className="mt-12 grid gap-10 md:grid-cols-3">
        {project.results.map((metric, index) => (
          <div
            key={metric.label}
            className={`flex flex-col-reverse border-t border-white/15 pt-6 ${index === 1 ? 'md:mt-24' : index === 2 ? 'md:mt-12' : ''}`}
          >
            <dt className="mt-2 text-lg text-white">{metric.label}</dt>
            <dd className="display display-condensed text-[26vw] text-hot md:text-[11vw]">
              <CountUp value={metric.value} decimals={metric.decimals} prefix={metric.prefix} suffix={metric.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Lessons({ project }: { project: Project }) {
  return (
    <section data-section="Lessons" aria-label="Lessons learned" className="shell py-20">
      <SectionHeading index={10} title="Lessons learned" />
      <ol className="mt-10">
        {project.lessons.map((lesson) => (
          <li key={lesson} className="group relative border-b border-white/10 py-8">
            <p className="font-serif text-3xl text-white transition-transform duration-700 ease-out-expo group-hover:translate-x-4 md:text-5xl">
              {lesson}
            </p>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-hot transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function NextProject({ project }: { project: Project }) {
  const next = getNextProject(project.slug);
  return (
    <section aria-label="Next project" className="relative overflow-hidden">
      <TransitionLink
        to={`/work/${next.slug}`}
        visual={next.visual}
        data-cursor="explore"
        className="shell group relative block py-24 md:py-32"
      >
        <SectionReveal variant="wipe" className="absolute inset-0 opacity-30 transition-opacity duration-700 group-hover:opacity-60">
          <div data-transition-origin className="h-full w-full">
            <ProjectVisual variant={next.visual} label="" />
          </div>
        </SectionReveal>
        <div className="relative">
          <span className="font-serif text-2xl italic text-petal">Next project</span>
          <span className="display type-stretch mt-3 block text-[18vw] text-white group-hover:text-hot md:text-[12vw]">{next.name}</span>
          <span className="mt-4 block max-w-lg text-muted">{next.tagline}</span>
        </div>
      </TransitionLink>
    </section>
  );
}

function CaseStudy({ project }: { project: Project }) {
  return (
    <Page title={project.name}>
      <CaseHero project={project} />
      <MetaStrip project={project} />
      <Overview project={project} />
      <Problem project={project} />
      <Research project={project} />
      <Wireframes project={project} />
      <DesignSystem project={project} />
      <FinalUI project={project} />
      <Prototype project={project} />
      <Development project={project} />
      <Results project={project} />
      <Lessons project={project} />
      <NextProject project={project} />
      <Footer />
    </Page>
  );
}

export default function CaseStudyPage() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);
  if (!project) return <NotFoundPage />;
  // Keyed so every animation and trigger resets cleanly between case studies.
  return <CaseStudy key={project.slug} project={project} />;
}
