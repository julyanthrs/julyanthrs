import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { scrollState } from "@/lib/scrollState";

/** Hairline on the right edge that grows with page progress. */
export const ScrollProgress = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const setScale = gsap.quickSetter(bar, "scaleY");
    let lastProgress = -1;
    const update = () => {
      if (scrollState.progress === lastProgress) return;
      lastProgress = scrollState.progress;
      setScale(scrollState.progress);
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed right-0 top-0 z-50 h-full w-[2px] bg-line">
      <div ref={barRef} className="h-full w-full origin-top scale-y-0 bg-hot shadow-[0_0_10px_var(--color-hot)]" />
    </div>
  );
};
