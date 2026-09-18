import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';

export type RevealVariant = 'wipe' | 'rise' | 'iris';

interface SectionRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  className?: string;
  /** Scrubs the inner scale with scroll after the reveal, for a slow push-in. */
  pushIn?: boolean;
}

const CLIP_FROM: Record<RevealVariant, string> = {
  wipe: 'inset(0% 100% 0% 0%)',
  rise: 'inset(100% 0% 0% 0%)',
  iris: 'circle(0% at 50% 50%)',
};

const CLIP_TO: Record<RevealVariant, string> = {
  wipe: 'inset(0% 0% 0% 0%)',
  rise: 'inset(0% 0% 0% 0%)',
  iris: 'circle(75% at 50% 50%)',
};

/** Extra scale so the scrubbed push-in never exposes the container edges. */
const PUSH_IN_SCALE = 1.14;

export function SectionReveal({ children, variant = 'rise', className = '', pushIn = false }: SectionRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);

  useGSAP(
    () => {
      if (reducedMotion || !rootRef.current || !innerRef.current) return;
      const root = rootRef.current;
      const inner = innerRef.current;

      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top 82%', once: true } })
        .fromTo(root, { clipPath: CLIP_FROM[variant] }, { clipPath: CLIP_TO[variant], duration: 1.4, ease: 'expo.inOut' })
        .fromTo(
          inner,
          { scale: 1.3, filter: 'blur(10px)' },
          { scale: pushIn ? PUSH_IN_SCALE : 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', clearProps: 'filter' },
          0.1,
        );

      if (pushIn) {
        gsap.fromTo(
          inner,
          { yPercent: -6 },
          { yPercent: 6, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      }
    },
    { scope: rootRef, dependencies: [reducedMotion, variant, pushIn] },
  );

  return (
    <div ref={rootRef} className={`relative overflow-hidden ${className}`}>
      <div ref={innerRef} className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
