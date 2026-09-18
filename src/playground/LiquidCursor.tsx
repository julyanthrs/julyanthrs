import { useId, useRef } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { damp } from "@/lib/math";
import type { ExperimentProps } from "./types";

const BLOB_COUNT = 14;
const LEAD_SMOOTHING = 14;
const FOLLOW_SMOOTHING = 22;

const BLOB_SIZES = Array.from({ length: BLOB_COUNT }, (_, index) => 64 - index * 3.4);

/** A chain of blobs merged by an SVG "goo" filter so the trail reads as one fluid body. */
export const LiquidCursor = ({ active }: ExperimentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const positions = useRef(BLOB_SIZES.map(() => ({ x: 0, y: 0 })));
  const pointer = useLocalPointer(containerRef);
  const filterId = `goo-${useId().replace(/:/g, "")}`;

  useAnimationFrame((delta, elapsed) => {
    const container = containerRef.current;
    if (!container) return;
    const { clientWidth: width, clientHeight: height } = container;
    const state = pointer.current;

    const targetX = state.inside ? state.x : width / 2 + Math.sin(elapsed * 1.1) * width * 0.28;
    const targetY = state.inside ? state.y : height / 2 + Math.sin(elapsed * 2.2) * height * 0.22;

    positions.current.forEach((position, index) => {
      const leader = index === 0 ? { x: targetX, y: targetY } : positions.current[index - 1]!;
      const amount = damp(index === 0 ? LEAD_SMOOTHING : FOLLOW_SMOOTHING, delta);
      position.x += (leader.x - position.x) * amount;
      position.y += (leader.y - position.y) * amount;
      const blob = blobRefs.current[index];
      if (blob) blob.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
    });
  }, active);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-none" data-cursor="play" role="img" aria-label="A liquid blob that trails the pointer.">
      <svg className="absolute size-0" aria-hidden="true">
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </svg>
      <p className="pointer-events-none absolute inset-0 grid place-items-center text-5xl font-bold text-paper/10 [font-variation-settings:'wdth'_75]" aria-hidden="true">
        fluid
      </p>
      <div className="absolute inset-0" style={{ filter: `url(#${filterId})` }} aria-hidden="true">
        {BLOB_SIZES.map((size, index) => (
          <span
            key={index}
            ref={(node) => {
              blobRefs.current[index] = node;
            }}
            className="absolute left-0 top-0 rounded-full will-transform"
            style={{
              width: size,
              height: size,
              background: index < 4 ? "#ffb8d5" : "#ff2e88",
            }}
          />
        ))}
      </div>
      <p className="pointer-events-none absolute inset-0 grid place-items-center text-5xl font-bold text-ink mix-blend-overlay [font-variation-settings:'wdth'_75]" aria-hidden="true">
        fluid
      </p>
    </div>
  );
};
