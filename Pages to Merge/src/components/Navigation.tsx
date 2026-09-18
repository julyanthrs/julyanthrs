import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { SITE } from '@/data/site';
import { TransitionLink } from '@/providers/TransitionProvider';
import { useSmoothScroll } from '@/providers/SmoothScrollProvider';
import { EASE } from '@/lib/motion';
import { Magnetic } from './MagneticButton';
import { MenuOverlay } from './MenuOverlay';
import { PinkRoom } from './PinkRoom';

const MENU_ID = 'site-menu';
const EGG_CLICKS = 5;
const EGG_WINDOW_MS = 2500;
const CLOCK_REFRESH_MS = 20_000;

const formatTime = () =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: SITE.timezone }).format(new Date());

function LocalClock() {
  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const interval = window.setInterval(() => setTime(formatTime()), CLOCK_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);
  return (
    <span className="annotation hidden text-white md:inline">
      {SITE.location} <span className="text-muted">/</span> <time>{time}</time>
    </span>
  );
}

function Logo({ onSecret }: { onSecret: () => void }) {
  const clicks = useRef<number[]>([]);

  const handleClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((stamp) => now - stamp < EGG_WINDOW_MS), now];
    if (clicks.current.length >= EGG_CLICKS) {
      clicks.current = [];
      onSecret();
    }
  };

  return (
    <TransitionLink to="/" onClick={handleClick} className="group relative flex items-center gap-3" aria-label={`${SITE.name}, home`}>
      <span className="display display-wide grid h-10 w-10 place-items-center rounded-full border border-white text-sm transition-colors duration-300 group-hover:border-hot group-hover:bg-hot group-hover:text-void">
        {SITE.initials}
      </span>
      {/* Hidden message, revealed on hover */}
      <span className="pointer-events-none overflow-hidden font-serif text-base italic text-white" aria-hidden="true">
        <span className="block translate-y-full transition-transform duration-500 ease-out-expo group-hover:translate-y-0">
          drawn by hand, not by template
        </span>
      </span>
    </TransitionLink>
  );
}

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [eggActive, setEggActive] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { lock, unlock } = useSmoothScroll();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    lock();
    return () => {
      unlock();
      toggleRef.current?.focus({ preventScroll: true });
    };
  }, [lock, menuOpen, unlock]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const endEgg = useCallback(() => setEggActive(false), []);

  return (
    <>
      <header className="shell pointer-events-none fixed inset-x-0 top-0 z-[70] flex items-center justify-between py-5 text-white mix-blend-difference">
        <div className="pointer-events-auto">
          <Logo onSecret={() => setEggActive(true)} />
        </div>
        <LocalClock />
        <div className="pointer-events-auto">
          <Magnetic strength={0.5}>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              onClick={() => setMenuOpen((open) => !open)}
              className="group flex h-12 items-center gap-3 rounded-full px-2 font-display text-sm font-semibold uppercase tracking-[0.14em]"
            >
              <span className="relative block h-5 overflow-hidden">
                <motion.span
                  className="block"
                  animate={{ y: menuOpen ? '-50%' : '0%' }}
                  transition={{ duration: 0.6, ease: EASE.cinematic }}
                >
                  <span className="block h-5 leading-5">Menu</span>
                  <span className="block h-5 leading-5">Close</span>
                </motion.span>
              </span>
              <span className="relative block h-3 w-7" aria-hidden="true">
                <span
                  className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500 ${menuOpen ? 'translate-y-1.5 rotate-45' : 'group-hover:translate-x-1'}`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500 ${menuOpen ? '-translate-y-1.5 -rotate-45' : 'group-hover:-translate-x-1'}`}
                />
              </span>
            </button>
          </Magnetic>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MenuOverlay id={MENU_ID} onClose={closeMenu} />}</AnimatePresence>
      {eggActive && <PinkRoom onDone={endEgg} />}
    </>
  );
}
