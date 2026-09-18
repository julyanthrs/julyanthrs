import { useEffect, useId, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePageTransition } from '@/providers/TransitionProvider';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useInView, useTicker } from '@/hooks/useTicker';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { SPRING } from '@/lib/motion';
import { SITE } from '@/data/site';
import { RevealText } from '../RevealText';
import { FloatingElement } from '../FloatingElement';
import { DesignAnnotation } from '../DesignDetails';

const WIDTH_RANGE = { min: 62, max: 125, initial: 100 } as const;

/* ---------------- Runaway heading: flees the cursor, springs home ---------------- */

const RUNAWAY_RADIUS = 140;
const RUNAWAY_MAX_OFFSET = 90;

function RunawayText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, SPRING.magnetic);
  const y = useSpring(0, SPRING.magnetic);
  const { finePointer, reducedMotion } = useMotionPreferences();
  const inView = useInView(ref);
  const enabled = finePointer && !reducedMotion && inView;

  useEffect(() => {
    if (enabled) startPointerTracking();
  }, [enabled]);

  useTicker(() => {
    const element = ref.current;
    if (!element || !pointer.hasMoved) return;
    const rect = element.getBoundingClientRect();
    // Measure from the resting position, not the displaced one.
    const homeX = rect.left + rect.width / 2 - x.get();
    const homeY = rect.top + rect.height / 2 - y.get();
    const dx = homeX - pointer.x;
    const dy = homeY - pointer.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance > RUNAWAY_RADIUS) {
      x.set(0);
      y.set(0);
      return;
    }
    const push = Math.min(RUNAWAY_MAX_OFFSET, (RUNAWAY_RADIUS - distance) * 1.2);
    x.set((dx / distance) * push);
    y.set((dy / distance) * push);
  }, enabled);

  return (
    <motion.span ref={ref} style={{ x, y }} className="inline-block will-change-transform">
      {children}
    </motion.span>
  );
}

/* ---------------- Interface fragments ---------------- */

function BrowserFragment() {
  return (
    <div className="w-64 overflow-hidden rounded-xl border border-white/15 bg-carbon/90 shadow-[0_30px_80px_-30px_rgba(255,45,149,0.5)] backdrop-blur-sm">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        {['bg-hot', 'bg-blush', 'bg-white/30'].map((color) => (
          <span key={color} className={`h-2 w-2 rounded-full ${color}`} />
        ))}
        <span className="annotation ml-2 truncate text-muted">novareyes.studio/work</span>
      </div>
      <div className="space-y-2 p-3">
        <div className="h-16 rounded-md bg-gradient-to-br from-hot to-blush" />
        <div className="h-2 w-3/4 rounded-full bg-white/20" />
        <div className="h-2 w-1/2 rounded-full bg-white/10" />
        <div className="flex gap-2 pt-1">
          <span className="h-5 w-14 rounded-full bg-hot" />
          <span className="h-5 w-10 rounded-full border border-white/20" />
        </div>
      </div>
    </div>
  );
}

function CodeFragment() {
  return (
    <pre className="annotation w-60 overflow-hidden rounded-xl border border-hot/30 bg-void/90 p-4 text-[0.7rem] leading-relaxed text-white shadow-2xl">
      <code>
        <span className="text-blush">const</span> hero = <span className="text-hot">useMotion</span>({'{'}
        {'\n  '}stretch: <span className="text-petal">125</span>,{'\n  '}ease: <span className="text-petal">'expo.out'</span>,{'\n'}
        {'}'});
        <span className="caret ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-hot" />
      </code>
    </pre>
  );
}

function WidthControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const inputId = useId();
  return (
    <div className="w-60 rounded-xl border border-white/15 bg-carbon/95 p-4 shadow-2xl" data-cursor="drag">
      <div className="annotation mb-3 flex justify-between text-muted">
        <span>Properties</span>
        <span className="text-hot">Headline</span>
      </div>
      <label htmlFor={inputId} className="mb-2 flex items-baseline justify-between text-sm text-white">
        Letter width
        <output htmlFor={inputId} className="annotation text-blush">
          {value}
        </output>
      </label>
      <input
        id={inputId}
        type="range"
        min={WIDTH_RANGE.min}
        max={WIDTH_RANGE.max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-hot"
      />
      <p className="mt-2 text-xs text-muted">Drag it. The headline is live type.</p>
    </div>
  );
}

