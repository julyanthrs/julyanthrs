import { useRef } from "react";
import { useCanvas2D } from "@/hooks/useCanvas2D";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { damp } from "@/lib/math";
import type { ExperimentProps } from "./types";

interface Ripple {
  x: number;
  y: number;
  age: number;
}

const CELL_PX = 26;
const INFLUENCE_RADIUS = 150;
const RIPPLE_SPEED = 320;
const RIPPLE_LIFETIME = 1.6;

export const GenerativeGrid = ({ active }: ExperimentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useLocalPointer(canvasRef);
  const smoothed = useRef({ x: 0, y: 0 });
  const ripples = useRef<Ripple[]>([]);
  const { contextRef, sizeRef } = useCanvas2D(canvasRef, ({ width, height }) => {
    smoothed.current = { x: width / 2, y: height / 2 };
  });

  useAnimationFrame((delta, elapsed) => {
    const context = contextRef.current;
    const { width, height } = sizeRef.current;
    if (!context) return;

    const state = pointer.current;
    const targetX = state.inside ? state.x : width / 2 + Math.cos(elapsed * 0.7) * width * 0.3;
    const targetY = state.inside ? state.y : height / 2 + Math.sin(elapsed * 0.9) * height * 0.3;
    const amount = damp(6, delta);
    smoothed.current.x += (targetX - smoothed.current.x) * amount;
    smoothed.current.y += (targetY - smoothed.current.y) * amount;

    ripples.current = ripples.current
      .map((ripple) => ({ ...ripple, age: ripple.age + delta }))
      .filter((ripple) => ripple.age < RIPPLE_LIFETIME);

    context.clearRect(0, 0, width, height);
    const columns = Math.ceil(width / CELL_PX);
    const rows = Math.ceil(height / CELL_PX);

    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const x = column * CELL_PX;
        const y = row * CELL_PX;
        const distance = Math.hypot(x - smoothed.current.x, y - smoothed.current.y);
        let influence = Math.max(0, 1 - distance / INFLUENCE_RADIUS);

        for (const ripple of ripples.current) {
          const ring = Math.abs(Math.hypot(x - ripple.x, y - ripple.y) - ripple.age * RIPPLE_SPEED);
          influence += Math.max(0, 1 - ring / 30) * (1 - ripple.age / RIPPLE_LIFETIME);
        }
        influence = Math.min(1, influence);

        const wave = (Math.sin(elapsed * 1.5 + column * 0.35 + row * 0.25) + 1) / 2;
        const size = 2 + influence * 9 + wave * 1.5;
        const rotation = influence * Math.PI * 0.75 + wave * 0.3;

        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.globalAlpha = 0.18 + influence * 0.82;
        context.strokeStyle = influence > 0.4 ? "#ff2e88" : "#ffb8d5";
        context.lineWidth = 1;
        if (influence > 0.55) {
          context.strokeRect(-size / 2, -size / 2, size, size);
        } else {
          context.beginPath();
          context.moveTo(-size / 2, 0);
          context.lineTo(size / 2, 0);
          context.moveTo(0, -size / 2);
          context.lineTo(0, size / 2);
          context.stroke();
        }
        context.restore();
      }
    }
    context.globalAlpha = 1;
  }, active);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      data-cursor="play"
      role="img"
      aria-label="Generative grid that bends toward the pointer. Click to send a ripple."
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        ripples.current.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, age: 0 });
      }}
    />
  );
};
