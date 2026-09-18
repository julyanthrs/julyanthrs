import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SKILLS, type Skill } from '@/data/skills';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useInView, useTicker } from '@/hooks/useTicker';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { EASE } from '@/lib/motion';
import { clamp, seeded } from '@/lib/math';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  dragging: boolean;
  grabX: number;
  grabY: number;
  travel: number;
}

const PHYSICS = {
  damping: 0.93,
  repelRadius: 170,
  repelForce: 1.4,
  driftForce: 0.035,
  wallBounce: 0.45,
  gap: 8,
  maxSpeed: 22,
  clickTravelPx: 6,
  throwScale: 0.6,
} as const;

const createBodies = (count: number, width: number, height: number): Body[] => {
  const random = seeded(7);
  return Array.from({ length: count }, () => ({
    x: width * (0.15 + random() * 0.7),
    y: height * (0.15 + random() * 0.7),
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
    dragging: false,
    grabX: 0,
    grabY: 0,
    travel: 0,
  }));
};

const resolveCollision = (a: Body, b: Body): void => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const overlapX = (a.width + b.width) / 2 + PHYSICS.gap - Math.abs(dx);
  const overlapY = (a.height + b.height) / 2 + PHYSICS.gap - Math.abs(dy);
  if (overlapX <= 0 || overlapY <= 0) return;

  // Dragged bodies are immovable; the other one takes the full push.
  const aShare = a.dragging ? 0 : b.dragging ? 1 : 0.5;
  const bShare = 1 - aShare;

  if (overlapX < overlapY) {
    const push = overlapX * Math.sign(dx || 1);
    a.x -= push * aShare;
    b.x += push * bShare;
    const exchange = (a.vx - b.vx) * 0.5;
    a.vx -= exchange;
    b.vx += exchange;
  } else {
    const push = overlapY * Math.sign(dy || 1);
    a.y -= push * aShare;
    b.y += push * bShare;
    const exchange = (a.vy - b.vy) * 0.5;
    a.vy -= exchange;
    b.vy += exchange;
  }
};

