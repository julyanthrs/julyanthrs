interface ArrowIconProps {
  direction?: "right" | "down" | "up" | "up-right";
  className?: string;
}

const ROTATION: Record<NonNullable<ArrowIconProps["direction"]>, string> = {
  right: "rotate-0",
  down: "rotate-90",
  up: "-rotate-90",
  "up-right": "-rotate-45",
};

export const ArrowIcon = ({ direction = "right", className = "" }: ArrowIconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={`size-3.5 ${ROTATION[direction]} ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 8h11M9 4l4 4-4 4" />
  </svg>
);
