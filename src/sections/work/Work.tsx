import { useCallback, useRef, useState } from "react";
import { projects } from "@/data/projects";
import type { Project } from "@/data/types";
import { useParallax } from "@/hooks/useParallax";
import { RevealText } from "@/components/ui/RevealText";
import { CrossMark, SectionIndex } from "@/components/ui/Decorations";
import { ProjectShowcase } from "./ProjectShowcase";
import { CaseStudyDialog } from "./CaseStudyDialog";

const yearRange = (() => {
  const years = projects.map((project) => Number(project.year));
  return `${Math.min(...years)}–${Math.max(...years)}`;
})();

export const Work = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const closeProject = useCallback(() => setOpenProject(null), []);

  useParallax(sectionRef);

  return (
    <section id="work" ref={sectionRef} className="relative isolate overflow-hidden py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div data-speed="0.5" className="absolute left-[-10%] top-[20%]">
          <div className="animate-glow-drift size-[40rem] rounded-full bg-hot/10 blur-[140px]" />
        </div>
        <div data-speed="0.7" className="absolute bottom-[10%] right-[-10%]">
          <div className="animate-glow-drift size-[32rem] rounded-full bg-blush/[0.07] blur-[120px] [animation-delay:-8s]" />
        </div>
      </div>

      <div className="container-frame">
        <header className="mb-16 flex flex-col gap-6 md:mb-24 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionIndex index={3} label="Work" />
            <RevealText as="h2" text="Selected work" variant="chars" className="heading-section mt-6" />
          </div>
          <p className="meta flex items-center gap-2">
            <CrossMark />
            {projects.length} projects, {yearRange}
          </p>
        </header>

        <div className="flex flex-col gap-24 md:gap-36">
          {projects.map((project, index) => (
            <ProjectShowcase key={project.slug} project={project} index={index} onOpen={setOpenProject} />
          ))}
        </div>
      </div>

      <CaseStudyDialog project={openProject} onClose={closeProject} />
    </section>
  );
};
