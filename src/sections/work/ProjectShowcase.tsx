import { useRef } from "react";
import type { Project, ProjectLayout } from "@/data/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, REVEAL_START } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { TiltCard } from "@/components/ui/TiltCard";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ProjectVisual } from "@/components/visuals/ProjectVisual";

interface ProjectShowcaseProps {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}

interface LayoutClasses {
  article: string;
  visual: string;
  meta: string;
}

const LAYOUTS: Record<ProjectLayout, LayoutClasses> = {
  left: { article: "", visual: "md:w-[68%]", meta: "md:ml-[8%] md:max-w-md" },
  right: { article: "", visual: "md:ml-auto md:w-[64%]", meta: "md:ml-auto md:mr-[6%] md:max-w-md" },
  center: { article: "md:text-center", visual: "md:mx-auto md:w-[60%]", meta: "md:mx-auto md:max-w-md md:items-center" },
  split: {
    article: "md:grid md:grid-cols-12 md:items-center md:gap-10",
    visual: "md:col-span-7",
    meta: "md:col-span-4 md:col-start-9 md:mt-0",
  },
};

export const ProjectShowcase = ({ project, index, onOpen }: ProjectShowcaseProps) => {
  const articleRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const layout = LAYOUTS[project.layout];
  const number = String(index + 1).padStart(2, "0");

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      const reveal = gsap.timeline({
        defaults: { ease: EASE.outExpo },
        scrollTrigger: { trigger: articleRef.current, start: REVEAL_START, once: true },
      });
      reveal
        .fromTo("[data-mask]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: EASE.inOut })
        .from("[data-mask-inner]", { scale: 1.35, duration: 1.8 }, 0)
        .from("[data-number]", { opacity: 0, rotate: -25, yPercent: 40, duration: 1 }, 0.5)
        .from("[data-title]", { yPercent: 110, duration: 1.1 }, 0.55)
        .from("[data-meta-item]", { opacity: 0, y: 16, stagger: 0.08, duration: 0.9 }, 0.7);

      gsap.to("[data-depth-away]", {
        scale: 0.9,
        opacity: 0.4,
        rotateX: 10,
        transformPerspective: 1400,
        transformOrigin: "50% 0%",
        ease: "none",
        scrollTrigger: { trigger: articleRef.current, start: "bottom 55%", end: "bottom top", scrub: true },
      });
    },
    { scope: articleRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <article ref={articleRef} className={`group/project relative ${layout.article}`} aria-labelledby={`project-${project.slug}`}>
      <div className={layout.visual} data-depth-away>
        <TiltCard maxTilt={5} lift={30}>
          <button
            type="button"
            onClick={() => onOpen(project)}
            data-cursor="view"
            aria-label={`Open case study: ${project.title}`}
            className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line text-left transition-[border-color,box-shadow] duration-500 hover:border-hot/70 hover:shadow-[0_0_0_1px_var(--color-hot),0_30px_80px_-30px_rgb(255_46_136/0.55)]"
          >
            <div data-mask className="absolute inset-0">
              {/* GSAP owns data-mask-inner's transform; the hover zoom lives on a child so a CSS transition never fights the tween. */}
              <div data-mask-inner className="absolute inset-0">
                <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover/project:scale-[1.04]">
                  <ProjectVisual kind={project.visual} />
                </div>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/project:opacity-100 [background:radial-gradient(circle_at_var(--glare-x,50%)_var(--glare-y,50%),rgb(255_184_213/0.14),transparent_45%)]"
            />
          </button>
        </TiltCard>
      </div>

      <div
        className={`mt-6 flex flex-col transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover/project:translate-x-2 ${layout.meta}`}
      >
        <span data-number className="inline-block origin-bottom-left font-mono text-sm text-hot">
          {number}
        </span>
        <h3 id={`project-${project.slug}`} className="mt-2 overflow-hidden pb-1 text-3xl font-semibold leading-tight md:text-4xl">
          <span data-title className="inline-block [font-variation-settings:'wdth'_82]">
            {project.title}
          </span>
        </h3>
        <p data-meta-item className="meta mt-2">
          {project.discipline} / {project.year}
        </p>
        <p data-meta-item className="mt-3 text-muted">
          {project.summary}
        </p>
        <span data-meta-item className="mt-4">
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="link-underline group/cta inline-flex items-center gap-2 text-sm font-medium"
          >
            View case study
            <ArrowIcon className="transition-transform duration-300 group-hover/cta:translate-x-1" />
          </button>
        </span>
      </div>
    </article>
  );
};
