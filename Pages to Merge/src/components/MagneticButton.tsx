import { forwardRef, useRef, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { motion, useSpring } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { emitSparks } from '@/lib/sparks';

interface MagneticProps {
  children: ReactNode;
  /** Fraction of the pointer offset the element follows. */
  strength?: number;
  className?: string;
}

/** Pulls its child toward the pointer and springs back on leave. */
export function Magnetic({ children, strength = 0.35, className = '' }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, SPRING.magnetic);
  const y = useSpring(0, SPRING.magnetic);
  const { finePointer, reducedMotion } = useMotionPreferences();
  const enabled = finePointer && !reducedMotion;

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x, y }}
      className={`-m-4 inline-block p-4 will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

type MagneticButtonTone = 'solid' | 'outline';

interface MagneticButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  children: ReactNode;
  tone?: MagneticButtonTone;
  strength?: number;
}

const TONE_CLASSES: Record<MagneticButtonTone, string> = {
  solid: 'bg-hot text-void hover:bg-flare',
  outline: 'border border-blush/50 text-white hover:border-hot hover:bg-hot/10',
};

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(function MagneticButton(
  { children, tone = 'solid', strength = 0.4, className = '', onClick, ...rest },
  ref,
) {
  return (
    <Magnetic strength={strength}>
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', ...SPRING.magnetic }}
        onClick={(event) => {
          emitSparks(event.clientX, event.clientY);
          onClick?.(event);
        }}
        className={`relative inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 font-display text-sm font-semibold tracking-wide transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${TONE_CLASSES[tone]} ${className}`}
        {...rest}
      >
        {children}
      </motion.button>
    </Magnetic>
  );
});
