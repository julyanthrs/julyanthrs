import { useRef, type PointerEvent, type ReactNode } from 'react';
import { motion, useMotionTemplate, useSpring, useTransform } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { useMotionPreferences } from '@/hooks/useMediaQuery';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  maxTilt?: number;
  /** Pink light that follows the pointer across the surface. */
  sheen?: boolean;
}

export function TiltCard({ children, className = '', maxTilt = 8, sheen = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { finePointer, reducedMotion } = useMotionPreferences();
  const enabled = finePointer && !reducedMotion;

  // Pointer position normalised to 0..1 inside the card.
  const px = useSpring(0.5, SPRING.tilt);
  const py = useSpring(0.5, SPRING.tilt);
  const rotateY = useTransform(px, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(py, [0, 1], [maxTilt, -maxTilt]);
  const sheenX = useTransform(px, (value) => `${value * 100}%`);
  const sheenY = useTransform(py, (value) => `${value * 100}%`);
  const sheenOpacity = useSpring(0, SPRING.tilt);
  const sheenBackground = useMotionTemplate`radial-gradient(420px circle at ${sheenX} ${sheenY}, rgba(255,79,163,0.28), transparent 60%)`;

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
    sheenOpacity.set(1);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
    sheenOpacity.set(0);
  };

  return (
    <div className={`[perspective:1400px] ${className}`}>
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={enabled ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        className="relative h-full w-full will-change-transform"
      >
        {children}
        {sheen && enabled && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{ background: sheenBackground, opacity: sheenOpacity }}
          />
        )}
      </motion.div>
    </div>
  );
}
