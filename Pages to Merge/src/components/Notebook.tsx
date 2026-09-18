import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { SITE } from '@/data/site';

interface Placement {
  left: string;
  top: string;
  rotate: number;
}

interface NotebookItemConfig {
  id: string;
  label: string;
  mobile: Placement;
  desktop: Placement;
  render: (controls: InspectorState) => ReactNode;
}

interface InspectorState {
  showGrid: boolean;
  warmBoard: boolean;
  setShowGrid: (value: boolean) => void;
  setWarmBoard: (value: boolean) => void;
}

const KEYBOARD_STEP_PX = 24;

function Portrait({ caption, variant }: { caption: string; variant: 'face' | 'desk' }) {
  return (
    <figure className="w-52 bg-white p-3 pb-2 text-void shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] md:w-60">
      <svg viewBox="0 0 200 220" className="block aspect-[10/11] w-full bg-void" aria-hidden="true">
        {variant === 'face' ? (
          <>
            <rect width="200" height="220" fill="#1a0610" />
            <circle cx="100" cy="92" r="46" fill="#FF9FCC" />
            <path d="M20 220 C 30 150, 170 150, 180 220 Z" fill="#FF2D95" />
            <path d="M52 86 C 50 30, 150 30, 150 86 C 140 60, 70 56, 52 86 Z" fill="#050505" />
            <rect x="68" y="84" width="28" height="16" rx="4" fill="none" stroke="#050505" strokeWidth="4" />
            <rect x="104" y="84" width="28" height="16" rx="4" fill="none" stroke="#050505" strokeWidth="4" />
          </>
        ) : (
          <>
            <rect width="200" height="220" fill="#0d0d0d" />
            <rect x="24" y="40" width="152" height="96" rx="8" fill="#FF2D95" />
            <rect x="36" y="52" width="60" height="8" rx="4" fill="#050505" />
            <rect x="36" y="68" width="100" height="6" rx="3" fill="#050505" opacity=".5" />
            <rect x="84" y="136" width="32" height="30" fill="#333" />
            <ellipse cx="150" cy="186" rx="18" ry="10" fill="#FFC1DC" />
            <rect x="30" y="176" width="80" height="10" rx="5" fill="#FF9FCC" />
          </>
        )}
      </svg>
      <figcaption className="px-1 pt-2 font-serif text-lg italic">{caption}</figcaption>
    </figure>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5 text-sm">
      <span aria-hidden="true">{label}</span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        onPointerDown={(event) => event.stopPropagation()}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-hot' : 'bg-white/20'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ease-out-expo ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

const ITEMS: readonly NotebookItemConfig[] = [
  {
    id: 'portrait',
    label: 'Polaroid portrait',
    mobile: { left: '4%', top: '1%', rotate: -6 },
    desktop: { left: '6%', top: '6%', rotate: -7 },
    render: () => <Portrait variant="face" caption="me, mid-kerning" />,
  },
  {
    id: 'rule',
    label: 'Sticky note with a design rule',
    mobile: { left: '46%', top: '9%', rotate: 5 },
    desktop: { left: '30%', top: '4%', rotate: 4 },
    render: () => (
      <div className="w-48 bg-petal p-5 text-void shadow-xl md:w-56">
        <p className="annotation text-void/60">rule no. 1</p>
        <p className="mt-2 font-serif text-2xl leading-tight">If it doesn't move, ask why it shouldn't.</p>
      </div>
    ),
  },
  {
    id: 'inspector',
    label: 'Inspector window with working toggles',
    mobile: { left: '6%', top: '25%', rotate: 2 },
    desktop: { left: '58%', top: '8%', rotate: -2 },
    render: ({ showGrid, warmBoard, setShowGrid, setWarmBoard }) => (
      <div className="w-64 overflow-hidden rounded-xl border border-white/15 bg-carbon text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="annotation text-hot">Inspector</span>
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-hot" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
          </span>
        </div>
        <div className="px-4 py-3">
          <Toggle label="Show layout grid" checked={showGrid} onChange={setShowGrid} />
          <Toggle label="Warm the board" checked={warmBoard} onChange={setWarmBoard} />
          <p className="annotation mt-2 text-muted">This window is real. Try it.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'code',
    label: 'Code window',
    mobile: { left: '40%', top: '42%', rotate: -3 },
    desktop: { left: '36%', top: '40%', rotate: 3 },
    render: () => (
      <pre className="annotation w-64 rounded-xl border border-hot/40 bg-void p-4 text-[0.72rem] leading-relaxed text-white shadow-2xl md:w-72">
        <code>
          <span className="text-blush">export const</span> me = {'{'}
          {'\n  '}loves: [<span className="text-petal">'type'</span>, <span className="text-petal">'springs'</span>],
          {'\n  '}hates: <span className="text-petal">'layout shift'</span>,{'\n  '}coffee: <span className="text-hot">Infinity</span>,
          {'\n'}
          {'}'};
        </code>
      </pre>
    ),
  },
  {
    id: 'skills',
    label: 'Skill labels',
    mobile: { left: '4%', top: '58%', rotate: 0 },
    desktop: { left: '8%', top: '52%', rotate: -2 },
    render: () => (
      <div className="flex w-60 flex-wrap gap-2 md:w-72">
        {['Motion design', 'Type nerd', 'Accessibility', 'Design systems', 'WebGL-curious'].map((tag, index) => (
          <span
            key={tag}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${index % 2 ? 'border border-hot text-hot' : 'bg-hot text-void'}`}
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'principles',
    label: 'Personal design principles',
    mobile: { left: '30%', top: '70%', rotate: 3 },
    desktop: { left: '70%', top: '46%', rotate: 5 },
    render: () => (
      <div className="w-60 border border-blush/40 bg-ink p-5 text-white shadow-2xl md:w-64">
        <p className="annotation text-hot">principles.md</p>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted">
          <li>Clarity first, character second, never neither.</li>
          <li>Motion must explain what changed.</li>
          <li>Ship it to real people early.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'desk',
    label: 'Polaroid of a desk',
    mobile: { left: '50%', top: '82%', rotate: 7 },
    desktop: { left: '52%', top: '66%', rotate: -5 },
    render: () => <Portrait variant="desk" caption={`${SITE.location}, 2am`} />,
  },
  {
    id: 'quote',
    label: 'Quote',
    mobile: { left: '6%', top: '88%', rotate: -2 },
    desktop: { left: '22%', top: '80%', rotate: 2 },
    render: () => (
      <blockquote className="w-64 font-serif text-3xl leading-tight text-petal md:w-80">
        “Good interfaces are felt before they are understood.”
      </blockquote>
    ),
  },
];

interface DraggableItemProps {
  config: NotebookItemConfig;
  boardRef: RefObject<HTMLDivElement>;
  placement: Placement;
  zIndex: number;
  onRaise: () => void;
  inspector: InspectorState;
}

function DraggableItem({ config, boardRef, placement, zIndex, onRaise, inspector }: DraggableItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-KEYBOARD_STEP_PX, 0],
      ArrowRight: [KEYBOARD_STEP_PX, 0],
      ArrowUp: [0, -KEYBOARD_STEP_PX],
      ArrowDown: [0, KEYBOARD_STEP_PX],
    };
    const delta = deltas[event.key];
    const board = boardRef.current?.getBoundingClientRect();
    const item = itemRef.current?.getBoundingClientRect();
    if (!delta || !board || !item || event.target !== event.currentTarget) return;
    event.preventDefault();
    onRaise();
    // Clamp so keyboard moves respect the same bounds as dragging.
    const [dx, dy] = delta;
    const clampedDx = Math.max(board.left - item.left, Math.min(board.right - item.right, dx));
    const clampedDy = Math.max(board.top - item.top, Math.min(board.bottom - item.bottom, dy));
    x.set(x.get() + clampedDx);
    y.set(y.get() + clampedDy);
  };

  return (
    <motion.div
      ref={itemRef}
      drag
      dragConstraints={boardRef}
      dragElastic={0.12}
      dragTransition={{ power: 0.35, timeConstant: 320, bounceStiffness: 260, bounceDamping: 22 }}
      whileDrag={{ scale: 1.06, rotate: 0, filter: 'drop-shadow(0 30px 40px rgba(255,45,149,0.35))' }}
      onPointerDown={onRaise}
      onKeyDown={nudge}
      tabIndex={0}
      role="group"
      aria-roledescription="draggable item"
      aria-label={`${config.label}. Drag, or use arrow keys to move.`}
      data-cursor="drag"
      className="absolute touch-none select-none rounded-sm outline-offset-4"
      style={{ x, y, left: placement.left, top: placement.top, rotate: placement.rotate, zIndex }}
    >
      {config.render(inspector)}
    </motion.div>
  );
}

export function Notebook() {
  const boardRef = useRef<HTMLDivElement>(null);
  const { isTablet } = useMotionPreferences();
  const [order, setOrder] = useState<string[]>(() => ITEMS.map((item) => item.id));
  const [showGrid, setShowGrid] = useState(false);
  const [warmBoard, setWarmBoard] = useState(false);
  const inspector: InspectorState = { showGrid, warmBoard, setShowGrid, setWarmBoard };

  const raise = (id: string) =>
    setOrder((current) => (current[current.length - 1] === id ? current : [...current.filter((entry) => entry !== id), id]));

  return (
    <section data-section="Notebook" aria-labelledby="notebook-title" className="shell relative py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="notebook-title" className="display display-condensed text-[16vw] md:text-[8vw]">
          Open notebook
        </h2>
        <p className="max-w-xs text-muted">Pieces of how I think. Everything on this board can be picked up and moved.</p>
      </div>

      <div
        ref={boardRef}
        className={`relative h-[210svh] overflow-hidden rounded-[2rem] border border-white/10 transition-colors duration-700 md:h-[125vh] ${warmBoard ? 'bg-[#1a0711]' : 'bg-ink'}`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${showGrid ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,45,149,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,45,149,0.18) 1px, transparent 1px)',
            backgroundSize: '8.333% 64px',
          }}
        />
        {ITEMS.map((item) => (
          <DraggableItem
            key={item.id}
            config={item}
            boardRef={boardRef}
            placement={isTablet ? item.desktop : item.mobile}
            zIndex={order.indexOf(item.id) + 1}
            onRaise={() => raise(item.id)}
            inspector={inspector}
          />
        ))}
      </div>
    </section>
  );
}
