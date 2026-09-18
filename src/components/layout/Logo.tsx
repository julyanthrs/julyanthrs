import { site } from "@/data/site";

/** Initials that flip letter by letter on hover, with a spinning spark. */
export const Logo = ({ className = "" }: { className?: string }) => (
  <span className={`group inline-flex items-center gap-1.5 font-semibold ${className}`}>
    <span className="relative inline-flex overflow-hidden" aria-hidden="true">
      {Array.from(site.initials).map((letter, index) => (
        <span key={letter + index} className="relative inline-block overflow-hidden">
          <span
            className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-full"
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            {letter}
          </span>
          <span
            className="absolute left-0 top-full inline-block text-hot transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-full"
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            {letter}
          </span>
        </span>
      ))}
    </span>
    <span
      aria-hidden="true"
      className="inline-block text-hot transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-180 group-hover:scale-125"
    >
      ✦
    </span>
    <span className="sr-only">{site.name}</span>
  </span>
);
