import { useEffect, useState, type RefObject } from "react";

interface InViewOptions {
  rootMargin?: string;
  once?: boolean;
}

/** Tracks element visibility; used to mount heavy work lazily and pause it off-screen. */
export const useInView = (
  ref: RefObject<Element | null>,
  { rootMargin = "0px", once = false }: InViewOptions = {},
): boolean => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return isInView;
};
