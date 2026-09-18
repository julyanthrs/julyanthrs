import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import type { Project } from "@/data/types";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { ProjectVisual } from "@/components/visuals/ProjectVisual";

interface CaseStudyDialogProps {
  project: Project | null;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const CaseStudyDialog = ({ project, onClose }: CaseStudyDialogProps) => {
  const { lock, unlock } = useSmoothScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lock();
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      unlock();
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [project, lock, unlock, onClose]);

  const sections = project
    ? ([
        ["Challenge", project.caseStudy.challenge],
        ["Approach", project.caseStudy.approach],
        ["Outcome", project.caseStudy.outcome],
      ] as const)
    : [];

  return createPortal(
    <AnimatePresence>
      {project && (
        <m.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/70 p-3 backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-study-title"
            data-lenis-prevent
            className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[16/9] overflow-hidden border-b border-line">
              <ProjectVisual kind={project.visual} />
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-line bg-ink/80 transition-transform duration-300 hover:rotate-90 hover:border-hot"
              aria-label="Close case study"
            >
              <span aria-hidden="true" className="text-lg leading-none">×</span>
            </button>

            <div className="p-6 sm:p-8">
              <p className="meta">
                {project.discipline} / {project.year}
              </p>
              <h3 id="case-study-title" className="mt-2 text-3xl font-semibold [font-variation-settings:'wdth'_82]">
                {project.title}
              </h3>
              <p className="mt-1 text-sm text-blush">{project.caseStudy.role}</p>

              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                {sections.map(([label, text], index) => (
                  <m.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                  >
                    <dt className="meta text-hot">{label}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted">{text}</dd>
                  </m.div>
                ))}
              </dl>

              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools used">
                {project.caseStudy.stack.map((tool) => (
                  <li key={tool} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
