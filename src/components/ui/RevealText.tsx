import { createElement, useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, REVEAL_START, STAGGER } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useIsRevealed } from "@/providers/LoadingProvider";

export type RevealTag = "p" | "h1" | "h2" | "h3" | "span" | "div";

export type RevealVariant = "chars" | "words" | "mask" | "blur" | "wipe" | "tracking";

interface RevealTextProps {
  text: string;
  as?: RevealTag;
  variant?: RevealVariant;
  className?: string;
  delay?: number;
  /** When true the reveal plays on mount instead of on scroll (used for the hero load sequence). */
  immediate?: boolean;
}

const SPLIT_VARIANTS: ReadonlySet<RevealVariant> = new Set(["chars", "words", "mask"]);

const splitWords = (text: string): string[] => text.split(" ").filter(Boolean);

/**
 * Accessible text reveal. Screen readers get the plain string through aria-label,
 * while the split spans are hidden from assistive tech.
 */
export const RevealText = ({
  text,
  as: Tag = "p",
  variant = "words",
  className = "",
  delay = 0,
  immediate = false,
}: RevealTextProps) => {
  const rootRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isRevealed = useIsRevealed();
  // Immediate reveals wait for the loading screen to leave; scroll reveals never need to.
  const canPlay = !immediate || isRevealed;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion || !canPlay) return;

      const scrollTrigger = immediate ? undefined : { trigger: root, start: REVEAL_START, once: true };
      const base = { delay, ease: EASE.outExpo, scrollTrigger };

      switch (variant) {
        case "chars":
          gsap.from(root.querySelectorAll("[data-char]"), {
            ...base,
            yPercent: 110,
            rotate: 8,
            opacity: 0,
            duration: DURATION.base,
            stagger: STAGGER.chars,
          });
          break;
        case "words":
          gsap.from(root.querySelectorAll("[data-word]"), {
            ...base,
            y: 18,
            opacity: 0,
            duration: DURATION.base,
            stagger: STAGGER.words,
          });
          break;
        case "mask":
          gsap.from(root.querySelectorAll("[data-word]"), {
            ...base,
            yPercent: 105,
            duration: DURATION.reveal,
            stagger: STAGGER.words,
          });
          break;
        case "blur":
          gsap.from(root, { ...base, filter: "blur(12px)", opacity: 0, y: 8, duration: DURATION.reveal });
          break;
        case "wipe":
          gsap.fromTo(
            root,
            { clipPath: "inset(0 100% 0 0)" },
            { ...base, clipPath: "inset(0 0% 0 0)", duration: DURATION.reveal, ease: EASE.inOut },
          );
          break;
        case "tracking":
          gsap.from(root, { ...base, letterSpacing: "0.4em", opacity: 0, duration: DURATION.reveal });
          break;
      }
    },
    { scope: rootRef, dependencies: [variant, prefersReducedMotion, canPlay] },
  );

  if (!SPLIT_VARIANTS.has(variant)) {
    return createElement(Tag, { ref: rootRef, className }, text);
  }

  const words = splitWords(text);
  const splitChildren: ReactNode = words.map((word, wordIndex) => (
    <span
      key={`${word}-${wordIndex}`}
      aria-hidden="true"
      className={`inline-block whitespace-nowrap ${variant === "mask" ? "overflow-hidden pb-[0.08em] align-bottom" : ""}`}
    >
      {variant === "chars" ? (
        <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          {Array.from(word).map((char, charIndex) => (
            <span key={charIndex} data-char className="inline-block will-transform">
              {char}
            </span>
          ))}
        </span>
      ) : (
        <span data-word className="inline-block will-transform">
          {word}
        </span>
      )}
      {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
    </span>
  ));

  return createElement(Tag, { ref: rootRef, className, "aria-label": text }, splitChildren);
};
