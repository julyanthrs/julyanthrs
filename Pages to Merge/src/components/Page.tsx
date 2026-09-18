import { useEffect, type ReactNode } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SITE } from '@/data/site';

interface PageProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Every route renders inside Page so titles, the skip-link target and
 * ScrollTrigger measurements stay consistent after lazy routes mount.
 */
export function Page({ title, children, className = '' }: PageProps) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} | Creative developer & UI/UX designer`;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [title]);

  return (
    <main id="main" tabIndex={-1} className={`relative outline-none ${className}`}>
      {children}
    </main>
  );
}
