import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollState } from "@/lib/scrollState";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

interface SmoothScrollContextValue {
  scrollTo: (target: string | HTMLElement | number) => void;
  /** Freezes page scrolling, e.g. while a dialog is open. */
  lock: () => void;
  unlock: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

const SCROLL_DURATION_SECONDS = 1.4;
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const updateProgress = (scrollY: number) => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollState.scrollY = scrollY;
  scrollState.progress = maxScroll > 0 ? scrollY / maxScroll : 0;
};

export const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  /** Lock state outlives Lenis instances: a lock requested before Lenis exists still applies. */
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      let lastY = window.scrollY;
      const handleNativeScroll = () => {
        const y = window.scrollY;
        scrollState.velocity = y - lastY;
        if (y !== lastY) scrollState.direction = y > lastY ? 1 : -1;
        lastY = y;
        updateProgress(y);
      };
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleNativeScroll);
    }

    const lenis = new Lenis({ duration: 1.15, easing: easeOutExpo, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenisRef.current = lenis;
    if (isLockedRef.current) lenis.stop();

    lenis.on("scroll", (instance: Lenis) => {
      scrollState.velocity = instance.velocity;
      if (instance.direction === 1 || instance.direction === -1) scrollState.direction = instance.direction;
      updateProgress(instance.scroll);
      ScrollTrigger.update();
    });

    const raf = (timeSeconds: number) => lenis.raf(timeSeconds * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  const scrollTo = useCallback((target: string | HTMLElement | number) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { duration: SCROLL_DURATION_SECONDS, easing: easeOutExpo });
      return;
    }
    const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (typeof element === "number") window.scrollTo({ top: element });
    else element?.scrollIntoView();
  }, []);

  const lock = useCallback(() => {
    isLockedRef.current = true;
    lenisRef.current?.stop();
    document.documentElement.style.overflow = "hidden";
  }, []);

  const unlock = useCallback(() => {
    isLockedRef.current = false;
    document.documentElement.style.overflow = "";
    lenisRef.current?.start();
  }, []);

  const value = useMemo(() => ({ scrollTo, lock, unlock }), [scrollTo, lock, unlock]);
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
};

export const useSmoothScroll = (): SmoothScrollContextValue => {
  const context = useContext(SmoothScrollContext);
  if (!context) throw new Error("useSmoothScroll must be used inside SmoothScrollProvider");
  return context;
};
