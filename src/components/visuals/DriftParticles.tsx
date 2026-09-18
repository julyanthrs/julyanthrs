import { useRef } from "react";
import { useCanvas2D } from "@/hooks/useCanvas2D";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { createRandom } from "@/lib/random";

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

const DENSITY_PX_PER_PARTICLE = 9000;
const MAX_PARTICLES = 140;

/** Ambient background dust for a section. Pauses off-screen. */
export const DriftParticles = ({ className = "" }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const isVisible = useInView(canvasRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { contextRef, sizeRef } = useCanvas2D(canvasRef, ({ width, height }) => {
    const random = createRandom(11);
    const count = Math.min(MAX_PARTICLES, Math.floor((width * height) / DENSITY_PX_PER_PARTICLE));
    particles.current = Array.from({ length: count }, () => ({
      x: random() * width,
      y: random() * height,
      speed: 4 + random() * 14,
      size: 0.6 + random() * 1.4,
      alpha: 0.15 + random() * 0.5,
    }));
  });

  useAnimationFrame((delta) => {
    const context = contextRef.current;
    const { width, height } = sizeRef.current;
    if (!context) return;
    context.clearRect(0, 0, width, height);
    for (const particle of particles.current) {
      particle.y -= particle.speed * delta;
      if (particle.y < -4) particle.y = height + 4;
      context.globalAlpha = particle.alpha;
      context.fillStyle = "#ffb8d5";
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
  }, isVisible && !prefersReducedMotion);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
};
