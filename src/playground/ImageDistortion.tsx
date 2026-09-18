import { useRef, useState } from "react";
import { useCanvas2D, type CanvasSize } from "@/hooks/useCanvas2D";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLocalPointer } from "@/hooks/useLocalPointer";
import { damp } from "@/lib/math";
import type { ExperimentProps } from "./types";

const STRIP_PX = 3;
const FALLOFF_PX = 90;
const MAX_SHIFT_PX = 38;

/** Paints the procedural artwork that gets distorted, at device resolution. */
const paintArtwork = (canvas: HTMLCanvasElement, { width, height, dpr }: CanvasSize) => {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(dpr, dpr);

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#000000");
  sky.addColorStop(0.55, "#3b0a24");
  sky.addColorStop(1, "#ff2e88");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.5, height * 0.62, 10, width * 0.5, height * 0.62, height * 0.5);
  glow.addColorStop(0, "rgba(255,184,213,0.95)");
  glow.addColorStop(0.35, "rgba(255,46,136,0.5)");
  glow.addColorStop(1, "rgba(255,46,136,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(0,0,0,0.55)";
  for (let y = height * 0.62; y < height; y += 9) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.lineWidth = 1 + ((y - height * 0.62) / height) * 6;
    context.stroke();
  }

  context.fillStyle = "#ffffff";
  context.font = `600 ${Math.round(height * 0.16)}px "Bricolage Grotesque", system-ui, sans-serif`;
  context.textAlign = "center";
  context.fillText("SIGNAL", width / 2, height * 0.34);
  context.font = `400 ${Math.max(9, Math.round(height * 0.035))}px "Martian Mono", monospace`;
  context.fillStyle = "rgba(255,255,255,0.6)";
  context.fillText("FRAME_06 / 35mm", width / 2, height * 0.42);
};

export const ImageDistortion = ({ active }: ExperimentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceCanvas] = useState(() => document.createElement("canvas"));
  const sourceRef = useRef(sourceCanvas);
  const pointer = useLocalPointer(canvasRef);
  const intensity = useRef(0);
  const focusY = useRef(0);

  const { contextRef, sizeRef } = useCanvas2D(canvasRef, (size) => {
    paintArtwork(sourceRef.current, size);
    document.fonts?.ready.then(() => paintArtwork(sourceRef.current, sizeRef.current));
  });

  useAnimationFrame((delta, elapsed) => {
    const context = contextRef.current;
    const { width, height, dpr } = sizeRef.current;
    const source = sourceRef.current;
    if (!context || width === 0) return;

    const state = pointer.current;
    const speed = state.inside ? Math.min(1, Math.hypot(state.vx, state.vy) / 30) : 0;
    intensity.current += ((state.inside ? 0.35 + speed : 0) - intensity.current) * damp(4, delta);
    focusY.current += ((state.inside ? state.y : height / 2) - focusY.current) * damp(8, delta);
    state.vx *= 0.85;
    state.vy *= 0.85;

    context.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += STRIP_PX) {
      const falloff = Math.max(0, 1 - Math.abs(y - focusY.current) / FALLOFF_PX);
      const shift = Math.sin(y * 0.06 + elapsed * 6) * MAX_SHIFT_PX * intensity.current * falloff ** 2;
      context.drawImage(source, 0, y * dpr, width * dpr, STRIP_PX * dpr, shift, y, width, STRIP_PX);
      if (falloff > 0.3 && intensity.current > 0.05) {
        context.globalAlpha = 0.35 * falloff;
        context.globalCompositeOperation = "lighter";
        context.drawImage(source, 0, y * dpr, width * dpr, STRIP_PX * dpr, shift * 1.6, y, width, STRIP_PX);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = 1;
      }
    }
  }, active);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      data-cursor="play"
      role="img"
      aria-label="Artwork that ripples and splits where the pointer sweeps across it."
    />
  );
};
