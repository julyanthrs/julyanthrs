import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Page } from '@/components/Page';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DesignAnnotation } from '@/components/DesignDetails';
import { useInView } from '@/hooks/useTicker';
import { usePageTransition } from '@/providers/TransitionProvider';
import { padIndex } from '@/lib/math';
import { GradientMesh, MouseTrail, ParticleField, PhysicsDrop } from '@/experiments/CanvasExperiments';
import { DragCube, LiquidCursor, MagneticField, NoiseDistortion, ProximityType, TypeMachine } from '@/experiments/DomExperiments';

const WebGLField = lazy(() => import('@/experiments/WebGLField'));

interface Experiment {
  id: string;
  title: string;
  instruction: string;
  tech: string;
  span: string;
  render: (active: boolean) => ReactNode;
}

const EXPERIMENTS: readonly Experiment[] = [
  {
    id: 'liquid',
    title: 'Liquid cursor',
    instruction: 'Move through the frame and watch the goo follow.',
    tech: 'SVG filters',
    span: 'md:col-span-7',
    render: (active) => <LiquidCursor active={active} />,
  },
  {
    id: 'cube',
    title: 'Pocket cube',
    instruction: 'Drag to spin. Arrow keys work too.',
    tech: 'CSS 3D',
    span: 'md:col-span-5 md:translate-y-16',
    render: (active) => <DragCube active={active} />,
  },
  {
    id: 'type',
    title: 'Type machine',
    instruction: 'Type. Every letter gets its own width and weight.',
    tech: 'Variable fonts',
    span: 'md:col-span-5',
    render: () => <TypeMachine />,
  },
  {
    id: 'particles',
    title: 'Particle field',
    instruction: 'Hover to scatter. Hold down for a bigger wave.',
    tech: 'Canvas 2D',
    span: 'md:col-span-7 md:translate-y-10',
    render: (active) => <ParticleField active={active} />,
  },
  {
    id: 'magnetic',
    title: 'Magnetic buttons',
    instruction: 'Get close. Each button pulls with a different strength.',
    tech: 'Spring physics',
    span: 'md:col-span-4',
    render: () => <MagneticField />,
  },
  {
    id: 'distortion',
    title: 'Noise distortion',
    instruction: 'Move fast across the poster to bend it.',
    tech: 'feDisplacementMap',
    span: 'md:col-span-4 md:-translate-y-8',
    render: (active) => <NoiseDistortion active={active} />,
  },
  {
    id: 'proximity',
    title: 'Proximity type',
    instruction: 'Letters widen and thicken as your pointer gets closer.',
    tech: 'Font variations',
    span: 'md:col-span-4',
    render: (active) => <ProximityType active={active} />,
  },
  {
    id: 'webgl',
    title: 'Pillar field',
    instruction: 'Move across the grid to raise the pillars.',
    tech: 'Three.js instancing',
    span: 'md:col-span-8',
    render: (active) => <WebGLField active={active} />,
  },
  {
    id: 'physics',
    title: 'Gravity drop',
    instruction: 'Click or tap anywhere to drop a ball.',
    tech: 'Verlet-ish physics',
    span: 'md:col-span-4 md:translate-y-12',
    render: (active) => <PhysicsDrop active={active} />,
  },
  {
    id: 'trail',
    title: 'Ribbon trail',
    instruction: 'Draw with your pointer. It wanders on its own when you leave.',
    tech: 'Canvas 2D',
    span: 'md:col-span-6',
    render: (active) => <MouseTrail active={active} />,
  },
  {
    id: 'mesh',
    title: 'Gradient mesh',
    instruction: 'Hover and the colours drift toward you at different speeds.',
    tech: 'Additive blending',
    span: 'md:col-span-6',
    render: (active) => <GradientMesh active={active} />,
  },
];

function ExperimentFrame({ experiment, index }: { experiment: Experiment; index: number }) {
  const frameRef = useRef<HTMLElement>(null);
  const nearView = useInView(frameRef, '300px');
  const inView = useInView(frameRef, '0px');
  const [mounted, setMounted] = useState(false);

  // Mount once when approaching, then only pause/resume. Keeps state while scrolling back.
  useEffect(() => {
    if (nearView) setMounted(true);
  }, [nearView]);

  const fallback = (
    <p className="grid h-full place-items-center p-6 text-center text-sm text-muted">
      This experiment needs a browser feature your device doesn't support.
    </p>
  );

  return (
    <article
      ref={frameRef}
      aria-labelledby={`experiment-${experiment.id}`}
      className={`group relative transition-transform duration-700 ${experiment.span}`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={`experiment-${experiment.id}`} className="flex items-baseline gap-3">
          <span className="annotation text-hot">{padIndex(index + 1)}</span>
          <span className="display type-stretch text-2xl text-white group-hover:text-hot md:text-3xl">{experiment.title}</span>
        </h2>
        <span className="annotation whitespace-nowrap text-muted">{experiment.tech}</span>
      </div>
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-white/10 bg-void transition-[border-color,box-shadow] duration-500 group-hover:border-hot/60 group-hover:shadow-[0_0_60px_-20px_rgba(255,45,149,0.6)] md:h-[400px]">
        {mounted ? (
          <ErrorBoundary scope={`experiment-${experiment.id}`} fallback={fallback}>
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-carbon" />}>{experiment.render(inView)}</Suspense>
          </ErrorBoundary>
        ) : (
          <div className="h-full w-full bg-carbon" aria-hidden="true" />
        )}
        {['left-2 top-2', 'right-2 top-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((corner) => (
          <span key={corner} aria-hidden="true" className={`pointer-events-none absolute h-2 w-2 border border-hot/60 ${corner}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{experiment.instruction}</p>
    </article>
  );
}

const TITLE = 'Playground';

export default function PlaygroundPage() {
  const { pageReady } = usePageTransition();

  return (
    <Page title="Playground">
      <section data-section="Lab" aria-label="Playground introduction" className="shell relative pb-16 pt-32 md:pt-40">
        <h1 className="display display-condensed text-[23vw] leading-[0.8] md:text-[17vw]" aria-label={TITLE}>
          {Array.from(TITLE).map((letter, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`group inline-block transition-[transform,opacity] duration-1000 ease-out-expo ${pageReady ? 'translate-y-0 opacity-100' : 'translate-y-1/2 opacity-0'}`}
              style={{ transitionDelay: `${index * 45}ms` }}
            >
              <span
                className={`type-stretch inline-block hover:-translate-y-4 ${index % 3 === 1 ? 'text-outline' : 'text-white'} hover:text-hot`}
              >
                {letter}
              </span>
            </span>
          ))}
        </h1>
        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <p className="font-serif text-2xl text-petal md:col-span-6 md:text-3xl">
            A creative coding lab. Small interactions I build to test ideas before they end up in real products. Everything here is
            playable.
          </p>
          <div className="md:col-span-4 md:col-start-9 md:justify-self-end">
            <DesignAnnotation label="LAB_BENCH" width={200} height={56} />
            <p className="mt-8 text-sm text-muted">One more secret lives in the logo. It takes a little persistence.</p>
          </div>
        </div>
      </section>

      <section data-section="Experiments" aria-label="Experiments" className="shell grid gap-x-8 gap-y-20 pb-40 md:grid-cols-12">
        {EXPERIMENTS.map((experiment, index) => (
          <ExperimentFrame key={experiment.id} experiment={experiment} index={index} />
        ))}
      </section>

      <Footer />
    </Page>
  );
}
