import { Page } from '@/components/Page';
import { RevealText } from '@/components/RevealText';
import { TransitionLink } from '@/providers/TransitionProvider';
import { CursorGlow } from '@/components/DesignDetails';

export default function NotFoundPage() {
  return (
    <Page title="Page not found">
      <section aria-label="Page not found" className="shell relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-32">
        <CursorGlow />
        <RevealText
          as="h1"
          trigger="ready"
          lines={['404']}
          className="display display-wide text-outline text-[40vw] leading-[0.75] md:text-[28vw]"
        />
        <p className="mt-8 max-w-md font-serif text-3xl text-petal">
          This page doesn't exist. The link may be old, or the address has a typo.
        </p>
        <TransitionLink to="/" className="group mt-10 w-max font-display text-xl text-white" data-cursor="explore">
          <span className="type-stretch inline-block group-hover:text-hot">Go to the home page</span>
          <span aria-hidden="true" className="ml-3 inline-block text-hot transition-transform duration-500 group-hover:translate-x-2">
            →
          </span>
        </TransitionLink>
      </section>
    </Page>
  );
}
