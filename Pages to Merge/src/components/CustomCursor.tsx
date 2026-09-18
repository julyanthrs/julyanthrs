import { useEffect, useRef, useState } from 'react';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useTicker } from '@/hooks/useTicker';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { damp, lerp } from '@/lib/math';

/**
 * Elements opt into cursor states with `data-cursor="view|drag|explore|select|hide"`.
 * Native interactive elements get the `hover` state automatically.
 */
type CursorMode = 'default' | 'hover' | 'text' | 'view' | 'drag' | 'explore' | 'select' | 'hide';

const LABELED_MODES: Partial<Record<CursorMode, string>> = { view: 'View', drag: 'Drag', explore: 'Explore' };
const EXPLICIT_MODES = new Set<CursorMode>(['view', 'drag', 'explore', 'select', 'hide', 'hover']);
const INTERACTIVE_SELECTOR = 'a, button, [role="button"], select, summary, label';
const TEXT_SELECTOR = 'input:not([type="radio"]):not([type="checkbox"]), textarea';

const RING_SMOOTHING = 14;

const RING_SIZE: Record<CursorMode, number> = {
  default: 34,
  hover: 64,
  text: 4,
  view: 104,
  drag: 96,
  explore: 112,
  select: 58,
  hide: 0,
};

const resolveMode = (target: EventTarget | null): CursorMode => {
  if (!(target instanceof Element)) return 'default';
  const tagged = target.closest<HTMLElement>('[data-cursor]');
  const taggedMode = tagged?.dataset.cursor as CursorMode | undefined;
  if (taggedMode && EXPLICIT_MODES.has(taggedMode)) return taggedMode;
  if (target.closest(TEXT_SELECTOR)) return 'text';
  if (target.closest(INTERACTIVE_SELECTOR)) return 'hover';
  return 'default';
};

export function CustomCursor() {
  const { finePointer, reducedMotion } = useMotionPreferences();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringPosition = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<CursorMode>('default');
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!finePointer) return;
    startPointerTracking();
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    const onOver = (event: PointerEvent) => setMode(resolveMode(event.target));
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointermove', onEnter, { passive: true, once: true });
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    return () => {
      root.classList.remove('has-custom-cursor');
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointermove', onEnter);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [finePointer]);

  useTicker((_time, deltaMs) => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    const smoothing = reducedMotion ? 1 : damp(RING_SMOOTHING, deltaMs / 1000);
    ringPosition.current.x = lerp(ringPosition.current.x, pointer.x, smoothing);
    ringPosition.current.y = lerp(ringPosition.current.y, pointer.y, smoothing);
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPosition.current.x}px, ${ringPosition.current.y}px, 0)`;
  }, finePointer);

  if (!finePointer) return null;

  const size = RING_SIZE[mode];
  const label = LABELED_MODES[mode];
  const isFilled = Boolean(label);
  const isSelect = mode === 'select';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div ref={ringRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-[width,height,background-color,border-color,border-radius] duration-500 ease-out-expo ${
            isSelect ? 'rounded-none border border-hot' : 'rounded-full'
          } ${isFilled ? 'border-transparent bg-hot' : ''} ${
            mode === 'hover' ? 'border border-hot bg-hot/15' : ''
          } ${mode === 'default' ? 'border border-blush/50' : ''} ${mode === 'text' ? 'rounded-sm bg-hot' : ''}`}
          style={{ width: size, height: mode === 'text' ? 28 : size, transform: `translate(-50%, -50%) scale(${pressed ? 0.85 : 1})` }}
        >
          {label && <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-void">{label}</span>}
          {isSelect &&
            ['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((corner) => (
              <span key={corner} className={`absolute h-2 w-2 border border-hot bg-void ${corner}`} />
            ))}
        </div>
      </div>
      <div ref={dotRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hot transition-opacity duration-200 ${
            isFilled || mode === 'text' || mode === 'hide' ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>
    </div>
  );
}
