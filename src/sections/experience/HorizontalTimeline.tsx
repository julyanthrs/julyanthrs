import { useRef, useState } from "react";
import { experience } from "@/data/experience";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/math";
import { TimelineCard, TimelineNode, getNodeState } from "./TimelineCard";

/** Fraction of the viewport width where a node counts as "reached". */
const ACTIVATION_LINE = 0.5;
/** Where the last node rests when the pin releases. */
const FINAL_NODE_POSITION = 0.38;

export const HorizontalTimeline = ({ header }: { header: React.ReactNode }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useGSAP(
    () => {
      const track = trackRef.current;
      const fill = fillRef.current;
      if (!track || !fill) return;

      const items = Array.from(track.querySelectorAll<HTMLElement>("[data-timeline-item]"));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      const measure = () => {
        const firstX = first.offsetLeft;
        const spacing = items[1] ? items[1].offsetLeft - firstX : 1;
        const lineWidth = last.offsetLeft - firstX;
        const distance = Math.max(0, last.offsetLeft - window.innerWidth * FINAL_NODE_POSITION);
        return { firstX, spacing, lineWidth, distance };
      };
      let metrics = measure();

      const setTrackX = gsap.quickSetter(track, "x", "px");
      const setGridX = gridRef.current ? gsap.quickSetter(gridRef.current, "x", "px") : null;
      const setFill = gsap.quickSetter(fill, "scaleX");

      ScrollTrigger.create({
        trigger: pinRef.current,
        pin: true,
        start: "top top",
        end: () => `+=${metrics.distance}`,
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: () => {
          metrics = measure();
        },
        onUpdate: ({ progress }) => {
          const trackX = -progress * metrics.distance;
          setTrackX(trackX);
          setGridX?.(trackX * 0.2);

          const reachedPx = window.innerWidth * ACTIVATION_LINE - trackX - metrics.firstX;
          setFill(clamp(reachedPx / metrics.lineWidth, 0, 1));

          const nextIndex = clamp(Math.floor(reachedPx / metrics.spacing), 0, items.length - 1);
          if (nextIndex !== activeIndexRef.current) {
            activeIndexRef.current = nextIndex;
            setActiveIndex(nextIndex);
          }
        },
      });

      gsap.from("[data-timeline-node-wrap]", {
        scale: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: "back.out(2)",
        scrollTrigger: { trigger: pinRef.current, start: "top 70%", once: true },
      });
    },
    { scope: pinRef },
  );

  return (
    <div ref={pinRef} className="relative flex h-svh flex-col justify-center overflow-hidden pt-nav">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div ref={gridRef} className="grid-backdrop absolute inset-y-0 -left-1/4 w-[200%] opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
      </div>

      <div className="container-frame">{header}</div>

      {/* Tall enough for a two-line card on either side of the line (card ~220px + 36px connector each way). */}
      <div className="relative mt-6 h-[500px]">
        <div ref={trackRef} className="absolute inset-y-0 left-0 flex will-transform" style={{ paddingLeft: "12vw", paddingRight: "50vw" }}>
          <div aria-hidden="true" className="absolute top-1/2 h-px bg-line" style={{ left: "12vw", width: `${(experience.length - 1) * 22}rem` }}>
            <div ref={fillRef} className="h-full w-full origin-left scale-x-0 bg-hot shadow-[0_0_12px_var(--color-hot)]" />
          </div>

          <ol className="contents">
            {experience.map((entry, index) => {
              const state = getNodeState(index, activeIndex);
              const isAbove = index % 2 === 0;
              return (
                <li
                  key={entry.year + entry.role}
                  data-timeline-item
                  className="relative h-full w-[22rem] shrink-0"
                  aria-current={state === "active" ? "step" : undefined}
                >
                  <span data-timeline-node-wrap className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <TimelineNode state={state} />
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 w-px bg-line-hot transition-opacity duration-500 ${
                      isAbove ? "bottom-1/2 h-8" : "top-1/2 h-8"
                    } ${state === "upcoming" ? "opacity-30" : "opacity-100"}`}
                  />
                  <div className={`absolute -left-6 w-72 ${isAbove ? "bottom-[calc(50%+2.25rem)]" : "top-[calc(50%+2.25rem)]"}`}>
                    <TimelineCard entry={entry} state={state} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};
