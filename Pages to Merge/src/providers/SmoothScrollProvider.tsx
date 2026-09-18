import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { clamp } from '@/lib/math';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface ScrollState {
  /** Pixels per frame, positive when scrolling down */
  velocity: number;
  direction: 1 | -1;
}

interface SmoothScrollApi {
  /** Mutable, read inside tickers — never triggers renders. */
  state: ScrollState;
  scrollTo: (target: number | HTMLElement, options?: { immediate?: boolean; offset?: number }) => void;
  lock: () => void;
  unlock: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

const LENIS_DURATION = 1.15;
const MAX_VELOCITY = 80;
const VELOCITY_DECAY = 0.9;

const expoOut = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);
  const lenisRef = useRef<Lenis | null>(null);
  const state = useRef<ScrollState>({ velocity: 0, direction: 1 }).current;

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ duration: LENIS_DURATION, easing: expoOut, touchMultiplier: 1.4 });
    lenisRef.current = lenis;

    lenis.on('scroll', (instance: Lenis) => {
      state.velocity = clamp(instance.velocity, -MAX_VELOCITY, MAX_VELOCITY);
      if (instance.direction === 1 || instance.direction === -1) state.direction = instance.direction;
      ScrollTrigger.update();
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion, state]);

  // Native-scroll fallback keeps velocity-driven effects consistent without Lenis.
  useEffect(() => {
    if (!reducedMotion) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const delta = window.scrollY - lastY;
      lastY = window.scrollY;
      state.velocity = clamp(delta, -MAX_VELOCITY, MAX_VELOCITY);
      if (delta !== 0) state.direction = delta > 0 ? 1 : -1;
    };
    const decay = () => {
      state.velocity *= VELOCITY_DECAY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    gsap.ticker.add(decay);
    return () => {
      window.removeEventListener('scroll', onScroll);
      gsap.ticker.remove(decay);
    };
  }, [reducedMotion, state]);

  // Refresh trigger positions once web fonts settle (they change text metrics).
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined);
  }, []);

  const api = useMemo<SmoothScrollApi>(
    () => ({
      state,
      scrollTo: (target, { immediate = false, offset = 0 } = {}) => {
        const lenis = lenisRef.current;
        if (lenis) {
          lenis.scrollTo(target, { immediate, offset, force: true });
          return;
        }
        const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: immediate || reducedMotion ? 'auto' : 'smooth' });
      },
      lock: () => {
        lenisRef.current?.stop();
        document.documentElement.style.overflow = 'hidden';
      },
      unlock: () => {
        lenisRef.current?.start();
        document.documentElement.style.overflow = '';
      },
    }),
    [reducedMotion, state],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}

export const useSmoothScroll = (): SmoothScrollApi => {
  const context = useContext(SmoothScrollContext);
  if (!context) throw new Error('useSmoothScroll must be used inside <SmoothScrollProvider>');
  return context;
};
