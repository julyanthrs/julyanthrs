import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PROCESS_STAGES } from '@/data/site';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { EASE } from '@/lib/motion';
import { padIndex } from '@/lib/math';

type Point = readonly [number, number];

const DESKTOP_POINTS: readonly Point[] = [
  [8, 30],
  [25, 72],
  [43, 26],
  [59, 70],
  [76, 28],
  [91, 66],
];

const MOBILE_POINTS: readonly Point[] = [
  [22, 7],
  [70, 24],
  [26, 41],
  [72, 58],
  [24, 75],
  [70, 92],
];

/** Smooth S-curves between consecutive nodes, in a 0–100 coordinate space. */
const buildPath = (points: readonly Point[], vertical: boolean): string =>
  points
    .map(([x, y], index) => {
      if (index === 0) return `M ${x} ${y}`;
      const [px, py] = points[index - 1] as Point;
      return vertical
        ? `C ${px} ${(py + y) / 2}, ${x} ${(py + y) / 2}, ${x} ${y}`
        : `C ${(px + x) / 2} ${py}, ${(px + x) / 2} ${y}, ${x} ${y}`;
    })
    .join(' ');

export function ProcessMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const { isTablet, reducedMotion } = useMotionPreferences();
  const points = isTablet ? DESKTOP_POINTS : MOBILE_POINTS;
  const path = useMemo(() => buildPath(points, !isTablet), [isTablet, points]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap
        .timeline({ scrollTrigger: { trigger: rootRef.current, start: 'top 75%', end: 'bottom 60%', scrub: 0.8 } })
        .fromTo('[data-process-line]', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
        .fromTo(
          '[data-process-node]',
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'back.out(2)', duration: 0.12, stagger: 0.17 },
          0,
        );
    },
    { scope: rootRef, dependencies: [reducedMotion, isTablet] },
  );

  return (
    <section data-section="Process" aria-labelledby="process-title" className="shell relative py-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id="process-title" className="display text-[15vw] md:text-[8vw]">
          How it gets made
        </h2>
        <p className="max-w-xs text-muted">Six stages, one loop. Hover or tab through a stage to see what it produces.</p>
      </div>

      <div ref={rootRef} className="relative h-[150svh] md:h-[75vh] md:min-h-[520px]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <path
            data-process-line
            d={path}
            pathLength={1}
            strokeDasharray="1"
            fill="none"
            stroke="#FF2D95"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          {!reducedMotion && (
            <path
              d={path}
              pathLength={1}
              fill="none"
              stroke="#FFC1DC"
              strokeWidth={4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="process-pulse"
            />
          )}
        </svg>

        <ol className="contents">
          {PROCESS_STAGES.map((stage, index) => {
            const [x, y] = points[index] as Point;
            const isActive = active === index;
            const cardBelow = isTablet ? y < 50 : true;
            return (
              <li key={stage.name} className="absolute" style={{ left: `${x}%`, top: `${y}%`, zIndex: isActive ? 10 : 1 }}>
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div data-process-node>
                    <button
                      type="button"
                      aria-expanded={isActive}
                      aria-controls={`process-stage-${index}`}
                      onPointerEnter={() => setActive(index)}
                      onPointerLeave={() => setActive((current) => (current === index ? null : current))}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                      onClick={() => setActive((current) => (current === index ? null : index))}
                      className={`relative grid h-20 w-20 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-500 ease-out-expo md:h-24 md:w-24 ${
                        isActive ? 'scale-125 border-hot bg-hot text-void' : 'border-blush/50 bg-void text-white hover:border-hot'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full border border-hot [animation:pulse-ring_1.4s_ease-out_infinite]"
                        />
                      )}
                      <span className="flex flex-col items-center leading-none">
                        <span className={`annotation ${isActive ? 'text-void' : 'text-hot'}`}>{padIndex(index + 1)}</span>
                        <span className="mt-1 font-display text-xs font-bold uppercase tracking-wide md:text-sm">{stage.name}</span>
                      </span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {isActive && (
                      <div className={`absolute left-1/2 w-64 -translate-x-1/2 ${cardBelow ? 'top-full mt-6' : 'bottom-full mb-6'}`}>
                        <motion.div
                          id={`process-stage-${index}`}
                          role="region"
                          aria-label={`${stage.name} details`}
                          initial={{ opacity: 0, y: cardBelow ? -10 : 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.45, ease: EASE.outExpo }}
                          className="rounded-2xl border border-hot/40 bg-carbon p-5 shadow-2xl"
                        >
                          <p className="text-sm text-white/85">{stage.summary}</p>
                          <p className="annotation mt-3 text-hot">Output: {stage.output}</p>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