export function SkillUniverse() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const suppressClick = useRef(false);
  const [selected, setSelected] = useState<Skill | null>(null);
  const { reducedMotion } = useMotionPreferences();
  const inView = useInView(containerRef);
  const simulate = inView && !reducedMotion;

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    if (bodies.current.length !== SKILLS.length) bodies.current = createBodies(SKILLS.length, width, height);
    bodies.current.forEach((body, index) => {
      const pill = pillRefs.current[index];
      if (!pill) return;
      body.width = pill.offsetWidth;
      body.height = pill.offsetHeight;
      body.x = clamp(body.x, body.width / 2, width - body.width / 2);
      body.y = clamp(body.y, body.height / 2, height - body.height / 2);
    });
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    startPointerTracking();
    return () => observer.disconnect();
  }, [measure, reducedMotion]);

  useTicker((time) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const localPointerX = pointer.x - rect.left;
    const localPointerY = pointer.y - rect.top;
    const list = bodies.current;

    list.forEach((body, index) => {
      if (body.dragging) return;
      body.vx += Math.sin(time * 0.6 + index * 1.7) * PHYSICS.driftForce;
      body.vy += Math.cos(time * 0.5 + index * 2.3) * PHYSICS.driftForce;

      const dx = body.x - localPointerX;
      const dy = body.y - localPointerY;
      const distance = Math.hypot(dx, dy);
      if (pointer.hasMoved && distance < PHYSICS.repelRadius && distance > 0.001) {
        const strength = ((PHYSICS.repelRadius - distance) / PHYSICS.repelRadius) * PHYSICS.repelForce;
        body.vx += (dx / distance) * strength;
        body.vy += (dy / distance) * strength;
      }

      body.vx = clamp(body.vx * PHYSICS.damping, -PHYSICS.maxSpeed, PHYSICS.maxSpeed);
      body.vy = clamp(body.vy * PHYSICS.damping, -PHYSICS.maxSpeed, PHYSICS.maxSpeed);
      body.x += body.vx;
      body.y += body.vy;
    });

    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) resolveCollision(list[i] as Body, list[j] as Body);
    }

    list.forEach((body, index) => {
      const halfW = body.width / 2;
      const halfH = body.height / 2;
      if (body.x < halfW || body.x > rect.width - halfW) {
        body.x = clamp(body.x, halfW, rect.width - halfW);
        body.vx *= -PHYSICS.wallBounce;
      }
      if (body.y < halfH || body.y > rect.height - halfH) {
        body.y = clamp(body.y, halfH, rect.height - halfH);
        body.vy *= -PHYSICS.wallBounce;
      }
      const pill = pillRefs.current[index];
      if (pill)
        pill.style.transform = `translate3d(${body.x - halfW}px, ${body.y - halfH}px, 0) rotate(${clamp(body.vx * 1.5, -14, 14)}deg)`;
    });
  }, simulate);

  const handlePointerDown = (index: number) => (event: PointerEvent<HTMLButtonElement>) => {
    const body = bodies.current[index];
    const container = containerRef.current;
    if (!body || !container) return;
    const rect = container.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    body.dragging = true;
    body.travel = 0;
    body.grabX = event.clientX - rect.left - body.x;
    body.grabY = event.clientY - rect.top - body.y;
  };

  const handlePointerMove = (index: number) => (event: PointerEvent<HTMLButtonElement>) => {
    const body = bodies.current[index];
    const container = containerRef.current;
    if (!body?.dragging || !container) return;
    const rect = container.getBoundingClientRect();
    const nextX = event.clientX - rect.left - body.grabX;
    const nextY = event.clientY - rect.top - body.grabY;
    body.vx = (nextX - body.x) * PHYSICS.throwScale;
    body.vy = (nextY - body.y) * PHYSICS.throwScale;
    body.travel += Math.hypot(nextX - body.x, nextY - body.y);
    body.x = nextX;
    body.y = nextY;
  };

  const handlePointerUp = (index: number) => () => {
    const body = bodies.current[index];
    if (!body) return;
    body.dragging = false;
    suppressClick.current = body.travel > PHYSICS.clickTravelPx;
  };

  const handleClick = (skill: Skill) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setSelected((current) => (current?.name === skill.name ? null : skill));
  };

  return (
    <section data-section="Skills" aria-labelledby="skills-title" className="shell relative py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="skills-title" className="display display-wide text-[13vw] md:text-[7vw]">
          Skill universe
        </h2>
        <p className="max-w-xs text-muted">Push them around with your cursor, throw them, or pick one to read what it means in practice.</p>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(255,45,149,0.12),transparent_65%)] ${
          reducedMotion ? 'flex flex-wrap content-start gap-3 p-6' : 'h-[560px] md:h-[620px]'
        }`}
      >
        <ul className="contents">
          {SKILLS.map((skill, index) => {
            const isSelected = selected?.name === skill.name;
            return (
              <li key={skill.name} className="contents">
                <button
                  ref={(element) => {
                    pillRefs.current[index] = element;
                  }}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleClick(skill)}
                  onPointerDown={reducedMotion ? undefined : handlePointerDown(index)}
                  onPointerMove={reducedMotion ? undefined : handlePointerMove(index)}
                  onPointerUp={reducedMotion ? undefined : handlePointerUp(index)}
                  onPointerCancel={reducedMotion ? undefined : handlePointerUp(index)}
                  data-cursor="drag"
                  className={`${reducedMotion ? '' : 'absolute left-0 top-0 touch-none will-change-transform'} whitespace-nowrap rounded-full px-5 py-3 font-display text-base font-semibold transition-colors duration-300 md:text-lg ${
                    isSelected
                      ? 'bg-hot text-void'
                      : skill.kind === 'design'
                        ? 'border border-blush/60 bg-void/70 text-petal hover:border-hot'
                        : 'border border-white/25 bg-carbon/80 text-white hover:border-hot'
                  }`}
                >
                  {skill.name}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 md:right-auto md:w-96" aria-live="polite">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.name}
                initial={{ y: 30, opacity: 0, rotate: -2 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE.outExpo }}
                className="rounded-2xl border border-hot/50 bg-void/95 p-5 shadow-[0_20px_60px_-20px_rgba(255,45,149,0.6)]"
              >
                <p className="display display-condensed text-3xl text-hot">{selected.name}</p>
                <p className="mt-2 text-sm text-white/80">{selected.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {reducedMotion && <div className="h-40 w-full" aria-hidden="true" />}
      </div>
    </section>
  );
}
