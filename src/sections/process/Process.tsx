import { useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { processIntro, processStages } from "@/data/process";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useParallax } from "@/hooks/useParallax";
import { RevealText } from "@/components/ui/RevealText";
import { CrossMark, InterfaceLabel, SectionIndex } from "@/components/ui/Decorations";

const VIEWBOX = { width: 1000, height: 300 } as const;
const MARGIN_X = 70;
const HIGH_Y = 90;
const LOW_Y = 210;

const points = processStages.map((_, index) => ({
  x: MARGIN_X + (index * (VIEWBOX.width - MARGIN_X * 2)) / (processStages.length - 1),
  y: index % 2 === 0 ? LOW_Y : HIGH_Y,
}));

/** Smooth S-curves between stages. Segments are identical, so length maps linearly to stage index. */
const pathData = points.reduce((path, point, index) => {
  if (index === 0) return `M ${point.x} ${point.y}`;
  const previous = points[index - 1]!;
  const midX = (previous.x + point.x) / 2;
  return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
}, "");

export const Process = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);
  const [reachedCount, setReachedCount] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reachedRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  useParallax(sectionRef);

  useGSAP(
    () => {
      const path = pathRef.current;
      const comet = cometRef.current;
      if (!path || !comet) return;

      // Dash in real user units: Chromium doesn't reliably scale unit-suffixed dash offsets by pathLength.
      const totalLength = path.getTotalLength();
      gsap.set(path, { strokeDasharray: totalLength });

      if (prefersReducedMotion) {
        gsap.set(path, { strokeDashoffset: 0 });
        setReachedCount(processStages.length);
        return;
      }

      gsap.fromTo(
        path,
        { strokeDashoffset: totalLength },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-process-stage]",
            start: "top 75%",
            end: "bottom 40%",
            scrub: 0.6,
            onUpdate: ({ progress }) => {
              const point = path.getPointAtLength(progress * totalLength);
              comet.setAttribute("cx", String(point.x));
              comet.setAttribute("cy", String(point.y));
              const count = Math.min(processStages.length, Math.floor(progress * (processStages.length - 1) + 1.02));
              if (count !== reachedRef.current) {
                reachedRef.current = count;
                setReachedCount(count);
              }
            },
          },
        },
      );

      gsap.from("[data-process-mobile-item]", {
        opacity: 0,
        x: -24,
        stagger: 0.1,
        duration: 0.8,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-process-mobile]", start: "top 80%", once: true },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section id="process" ref={sectionRef} className="relative py-24 md:py-32">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 -z-10 h-64 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(255_46_136/0.08),transparent_70%)]" data-speed="0.7" />
      <div className="container-frame">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionIndex index={6} label="Process" />
            <RevealText as="h2" text="From idea to shipped" variant="chars" className="heading-section mt-6" />
          </div>
          <RevealText as="p" text={processIntro} variant="blur" className="max-w-xs text-muted" />
        </div>

        <div data-process-stage className="relative mt-16 hidden aspect-[1000/300] md:block">
          <InterfaceLabel className="absolute -top-2 left-0">path.svg / 6 anchors</InterfaceLabel>
          <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d={pathData} fill="none" stroke="var(--color-line)" strokeWidth="1" strokeDasharray="4 6" />
            <path
              ref={pathRef}
              d={pathData}
              fill="none"
              stroke="var(--color-hot)"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 6px rgb(255 46 136 / 0.7))" }}
            />
            <circle ref={cometRef} r="4" cx={points[0]?.x} cy={points[0]?.y} fill="var(--color-blush)" />
          </svg>

          <ol className="absolute inset-0">
            {processStages.map((stage, index) => {
              const point = points[index]!;
              const isReached = index < reachedCount;
              const isOpen = openIndex === index;
              const detailAbove = point.y === HIGH_Y;
              return (
                <li
                  key={stage.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(point.x / VIEWBOX.width) * 100}%`, top: `${(point.y / VIEWBOX.height) * 100}%` }}
                  onMouseEnter={() => setOpenIndex(index)}
                  onMouseLeave={() => setOpenIndex(null)}
                >
                  <button
                    type="button"
                    onFocus={() => setOpenIndex(index)}
                    onBlur={() => setOpenIndex(null)}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`process-detail-${index}`}
                    className={`group flex flex-col items-center gap-2 transition-opacity duration-500 ${isReached ? "opacity-100" : "opacity-35"}`}
                  >
                    <span
                      className={`grid size-11 place-items-center rounded-full border font-mono text-xs transition-[background-color,color,border-color,transform,box-shadow] duration-500 ease-[var(--ease-spring)] group-hover:scale-110 ${
                        isReached ? "border-hot bg-ink text-hot shadow-[0_0_20px_rgb(255_46_136/0.35)]" : "border-line bg-ink text-faint"
                      } ${isOpen ? "!bg-hot !text-ink" : ""}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium">{stage.name}</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <m.p
                        id={`process-detail-${index}`}
                        initial={{ opacity: 0, y: detailAbove ? 8 : -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute left-1/2 z-10 w-48 -translate-x-1/2 rounded-lg border border-line-hot bg-surface p-3 text-center text-xs leading-relaxed text-muted ${
                          detailAbove ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]"
                        }`}
                      >
                        {stage.detail}
                      </m.p>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
          <CrossMark className="absolute bottom-0 right-0" />
        </div>

        <ol data-process-mobile className="relative mt-12 flex flex-col gap-5 border-l border-line-hot pl-6 md:hidden">
          {processStages.map((stage, index) => (
            <li key={stage.name} data-process-mobile-item className="relative">
              <span aria-hidden="true" className="absolute -left-[1.85rem] top-1 size-3 rounded-full border border-hot bg-ink" />
              <p className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-hot">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-lg font-medium">{stage.name}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{stage.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
