import { useRef } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { damp, mapRange } from "@/lib/math";
import type { ExperimentProps } from "./types";

const WORD = "KINETIC";
const INFLUENCE_PX = 220;
const WEIGHT = { min: 250, max: 800 } as const;
const WIDTH = { min: 75, max: 100 } as const;

/** Letters swell in weight and width and lift toward the pointer. */
export const KineticType = ({ active }: ExperimentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const influence = useRef(Array.from(WORD, () => 0));
  const pointer = useLocalPointer(containerRef);

  useAnimationFrame((delta, elapsed) => {
    const state = pointer.current;
    const letters = letterRefs.current;

    // Read all layout first, then write, so variable-font width changes cause one reflow per frame.
    const centers = letters.map((letter) =>
      letter ? { x: letter.offsetLeft + letter.offsetWidth / 2, y: letter.offsetTop + letter.offsetHeight / 2 } : null,
    );

    letters.forEach((letter, index) => {
      const center = centers[index];
      if (!letter || !center) return;
      const target = state.inside
        ? Math.max(0, 1 - Math.hypot(state.x - center.x, (state.y - center.y) * 1.4) / INFLUENCE_PX)
        : ((Math.sin(elapsed * 2 - index * 0.7) + 1) / 2) * 0.45;

      const previous = influence.current[index] ?? 0;
      const current = previous + (target - previous) * damp(9, delta);
      influence.current[index] = current;

      const weight = Math.round(mapRange(current, 0, 1, WEIGHT.min, WEIGHT.max));
      const width = Math.round(mapRange(current, 0, 1, WIDTH.max, WIDTH.min));
      letter.style.fontVariationSettings = `"wght" ${weight}, "wdth" ${width}`;
      letter.style.transform = `translateY(${-current * 14}px) rotate(${(current * (index % 2 ? 6 : -6)).toFixed(2)}deg)`;
      letter.style.color = current > 0.55 ? "#ff2e88" : current > 0.25 ? "#ffb8d5" : "#ffffff";
    });
  }, active);

  return (
    <div ref={containerRef} className="relative grid h-full w-full place-items-center touch-none" data-cursor="play">
      <p className="static flex select-none text-[clamp(3rem,10vw,7.5rem)] leading-none tracking-tight" aria-label={WORD}>
        {Array.from(WORD).map((char, index) => (
          <span
            key={index}
            aria-hidden="true"
            ref={(node) => {
              letterRefs.current[index] = node;
            }}
            className="inline-block will-transform"
          >
            {char}
          </span>
        ))}
      </p>
    </div>
  );
};
