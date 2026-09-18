import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useInView, useTicker } from '@/hooks/useTicker';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { lerp } from '@/lib/math';

/* ------------------------------------------------------------------ */
/* DesignAnnotation: a selection frame with live coordinates           */
/* ------------------------------------------------------------------ */

interface DesignAnnotationProps {
  label: string;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
}

const COORD_UPDATE_EVERY_FRAMES = 8;

export function DesignAnnotation({ label, className = '', style, width = 180, height = 110 }: DesignAnnotationProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const frameCount = useRef(0);
  const inView = useInView(frameRef);

  // Coordinates reflect the frame's real on-screen position, like a design tool inspector.
  useTicker(() => {
    frameCount.current += 1;
    if (frameCount.current % COORD_UPDATE_EVERY_FRAMES !== 0 || !frameRef.current || !coordsRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    coordsRef.current.textContent = `x: ${Math.round(rect.left)}  y: ${Math.round(rect.top)}`;
  }, inView);

  const handles = ['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1'];

  return (
    <div className={`pointer-events-auto select-none ${className}`} style={style} data-cursor="select" aria-hidden="true">
      <div className="annotation mb-1 flex items-center gap-3">
        <span className="text-hot">{label}</span>
        <span ref={coordsRef} className="text-muted">
          x: 0 y: 0
        </span>
      </div>
      <div ref={frameRef} className="relative border border-hot/70" style={{ width, height }}>
        {handles.map((position) => (
          <span key={position} className={`absolute h-2 w-2 border border-hot bg-void ${position}`} />
        ))}
        <span className="annotation absolute -bottom-5 left-1/2 -translate-x-1/2 text-muted">{width}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MechanicalCounter: odometer digits that roll into place             */
/* ------------------------------------------------------------------ */

const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

interface MechanicalCounterProps {
  value: string;
  className?: string;
}

export function MechanicalCounter({ value, className = '' }: MechanicalCounterProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const columns = root.querySelectorAll<HTMLElement>('[data-digit]');
      columns.forEach((column, index) => {
        const digit = Number(column.dataset.digit);
        const target = { yPercent: -digit * 10 };
        if (reducedMotion) {
          gsap.set(column, target);
          return;
        }
        // Rolls up from zero like an odometer, each column slightly later.
        gsap.fromTo(
          column,
          { yPercent: 0 },
          { ...target, duration: 1.4 + index * 0.25, ease: 'expo.inOut', scrollTrigger: { trigger: root, start: 'top 90%', once: true } },
        );
      });
    },
    { scope: rootRef, dependencies: [value, reducedMotion] },
  );

  return (
    <span ref={rootRef} className={`inline-flex overflow-hidden leading-none ${className}`} aria-label={value} role="img">
      {Array.from(value).map((char, index) =>
        /\d/.test(char) ? (
          <span key={index} className="relative inline-block h-[1em] overflow-hidden" aria-hidden="true">
            <span data-digit={char} className="flex flex-col will-change-transform">
              {DIGITS.map((digit) => (
                <span key={digit} className="block h-[1em]">
                  {digit}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={index} aria-hidden="true">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* CountUp: numeric metric that counts when scrolled into view         */
/* ------------------------------------------------------------------ */

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (current: number) => `${prefix}${current.toFixed(decimals)}${suffix}`;
  const { reducedMotion } = useMotionPreferences();

  useGSAP(
    () => {
      const element = ref.current;
      if (!element || reducedMotion) return;
      const counter = { current: 0 };
      element.textContent = format(0);
      gsap.to(counter, {
        current: value,
        duration: 2,
        ease: 'expo.out',
        scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        onUpdate: () => {
          element.textContent = format(counter.current);
        },
      });
    },
    { dependencies: [value, reducedMotion] },
  );

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {format(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* CursorGlow: pink light that trails the pointer behind a section     */
/* ------------------------------------------------------------------ */

interface CursorGlowProps {
  size?: number;
  className?: string;
}

const GLOW_SMOOTHING = 0.08;

export function CursorGlow({ size = 640, className = '' }: CursorGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const { finePointer, reducedMotion } = useMotionPreferences();
  const inView = useInView(containerRef, '0px');
  const enabled = finePointer && !reducedMotion && inView;

  useEffect(() => {
    if (enabled) startPointerTracking();
  }, [enabled]);

  useTicker(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;
    const rect = container.getBoundingClientRect();
    const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
    if (inside !== visible) setVisible(inside);
    position.current.x = lerp(position.current.x, pointer.x - rect.left, GLOW_SMOOTHING);
    position.current.y = lerp(position.current.y, pointer.y - rect.top, GLOW_SMOOTHING);
    glow.style.transform = `translate3d(${position.current.x - size / 2}px, ${position.current.y - size / 2}px, 0)`;
  }, enabled);

  return (
    <div ref={containerRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        ref={glowRef}
        className="absolute left-0 top-0 rounded-full transition-opacity duration-700 will-change-transform"
        style={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
          background: 'radial-gradient(circle, rgba(255,45,149,0.22) 0%, rgba(255,45,149,0.08) 35%, transparent 70%)',
        }}
      />
    </div>
  );
}
