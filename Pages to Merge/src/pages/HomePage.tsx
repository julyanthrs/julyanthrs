import { lazy, Suspense, useMemo, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Page } from '@/components/Page';
import { HeroSection } from '@/components/home/HeroSection';
import { IntroSequence } from '@/components/home/IntroSequence';
import { Marquee } from '@/components/Marquee';
import { ProjectGallery } from '@/components/ProjectGallery';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useInView } from '@/hooks/useTicker';
import { usePageTransition } from '@/providers/TransitionProvider';
import { MARQUEE_WORDS } from '@/data/site';

const Hero3D = lazy(() => import('@/components/Hero3D'));

const supportsWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

function FallbackOrb() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-[18%] rounded-full shadow-[inset_-30px_-40px_80px_rgba(255,45,149,0.55),inset_20px_30px_60px_rgba(255,255,255,0.12)]"
      style={{ background: 'radial-gradient(circle at 35% 30%, #2a2a2a 0%, #050505 55%, #3a0a22 100%)' }}
    />
  );
}

function BlobStage({ storyRef }: { storyRef: RefObject<HTMLDivElement> }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef(0);
  const { reducedMotion, lowPower, isTablet } = useMotionPreferences();
  const { pageReady } = usePageTransition();
  const storyInView = useInView(storyRef, '0px');
  const hasWebGL = useMemo(supportsWebGL, []);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const story = storyRef.current;
      if (!stage || !story) return;

      gsap.to(morphRef, {
        current: 1,
        ease: 'none',
        scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: true },
      });
      if (reducedMotion) return;

      if (pageReady)
        gsap.fromTo(stage, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.8, ease: 'expo.out', delay: 0.3 });
      else gsap.set(stage, { autoAlpha: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
        .to(stage, { yPercent: isTablet ? 8 : 20, xPercent: isTablet ? -18 : 0, scale: isTablet ? 0.8 : 0.7, ease: 'none' });
      gsap.to('[data-blob-fade]', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: story, start: 'bottom 130%', end: 'bottom 70%', scrub: true },
      });
    },
    { dependencies: [pageReady, reducedMotion, isTablet] },
  );

  const frameloop = reducedMotion ? 'demand' : storyInView ? 'always' : 'never';

  return (
    <div data-blob-fade aria-hidden="true" className="pointer-events-none fixed inset-0 z-10">
      <div
        ref={stageRef}
        className="absolute right-[-14vw] top-[27svh] h-[84vw] w-[84vw] will-change-transform md:right-[2vw] md:top-[8svh] md:h-[82svh] md:w-[56vw]"
      >
        <div className="absolute inset-[15%] rounded-full bg-hot/25 blur-[90px]" />
        {hasWebGL ? (
          <ErrorBoundary scope="hero-3d" fallback={<FallbackOrb />}>
            <Suspense fallback={<FallbackOrb />}>
              <Hero3D morphRef={morphRef} lowPower={lowPower} frameloop={frameloop} compact={!isTablet} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <FallbackOrb />
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const storyRef = useRef<HTMLDivElement>(null);

  return (
    <Page>
      <div ref={storyRef} className="relative">
        <BlobStage storyRef={storyRef} />
        <HeroSection />
        <IntroSequence />
      </div>

      <div className="relative z-30 bg-void">
        <section aria-label="Disciplines" className="-rotate-2 border-y border-white/10 bg-void py-6 md:py-10">
          <Marquee items={MARQUEE_WORDS} className="display display-condensed text-[18vw] md:text-[11vw]" />
          <div aria-hidden="true">
            <Marquee
              items={MARQUEE_WORDS}
              inverted
              baseSpeed={40}
              alternateOutline={false}
              className="display display-wide mt-2 text-[6vw] text-petal md:text-[3vw]"
            />
          </div>
        </section>
        <ProjectGallery />
        <Footer />
      </div>
    </Page>
  );
}
