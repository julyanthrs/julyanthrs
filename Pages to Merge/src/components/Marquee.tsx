import { Fragment, useEffect, useRef, useState } from 'react';
import { useSmoothScroll } from '@/providers/SmoothScrollProvider';
import { useInView, useTicker } from '@/hooks/useTicker';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { clamp, lerp } from '@/lib/math';

interface MarqueeProps {
  items: readonly string[];
  separator?: string;
  /** Idle speed in px/second. */
  baseSpeed?: number;
  /** Extra px/frame per unit of scroll velocity. */
  velocityBoost?: number;
  className?: string;
  /** Outline every other word for rhythm. */
  alternateOutline?: boolean;
  /** Invert direction mapping, for counter-moving stacked marquees. */
  inverted?: boolean;
  separatorClassName?: string;
}

const COPIES = 3;
const MAX_SKEW_DEG = 12;
const SKEW_SMOOTHING = 0.12;

export function Marquee({
  items,
  separator = '✦',
  baseSpeed = 60,
  velocityBoost = 0.9,
  className = '',
  alternateOutline = true,
  inverted = false,
  separatorClassName = 'text-hot',
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const skew = useRef(0);
  const [copyWidth, setCopyWidth] = useState(0);
  const { state } = useSmoothScroll();
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);
  const inView = useInView(rootRef);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const observer = new ResizeObserver(([entry]) => setCopyWidth(entry?.contentRect.width ?? 0));
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  useTicker((_time, deltaMs) => {
    const track = trackRef.current;
    if (!track || copyWidth === 0) return;
    const direction = (inverted ? -1 : 1) * state.direction;
    const distance = (baseSpeed * deltaMs) / 1000 + Math.abs(state.velocity) * velocityBoost;
    offset.current = (offset.current + distance * direction) % copyWidth;
    skew.current = lerp(skew.current, clamp(-state.velocity * 0.35, -MAX_SKEW_DEG, MAX_SKEW_DEG), SKEW_SMOOTHING);
    // Scrolling down (direction 1) moves content to the right.
    const x = offset.current - copyWidth + (offset.current < 0 ? copyWidth : 0);
    track.style.transform = `translate3d(${x}px,0,0) skewX(${skew.current.toFixed(2)}deg)`;
  }, inView && !reducedMotion);

  const renderCopy = (copyIndex: number) => (
    <div
      key={copyIndex}
      ref={copyIndex === 0 ? copyRef : undefined}
      className="flex shrink-0 items-center"
      aria-hidden={copyIndex > 0 ? 'true' : undefined}
    >
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          <span className={`px-[0.25em] ${alternateOutline && index % 2 === 1 ? 'text-outline' : ''}`}>{item}</span>
          <span className={`px-[0.2em] ${separatorClassName}`} aria-hidden="true">
            {separator}
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative overflow-hidden whitespace-nowrap ${className}`}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {Array.from({ length: reducedMotion ? 1 : COPIES }, (_, index) => renderCopy(index))}
      </div>
    </div>
  );
}
