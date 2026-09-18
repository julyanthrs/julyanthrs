import { useId, type ChangeEvent, type FocusEvent } from "react";

interface FieldBaseProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

type FormFieldProps = FieldBaseProps &
  (
    | { kind: "input"; type: "text" | "email"; autoComplete: string; maxLength: number }
    | { kind: "textarea"; maxLength: number }
    | { kind: "select"; options: readonly string[] }
  );

const CONTROL_CLASSES =
  "peer w-full appearance-none border-0 border-b border-line bg-transparent pb-2 pt-6 text-paper outline-none transition-colors duration-300 placeholder:text-transparent focus:border-transparent aria-[invalid=true]:border-hot/60";

/** Floating-label field with an animated underline and inline error message. */
export const FormField = (props: FormFieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    name: props.name,
    value: props.value,
    onChange: props.onChange,
    onBlur: props.onBlur,
    "aria-invalid": Boolean(props.error),
    "aria-describedby": props.error ? errorId : undefined,
    required: true,
  };

  const hasValue = props.value.length > 0;

  return (
    <div className="relative">
      {props.kind === "input" && (
        <input {...shared} type={props.type} autoComplete={props.autoComplete} maxLength={props.maxLength} placeholder={props.label} className={CONTROL_CLASSES} />
      )}
      {props.kind === "textarea" && (
        <textarea {...shared} rows={4} maxLength={props.maxLength} placeholder={props.label} className={`${CONTROL_CLASSES} resize-none`} data-lenis-prevent />
      )}
      {props.kind === "select" && (
        <select {...shared} className={`${CONTROL_CLASSES} cursor-pointer [&>option]:bg-surface`}>
          <option value="" disabled hidden />
          {props.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-0 origin-left transition-all duration-300 ease-[var(--ease-out-expo)] peer-focus:top-0 peer-focus:scale-[0.8] peer-focus:text-hot ${
          hasValue ? "top-0 scale-[0.8] text-muted" : "top-6 text-muted"
        }`}
      >
        {props.label}
      </label>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-hot transition-transform duration-500 ease-[var(--ease-out-expo)] peer-focus:scale-x-100" />
      {props.kind === "select" && (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-0 text-xs text-muted transition-transform duration-300 peer-focus:rotate-180 peer-focus:text-hot">
          ▾
        </span>
      )}
      {props.error && (
        <p id={errorId} className="mt-1.5 text-xs text-hot" role="alert">
          {props.error}
        </p>
      )}
    </div>
  );
};
