import { lazy, Suspense, useCallback, useRef } from "react";
import { SceneBoundary } from "@/components/ui/SceneBoundary";
import { site } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useParallax } from "@/hooks/useParallax";
import { usePointerDepth } from "@/hooks/usePointerDepth";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { useLoading } from "@/providers/LoadingProvider";
import { loadHeroScene } from "@/three/sceneModules";
import { RevealText } from "@/components/ui/RevealText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CoordinateReadout, CrossMark, InterfaceLabel, SelectionHandles } from "@/components/ui/Decorations";

const HeroSculpture = lazy(loadHeroScene);

const SculptureFallback = () => (
  <div className="grid h-full place-items-center" aria-hidden="true">
    <span className="size-16 animate-spin rounded-sm border border-hot/40 [animation-duration:3s]" />
  </div>
);

/** Flat line-art stand-in (nested rotated polygons) shown when WebGL is unavailable. */
const StaticSculpture = () => (
  <svg viewBox="0 0 200 200" className="h-full w-full p-[14%] text-hot" fill="none" stroke="currentColor" aria-hidden="true">
    {[0, 15, 30, 45].map((rotation, index) => (
      <polygon
        key={rotation}
        points="100,18 171,59 171,141 100,182 29,141 29,59"
        strokeWidth={index === 0 ? 1.5 : 0.75}
        opacity={1 - index * 0.2}
        transform={`translate(100 100) rotate(${rotation}) scale(${1 - index * 0.12}) translate(-100 -100)`}
      />
    ))}
    <path d="M29 59 L171 141 M171 59 L29 141 M100 18 L100 182" strokeWidth="0.5" opacity="0.35" />
  </svg>
);

