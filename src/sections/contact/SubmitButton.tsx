import { AnimatePresence, m } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import type { SubmitStatus } from "./useContactForm";

const LABEL_TRANSITION = { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as const;
const WIDTH_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

const Spinner = () => (
  <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-[1.5px] border-ink/30 border-t-ink" />
);

const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <m.path d="M3 8.5l3.2 3L13 4.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
  </svg>
);

const LabelContent = ({ status }: { status: SubmitStatus }) => {
  switch (status) {
    case "submitting":
      return (
        <>
          Sending <Spinner />
        </>
      );
    case "sent":
      return (
        <>
          Message sent <Check />
        </>
      );
    case "error":
      return (
        <>
          Try again <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
        </>
      );
    case "idle":
      return (
        <>
          Send message <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
        </>
      );
  }
};

/** Submit control whose label and width animate between form states. */
export const SubmitButton = ({ status }: { status: SubmitStatus }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isBusy = status === "submitting";
  const isSent = status === "sent";

  return (
    <MagneticButton
      type="submit"
      strength={isSent ? 0 : 0.35}
      aria-disabled={isBusy || isSent}
      className={`min-h-11 overflow-hidden px-6 uppercase tracking-wide ${isSent ? "bg-blush" : ""} ${isBusy ? "cursor-progress" : ""}`}
    >
      <m.span layout={!prefersReducedMotion} transition={WIDTH_SPRING} className="relative inline-flex">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={status}
            className="inline-flex items-center gap-2 whitespace-nowrap"
            initial={prefersReducedMotion ? false : { y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: "-110%", opacity: 0 }}
            transition={LABEL_TRANSITION}
          >
            <LabelContent status={status} />
          </m.span>
        </AnimatePresence>
      </m.span>
    </MagneticButton>
  );
};
