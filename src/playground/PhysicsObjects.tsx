import { useEffect, useRef, type PointerEvent } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import type { ExperimentProps } from "./types";

interface BodyDefinition {
  radius: number;
  label: string;
  className: string;
}

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
}

const DEFINITIONS: readonly BodyDefinition[] = [
  { radius: 34, label: "✦", className: "rounded-full bg-hot text-ink" },
  { radius: 28, label: "{ }", className: "rounded-2xl border border-blush text-blush" },
  { radius: 40, label: "Aa", className: "rounded-full border border-line bg-surface-raised text-paper" },
  { radius: 24, label: "◐", className: "rounded-full bg-blush text-ink" },
  { radius: 30, label: "UI", className: "rounded-xl bg-chrome text-ink" },
  { radius: 22, label: "⌘", className: "rounded-full border border-hot text-hot" },
  { radius: 36, label: "3D", className: "rounded-3xl bg-hot-deep text-paper" },
  { radius: 26, label: "#", className: "rounded-lg border border-chrome text-chrome" },
];

const GRAVITY = 1600;
const RESTITUTION = 0.55;
const AIR_DRAG = 0.995;
const FLOOR_FRICTION = 0.9;
const THROW_SCALE = 60;
const MAX_THROW = 2200;

/** Lightweight circle physics with pointer dragging and throwing. */
export const PhysicsObjects = ({ active }: ExperimentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const dragged = useRef<{ index: number; offsetX: number; offsetY: number; lastX: number; lastY: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    bodies.current = DEFINITIONS.map((definition, index) => ({
      x: ((index + 1) / (DEFINITIONS.length + 1)) * width,
      y: -index * 50,
      vx: (index % 2 ? 1 : -1) * 80,
      vy: 0,
      angle: 0,
      radius: definition.radius,
    }));
  }, []);

  useAnimationFrame((delta) => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const list = bodies.current;

    list.forEach((body, index) => {
      if (dragged.current?.index === index) return;
      body.vy += GRAVITY * delta;
      body.vx *= AIR_DRAG;
      body.vy *= AIR_DRAG;
      body.x += body.vx * delta;
      body.y += body.vy * delta;

      if (body.y + body.radius > height) {
        body.y = height - body.radius;
        body.vy *= -RESTITUTION;
        body.vx *= FLOOR_FRICTION;
      }
      if (body.x - body.radius < 0) {
        body.x = body.radius;
        body.vx *= -RESTITUTION;
      } else if (body.x + body.radius > width) {
        body.x = width - body.radius;
        body.vx *= -RESTITUTION;
      }
      body.angle += (body.vx * delta) / body.radius;
    });

    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        const first = list[a]!;
        const second = list[b]!;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const overlap = first.radius + second.radius - distance;
        if (overlap <= 0) continue;

        const nx = dx / distance;
        const ny = dy / distance;
        const firstPinned = dragged.current?.index === a;
        const secondPinned = dragged.current?.index === b;
        const share = firstPinned || secondPinned ? 1 : 0.5;
        if (!firstPinned) {
          first.x -= nx * overlap * share;
          first.y -= ny * overlap * share;
        }
        if (!secondPinned) {
          second.x += nx * overlap * share;
          second.y += ny * overlap * share;
        }

        const relativeVelocity = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
        if (relativeVelocity > 0) continue;
        const impulse = (-(1 + RESTITUTION) * relativeVelocity) / 2;
        if (!firstPinned) {
          first.vx -= impulse * nx;
          first.vy -= impulse * ny;
        }
        if (!secondPinned) {
          second.vx += impulse * nx;
          second.vy += impulse * ny;
        }
      }
    }

    list.forEach((body, index) => {
      const element = elementRefs.current[index];
      if (element) {
        element.style.transform = `translate3d(${body.x - body.radius}px, ${body.y - body.radius}px, 0) rotate(${body.angle}rad)`;
      }
    });
  }, active);

  const localPoint = (event: PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, index: number) => {
    const body = bodies.current[index];
    if (!body) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = localPoint(event);
    dragged.current = { index, offsetX: point.x - body.x, offsetY: point.y - body.y, lastX: point.x, lastY: point.y };
    body.vx = 0;
    body.vy = 0;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragged.current;
    const body = drag ? bodies.current[drag.index] : undefined;
    if (!drag || !body) return;
    const point = localPoint(event);
    const clamp = (value: number, max: number) => Math.min(Math.max(value, body.radius), max - body.radius);
    body.x = clamp(point.x - drag.offsetX, containerRef.current!.clientWidth);
    body.y = clamp(point.y - drag.offsetY, containerRef.current!.clientHeight);
    body.vx = Math.max(-MAX_THROW, Math.min(MAX_THROW, (point.x - drag.lastX) * THROW_SCALE));
    body.vy = Math.max(-MAX_THROW, Math.min(MAX_THROW, (point.y - drag.lastY) * THROW_SCALE));
    drag.lastX = point.x;
    drag.lastY = point.y;
  };

  const handlePointerUp = () => {
    dragged.current = null;
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" aria-label="Draggable physics shapes" role="group">
      {DEFINITIONS.map((definition, index) => (
        <div
          key={definition.label}
          ref={(node) => {
            elementRefs.current[index] = node;
          }}
          data-cursor="drag"
          onPointerDown={(event) => handlePointerDown(event, index)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute left-0 top-0 grid touch-none select-none place-items-center text-sm font-semibold will-transform ${definition.className}`}
          style={{ width: definition.radius * 2, height: definition.radius * 2, transform: "translate3d(-200px,-200px,0)" }}
          aria-hidden="true"
        >
          {definition.label}
        </div>
      ))}
    </div>
  );
};
