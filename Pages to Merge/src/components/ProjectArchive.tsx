import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LAB_ENTRIES, PROJECTS } from '@/data/projects';
import { TransitionLink } from '@/providers/TransitionProvider';
import { useMotionPreferences } from '@/hooks/useMediaQuery';
import { useTicker } from '@/hooks/useTicker';
import { pointer, startPointerTracking } from '@/lib/pointer';
import { EASE } from '@/lib/motion';
import { damp, lerp } from '@/lib/math';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import type { VisualVariant } from '@/visuals/types';
import { RevealText } from './RevealText';

interface ArchiveRow {
  key: string;
  year: number;
  name: string;
  label: string;
  to: string;
  visual: VisualVariant;
}

const ROWS: readonly ArchiveRow[] = [
  ...PROJECTS.map((project) => ({
    key: project.slug,
    year: project.year,
    name: project.name,
    label: project.archiveLabel,
    to: `/work/${project.slug}`,
    visual: project.visual,
  })),
  ...LAB_ENTRIES.map((entry) => ({
    key: entry.name,
    year: entry.year,
    name: entry.name,
    label: entry.label,
    to: '/playground',
    visual: entry.visual,
  })),
];

const PREVIEW = { width: 320, height: 220, smoothing: 10, offsetX: 32 } as const;

export function ProjectArchive() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState<ArchiveRow | null>(null);
  const { finePointer, reducedMotion } = useMotionPreferences();

  useTicker(
    (_time, deltaMs) => {
      const section = sectionRef.current;
      const preview = previewRef.current;
      if (!section || !preview) return;
      const rect = section.getBoundingClientRect();
      if (pointer.hasMoved) {
        target.current = { x: pointer.x - rect.left + PREVIEW.offsetX, y: pointer.y - rect.top - PREVIEW.height / 2 };
      }
      const amount = reducedMotion ? 1 : damp(PREVIEW.smoothing, deltaMs / 1000);
      const velocityTilt = (target.current.x - current.current.x) * 0.04;
      current.current.x = lerp(current.current.x, target.current.x, amount);
      current.current.y = lerp(current.current.y, target.current.y, amount);
      preview.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) rotate(${Math.max(-12, Math.min(12, velocityTilt))}deg)`;
    },
    Boolean(active) && finePointer,
  );

  return (
    <section
      ref={sectionRef}
      data-section="Archive"
      aria-label="Project archive"
      className="shell relative bg-void py-28"
      onPointerEnter={startPointerTracking}
      onPointerLeave={() => setActive(null)}
    >
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <RevealText as="h2" lines={['Archive']} className="display display-wide text-[18vw] md:text-[9vw]" />
        <p className="max-w-xs text-muted">Everything, newest first. Hover a row to peek.</p>
      </div>

      <ul className="border-t border-white/15">
        {ROWS.map((row) => (
          <li key={row.key}>
            <TransitionLink
              to={row.to}
              visual={row.visual}
              data-cursor="explore"
              onPointerEnter={() => setActive(row)}
              onFocus={() => setActive(row)}
              onBlur={() => setActive(null)}
              className="group relative grid grid-cols-[4rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-white/15 py-6 md:grid-cols-[6rem_1fr_14rem] md:py-8"
            >
              <span className="annotation text-muted transition-colors group-hover:text-hot">{row.year}</span>
              <span className="display type-stretch text-4xl text-white transition-transform duration-700 ease-out-expo group-hover:translate-x-5 group-hover:text-hot md:text-6xl">
                {row.name}
              </span>
              <span className="col-start-2 text-sm text-muted transition-transform duration-700 ease-out-expo group-hover:-translate-x-3 md:col-start-3 md:text-right">
                {row.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-hot transition-transform duration-700 ease-out-expo group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
            </TransitionLink>
          </li>
        ))}
      </ul>

      {finePointer && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 will-change-transform"
          style={{ width: PREVIEW.width, height: PREVIEW.height }}
        >
          <AnimatePresence mode="popLayout">
            {active && (
              <motion.div
                key={active.key}
                initial={{ clipPath: 'inset(50% 50% 50% 50% round 12px)', scale: 1.2 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0% round 12px)', scale: 1 }}
                exit={{ clipPath: 'inset(50% 50% 50% 50% round 12px)', opacity: 0 }}
                transition={{ duration: 0.55, ease: EASE.outExpo }}
                className="absolute inset-0 overflow-hidden shadow-[0_30px_80px_-20px_rgba(255,45,149,0.6)]"
              >
                <ProjectVisual variant={active.visual} label="" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
