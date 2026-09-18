import { useRef } from 'react';
import { useCanvasLoop, type FrameInfo } from './useCanvasLoop';

export interface ExperimentProps {
  active: boolean;
}

const PINKS = ['#FF2D95', '#FF4FA3', '#FF9FCC', '#FFC1DC'] as const;
const pink = (index: number): string => PINKS[index % PINKS.length] as string;

const canvasClass = 'block h-full w-full touch-none';

/* ---------------- Particle field ---------------- */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
}

const PARTICLE_SPACING = 26;
const LINK_DISTANCE = 42;

export function ParticleField({ active }: ExperimentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  useCanvasLoop(canvasRef, {
    active,
    onResize: (width, height) => {
      const list: Particle[] = [];
      for (let y = PARTICLE_SPACING / 2; y < height; y += PARTICLE_SPACING) {
        for (let x = PARTICLE_SPACING / 2; x < width; x += PARTICLE_SPACING) list.push({ x, y, vx: 0, vy: 0, homeX: x, homeY: y });
      }
      particles.current = list;
    },
    draw: (context, { width, height, pointer }) => {
      context.clearRect(0, 0, width, height);
      const radius = pointer.down ? 150 : 90;
      const list = particles.current;
      for (const particle of list) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (pointer.inside && distance < radius && distance > 0) {
          const force = (radius - distance) / radius;
          particle.vx += (dx / distance) * force * 3;
          particle.vy += (dy / distance) * force * 3;
        }
        particle.vx += (particle.homeX - particle.x) * 0.04;
        particle.vy += (particle.homeY - particle.y) * 0.04;
        particle.vx *= 0.82;
        particle.vy *= 0.82;
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      context.strokeStyle = 'rgba(255,45,149,0.35)';
      context.lineWidth = 1;
      context.beginPath();
      list.forEach((particle, index) => {
        const right = list[index + 1];
        if (right && Math.hypot(right.x - particle.x, right.y - particle.y) < LINK_DISTANCE && right.homeY === particle.homeY) {
          context.moveTo(particle.x, particle.y);
          context.lineTo(right.x, right.y);
        }
      });
      context.stroke();
      for (const particle of list) {
        const displacement = Math.min(1, Math.hypot(particle.x - particle.homeX, particle.y - particle.homeY) / 30);
        context.fillStyle = displacement > 0.2 ? '#FF2D95' : 'rgba(255,193,220,0.55)';
        context.beginPath();
        context.arc(particle.x, particle.y, 1.5 + displacement * 2.5, 0, Math.PI * 2);
        context.fill();
      }
    },
  });

  return <canvas ref={canvasRef} className={canvasClass} aria-label="Particle grid that scatters away from your pointer" role="img" />;
}

/* ---------------- Mouse trail ---------------- */

const TRAIL_LENGTH = 48;

