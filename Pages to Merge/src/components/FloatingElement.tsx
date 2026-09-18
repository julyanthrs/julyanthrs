import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useTicker } from '@/hooks/useTicker';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max cursor-parallax travel in px. Negative values move against the cursor. */
  depth?: number;
  /** Scroll parallax as % of own height across the viewport pass. Foreground > 0, background < 0. */
  scrollSpeed?: number;
  /** Idle bob; disabled when 0. */
  floatSeconds?: number;
  rotate?: number;
}

export function FloatingElement({
  children,
  className = '',
  style,
  depth = 20,
  scrollSpeed = 0,
  floatSeconds = 7,
  rotate = 0,
}: FloatingElementProps) {
  const scrollLayerRef = useRef<HTMLDivElement>(null);
  const pointerLayerRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<gsap.QuickToFunc>();
  const quickY = useRef<gsap.QuickToFunc>();
  const { reducedMotion, finePointer } = useMotionPreferences();
  const pointerEnabled = finePointer && !reducedMotion && depth !== 0;

  useGSAP(
    () => {
      if (reducedMotion) return;
      if (pointerLayerRef.current && pointerEnabled) {
        startPointerTracking();
        quickX.current = gsap.quickTo(pointerLayerRef.current, 'x', { duration: 1.1, ease: 'power3.out' });
        quickY.current = gsap.quickTo(pointerLayerRef.current, 'y', { duration: 1.1, ease: 'power3.out' });
      }
      if (scrollLayerRef.current && scrollSpeed !== 0) {
        gsap.fromTo(
          scrollLayerRef.current,
          { yPercent: scrollSpeed },
          {
            yPercent: -scrollSpeed,
            ease: 'none',
            scrollTrigger: { trigger: scrollLayerRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
    },
    { dependencies: [reducedMotion, pointerEnabled, scrollSpeed] },
  );

  const lastPointer = useRef({ nx: Number.NaN, ny: Number.NaN });

  useTicker(() => {
    // Only retarget when the pointer actually moved; quickTo restarts a tween per call.
    if (lastPointer.current.nx === pointer.nx && lastPointer.current.ny === pointer.ny) return;
    lastPointer.current = { nx: pointer.nx, ny: pointer.ny };
    quickX.current?.(pointer.nx * depth);
    quickY.current?.(pointer.ny * depth);
  }, pointerEnabled);

  const floatStyle =
    floatSeconds > 0
      ? ({ '--float-duration': `${floatSeconds}s`, '--float-delay': `${-floatSeconds * 0.37}s` } as CSSProperties)
      : undefined;

  return (
    <div ref={scrollLayerRef} className={`will-change-transform ${className}`} style={style}>
      <div ref={pointerLayerRef} className="will-change-transform">
        <div className={floatSeconds > 0 ? 'idle-float' : ''} style={floatStyle}>
          <div style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}>{children}</div>
        </div>
      </div>
    </div>
  );
}
