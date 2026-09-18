import { useCallback, useEffect, useRef, useState } from "react";
import { skills } from "@/data/skills";
import type { Skill } from "@/data/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/math";
import { createRandom } from "@/lib/random";
import { scrollState } from "@/lib/scrollState";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useInView } from "@/hooks/useInView";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

interface Body {
  homeX: number;
  homeY: number;
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  phase: number;
  baseRotation: number;
  width: number;
  height: number;
}

const PHYSICS = {
  spring: 14,
  damping: 0.86,
  repelRadius: 120,
  repelForce: 5200,
  floatX: 6,
  floatY: 9,
  scrollKick: 1.6,
} as const;

/** Field widths (px) below which the capsule grid drops to fewer columns, so long labels never overlap. */
const FIELD_COLUMN_BREAKPOINTS = { two: 400, three: 520, four: 800 } as const;

/** Minimum gap (px) between a capsule and the field edge, so nothing touches or escapes the container. */
const FIELD_PADDING_PX = 16;

const GROUP_STYLES: Record<Skill["group"], string> = {
  build: "border-hot/60 text-paper hover:bg-hot hover:text-ink",
  design: "border-blush/40 bg-blush/10 text-blush hover:bg-blush hover:text-ink",
  motion: "border-chrome/40 text-chrome hover:bg-chrome hover:text-ink",
};

const computeHomes = (width: number, height: number, count: number) => {
  const random = createRandom(42);
  const columns = width < FIELD_COLUMN_BREAKPOINTS.two ? 2 : width < FIELD_COLUMN_BREAKPOINTS.three ? 3 : width < FIELD_COLUMN_BREAKPOINTS.four ? 4 : 5;
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowShift = row % 2 === 1 ? cellWidth * 0.25 : -cellWidth * 0.1;
    return {
      x: cellWidth * (column + 0.5) + rowShift + (random() - 0.5) * cellWidth * 0.3,
      y: cellHeight * (row + 0.5) + (random() - 0.5) * cellHeight * 0.35,
      rotation: (random() - 0.5) * 14,
      phase: random() * Math.PI * 2,
    };
  });
};

export const SkillField = () => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const capsuleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const fieldSize = useRef({ width: 0, height: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isVisible = useInView(fieldRef);
  const pointer = useLocalPointer(fieldRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const layout = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    const { width, height } = field.getBoundingClientRect();
    fieldSize.current = { width, height };
    const homes = computeHomes(width, height, skills.length);
    bodies.current = homes.map((home, index) => {
      const element = capsuleRefs.current[index];
      const previous = bodies.current[index];
      const capsuleWidth = element?.offsetWidth ?? 0;
      const capsuleHeight = element?.offsetHeight ?? 0;
      return {
        homeX: clamp(home.x, capsuleWidth / 2 + FIELD_PADDING_PX, width - capsuleWidth / 2 - FIELD_PADDING_PX),
        homeY: clamp(home.y, capsuleHeight / 2 + FIELD_PADDING_PX, height - capsuleHeight / 2 - FIELD_PADDING_PX),
        offsetX: previous?.offsetX ?? 0,
        offsetY: previous?.offsetY ?? 0,
        velocityX: 0,
        velocityY: 0,
        phase: home.phase,
        baseRotation: home.rotation,
        width: capsuleWidth,
        height: capsuleHeight,
      };
    });
    renderBodies(0);
  }, []);

  const renderBodies = (rotationScale: number) => {
    bodies.current.forEach((body, index) => {
      const element = capsuleRefs.current[index];
      if (!element) return;
      const { width, height } = fieldSize.current;
      const x = clamp(body.homeX + body.offsetX - body.width / 2, FIELD_PADDING_PX, width - body.width - FIELD_PADDING_PX);
      const y = clamp(body.homeY + body.offsetY - body.height / 2, FIELD_PADDING_PX, height - body.height - FIELD_PADDING_PX);
      const rotation = body.baseRotation * 0.4 + body.offsetX * 0.25 * rotationScale;
      element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    });
  };

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(field);
    // Capsule widths change once web fonts load; re-measure so the clamps use real sizes.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) layout();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [layout]);

  useAnimationFrame((delta, elapsed) => {
    const { x: pointerX, y: pointerY, inside } = pointer.current;
    const scrollKick = scrollState.velocity * PHYSICS.scrollKick;

    bodies.current.forEach((body, index) => {
      const floatX = Math.sin(elapsed * 0.8 + body.phase) * PHYSICS.floatX;
      const floatY = Math.cos(elapsed * 0.6 + body.phase) * PHYSICS.floatY;
      let forceX = (floatX - body.offsetX) * PHYSICS.spring;
      let forceY = (floatY - body.offsetY) * PHYSICS.spring - scrollKick;

      if (inside && index !== selectedIndex) {
        const dx = body.homeX + body.offsetX - pointerX;
        const dy = body.homeY + body.offsetY - pointerY;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < PHYSICS.repelRadius) {
          const strength = (1 - distance / PHYSICS.repelRadius) ** 2 * PHYSICS.repelForce;
          forceX += (dx / distance) * strength;
          forceY += (dy / distance) * strength;
        }
      }

      body.velocityX = (body.velocityX + forceX * delta) * PHYSICS.damping;
      body.velocityY = (body.velocityY + forceY * delta) * PHYSICS.damping;
      body.offsetX += body.velocityX * delta * 10;
      body.offsetY += body.velocityY * delta * 10;
    });
    renderBodies(1);
  }, isVisible && !prefersReducedMotion);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-skill-capsule]")) setSelectedIndex(null);
    };
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && setSelectedIndex(null);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [selectedIndex]);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      gsap.from("[data-capsule-inner]", {
        scale: 0,
        rotate: -30,
        duration: 0.9,
        stagger: { each: 0.05, from: "random" },
        ease: "back.out(2.2)",
        scrollTrigger: { trigger: fieldRef.current, start: "top 80%", once: true },
      });
    },
    { scope: fieldRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <div ref={fieldRef} className="relative h-[520px] w-full overflow-visible sm:h-[460px]" role="group" aria-label="Skills">
      {skills.map((skill, index) => {
        const isSelected = selectedIndex === index;
        const tooltipId = `skill-tip-${index}`;
        return (
          <div
            key={skill.name}
            ref={(node) => {
              capsuleRefs.current[index] = node;
            }}
            data-skill-capsule
            className={`absolute left-0 top-0 will-transform ${isSelected ? "z-20" : "z-0"}`}
          >
            <div data-capsule-inner>
              <button
                type="button"
                aria-expanded={isSelected}
                aria-describedby={isSelected ? tooltipId : undefined}
                onClick={() => setSelectedIndex(isSelected ? null : index)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-[background-color,color,transform] duration-300 hover:rotate-6 active:scale-90 ${GROUP_STYLES[skill.group]} ${
                  isSelected ? "!bg-hot !text-ink" : ""
                }`}
              >
                {skill.name}
              </button>
            </div>
            {isSelected && (
              <div
                id={tooltipId}
                role="tooltip"
                className="absolute bottom-[calc(100%+10px)] left-1/2 w-56 -translate-x-1/2 rounded-xl border border-line-hot bg-ink/95 p-3 shadow-2xl [animation:tooltip-in_0.35s_var(--ease-out-expo)]"
              >
                <p className="meta text-hot">{skill.name}</p>
                <p className="mt-1 text-sm leading-snug text-paper">{skill.detail}</p>
                <span aria-hidden="true" className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-line-hot bg-ink" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
