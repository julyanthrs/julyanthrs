import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { padIndex } from '@/lib/math';
import { SplitText } from '../SplitText';

const PHRASES: readonly (readonly [string, string])[] = [
  ['I design', 'interfaces.'],
  ['I build', 'experiences.'],
  ['I make', 'them move.'],
];

const DESCRIPTION =
  "I'm a Web Developer and UI/UX Designer focused on creating digital experiences that feel intuitive, expressive, and alive.";

const PIN_LENGTH = '+=320%';
const WORD_SCATTER_VW = 45;

export function IntroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const q = gsap.utils.selector(sectionRef);
      const phraseChars = (index: number) => q(`[data-phrase="${index}"] [data-char]`);
      const phraseWords = (index: number) => q(`[data-phrase="${index}"] [data-word]`);
      const phraseLines = (index: number) => q(`[data-phrase="${index}"] [data-line]`);

      gsap.set(phraseChars(0), { yPercent: 115 });
      gsap.set(q('[data-phrase="1"] [data-line]'), { clipPath: 'inset(0% 100% 0% 0%)', xPercent: 8, rotate: -3 });
      gsap.set(phraseChars(2), { xPercent: 180, skewX: -35, opacity: 0 });
      gsap.set(q('[data-description] [data-word]'), { opacity: 0, yPercent: 60, filter: 'blur(10px)' });

      const timeline = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: PIN_LENGTH,
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            if (counterRef.current) counterRef.current.textContent = padIndex(Math.min(3, Math.floor(self.progress * 3) + 1));
          },
        },
      });

      timeline
        // 01 rise, then stretch upward and vanish
        .to(phraseChars(0), { yPercent: 0, stagger: 0.02, duration: 1, ease: 'expo.out' })
        .to({}, { duration: 0.5 })
        .to(phraseChars(0), {
          yPercent: -140,
          scaleY: 2.6,
          opacity: 0,
          transformOrigin: '50% 100%',
          stagger: { each: 0.015, from: 'end' },
          duration: 1,
        })
        // 02 wipe in through a mask, then words scatter
        .to(phraseLines(1), { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, rotate: 0, stagger: 0.15, duration: 1.2 }, '-=0.4')
        .to({}, { duration: 0.5 })
        .to(phraseWords(1), {
          x: (index: number) => `${(index % 2 === 0 ? -1 : 1) * WORD_SCATTER_VW}vw`,
          rotate: (index: number) => (index % 2 === 0 ? -18 : 14),
          opacity: 0,
          filter: 'blur(12px)',
          duration: 1,
        })
        // 03 slide in skewed, then shrink away to make room for the description
        .to(phraseChars(2), { xPercent: 0, skewX: 0, opacity: 1, stagger: 0.025, duration: 1.2, ease: 'expo.out' }, '-=0.5')
        .to({}, { duration: 0.4 })
        .to(q('[data-phrase="2"]'), { scale: 0.45, yPercent: -55, transformOrigin: '0% 0%', duration: 1 })
        .to(q('[data-description] [data-word]'), { opacity: 1, yPercent: 0, filter: 'blur(0px)', stagger: 0.03, duration: 1 }, '-=0.6')
        .to(q('[data-intro-progress]'), { scaleX: 1, ease: 'none', duration: timeline.duration() }, 0);
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  if (reducedMotion) {
    return (
      <section data-section="Intro" aria-label="What I do" className="shell relative z-20 space-y-10 py-32">
        {PHRASES.map((lines) => (
          <p key={lines.join(' ')} className="display text-[14vw] md:text-[9vw]">
            {lines.join(' ')}
          </p>
        ))}
        <p className="max-w-2xl font-serif text-3xl leading-snug text-petal md:text-4xl">{DESCRIPTION}</p>
      </section>
    );
  }

  return (
    <section ref={sectionRef} data-section="Intro" aria-label="What I do" className="relative z-20 h-[100svh] overflow-hidden">
      <div className="shell relative flex h-full flex-col justify-center">
        <p className="sr-only">
          {PHRASES.map((lines) => lines.join(' ')).join(' ')} {DESCRIPTION}
        </p>

        <div className="relative h-[40vw] md:h-[22vw]" aria-hidden="true">
          {PHRASES.map((lines, phraseIndex) => (
            <div key={phraseIndex} data-phrase={phraseIndex} className="absolute inset-x-0 top-0 will-change-transform">
              {lines.map((line, lineIndex) => (
                <span
                  key={line}
                  data-line
                  className={`display block overflow-hidden pb-[0.06em] text-[17vw] md:text-[10.5vw] ${lineIndex === 1 ? 'ml-[8vw] text-hot md:ml-[16vw]' : 'text-white'} ${
                    phraseIndex === 1 ? 'display-wide' : phraseIndex === 2 ? 'display-condensed' : ''
                  }`}
                >
                  {line.split(' ').map((word, wordIndex) => (
                    <span key={`${word}-${wordIndex}`} data-word className="mr-[0.22em] inline-block">
                      <SplitText text={word} unitAttribute="data-char" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>

        <p
          data-description
          className="relative ml-auto mt-10 max-w-xl font-serif text-2xl leading-snug text-petal md:mr-[8vw] md:text-4xl"
          aria-hidden="true"
        >
          {DESCRIPTION.split(' ').map((word, index) => (
            <span key={`${word}-${index}`} data-word className="mr-[0.25em] inline-block">
              {word}
            </span>
          ))}
        </p>

        <div className="absolute inset-x-[var(--gutter)] bottom-8 flex items-center gap-4" aria-hidden="true">
          <span className="annotation text-hot">
            <span ref={counterRef}>01</span> / 03
          </span>
          <span className="relative h-px flex-1 bg-white/10">
            <span data-intro-progress className="absolute inset-0 origin-left scale-x-0 bg-hot" />
          </span>
        </div>
      </div>
    </section>
  );
}
