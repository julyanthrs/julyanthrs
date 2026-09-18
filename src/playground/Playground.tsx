import { useRef, type ComponentType, type PointerEvent } from "react";
import { experiments, playgroundIntro } from "@/data/playground";
import type { ExperimentId } from "@/data/types";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useParallax } from "@/hooks/useParallax";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { RevealText } from "@/components/ui/RevealText";
import { InterfaceLabel, SectionIndex } from "@/components/ui/Decorations";
import type { ExperimentProps } from "./types";
import { ExperimentFrame } from "./ExperimentFrame";
import { GeometryExperiment } from "./GeometryExperiment";
import { ParticleField } from "./ParticleField";
import { LiquidCursor } from "./LiquidCursor";
import { KineticType } from "./KineticType";
import { PhysicsObjects } from "./PhysicsObjects";
import { ImageDistortion } from "./ImageDistortion";
import { MagneticUI } from "./MagneticUI";
import { GenerativeGrid } from "./GenerativeGrid";

const EXPERIMENT_COMPONENTS: Record<ExperimentId, ComponentType<ExperimentProps>> = {
  geometry: GeometryExperiment,
  particles: ParticleField,
  liquid: LiquidCursor,
  kinetic: KineticType,
  physics: PhysicsObjects,
  distortion: ImageDistortion,
  magnetic: MagneticUI,
  grid: GenerativeGrid,
};

export const Playground = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  useParallax(sectionRef);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      gsap.set("[data-experiment]", { opacity: 0 });
      ScrollTrigger.batch("[data-experiment]", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { opacity: 0, y: 60, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: "expo.out", clearProps: "transform,opacity" },
          ),
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <section id="playground" ref={sectionRef} onPointerMove={handlePointerMove} className="relative isolate py-24 [--mx:50%] [--my:30%] md:py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="grid-backdrop absolute inset-0 opacity-30" />
        <div className="grid-backdrop absolute inset-0 [mask-image:radial-gradient(circle_280px_at_var(--mx)_var(--my),black,transparent)] [background-image:linear-gradient(to_right,rgb(255_46_136/0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_46_136/0.45)_1px,transparent_1px)]" />
      </div>

      <div className="container-frame">
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionIndex index={7} label="Playground" />
            <RevealText as="h2" text="Playground" variant="chars" className="heading-section mt-6" />
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <RevealText as="p" text={playgroundIntro} variant="words" className="max-w-xs text-muted md:text-right" />
            <InterfaceLabel>{`${experiments.length} live experiments / 60fps target`}</InterfaceLabel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {experiments.map((experiment, index) => (
            <div key={experiment.id} className={experiment.span === 2 ? "md:col-span-2" : ""} data-speed={index % 2 === 0 ? 1.04 : 0.97}>
              <ExperimentFrame experiment={experiment} index={index} Component={EXPERIMENT_COMPONENTS[experiment.id]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
