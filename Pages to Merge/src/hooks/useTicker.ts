import { useEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from 'gsap';

type TickerCallback = (time: number, deltaMs: number) => void;

/**
 * Subscribes to the single GSAP ticker (which also drives Lenis), so every
 * per-frame effect shares one requestAnimationFrame loop.
 */
export const useTicker = (callback: TickerCallback, enabled = true): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const tick: TickerCallback = (time, deltaMs) => callbackRef.current(time, deltaMs);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [enabled]);
};

/** True while the element intersects the viewport (with margin); used to pause offscreen work. */
export const useInView = <T extends Element>(ref: RefObject<T>, rootMargin = '120px'): boolean => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
};
