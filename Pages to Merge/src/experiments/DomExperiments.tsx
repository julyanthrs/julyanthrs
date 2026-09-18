import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import { Magnetic } from '@/components/MagneticButton';
import { clamp, lerp, seeded } from '@/lib/math';
import type { ExperimentProps } from './CanvasExperiments';

/** rAF loop that only runs while the experiment is visible. */
const useFrameLoop = (active: boolean, callback: (time: number) => void): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const loop = (now: number) => {
      callbackRef.current(now / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
};

const localPoint = (event: PointerEvent<Element>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
};

/* ---------------- Liquid cursor ---------------- */

const LIQUID_TAIL = [0.3, 0.18, 0.11, 0.07, 0.045];

export function LiquidCursor({ active }: ExperimentProps) {
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const target = useRef({ x: 160, y: 120 });
  const blobs = useRef<(SVGCircleElement | null)[]>([]);
  const positions = useRef(LIQUID_TAIL.map(() => ({ x: 160, y: 120 })));

  useFrameLoop(active, () => {
    LIQUID_TAIL.forEach((follow, index) => {
      const position = positions.current[index];
      const blob = blobs.current[index];
      if (!position || !blob) return;
      position.x = lerp(position.x, target.current.x, follow);
      position.y = lerp(position.y, target.current.y, follow);
      blob.setAttribute('cx', position.x.toFixed(1));
      blob.setAttribute('cy', position.y.toFixed(1));
    });
  });

  return (
    <div
      className="relative h-full w-full touch-none"
      onPointerMove={(event) => {
        const { x, y } = localPoint(event);
        target.current = { x, y };
      }}
    >
      <svg className="absolute inset-0 h-full w-full" aria-label="Liquid blobs that stretch after your pointer" role="img">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} fill="#FF2D95">
          <circle cx="30%" cy="70%" r="46" />
          <circle cx="75%" cy="35%" r="38" />
          {LIQUID_TAIL.map((_, index) => (
            <circle
              key={index}
              ref={(element) => {
                blobs.current[index] = element;
              }}
              r={40 - index * 6}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ---------------- Draggable 3D cube ---------------- */

const CUBE_FACES = [
  { label: 'Design', transform: 'rotateY(0deg)' },
  { label: 'Build', transform: 'rotateY(90deg)' },
  { label: 'Test', transform: 'rotateY(180deg)' },
  { label: 'Ship', transform: 'rotateY(-90deg)' },
  { label: 'Think', transform: 'rotateX(90deg)' },
  { label: 'Repeat', transform: 'rotateX(-90deg)' },
];

const CUBE_KEY_STEP = 15;

export function DragCube({ active }: ExperimentProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotation = useRef({ x: -24, y: 32, vx: 0, vy: 0.25 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useFrameLoop(active, () => {
    const state = rotation.current;
    if (!drag.current) {
      state.x += state.vx;
      state.y += state.vy;
      state.vx *= 0.95;
      state.vy = lerp(state.vy, 0.25, 0.02);
    }
    if (cubeRef.current) cubeRef.current.style.transform = `translateZ(-80px) rotateX(${state.x}deg) rotateY(${state.y}deg)`;
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = {
      ArrowUp: [CUBE_KEY_STEP, 0],
      ArrowDown: [-CUBE_KEY_STEP, 0],
      ArrowLeft: [0, -CUBE_KEY_STEP],
      ArrowRight: [0, CUBE_KEY_STEP],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    rotation.current.x += delta[0];
    rotation.current.y += delta[1];
  };

  return (
    <div
      tabIndex={0}
      role="img"
      aria-label="3D cube. Drag or use arrow keys to rotate."
      data-cursor="drag"
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const dx = event.clientX - drag.current.x;
        const dy = event.clientY - drag.current.y;
        drag.current = { x: event.clientX, y: event.clientY };
        rotation.current.y += dx * 0.5;
        rotation.current.x -= dy * 0.5;
        rotation.current.vy = dx * 0.4;
        rotation.current.vx = -dy * 0.4;
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      className="grid h-full w-full touch-none select-none place-items-center [perspective:700px]"
    >
      <div ref={cubeRef} className="relative h-40 w-40 [transform-style:preserve-3d]">
        {CUBE_FACES.map((face, index) => (
          <div
            key={face.label}
            className={`absolute inset-0 grid place-items-center border border-hot font-display text-xl font-bold uppercase ${index % 2 ? 'bg-hot/85 text-void' : 'bg-void/85 text-petal'}`}
            style={{ transform: `${face.transform} translateZ(80px)` }}
          >
            {face.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Type machine ---------------- */

const TYPE_LIMIT = 18;

export function TypeMachine() {
  const inputId = useId();
  const [text, setText] = useState('Hello');
  // Seeded per position so existing letters keep their style while you type.
  const styles = Array.from(text).map((_, index) => {
    const random = seeded((index + 1) * 97);
    return { width: 62 + Math.round(random() * 63), weight: 300 + Math.round(random() * 600), rotate: (random() - 0.5) * 18 };
  });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-4 p-5">
      <p className="flex min-h-0 flex-1 flex-wrap content-center items-center justify-center overflow-hidden" aria-hidden="true">
        <AnimatePresence initial={false}>
          {Array.from(text).map((char, index) => {
            const style = styles[index];
            return (
              <motion.span
                key={`${index}-${char}`}
                initial={{ y: 60, opacity: 0, scale: 1.8 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: style?.rotate ?? 0 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className={`inline-block font-display text-6xl uppercase leading-none md:text-7xl ${index % 3 === 0 ? 'text-hot' : 'text-white'}`}
                style={{ fontVariationSettings: `'wdth' ${style?.width ?? 100}`, fontWeight: style?.weight }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </p>
      <div>
        <label htmlFor={inputId} className="annotation text-muted">
          Type anything
        </label>
        <input
          id={inputId}
          value={text}
          maxLength={TYPE_LIMIT}
          onChange={(event) => setText(event.target.value)}
          className="mt-1 w-full border-b border-white/25 bg-transparent py-2 font-display text-lg text-white caret-hot outline-none focus:border-hot"
        />
      </div>
    </div>
  );
}

/* ---------------- Magnetic field ---------------- */

const MAGNETS = ['Hover', 'me', 'Pull', 'Snap', 'Spring', 'Drift', 'Stick', 'Float', 'Orbit'];

export function MagneticField() {
  const [pressed, setPressed] = useState<string | null>(null);
  return (
    <div className="grid h-full w-full grid-cols-3 place-items-center gap-2 p-6">
      {MAGNETS.map((label, index) => (
        <Magnetic key={label} strength={0.2 + (index % 3) * 0.2}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => setPressed(label)}
            aria-pressed={pressed === label}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${pressed === label ? 'bg-hot text-void' : 'border border-blush/50 text-petal hover:border-hot'}`}
          >
            {label}
          </motion.button>
        </Magnetic>
      ))}
    </div>
  );
}

/* ---------------- Noise distortion ---------------- */

export function NoiseDistortion({ active }: ExperimentProps) {
  const filterId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const energy = useRef(0);
  const scale = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useFrameLoop(active, (time) => {
    energy.current *= 0.92;
    scale.current = lerp(scale.current, clamp(energy.current, 0, 140), 0.15);
    turbulenceRef.current?.setAttribute('baseFrequency', `${0.008 + Math.sin(time * 0.6) * 0.003} 0.02`);
    displacementRef.current?.setAttribute('scale', (8 + scale.current).toFixed(1));
  });

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden"
      onPointerMove={(event) => {
        const { x, y } = localPoint(event);
        if (lastPoint.current) energy.current += Math.hypot(x - lastPoint.current.x, y - lastPoint.current.y) * 1.2;
        lastPoint.current = { x, y };
      }}
      onPointerLeave={() => {
        lastPoint.current = null;
      }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="4" />
          <feDisplacementMap ref={displacementRef} in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="absolute inset-[-5%]" style={{ filter: `url(#${filterId})` }}>
        <ProjectVisual variant="noir" label="Poster artwork that warps as you move across it" />
      </div>
    </div>
  );
}

/* ---------------- Proximity typography ---------------- */

const PROXIMITY_WORD = 'Closer';
const PROXIMITY_RADIUS = 220;

export function ProximityType({ active }: ExperimentProps) {
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const current = useRef(Array.from(PROXIMITY_WORD, () => 0));

  useFrameLoop(active, () => {
    letters.current.forEach((letter, index) => {
      if (!letter) return;
      let target = 0;
      if (pointerRef.current) {
        const rect = letter.getBoundingClientRect();
        const distance = Math.hypot(rect.left + rect.width / 2 - pointerRef.current.x, rect.top + rect.height / 2 - pointerRef.current.y);
        target = clamp(1 - distance / PROXIMITY_RADIUS, 0, 1);
      }
      const value = lerp(current.current[index] ?? 0, target, 0.15);
      current.current[index] = value;
      letter.style.fontVariationSettings = `'wdth' ${Math.round(62 + value * 63)}, 'wght' ${Math.round(200 + value * 700)}`;
      letter.style.color = value > 0.55 ? '#FF2D95' : '#FFFFFF';
    });
  });

  return (
    <div
      className="grid h-full w-full touch-none place-items-center overflow-hidden"
      onPointerMove={(event) => {
        pointerRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerLeave={() => {
        pointerRef.current = null;
      }}
    >
      <p className="font-display text-[15vw] uppercase leading-none md:text-[7vw]" aria-label={PROXIMITY_WORD}>
        {Array.from(PROXIMITY_WORD).map((char, index) => (
          <span
            key={index}
            ref={(element) => {
              letters.current[index] = element;
            }}
            aria-hidden="true"
            className="inline-block"
          >
            {char}
          </span>
        ))}
      </p>
    </div>
  );
}
