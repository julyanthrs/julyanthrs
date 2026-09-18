import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSmoothScroll } from '@/providers/SmoothScrollProvider';
import { usePageTransition } from '@/providers/TransitionProvider';
import { padIndex } from '@/lib/math';

interface SectionMarker {
  label: string;
  progress: number;
  element: HTMLElement;
}

export function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<SectionMarker[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const { scrollTo } = useSmoothScroll();
  const { pageReady } = usePageTransition();

  useEffect(() => {
    if (!pageReady) return;

    const measure = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
      setMarkers(
        sections.map((element) => ({
          element,
          label: element.dataset.section ?? '',
          progress: Math.min(1, (element.getBoundingClientRect().top + window.scrollY) / scrollable),
        })),
      );
    };

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleY(${self.progress})`;
      },
      onRefresh: measure,
    });
    measure();
    return () => trigger.kill();
  }, [location.pathname, pageReady]);

  useEffect(() => {
    if (markers.length === 0) return;
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const next = markers.reduce((found, marker, index) => (self.progress + 0.02 >= marker.progress ? index : found), 0);
        setActiveIndex((current) => (current === next ? current : next));
      },
    });
    return () => trigger.kill();
  }, [markers]);

  return (
    <div aria-hidden={markers.length === 0} className="pointer-events-none fixed bottom-0 right-0 top-0 z-[60] w-10 md:w-14">
      <div className="absolute bottom-0 right-2 top-0 w-px bg-white/10 md:right-4">
        <div
          ref={fillRef}
          className="h-full w-full origin-top scale-y-0 bg-hot shadow-[0_0_12px_rgba(255,45,149,0.8)] will-change-transform"
        />
      </div>
      <nav aria-label="Page sections" className="hidden md:block">
        {markers.map((marker, index) => (
          <button
            key={`${marker.label}-${index}`}
            type="button"
            onClick={() => scrollTo(marker.element)}
            aria-label={`Scroll to ${marker.label}`}
            aria-current={index === activeIndex ? 'step' : undefined}
            className={`annotation pointer-events-auto absolute right-6 -translate-y-1/2 py-1 transition-colors duration-300 ${
              index === activeIndex ? 'text-hot' : 'text-white/40 hover:text-white'
            }`}
            style={{ top: `calc(${marker.progress * 100}% * 0.9 + 5%)` }}
          >
            {padIndex(index + 1)}
          </button>
        ))}
      </nav>
    </div>
  );
}
