import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { padIndex } from '@/lib/math';

const WORDS = ['UI', 'UX', 'Code', 'Design', 'Interaction', 'Build', 'Create', 'Web', 'Experience'];
const WORD_INTERVAL_MS = 110;
const COUNT_SECONDS = 1.35;

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [done, setDone] = useState(false);
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => setWordIndex((index) => (index + 1) % WORDS.length), WORD_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useGSAP(
    () => {
      const counter = { value: 0 };
      const finish = () => {
        setDone(true);
        onComplete();
      };

      if (reducedMotion) {
        gsap.to(rootRef.current, { autoAlpha: 0, duration: 0.4, delay: 0.2, onComplete: finish });
        return;
      }

      gsap
        .timeline({ onComplete: finish })
        .to(counter, {
          value: 100,
          duration: COUNT_SECONDS,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (counterRef.current) counterRef.current.textContent = `${padIndex(Math.round(counter.value), 3)}%`;
          },
        })
        .to('[data-loader-words]', { autoAlpha: 0, yPercent: -40, duration: 0.3, ease: 'power2.in' }, '+=0.18')
        .fromTo('[data-loader-leak]', { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: 'expo.out' })
        .to('[data-loader-top]', { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '+=0.05')
        .to('[data-loader-bottom]', { yPercent: 100, duration: 0.95, ease: 'expo.inOut' }, '<')
        .to('[data-loader-leak]', { scaleY: 40, opacity: 0, duration: 0.8, ease: 'expo.out' }, '<');
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  if (done) return null;

  return (
    <div ref={rootRef} role="status" aria-live="polite" aria-label="Loading portfolio" className="fixed inset-0 z-[120]">
      <div data-loader-top className="absolute inset-x-0 top-0 h-1/2 bg-void will-change-transform" />
      <div data-loader-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-void will-change-transform" />
      <div
        data-loader-leak
        className="absolute inset-x-0 top-1/2 h-[2px] origin-center -translate-y-1/2 scale-x-0 bg-flare shadow-[0_0_60px_18px_rgba(255,45,149,0.65)]"
      />
      <div data-loader-words className="shell absolute inset-0 flex flex-col justify-between py-8">
        <div className="annotation flex justify-between">
          <span>NR_PORTFOLIO.fig</span>
          <span className="text-muted">Loading assets</span>
        </div>
        <p className="display display-condensed text-[22vw] text-white md:text-[14vw]" aria-hidden="true">
          {WORDS[wordIndex]}
        </p>
        <div className="flex items-end justify-between">
          <span className="font-serif text-lg italic text-blush">Web developer & UI/UX designer</span>
          <span ref={counterRef} className="display display-wide text-5xl text-hot md:text-7xl">
            000%
          </span>
        </div>
      </div>
    </div>
  );
}
