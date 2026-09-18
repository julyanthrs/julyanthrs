import { experienceIntro } from "@/data/experience";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { RevealText } from "@/components/ui/RevealText";
import { SectionIndex } from "@/components/ui/Decorations";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { VerticalTimeline } from "./VerticalTimeline";

const TimelineHeader = () => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <SectionIndex index={4} label="Experience" />
      <RevealText as="h2" text="Experience" variant="mask" className="heading-section mt-6" />
    </div>
    <RevealText as="p" text={experienceIntro} variant="wipe" className="max-w-xs text-muted" />
  </div>
);

export const Experience = () => {
  const isDesktop = useIsDesktop();

  return (
    <section id="experience" className="relative isolate">
      {isDesktop ? <HorizontalTimeline header={<TimelineHeader />} /> : <VerticalTimeline header={<TimelineHeader />} />}
    </section>
  );
};
