import { useRef, useState } from "react";
import { useCanvas2D } from "@/hooks/useCanvas2D";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { getDeviceTier, TIER_SCALE } from "@/lib/device";
import { createRandom } from "@/lib/random";
import type { ExperimentProps } from "./types";

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
}

const PX_PER_PARTICLE = 520;
const MAX_PARTICLES = 900;
const FORCE_RADIUS = 140;
const FORCE_STRENGTH = 900;
const HOME_PULL = 1.4;
const FRICTION = 0.9;

type Mode = "attract" | "repel";

export const ParticleField = ({ active }: ExperimentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const [mode, setMode] = useState<Mode>("attract");
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;
  const pointer = useLocalPointer(canvasRef);

  const { contextRef, sizeRef } = useCanvas2D(canvasRef, ({ width, height }) => {
    const random = createRandom(5);
    const scale = TIER_SCALE[getDeviceTier()];
    const count = Math.min(MAX_PARTICLES * scale, Math.floor((width * height) / PX_PER_PARTICLE) * scale);
    particles.current = Array.from({ length: Math.floor(count) }, () => {
      const x = random() * width;
      const y = random() * height;
      return { x, y, homeX: x, homeY: y, vx: 0, vy: 0 };
    });
  });

  useAnimationFrame((delta, elapsed) => {
    const context = contextRef.current;
    const { width, height } = sizeRef.current;
    if (!context) return;
    const { x: px, y: py, inside } = pointer.current;
    const direction = modeRef.current === "attract" ? -1 : 1;

    context.fillStyle = "rgba(0,0,0,0.28)";
    context.fillRect(0, 0, width, height);

    for (const particle of particles.current) {
      const driftX = Math.sin(elapsed * 0.6 + particle.homeY * 0.02) * 6;
      const driftY = Math.cos(elapsed * 0.5 + particle.homeX * 0.02) * 6;
      particle.vx += (particle.homeX + driftX - particle.x) * HOME_PULL * delta;
      particle.vy += (particle.homeY + driftY - particle.y) * HOME_PULL * delta;

      if (inside) {
        const dx = particle.x - px;
        const dy = particle.y - py;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < FORCE_RADIUS) {
          const strength = (1 - distance / FORCE_RADIUS) * FORCE_STRENGTH * delta * direction;
          particle.vx += (dx / distance) * strength;
          particle.vy += (dy / distance) * strength;
        }
      }

      particle.vx *= FRICTION;
      particle.vy *= FRICTION;
      particle.x += particle.vx;
      particle.y += particle.vy;

      const speed = Math.min(1, Math.hypot(particle.vx, particle.vy) / 4);
      context.fillStyle = speed > 0.35 ? "#ff2e88" : "#ffb8d5";
      context.globalAlpha = 0.35 + speed * 0.65;
      const size = 1.2 + speed * 1.6;
      context.fillRect(particle.x, particle.y, size, size);
    }
    context.globalAlpha = 1;
  }, active);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        data-cursor="play"
        aria-label="Particle field. Move the pointer to attract particles, click to switch to repel."
        role="img"
        onClick={() => setMode((current) => (current === "attract" ? "repel" : "attract"))}
      />
      <span className="meta pointer-events-none absolute bottom-3 left-4 rounded-full border border-line bg-ink/70 px-2 py-1" aria-live="polite">
        mode: <span className="text-hot">{mode}</span>
      </span>
    </div>
  );
};
