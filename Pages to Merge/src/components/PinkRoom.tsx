import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { EASE } from '@/lib/motion';

interface PinkRoomProps {
  onDone: () => void;
}

const DURATION_MS = 4800;
const GLYPHS = ['✦', '✧', '♥', '★', '+'];
const COLORS = ['#FF2D95', '#FF4FA3', '#FF9FCC', '#FFC1DC'];
const COUNT = { desktop: 140, lowPower: 50 };

interface Drop {
  x: number;
  y: number;
  speed: number;
  size: number;
  spin: number;
  angle: number;
  glyph: string;
  color: string;
}

/** Easter egg: click the logo five times quickly. */
export function PinkRoom({ onDone }: PinkRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion, lowPower } = useMotionPreferences();

  useEffect(() => {
    const timeout = window.setTimeout(onDone, DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || reducedMotion) return;

    const ratio = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);

    const drops: Drop[] = Array.from({ length: lowPower ? COUNT.lowPower : COUNT.desktop }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      speed: 2 + Math.random() * 5,
      size: 12 + Math.random() * 26,
      spin: (Math.random() - 0.5) * 0.08,
      angle: Math.random() * Math.PI,
      glyph: GLYPHS[index % GLYPHS.length] as string,
      color: COLORS[index % COLORS.length] as string,
    }));

    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const drop of drops) {
        drop.y += drop.speed;
        drop.angle += drop.spin;
        context.save();
        context.translate(drop.x, drop.y);
        context.rotate(drop.angle);
        context.fillStyle = drop.color;
        context.font = `${drop.size}px Archivo, sans-serif`;
        context.fillText(drop.glyph, 0, 0);
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [lowPower, reducedMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[110]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-10 flex justify-center px-4">
        <motion.div
          role="status"
          initial={{ y: 80, opacity: 0, rotate: -6 }}
          animate={{ y: 0, opacity: 1, rotate: -3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE.outExpo }}
          className="w-full max-w-md rounded-2xl bg-hot px-6 py-5 text-void shadow-[0_30px_80px_-20px_rgba(255,45,149,0.8)]"
        >
          <p className="display display-condensed text-4xl">You found the pink room.</p>
          <p className="mt-2 font-serif text-lg italic">Five clicks on a logo is exactly the curiosity I design for.</p>
        </motion.div>
      </div>
    </div>
  );
}
