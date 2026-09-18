import { useRef } from "react";
import { skills, skillsIntro } from "@/data/skills";
import type { Skill } from "@/data/types";
import { gsap, useGSAP } from "@/lib/gsap";
import { useParallax } from "@/hooks/useParallax";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { RevealText } from "@/components/ui/RevealText";
import { InterfaceLabel, SectionIndex } from "@/components/ui/Decorations";
import { DriftParticles } from "@/components/visuals/DriftParticles";
import { SkillField } from "./SkillField";

const LEGEND: ReadonlyArray<{ group: Skill["group"]; label: string; swatch: string }> = [
  { group: "build", label: "Build", swatch: "border border-hot" },
  { group: "design", label: "Design", swatch: "bg-blush" },
  { group: "motion", label: "Motion & 3D", swatch: "bg-chrome" },
];

export const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  useParallax(sectionRef);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      gsap.fromTo(
        "[data-skill-stage]",
        { rotateX: 14, transformPerspective: 1200 },
        {
          rotateX: -6,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section id="skills" ref={sectionRef} className="relative isolate overflow-hidden py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-80" data-speed="0.8">
        <DriftParticles />
      </div>

      <div className="container-frame grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionIndex index={5} label="Skills" />
          <RevealText as="h2" text="Toolkit" variant="tracking" className="heading-section mt-6" />
          <RevealText as="p" text={skillsIntro} variant="words" className="mt-5 max-w-xs text-muted" />
          <ul className="mt-8 flex flex-col gap-3">
            {LEGEND.map((item) => (
              <li key={item.group} className="flex items-center gap-3 text-sm text-muted">
                <span aria-hidden="true" className={`size-3 rounded-full ${item.swatch}`} />
                {item.label}
                <span className="meta ml-auto">{skills.filter((skill) => skill.group === item.group).length}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-8" data-speed="1.08">
          <div data-skill-stage className="relative rounded-3xl border border-line bg-surface/40 p-4 sm:p-8">
            <InterfaceLabel className="absolute left-5 top-3">{`skills.field / ${skills.length} nodes`}</InterfaceLabel>
            <InterfaceLabel className="absolute bottom-3 right-5">hover to push, click to inspect</InterfaceLabel>
            <SkillField />
          </div>
        </div>
      </div>
    </section>
  );
};
