import { useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence, m } from "framer-motion";
import { navItems } from "@/data/site";
import type { SectionId } from "@/data/types";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { useActiveSection } from "@/hooks/useActiveSection";
import { Logo } from "./Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

const TRACKED_SECTIONS: readonly SectionId[] = [
  "home",
  "about",
  "work",
  "experience",
  "skills",
  "process",
  "playground",
  "contact",
];
const SCROLLED_THRESHOLD_PX = 40;

export const Navigation = () => {
  const { scrollTo } = useSmoothScroll();
  const activeId = useActiveSection(TRACKED_SECTIONS);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && setIsMenuOpen(false);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMenuOpen]);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: SectionId) => {
    event.preventDefault();
    setIsMenuOpen(false);
    scrollTo(`#${id}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Primary"
        className={`container-frame flex h-14 items-center justify-between rounded-full transition-[background-color,border-color,backdrop-filter] duration-500 ${
          isScrolled ? "border border-line bg-ink/55 backdrop-blur-xl" : "border border-transparent"
        }`}
      >
        <a href="#home" onClick={(event) => navigate(event, "home")} className="text-lg" data-cursor="hover">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} className="relative">
                <a
                  href={`#${item.id}`}
                  onClick={(event) => navigate(event, item.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={`block px-3 py-2 text-sm transition-colors duration-300 ${
                    isActive ? "text-paper" : "text-muted hover:text-paper"
                  }`}
                >
                  {item.label}
                </a>
                {isActive && (
                  <m.span
                    layoutId="nav-indicator"
                    aria-hidden="true"
                    className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-hot shadow-[0_0_8px_var(--color-hot)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block">
            <MagneticButton href="#contact" onClick={(event) => navigate(event, "contact")} className="px-4 py-2 text-xs">
              Let's talk
            </MagneticButton>
          </span>
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-full border border-line md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span
              aria-hidden="true"
              className={`absolute h-px w-4 bg-paper transition-transform duration-300 ${isMenuOpen ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-px w-4 bg-paper transition-transform duration-300 ${isMenuOpen ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <m.div
            id="mobile-menu"
            className="fixed inset-x-3 top-20 rounded-3xl border border-line bg-ink/90 p-6 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                <m.li
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05 }}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => navigate(event, item.id)}
                    className="flex items-center justify-between border-b border-line py-3 text-2xl font-medium"
                  >
                    {item.label}
                    {activeId === item.id && <span className="size-1.5 rounded-full bg-hot" aria-hidden="true" />}
                  </a>
                </m.li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
};
