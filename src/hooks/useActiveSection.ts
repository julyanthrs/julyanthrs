import { useEffect, useState } from "react";
import type { SectionId } from "@/data/types";

/** Reports which section currently crosses the middle band of the viewport. */
export const useActiveSection = (sectionIds: readonly SectionId[]): SectionId | null => {
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id as SectionId);
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
};
