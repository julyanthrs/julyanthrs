import { SITE, SOCIAL_LINKS } from '@/data/site';
import { TransitionLink } from '@/providers/TransitionProvider';
import { useSmoothScroll } from '@/providers/SmoothScrollProvider';
import { CursorGlow } from './DesignDetails';
import { MagneticButton } from './MagneticButton';

interface FooterProps {
  /** The contact page already is the call to action. */
  showCallToAction?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

export function Footer({ showCallToAction = true }: FooterProps) {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-void">
      <CursorGlow />
      {showCallToAction && (
        <TransitionLink to="/contact" visual="atelier" className="shell group relative block pb-10 pt-20 md:pt-28" data-cursor="explore">
          <span className="font-serif text-xl italic text-blush md:text-2xl">Have a strange, ambitious idea?</span>
          <span className="display type-stretch mt-4 block text-[17vw] text-white transition-colors group-hover:text-hot md:text-[12vw]">
            Let's talk
            <span
              className="ml-[0.1em] inline-block text-hot transition-transform duration-700 ease-out-expo group-hover:rotate-45"
              aria-hidden="true"
            >
              ↗
            </span>
          </span>
        </TransitionLink>
      )}

      <div className="shell relative flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
                className="text-muted underline-offset-4 transition-colors hover:text-hot hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-8 md:justify-end">
          <p className="annotation text-muted">
            © {CURRENT_YEAR} {SITE.name}. {SITE.availability}.
          </p>
          <MagneticButton type="button" tone="outline" onClick={() => scrollTo(0)} aria-label="Back to top" className="h-14 w-14 !px-0">
            <span aria-hidden="true">↑</span>
          </MagneticButton>
        </div>
      </div>
    </footer>
  );
}
