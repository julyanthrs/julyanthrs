import { site } from "@/data/site";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { Logo } from "./Logo";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

export const Footer = () => {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer className="relative border-t border-line">
      <div className="container-frame flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => scrollTo(0)} className="self-start text-2xl" aria-label="Back to top">
            <Logo />
          </button>
          <p className="text-sm text-muted">{site.roles.join(" + ")}</p>
        </div>
        <p className="text-sm text-muted md:text-center">{site.footerNote}</p>
        <div className="flex items-center gap-6">
          <p className="meta">© {site.year} {site.name}</p>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="group grid size-10 place-items-center rounded-full border border-line transition-colors hover:border-hot"
            aria-label="Back to top"
          >
            <ArrowIcon direction="up" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
