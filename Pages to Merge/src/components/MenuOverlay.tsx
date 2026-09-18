import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS, SITE, SOCIAL_LINKS } from '@/data/site';
import { TransitionLink } from '@/providers/TransitionProvider';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import { EASE } from '@/lib/motion';
import { padIndex } from '@/lib/math';

interface MenuOverlayProps {
  id: string;
  onClose: () => void;
}

const ORIGIN = 'calc(100% - 3.5rem) 2.25rem';
const BACKDROP_TINTS = ['#050505', '#0d0508', '#0a0507', '#0c0409', '#0e060a'];
const FOCUSABLE = 'a[href], button:not([disabled])';

export function MenuOverlay({ id, onClose }: MenuOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))),
  );
  const [hovered, setHovered] = useState(activeIndex);
  const hoveredItem = NAV_ITEMS[hovered] ?? NAV_ITEMS[0];

  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !rootRef.current) return;
    const focusable = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <motion.div
      ref={rootRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      onKeyDown={handleKeyDown}
      initial={{ clipPath: `circle(0% at ${ORIGIN})` }}
      animate={{ clipPath: `circle(150% at ${ORIGIN})`, backgroundColor: BACKDROP_TINTS[hovered] }}
      exit={{ clipPath: `circle(0% at ${ORIGIN})` }}
      transition={{ duration: 0.9, ease: EASE.cinematic }}
      className="fixed inset-0 z-[65] flex flex-col overflow-y-auto bg-void"
      data-lenis-prevent
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/3 h-[60vmax] w-[60vmax] rounded-full bg-hot/10 blur-[120px]"
      />

      <div className="shell relative flex flex-1 flex-col justify-center gap-10 pb-10 pt-28 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Primary">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item, index) => {
              const isCurrent = index === activeIndex;
              return (
                <li key={item.path} className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '110%' }}
                    transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.25 + index * 0.06 }}
                  >
                    <TransitionLink
                      to={item.path}
                      visual={item.preview}
                      onClick={isCurrent ? onClose : undefined}
                      onPointerEnter={() => setHovered(index)}
                      onFocus={() => setHovered(index)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className="group flex items-start gap-4 py-1 outline-offset-8 md:gap-6"
                    >
                      <span className="annotation mt-3 w-6 text-muted transition-colors group-hover:text-hot md:mt-5">
                        {padIndex(index + 1)}
                      </span>
                      <span
                        className={`display type-stretch text-[15vw] group-hover:translate-x-4 group-hover:text-hot group-focus-visible:text-hot md:text-[10vw] lg:text-[8.5vw] ${
                          isCurrent ? 'text-outline' : 'text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </TransitionLink>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative hidden aspect-[4/5] w-[26vw] max-w-sm lg:block" aria-hidden="true">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={hoveredItem?.path}
              initial={{ clipPath: 'inset(100% 0% 0% 0%)', rotate: -4, scale: 1.1 }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)', rotate: 3, scale: 1 }}
              exit={{ clipPath: 'inset(0% 0% 100% 0%)', rotate: 6 }}
              transition={{ duration: 0.7, ease: EASE.cinematic }}
              className="absolute inset-0 overflow-hidden rounded-[2rem] border border-hot/40 shadow-[0_40px_120px_-30px_rgba(255,45,149,0.55)]"
            >
              {hoveredItem && <ProjectVisual variant={hoveredItem.preview} label="" />}
            </motion.div>
          </AnimatePresence>
          <span className="annotation absolute -bottom-7 left-0">PREVIEW_{padIndex(hovered + 1)}.png</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="shell relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6"
      >
        <a href={`mailto:${SITE.email}`} className="font-serif text-xl italic text-blush transition-colors hover:text-hot">
          {SITE.email}
        </a>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {SOCIAL_LINKS.slice(1).map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer noopener" className="transition-colors hover:text-hot">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