function CollaboratorCursor() {
  const { reducedMotion } = useMotionPreferences();
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none flex items-start"
      animate={reducedMotion ? undefined : { x: [0, 140, 60, 220, 0], y: [0, -60, 40, 10, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="20" height="22" viewBox="0 0 20 22" className="drop-shadow">
        <path d="M1 1l0 18 5-5 4 8 3-1.5-4-8h7z" fill="#FF2D95" stroke="#050505" strokeWidth="1.5" />
      </svg>
      <span className="mt-4 rounded-full bg-hot px-2 py-0.5 text-[0.7rem] font-semibold text-void">Mika, editing</span>
    </motion.div>
  );
}

/* ---------------- Hero ---------------- */

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [letterWidth, setLetterWidth] = useState<number>(WIDTH_RANGE.initial);
  const { pageReady } = usePageTransition();
  const { reducedMotion, isDesktop } = useMotionPreferences();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const fragments = gsap.utils.toArray<HTMLElement>('[data-hero-fragment]');
      gsap.set(fragments, { autoAlpha: 0, scale: 0.7, filter: 'blur(8px)' });
      if (!pageReady) return;

      gsap.to(fragments, {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.09,
        delay: 0.55,
        clearProps: 'filter',
      });

      gsap
        .timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to('[data-hero-line="creative"]', { xPercent: -16 }, 0)
        .to('[data-hero-line="developer"]', { xPercent: 12 }, 0)
        .to('[data-hero-line="designer"]', { yPercent: -160, rotate: -10 }, 0)
        .to('[data-hero-foot]', { yPercent: 60, opacity: 0 }, 0);
    },
    { scope: sectionRef, dependencies: [pageReady, reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      data-section="Hero"
      aria-label="Introduction"
      className="relative flex min-h-[100svh] flex-col overflow-x-clip pt-24 md:pt-28"
    >
      <h1 className="sr-only">{SITE.name}, creative developer and UI/UX designer</h1>

      <div className="relative flex-1" aria-hidden="true">
        <div data-hero-line="creative" className="relative z-0 -ml-[1.5vw] will-change-transform">
          <RevealText
            as="span"
            trigger="ready"
            lines={['Creative']}
            className="display display-condensed block text-[26vw] text-white md:text-[21vw] lg:text-[19vw]"
          />
        </div>

        <div
          data-hero-line="designer"
          className="relative z-20 -mt-[2vw] ml-[4vw] inline-flex w-max -rotate-3 items-center gap-2 border border-hot px-3 py-1 will-change-transform md:absolute md:right-[8vw] md:top-[24vw] md:ml-0 lg:top-[20vw]"
        >
          <span className="text-hot">✦</span>
          <RevealText
            as="span"
            trigger="ready"
            split="words"
            effect="blur"
            delay={0.6}
            lines={['UI/UX Designer']}
            className="display display-wide text-xl text-white md:text-3xl"
          />
          {['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((corner) => (
            <span key={corner} className={`absolute h-2 w-2 border border-hot bg-void ${corner}`} />
          ))}
        </div>

        <div className="pointer-events-none absolute left-[9vw] top-[21vw] hidden h-[6vw] w-px bg-blush/60 md:block">
          <span className="annotation absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap">24px</span>
        </div>

        <div
          data-hero-line="developer"
          className="text-outline relative z-20 ml-[6vw] whitespace-nowrap will-change-transform md:-mt-[1vw] md:ml-[17vw]"
          style={{ fontVariationSettings: `'wdth' ${letterWidth}` }}
        >
          <RevealText
            as="span"
            trigger="ready"
            delay={0.15}
            lines={['Developer']}
            className="display block text-[26vw] md:text-[21vw] lg:text-[19vw]"
          />
        </div>

        <div data-hero-fragment className="absolute left-[30vw] top-[38vw] z-20 hidden lg:block">
          <DesignAnnotation label="FRAME_01" width={140} height={84} />
        </div>

        <div data-hero-fragment className="absolute right-[5vw] top-[2vh] z-20 hidden lg:block">
          <FloatingElement depth={28} scrollSpeed={40} floatSeconds={8} rotate={4}>
            <BrowserFragment />
          </FloatingElement>
        </div>

        <div data-hero-fragment className="absolute bottom-[4vh] left-[4vw] z-20 origin-bottom-left scale-[0.8] md:hidden">
          <CodeFragment />
        </div>

        <div data-hero-fragment className="absolute bottom-[2vh] left-[3vw] z-20 hidden md:block">
          <FloatingElement depth={-22} scrollSpeed={-30} floatSeconds={9} rotate={-3}>
            <CodeFragment />
          </FloatingElement>
        </div>

        <div data-hero-fragment className="absolute right-[42vw] top-[31vw] z-20 hidden lg:block">
          <CollaboratorCursor />
        </div>

        <div data-hero-fragment className="absolute bottom-[14vh] right-[30vw] z-20 hidden lg:block">
          <FloatingElement depth={-40} floatSeconds={6}>
            <svg width="64" height="64" viewBox="-32 -32 64 64" aria-hidden="true">
              <path d="M0-30Q0 0 30 0Q0 0 0 30Q0 0-30 0Q0 0 0-30Z" fill="#FF4FA3" />
            </svg>
          </FloatingElement>
        </div>
      </div>

      <div data-hero-foot className="shell relative z-20 mt-10 grid gap-8 pb-8 md:grid-cols-12 md:items-end">
        <p className="max-w-sm font-serif text-2xl leading-snug text-petal md:col-span-5 md:text-3xl">
          Interfaces that feel intuitive, expressive and a little bit alive.
        </p>

        <div data-hero-fragment className="md:col-span-4 md:justify-self-center">
          <WidthControl value={letterWidth} onChange={setLetterWidth} />
        </div>

        <div className="flex items-end justify-between gap-6 md:col-span-3 md:flex-col md:items-end">
          <span className="display display-condensed text-3xl text-hot" aria-hidden="true">
            {isDesktop && !reducedMotion ? <RunawayText>Try to catch me</RunawayText> : 'Scroll to explore'}
          </span>
          <span className="flex items-center gap-3 text-sm text-muted">
            Scroll
            <span className="relative block h-10 w-px overflow-hidden bg-white/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-hot" />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
