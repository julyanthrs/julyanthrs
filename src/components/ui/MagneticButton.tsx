import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

type Variant = "solid" | "outline" | "ghost";

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  strength?: number;
  className?: string;
}

type ButtonProps = BaseProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;
type AnchorProps = BaseProps & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "children" | "className" | "href">;

const VARIANT_CLASSES: Record<Variant, string> = {
  solid: "bg-hot text-ink hover:bg-blush",
  outline: "border border-line-hot text-paper hover:border-hot hover:bg-hot/10",
  ghost: "text-paper hover:text-blush",
};

const BASE_CLASSES =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color,color,border-color,scale] duration-300 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-60";

/** Button or link with magnetic pointer attraction and press compression. */
export const MagneticButton = (props: ButtonProps | AnchorProps) => {
  const { children, variant = "solid", strength = 0.3, className = "" } = props;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  useMagnetic(wrapperRef, { strength });

  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
  const content = <span className="relative z-10 inline-flex items-center gap-2">{children}</span>;

  if (props.href !== undefined) {
    const { variant: _v, strength: _s, className: _c, children: _ch, ...anchorProps } = props;
    return (
      <span ref={wrapperRef} className="inline-block will-transform">
        <a {...anchorProps} className={classes} data-cursor="hover">
          {content}
        </a>
      </span>
    );
  }

  const { variant: _v, strength: _s, className: _c, children: _ch, type = "button", ...buttonProps } = props;
  return (
    <span ref={wrapperRef} className="inline-block will-transform">
      <button {...buttonProps} type={type} className={classes} data-cursor="hover">
        {content}
      </button>
    </span>
  );
};
