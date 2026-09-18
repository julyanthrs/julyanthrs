import { lazy, Suspense, useCallback, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { TransitionProvider, usePageTransition } from '@/providers/TransitionProvider';
import { CustomCursor } from '@/components/CustomCursor';
import { Loader } from '@/components/Loader';
import { Navigation } from '@/components/Navigation';
import { ScrollProgress } from '@/components/ScrollProgress';

const pageImports = {
  home: () => import('@/pages/HomePage'),
  work: () => import('@/pages/WorkPage'),
  caseStudy: () => import('@/pages/CaseStudyPage'),
  about: () => import('@/pages/AboutPage'),
  playground: () => import('@/pages/PlaygroundPage'),
  contact: () => import('@/pages/ContactPage'),
  notFound: () => import('@/pages/NotFoundPage'),
};

const HomePage = lazy(pageImports.home);
const WorkPage = lazy(pageImports.work);
const CaseStudyPage = lazy(pageImports.caseStudy);
const AboutPage = lazy(pageImports.about);
const PlaygroundPage = lazy(pageImports.playground);
const ContactPage = lazy(pageImports.contact);
const NotFoundPage = lazy(pageImports.notFound);

/** Warm every route chunk once the first page is visible, so transitions never reveal an empty page. */
const preloadRoutes = () => {
  Object.values(pageImports).forEach((load) => {
    load().catch((error: unknown) => console.error('[routes] preload failed', error));
  });
};

function AppShell() {
  const { markLoaded } = usePageTransition();

  const handleLoaded = useCallback(() => {
    markLoaded();
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1200));
    idle(preloadRoutes);
  }, [markLoaded]);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  return (
    <div className="grain min-h-screen bg-void text-white">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="shell fixed left-4 top-4 z-[130] -translate-y-24 rounded-full bg-hot py-3 font-semibold text-void focus:translate-y-0"
      >
        Skip to content
      </a>
      <Loader onComplete={handleLoaded} />
      <CustomCursor />
      <Navigation />
      <ScrollProgress />
      <Suspense fallback={<div className="min-h-screen bg-void" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/:slug" element={<CaseStudyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SmoothScrollProvider>
        <TransitionProvider>
          <AppShell />
        </TransitionProvider>
      </SmoothScrollProvider>
    </HashRouter>
  );
}
