import { Fragment } from "react";

export type SplitMode = "chars" | "words";

interface SplitTextProps {
  text: string;
  split?: SplitMode;
  /** Data attribute placed on each animatable unit (char or word). */
  unitAttribute?: string;
  unitClassName?: string;
}

/**
 * Renders text as inline-block units for per-character or per-word animation.
 * Words never break internally. The parent is responsible for the accessible
 * label, so every unit is hidden from assistive technology.
 */
export function SplitText({ text, split = "chars", unitAttribute = "data-split-unit", unitClassName = "" }: SplitTextProps) {
  const unitProps = { [unitAttribute]: "", className: `inline-block will-change-transform ${unitClassName}` };
  const words = text.split(" ");

  return (
    <>
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="inline-block whitespace-nowrap" aria-hidden="true">
            {split === "chars" ? (
              Array.from(word).map((char, charIndex) => (
                <span key={charIndex} {...unitProps}>
                  {char}
                </span>
              ))
            ) : (
              <span {...unitProps}>{word}</span>
            )}
          </span>
          {wordIndex < words.length - 1 && (
            <span className="inline-block" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </Fragment>
      ))}
    </>
  );
}
