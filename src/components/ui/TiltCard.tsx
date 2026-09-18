import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  /** Pixels the card lifts toward the viewer on hover. */
  lift?: number;
}

/** Perspective tilt that follows the pointer and eases back on leave. */
export const TiltCard = ({ children, className = "", maxTilt = 6, lift = 24 }: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !window.matchMedia("(pointer: fine)").matches) return;

    const rotateX = gsap.quickTo(card, "rotateX", { duration: 0.6, ease: "power3.out" });
    const rotateY = gsap.quickTo(card, "rotateY", { duration: 0.6, ease: "power3.out" });
    const translateZ = gsap.quickTo(card, "z", { duration: 0.6, ease: "power3.out" });

    const handleMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY(nx * maxTilt * 2);
      rotateX(-ny * maxTilt * 2);
      translateZ(lift);
      card.style.setProperty("--glare-x", `${(nx + 0.5) * 100}%`);
      card.style.setProperty("--glare-y", `${(ny + 0.5) * 100}%`);
    };
    const handleLeave = () => {
      rotateX(0);
      rotateY(0);
      translateZ(0);
    };

    card.addEventListener("pointermove", handleMove);
    card.addEventListener("pointerleave", handleLeave);
    return () => {
      card.removeEventListener("pointermove", handleMove);
      card.removeEventListener("pointerleave", handleLeave);
    };
  }, [maxTilt, lift]);

  return (
    <div className="[perspective:1400px]">
      <div ref={cardRef} className={`preserve-3d will-transform ${className}`}>
        {children}
      </div>
    </div>
  );
};
