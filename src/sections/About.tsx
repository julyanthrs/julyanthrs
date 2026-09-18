import { useRef, type ReactNode } from "react";
import { m } from "framer-motion";
import { about } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, REVEAL_START } from "@/lib/motion";
import { useParallax } from "@/hooks/useParallax";
import { usePointerDepth } from "@/hooks/usePointerDepth";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { RevealText } from "@/components/ui/RevealText";
import { InterfaceLabel, SectionIndex, SelectionHandles } from "@/components/ui/Decorations";
import { Portrait } from "@/components/visuals/Portrait";

interface CollageItemProps {
  children: ReactNode;
  position: string;
  speed: number;
  depth: number;
  draggable?: boolean;
  rotate?: number;
}

const DRAG_TRANSITION = { bounceStiffness: 260, bounceDamping: 16 } as const;

const CollageItem = ({ children, position, speed, depth, draggable = false, rotate = 0 }: CollageItemProps) => {
  const hasFinePointer = useHasFinePointer();
  const canDrag = draggable && hasFinePointer;

  return (
    <div className={`absolute ${position}`} data-speed={speed}>
      <div data-depth={depth} className="will-transform">
        <div data-collage-item style={{ rotate: `${rotate}deg` }}>
          <m.div
            drag={canDrag}
            dragSnapToOrigin
            dragElastic={0.25}
            dragTransition={DRAG_TRANSITION}
            whileDrag={{ scale: 1.06, rotate: rotate > 0 ? -3 : 3, zIndex: 20 }}
            whileHover={{ y: -4 }}
            data-cursor={canDrag ? "drag" : undefined}
            className="relative"
          >
            {children}
          </m.div>
        </div>
      </div>
    </div>
  );
};

const InterfaceMockup = () => (
  <div className="glass overflow-hidden rounded-xl p-3 shadow-[0_30px_60px_-30px_rgb(255_46_136/0.35)]">
    <div className="mb-3 flex items-center justify-between">
      <span className="h-2 w-12 rounded-full bg-paper/80" />
      <span className="size-5 rounded-full bg-hot" />
    </div>
    <div className="mb-3 rounded-lg bg-gradient-to-br from-hot/70 to-hot-deep/30 p-3">
      <span className="block h-1.5 w-10 rounded-full bg-ink/50" />
      <span className="mt-2 block text-lg font-semibold leading-none text-ink">+24.8%</span>
    </div>
    <div className="flex h-14 items-end gap-1" aria-hidden="true">
      {[40, 65, 35, 80, 55, 90, 70].map((height, index) => (
        <span key={index} className="flex-1 rounded-sm bg-blush/70" style={{ height: `${height}%` }} />
      ))}
    </div>
  </div>
);

const CodeWindow = () => (
  <div className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-2xl">
    <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
      {["bg-hot", "bg-blush/70", "bg-faint"].map((color) => (
        <span key={color} className={`size-2 rounded-full ${color}`} />
      ))}
      <span className="meta ml-2 text-[0.55rem]">Capsule.tsx</span>
    </div>
    <pre className="overflow-hidden p-3 font-mono text-[0.58rem] leading-relaxed text-muted" aria-hidden="true">
      <span className="text-faint">01</span> <span className="text-hot">export const</span> <span className="text-paper">Capsule</span> = () =&gt; ({"\n"}
      <span className="text-faint">02</span>   &lt;<span className="text-blush">motion.button</span>{"\n"}
      <span className="text-faint">03</span>     whileHover={"{{"} rotate: <span className="text-paper">6</span> {"}}"}{"\n"}
      <span className="text-faint">04</span>     className=<span className="text-hot">"pill"</span>{"\n"}
      <span className="text-faint">05</span>   /&gt;{"\n"}
      <span className="text-faint">06</span> );
    </pre>
  </div>
);

const DesignNote = () => (
  <div className="rounded-md bg-blush p-3 text-ink shadow-[0_20px_40px_-20px_rgb(255_184_213/0.5)]">
    <p className="font-mono text-[0.55rem] opacity-60">note_03</p>
    <p className="mt-1 text-sm font-medium leading-snug">Motion should explain, not decorate.</p>
  </div>
);

const TypeSpecimen = () => (
  <div className="rounded-xl border border-line bg-ink p-3">
    <p className="text-5xl font-bold leading-none [font-variation-settings:'wdth'_76]">Aa</p>
    <p className="meta mt-2 text-[0.55rem]">Bricolage / 76 wdth</p>
    <div className="mt-2 flex gap-1" aria-hidden="true">
      {["bg-hot", "bg-blush", "bg-chrome", "bg-paper"].map((swatch) => (
        <span key={swatch} className={`size-3 rounded-full ${swatch}`} />
      ))}
    </div>
  </div>
);

export const About = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useParallax(sectionRef);
  usePointerDepth(collageRef, !prefersReducedMotion);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      gsap.from("[data-collage-item]", {
        opacity: 0,
        y: 60,
        rotateZ: (index: number) => (index % 2 === 0 ? -8 : 8),
        clipPath: "inset(0 0 100% 0)",
        duration: 1.2,
        stagger: 0.12,
        ease: EASE.outExpo,
        scrollTrigger: { trigger: collageRef.current, start: REVEAL_START, once: true },
      });
      gsap.from("[data-fact]", {
        opacity: 0,
        x: -20,
        stagger: 0.1,
        duration: 0.9,
        ease: EASE.outExpo,
        scrollTrigger: { trigger: "[data-facts]", start: REVEAL_START, once: true },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section id="about" ref={sectionRef} className="relative py-24 md:py-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-hot/5 to-transparent" />
      <div className="container-frame grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionIndex index={2} label="About" />
          <RevealText as="h2" text={about.heading} variant="words" className="heading-section mt-6 max-w-sm" />
          <RevealText as="p" text={about.body} variant="blur" className="mt-6 max-w-md text-muted" />

          <dl data-facts className="mt-10 flex gap-8 border-t border-line pt-6">
            {about.facts.map((fact) => (
              <div key={fact.label} data-fact className="group">
                <dt className="meta">{fact.label}</dt>
                <dd className="mt-1 text-3xl font-semibold transition-colors duration-300 group-hover:text-hot">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="meta mt-8 hidden text-blush lg:block">Tip: the code window and note are draggable.</p>
        </div>

        <div ref={collageRef} className="relative h-[440px] sm:h-[520px] lg:col-span-7 [perspective:1200px]">
          <InterfaceLabel className="absolute left-0 top-0">canvas / about.fig</InterfaceLabel>
          <CollageItem position="left-[2%] top-[8%] w-[46%] sm:w-[40%]" speed={0.9} depth={0.6}>
            <InterfaceMockup />
          </CollageItem>
          <CollageItem position="right-[4%] top-[2%] w-[34%] sm:w-[28%]" speed={1.15} depth={1.2} rotate={3}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line">
              <Portrait />
            </div>
            <SelectionHandles />
          </CollageItem>
          <CollageItem position="left-[22%] top-[50%] w-[58%] sm:w-[44%]" speed={1.05} depth={1.6} draggable>
            <CodeWindow />
          </CollageItem>
          <CollageItem position="right-[2%] top-[56%] w-[34%] sm:w-[24%]" speed={1.2} depth={2} rotate={5} draggable>
            <DesignNote />
          </CollageItem>
          <CollageItem position="left-0 bottom-[0%] w-[30%] sm:w-[22%]" speed={0.85} depth={1} rotate={-3}>
            <TypeSpecimen />
          </CollageItem>
        </div>
      </div>
    </section>
  );
};