export const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isVisible = useInView(sectionRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const { phase, completeTask } = useLoading();
  const isRevealed = phase !== "loading";
  const handleSceneReady = useCallback(() => completeTask("scene"), [completeTask]);

  useParallax(sectionRef);
  usePointerDepth(sectionRef, !prefersReducedMotion);

  useGSAP(
    () => {
      if (prefersReducedMotion || !isRevealed) return;
      const intro = gsap.timeline({ defaults: { ease: EASE.outExpo } });
      intro
        .from("[data-hero-fade]", { opacity: 0, y: 14, duration: 1, stagger: 0.08 }, 0.2)
        .from("[data-stage-frame]", { opacity: 0, scale: 0.92, duration: 1.4 }, 0.2)
        .from("[data-hero-fragment]", { opacity: 0, scale: 0.6, duration: 1, stagger: 0.1, ease: EASE.spring }, 0.9)
        .from("[data-hero-line]", { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: EASE.inOut }, 0.4);

      gsap.to(contentRef.current, {
        yPercent: -18,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion, isRevealed] },
  );

  return (
    <section id="home" ref={sectionRef} className="relative isolate overflow-hidden pb-10 pt-28 md:pt-32">
      <div aria-hidden="true" className="absolute inset-0 -z-10" data-speed="0.6">
        <div className="grid-backdrop animate-grid-drift absolute inset-0 [mask-image:radial-gradient(ellipse_at_65%_45%,black_10%,transparent_70%)]" />
        <div className="animate-glow-drift absolute right-[8%] top-[18%] size-[36rem] rounded-full bg-hot/15 blur-[120px]" />
      </div>

      <div className="container-frame">
        <div className="grid min-h-[calc(100svh-12rem)] items-center gap-10 lg:grid-cols-12">
          <div ref={contentRef} className="relative z-10 lg:col-span-6">
            <p data-hero-fade className="meta mb-8 flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-hot/60" />
                <span className="relative size-2 rounded-full bg-hot" />
              </span>
              {site.availability}
              <span className="text-faint">/ {site.location}</span>
            </p>

            <RevealText as="p" text={site.name} variant="chars" immediate delay={0.15} className="mb-3 text-lg text-blush" />

            <h1 className="text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.98] tracking-[-0.03em]">
              <RevealText
                as="span"
                text={site.roles[0]}
                variant="mask"
                immediate
                delay={0.3}
                className="block font-bold [font-variation-settings:'wdth'_76]"
              />
              <span className="flex items-center gap-4">
                <span
                  data-hero-fade
                  aria-hidden="true"
                  className="grid size-[0.72em] shrink-0 place-items-center rounded-full border border-hot/60 font-mono text-[0.3em] text-hot"
                >
                  &amp;
                </span>
                <RevealText
                  as="span"
                  text={site.roles[1]}
                  variant="mask"
                  immediate
                  delay={0.45}
                  className="block font-light [font-variation-settings:'wdth'_100]"
                />
              </span>
            </h1>

            <span data-hero-line aria-hidden="true" className="mt-8 block h-px w-full max-w-md bg-gradient-to-r from-hot via-line-hot to-transparent" />

            <RevealText
              as="p"
              text={site.statement}
              variant="blur"
              immediate
              delay={0.7}
              className="mt-6 max-w-md text-lg leading-relaxed text-muted"
            />

            <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-5">
              <MagneticButton variant="outline" onClick={() => scrollTo("#work")}>
                Explore my work
                <ArrowIcon direction="down" className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </MagneticButton>
              <span className="meta flex items-center gap-2">
                <span className="relative block h-6 w-px overflow-hidden bg-line">
                  <span className="animate-float absolute inset-x-0 top-0 h-2 bg-hot" />
                </span>
                Scroll to explore
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div ref={stageRef} data-butterfly-anchor className="relative mx-auto aspect-square w-full max-w-[min(540px,80vw)]">
              <div data-stage-frame data-depth="0.4" className="absolute inset-[6%] rounded-[2rem] border border-dashed border-line">
                <SelectionHandles />
                <InterfaceLabel className="absolute -top-6 left-0">FRAME_01 sculpture.glb</InterfaceLabel>
                <InterfaceLabel className="absolute -bottom-6 right-0">540 × 540</InterfaceLabel>
              </div>
              <div className="absolute inset-0">
                <SceneBoundary name="hero" fallback={<StaticSculpture />}>
                  <Suspense fallback={<SculptureFallback />}>
                    <HeroSculpture
                      active={isVisible || phase === "loading"}
                      reducedMotion={prefersReducedMotion}
                      revealed={isRevealed}
                      onReady={handleSceneReady}
                    />
                  </Suspense>
                </SceneBoundary>
              </div>

              <div data-speed="1.25" className="absolute -left-2 top-[12%] hidden sm:block">
                <div data-hero-fragment data-depth="1.4" className="glass w-40 rounded-lg p-2">
                  <div className="mb-2 flex items-center gap-1" aria-hidden="true">
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} className="size-1.5 rounded-full bg-faint" />
                    ))}
                    <span className="meta ml-2 truncate text-[0.5rem]">kaimoreno.dev</span>
                  </div>
                  <div className="h-1.5 w-3/4 rounded-full bg-hot/60" />
                  <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-line" />
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((cell) => (
                      <span key={cell} className="h-4 rounded-sm bg-paper/5" />
                    ))}
                  </div>
                </div>
              </div>

              <div data-speed="0.8" className="absolute -right-1 bottom-[14%] hidden sm:block">
                <pre
                  data-hero-fragment
                  data-depth="1"
                  className="glass rounded-lg px-3 py-2 font-mono text-[0.55rem] leading-relaxed text-muted"
                  aria-hidden="true"
                >
                  <span className="text-hot">const</span> form = <span className="text-blush">useSculpt</span>({"{"}
                  {"\n"}  twist: <span className="text-paper">2.5</span>,{"\n"}  glow: <span className="text-hot">"#ff2e88"</span>
                  {"\n"}{"}"});<span className="animate-blink text-hot">▍</span>
                </pre>
              </div>

              <div data-speed="1.1" className="absolute left-[18%] -bottom-2 hidden md:block">
                <span data-hero-fragment data-depth="1.8" className="meta flex items-center gap-2 rounded-full border border-line-hot bg-ink/70 px-2.5 py-1">
                  <CrossMark /> auto-layout 24
                </span>
              </div>
              <CrossMark className="absolute right-[10%] top-[8%]" />
              <CrossMark className="absolute bottom-[6%] left-[6%]" />
            </div>
          </div>
        </div>

        <div data-hero-fade className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <CoordinateReadout />
          <InterfaceLabel className="hidden sm:inline">GRID 12</InterfaceLabel>
          <InterfaceLabel>DESIGN / BUILD / TEST</InterfaceLabel>
        </div>
      </div>
    </section>
  );
};