export function MouseTrail({ active }: ExperimentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{ x: number; y: number }[]>([]);

  useCanvasLoop(canvasRef, {
    active,
    draw: (context, { width, height, time, pointer }) => {
      const target = pointer.inside
        ? { x: pointer.x, y: pointer.y }
        : { x: width / 2 + Math.cos(time * 1.3) * width * 0.3, y: height / 2 + Math.sin(time * 2.1) * height * 0.25 };
      const list = points.current;
      const head = list[0] ?? target;
      list.unshift({ x: head.x + (target.x - head.x) * 0.35, y: head.y + (target.y - head.y) * 0.35 });
      if (list.length > TRAIL_LENGTH) list.pop();

      context.fillStyle = 'rgba(5,5,5,0.35)';
      context.fillRect(0, 0, width, height);
      context.lineCap = 'round';
      for (let index = 1; index < list.length; index += 1) {
        const from = list[index - 1];
        const to = list[index];
        if (!from || !to) continue;
        const progress = 1 - index / list.length;
        context.strokeStyle = index % 6 === 0 ? '#FFC1DC' : `rgba(255,45,149,${progress})`;
        context.lineWidth = progress * 26;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
    },
  });

  return <canvas ref={canvasRef} className={canvasClass} aria-label="A pink ribbon that follows your pointer" role="img" />;
}

/* ---------------- Gradient mesh ---------------- */

const MESH_BLOBS = [
  { speed: 0.4, phase: 0, radius: 0.55, follow: 0.08 },
  { speed: 0.3, phase: 2, radius: 0.45, follow: 0.03 },
  { speed: 0.5, phase: 4, radius: 0.5, follow: 0.05 },
  { speed: 0.35, phase: 1, radius: 0.35, follow: 0.12 },
];

export function GradientMesh({ active }: ExperimentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positions = useRef(MESH_BLOBS.map(() => ({ x: 0, y: 0 })));

  useCanvasLoop(canvasRef, {
    active,
    draw: (context, { width, height, time, pointer }: FrameInfo) => {
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#050505';
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';
      MESH_BLOBS.forEach((blob, index) => {
        const position = positions.current[index];
        if (!position) return;
        const orbitX = width / 2 + Math.cos(time * blob.speed + blob.phase) * width * 0.3;
        const orbitY = height / 2 + Math.sin(time * blob.speed * 1.3 + blob.phase) * height * 0.3;
        const targetX = pointer.inside ? pointer.x : orbitX;
        const targetY = pointer.inside ? pointer.y : orbitY;
        position.x += (targetX - position.x) * blob.follow;
        position.y += (targetY - position.y) * blob.follow;
        const radius = Math.max(width, height) * blob.radius;
        const gradient = context.createRadialGradient(position.x, position.y, 0, position.x, position.y, radius);
        gradient.addColorStop(0, pink(index));
        gradient.addColorStop(1, 'rgba(5,5,5,0)');
        context.globalAlpha = 0.55;
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      });
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    },
  });

  return <canvas ref={canvasRef} className={canvasClass} aria-label="Soft pink gradient mesh that drifts toward your pointer" role="img" />;
}

/* ---------------- Physics drop ---------------- */

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const GRAVITY = 900;
const RESTITUTION = 0.72;
const MAX_BALLS = 60;
const STARTER_BALLS = 8;

export function PhysicsDrop({ active }: ExperimentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balls = useRef<Ball[]>([]);
  const spawnCount = useRef(0);

  const spawn = (x: number, y: number) => {
    spawnCount.current += 1;
    balls.current.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 500,
      vy: -Math.random() * 300,
      radius: 12 + Math.random() * 22,
      color: pink(spawnCount.current),
    });
    if (balls.current.length > MAX_BALLS) balls.current.shift();
  };

  useCanvasLoop(canvasRef, {
    active,
    onResize: (width) => {
      if (balls.current.length === 0) for (let index = 0; index < STARTER_BALLS; index += 1) spawn(width * (0.2 + index * 0.08), 40);
    },
    onPointerDown: (pointer) => spawn(pointer.x, pointer.y),
    draw: (context, { width, height, delta }) => {
      context.clearRect(0, 0, width, height);
      const list = balls.current;
      for (const ball of list) {
        ball.vy += GRAVITY * delta;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy *= -RESTITUTION;
          ball.vx *= 0.98;
        }
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
          ball.x = Math.min(width - ball.radius, Math.max(ball.radius, ball.x));
          ball.vx *= -RESTITUTION;
        }
      }
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i] as Ball;
          const b = list[j] as Ball;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const overlap = a.radius + b.radius - distance;
          if (overlap <= 0) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          const impulse = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (impulse < 0) {
            a.vx += impulse * nx * RESTITUTION;
            a.vy += impulse * ny * RESTITUTION;
            b.vx -= impulse * nx * RESTITUTION;
            b.vy -= impulse * ny * RESTITUTION;
          }
        }
      }
      for (const ball of list) {
        context.fillStyle = ball.color;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
      }
    },
  });

  return (
    <canvas
      ref={canvasRef}
      className={`${canvasClass}`}
      data-cursor="hover"
      aria-label="Click or tap to drop bouncing pink balls"
      role="img"
    />
  );
}
