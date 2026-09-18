import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useHref, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA } from '@/lib/motion';
import { ProjectVisual } from '@/visuals/ProjectVisual';
import type { VisualVariant } from '@/visuals/types';
import { useSmoothScroll } from './SmoothScrollProvider';

interface TransitionOptions {
  origin?: HTMLElement | null;
  visual?: VisualVariant;
}

interface TransitionApi {
  navigateTo: (to: string, options?: TransitionOptions) => void;
  /** False while the loader or a cover panel hides the page. Entrance animations wait for it. */
  pageReady: boolean;
  markLoaded: () => void;
}

const TransitionContext = createContext<TransitionApi | null>(null);

const COVER_SECONDS = 0.8;
const REVEAL_SECONDS = 0.9;
const CORNER_RADIUS = 18;

const insetFor = (rect: DOMRect | null): string => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (!rect) return `inset(${height}px 0px 0px 0px round 0px)`;
  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const right = Math.max(0, width - rect.right);
  const bottom = Math.max(0, height - rect.bottom);
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${CORNER_RADIUS}px)`;
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollTo } = useSmoothScroll();
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);
  const panelRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [covering, setCovering] = useState(false);
  const [visual, setVisual] = useState<VisualVariant | undefined>();

  const resetScrollAfterRoute = useCallback(() => {
    scrollTo(0, { immediate: true });
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, [scrollTo]);

  const navigateTo = useCallback(
    (to: string, { origin = null, visual: nextVisual }: TransitionOptions = {}) => {
      const panel = panelRef.current;
      if (to === location.pathname || isAnimating.current) return;

      if (reducedMotion || !panel) {
        navigate(to);
        resetScrollAfterRoute();
        return;
      }

      isAnimating.current = true;
      setVisual(nextVisual);
      setCovering(true);
      const rect = origin?.getBoundingClientRect() ?? null;

      gsap
        .timeline({
          onComplete: () => {
            isAnimating.current = false;
            gsap.set(panel, { visibility: 'hidden' });
          },
        })
        .set(panel, { visibility: 'visible', clipPath: insetFor(rect) })
        .to(panel, {
          clipPath: 'inset(0px 0px 0px 0px round 0px)',
          duration: COVER_SECONDS,
          ease: 'expo.inOut',
        })
        .add(() => {
          navigate(to);
          resetScrollAfterRoute();
        })
        .add(() => setCovering(false), '+=0.12')
        .to(panel, {
          clipPath: `inset(0px 0px ${window.innerHeight}px 0px round 0px)`,
          duration: REVEAL_SECONDS,
          ease: 'expo.inOut',
        });
    },
    [location.pathname, navigate, reducedMotion, resetScrollAfterRoute],
  );

  // Browser back/forward and direct hash edits bypass navigateTo; start those pages at the top too.
  const isFirstLocation = useRef(true);
  useEffect(() => {
    if (isFirstLocation.current) {
      isFirstLocation.current = false;
      return;
    }
    if (!isAnimating.current) resetScrollAfterRoute();
  }, [location.pathname, resetScrollAfterRoute]);

  const markLoaded = useCallback(() => setLoaded(true), []);

  const api = useMemo<TransitionApi>(
    () => ({ navigateTo, markLoaded, pageReady: loaded && !covering }),
    [covering, loaded, markLoaded, navigateTo],
  );

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div
        ref={panelRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[85] overflow-hidden bg-hot"
        style={{ visibility: 'hidden' }}
      >
        {visual && (
          <div className="absolute inset-0 opacity-90">
            <ProjectVisual variant={visual} label="" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-px bg-petal shadow-[0_0_40px_12px_rgba(255,79,163,0.7)]" />
      </div>
    </TransitionContext.Provider>
  );
}

export const usePageTransition = (): TransitionApi => {
  const context = useContext(TransitionContext);
  if (!context) throw new Error('usePageTransition must be used inside <TransitionProvider>');
  return context;
};

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

interface TransitionLinkProps extends AnchorProps {
  to: string;
  visual?: VisualVariant;
  children: ReactNode;
}

/**
 * A real anchor (keyboard, middle-click and "open in new tab" keep working)
 * that plays the cinematic transition for plain left clicks. If the link
 * contains an element marked `data-transition-origin`, the panel grows from it.
 */
export function TransitionLink({ to, visual, onClick, children, ...rest }: TransitionLinkProps) {
  const href = useHref(to);
  const { navigateTo } = usePageTransition();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (event.defaultPrevented || isModified || rest.target === '_blank') return;
    event.preventDefault();
    const origin = event.currentTarget.querySelector<HTMLElement>('[data-transition-origin]') ?? event.currentTarget;
    navigateTo(to, { origin, visual });
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
