import { useEffect, type ReactNode } from "react";
import { LazyMotion } from "framer-motion";
import { ScrollTrigger } from "@/lib/gsap";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";
import { LoadingProvider, useLoading } from "@/providers/LoadingProvider";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { ButterflyLayer } from "@/components/layout/ButterflyLayer";
import { Cursor } from "@/components/layout/Cursor";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { Navigation } from "@/components/layout/Navigation";
import { Marquee } from "@/components/layout/Marquee";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/sections/Hero";
import { IntroSequence } from "@/sections/intro-sequence/IntroSequence";
import { About } from "@/sections/About";
import { Work } from "@/sections/work/Work";
import { Experience } from "@/sections/experience/Experience";
import { Skills } from "@/sections/skills/Skills";
import { Process } from "@/sections/process/Process";
import { Playground } from "@/playground/Playground";
import { Contact } from "@/sections/contact/Contact";

const loadMotionFeatures = () => import("@/lib/motionFeatures").then((module) => module.default);

/**
 * Web fonts change text metrics after first paint, which shifts every
 * section below and invalidates pinned ScrollTrigger positions. Re-measure once they land.
 */
const useRefreshTriggersAfterFonts = (): void => {
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);
};

/** Keeps the page out of the tab order while the intro covers it, and re-measures once it's gone. */
const PageShell = ({ children }: { children: ReactNode }) => {
  const { phase } = useLoading();

  useEffect(() => {
    // Releasing the scroll lock restores the scrollbar, which shifts layout slightly.
    if (phase === "done") ScrollTrigger.refresh();
  }, [phase]);

  return <div inert={phase === "loading"}>{children}</div>;
};

export const App = () => {
  useRefreshTriggersAfterFonts();

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <SmoothScrollProvider>
        <LoadingProvider>
          <Cursor />
          <LoadingScreen />
          <ButterflyLayer />
          <PageShell>
            <a
              href="#main"
              className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-hot px-4 py-2 text-sm font-medium text-ink transition-transform focus-visible:translate-y-0"
            >
              Skip to content
            </a>
            <ScrollProgress />
            <Navigation />
            <main id="main" tabIndex={-1} className="outline-none">
              <Hero />
              <IntroSequence />
              <About />
              <Marquee />
              <Work />
              <Experience />
              <Skills />
              <Process />
              <Playground />
              <Contact />
            </main>
            <Footer />
          </PageShell>
        </LoadingProvider>
      </SmoothScrollProvider>
    </LazyMotion>
  );
};
