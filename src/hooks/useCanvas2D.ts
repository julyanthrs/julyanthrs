import { useEffect, useRef, type RefObject } from "react";

export interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

const MAX_DPR = 2;

/**
 * Keeps a 2D canvas backing store matched to its CSS size and device pixel ratio.
 * Returns the context and a live size ref for draw loops.
 */
export const useCanvas2D = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onResize?: (size: CanvasSize) => void,
) => {
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    contextRef.current = context;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height, dpr };
      onResizeRef.current?.(sizeRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  return { contextRef, sizeRef };
};
