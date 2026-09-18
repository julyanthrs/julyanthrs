import { useRef } from "react";
import { experience } from "@/data/experience";
import { gsap, useGSAP } from "@/lib/gsap";
import { TimelineCard, TimelineNode } from "./TimelineCard";

/** Mobile timeline: a scrubbed vertical line with nodes that light up as they are reached. */
export const VerticalTimeline = ({ header }: { header: React.ReactNode }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-vertical-fill]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: listRef.current, start: "top 60%", end: "bottom 60%", scrub: true },
        },
      );

      rootRef.current?.querySelectorAll<HTMLElement>("[data-vertical-item]").forEach((item) => {
        gsap.from(item.querySelector("[data-vertical-card]"), {
          opacity: 0,
          x: 30,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: item, start: "top 80%", once: true },
        });
        gsap.to(item, {
          scrollTrigger: { trigger: item, start: "top 60%", toggleClass: { targets: item, className: "is-reached" } },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="container-frame relative overflow-x-clip py-24">
      {/* overflow-x-clip: cards wait 30px to the right before revealing; clip (unlike hidden) creates no scroll container. */}
      {header}
      <ol ref={listRef} className="relative mt-12 flex flex-col gap-8 pl-8">
        <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-0 w-px bg-line">
          <span data-vertical-fill className="block h-full w-full origin-top bg-hot shadow-[0_0_10px_var(--color-hot)]" />
        </span>
        {experience.map((entry) => (
          <li key={entry.year + entry.role} data-vertical-item className="group/item relative">
            <span className="absolute -left-8 top-5 transition-transform duration-500 group-[.is-reached]/item:scale-125">
              <span className="block rounded-full group-[.is-reached]/item:shadow-[0_0_18px_var(--color-hot)]">
                <TimelineNode state="upcoming" className="group-[.is-reached]/item:border-hot group-[.is-reached]/item:bg-hot" />
              </span>
            </span>
            <div data-vertical-card>
              <TimelineCard entry={entry} state="passed" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
