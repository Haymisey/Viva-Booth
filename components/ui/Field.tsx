import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  hint?: string;
};

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-ink/60";

export function TextField({
  label,
  hint,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={fieldId}>
      <span className={labelClass}>{label}</span>
      <input
        id={fieldId}
        className="w-full border-b border-ink/20 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink/35 focus:border-ink"
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-ink/55">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block" htmlFor={fieldId}>
      <span className={labelClass}>{label}</span>
      <textarea
        id={fieldId}
        className="min-h-[7.5rem] w-full resize-y rounded-lg border border-ink/15 bg-card px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink/35 focus:border-ink"
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-ink/55">{hint}</span> : null}
    </label>
  );
}
