import { useRef, type ElementType } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePageTransition } from '@/providers/TransitionProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { SplitText, type SplitMode } from './SplitText';

type RevealEffect = 'rise' | 'blur' | 'spread';

interface RevealTextProps {
  lines: readonly string[];
  as?: ElementType;
  split?: SplitMode;
  effect?: RevealEffect;
  /** `ready` plays once the page is uncovered; `scroll` plays when it enters the viewport. */
  trigger?: 'ready' | 'scroll';
  className?: string;
  lineClassName?: (index: number) => string;
  delay?: number;
  stagger?: number;
}

const FROM_STATE: Record<RevealEffect, gsap.TweenVars> = {
  rise: { yPercent: 118, rotate: 7, transformOrigin: '0% 100%' },
  blur: { yPercent: 40, opacity: 0, filter: 'blur(14px)' },
  spread: { opacity: 0, letterSpacing: '0.35em', filter: 'blur(6px)' },
};

const TO_STATE: Record<RevealEffect, gsap.TweenVars> = {
  rise: { yPercent: 0, rotate: 0 },
  blur: { yPercent: 0, opacity: 1, filter: 'blur(0px)' },
  spread: { opacity: 1, letterSpacing: '-0.035em', filter: 'blur(0px)' },
};

export function RevealText({
  lines,
  as: Tag = 'h2',
  split = 'chars',
  effect = 'rise',
  trigger = 'scroll',
  className = '',
  lineClassName,
  delay = 0,
  stagger,
}: RevealTextProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { pageReady } = usePageTransition();
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reducedMotion) return;
      const targetSelector = effect === 'spread' ? '[data-reveal-line]' : '[data-reveal-unit]';
      const targets = root.querySelectorAll(targetSelector);
      gsap.set(targets, FROM_STATE[effect]);

      if (trigger === 'ready' && !pageReady) return;

      gsap.to(targets, {
        ...TO_STATE[effect],
        duration: effect === 'rise' ? 1.1 : 1.3,
        ease: 'expo.out',
        delay,
        stagger: stagger ?? (split === 'chars' ? 0.025 : 0.06),
        clearProps: effect === 'spread' ? 'letterSpacing,filter' : 'filter',
        scrollTrigger: trigger === 'scroll' ? { trigger: root, start: 'top 85%', once: true } : undefined,
      });
    },
    { scope: rootRef, dependencies: [pageReady, reducedMotion] },
  );

  return (
    <Tag ref={rootRef} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, lineIndex) => (
        <span key={`${line}-${lineIndex}`} data-reveal-line className={`mask-line ${lineClassName?.(lineIndex) ?? ''}`} aria-hidden="true">
          <SplitText text={line} split={split} unitAttribute="data-reveal-unit" />
        </span>
      ))}
    </Tag>
  );
}
