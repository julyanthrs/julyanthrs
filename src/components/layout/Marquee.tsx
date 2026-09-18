import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { scrollState } from "@/lib/scrollState";
import { marqueeWords } from "@/data/site";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const BASE_SPEED_PX_PER_SECOND = 60;
const VELOCITY_BOOST = 5;
const MAX_BOOST_PX_PER_SECOND = 900;
const REPEAT_COUNT = 3;

/** Scroll-reactive marquee: direction follows scroll direction, speed follows velocity. */
export const Marquee = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion) return;

    const setX = gsap.quickSetter(track, "x", "px");
    let offset = 0;
    let smoothedVelocity = 0;

    const tick = (_time: number, deltaMs: number) => {
      const deltaSeconds = Math.min(deltaMs / 1000, 0.05);
      const loopWidth = track.scrollWidth / 2;
      if (loopWidth === 0) return;
      smoothedVelocity += (Math.abs(scrollState.velocity) - smoothedVelocity) * 0.1;
      const boost = Math.min(smoothedVelocity * VELOCITY_BOOST * 60, MAX_BOOST_PX_PER_SECOND);
      offset -= scrollState.direction * (BASE_SPEED_PX_PER_SECOND + boost) * deltaSeconds;
      offset = ((offset % loopWidth) - loopWidth) % loopWidth;
      setX(offset);
      track.style.setProperty("--skew", `${Math.max(-8, Math.min(8, scrollState.velocity * -0.4))}deg`);
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [prefersReducedMotion]);

  const sequence = Array.from({ length: REPEAT_COUNT }, () => marqueeWords).flat();

  return (
    <div className="relative overflow-hidden border-y border-line bg-surface/60 py-5" aria-label={marqueeWords.join(", ")}>
      <div ref={trackRef} className="flex w-max will-transform" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {sequence.map((word, index) => (
              <span
                key={`${copy}-${index}`}
                className="flex items-center gap-8 pr-8 text-2xl font-medium [font-variation-settings:'wdth'_80] md:text-3xl"
              >
                <span className="inline-block [transform:skewX(var(--skew,0deg))] transition-colors hover:text-hot">
                  {word}
                </span>
                <span className="text-lg text-hot">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
