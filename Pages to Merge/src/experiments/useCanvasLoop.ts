import { useEffect, useRef, type RefObject } from 'react';

export interface LocalPointer {
  x: number;
  y: number;
  inside: boolean;
  down: boolean;
  /** Pixels moved since last frame */
  speed: number;
}

export interface FrameInfo {
  width: number;
  height: number;
  time: number;
  delta: number;
  pointer: LocalPointer;
}

interface CanvasLoopOptions {
  active: boolean;
  draw: (context: CanvasRenderingContext2D, frame: FrameInfo) => void;
  onResize?: (width: number, height: number) => void;
  onPointerDown?: (pointer: LocalPointer) => void;
}

const MAX_DPR = 2;

/**
 * DPR-aware canvas with a paused-when-inactive rAF loop and local pointer state.
 * Canvas experiments share this so each file only contains its own idea.
 */
export const useCanvasLoop = (
  canvasRef: RefObject<HTMLCanvasElement>,
  { active, draw, onResize, onPointerDown }: CanvasLoopOptions,
): void => {
  const drawRef = useRef(draw);
  const resizeRef = useRef(onResize);
  const downRef = useRef(onPointerDown);
  drawRef.current = draw;
  resizeRef.current = onResize;
  downRef.current = onPointerDown;
  const pointer = useRef<LocalPointer>({ x: 0, y: 0, inside: false, down: false, speed: 0 });
  const size = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      size.current = { width: rect.width, height: rect.height };
      resizeRef.current?.(rect.width, rect.height);
    };

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.current.speed += Math.hypot(x - pointer.current.x, y - pointer.current.y);
      pointer.current.x = x;
      pointer.current.y = y;
    };
    const onMove = (event: PointerEvent) => {
      toLocal(event);
      pointer.current.inside = true;
    };
    const onLeave = () => {
      pointer.current.inside = false;
      pointer.current.down = false;
    };
    const onDown = (event: PointerEvent) => {
      toLocal(event);
      pointer.current.down = true;
      pointer.current.inside = true;
      downRef.current?.(pointer.current);
    };
    const onUp = () => {
      pointer.current.down = false;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      observer.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [canvasRef]);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!active || !context) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      drawRef.current(context, { ...size.current, time: now / 1000, delta, pointer: pointer.current });
      pointer.current.speed *= 0.85;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active, canvasRef]);
};
