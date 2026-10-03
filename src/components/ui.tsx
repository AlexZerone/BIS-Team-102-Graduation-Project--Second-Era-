import type { ComponentProps, ReactNode } from "react";

// 44px tall on touch screens, compact from the sm breakpoint. Focus ring comes from globals.css.
const base = "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 sm:min-h-9";
export const btn = {
  primary: `${base} bg-brand text-brand-ink hover:opacity-90`,
  secondary: `${base} border border-field bg-surface hover:bg-background`,
  danger: `${base} border border-danger text-danger hover:bg-danger/10`,
};

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

const tones = {
  neutral: "bg-line/60 text-foreground",
  brand: "bg-brand/15 text-brand",
  warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-danger/15 text-danger",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-6 text-center text-muted">{children}</p>;
}

// 16px text on phones stops iOS zooming into fields; aria-invalid is set by ActionForm.
const inputClass =
  "mt-1 block w-full rounded-md border border-field bg-surface px-3 py-2 text-base sm:text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger disabled:cursor-not-allowed disabled:bg-background disabled:text-muted";

type FieldProps = { label: string; name: string; hint?: string } & (
  | ({ as?: "input" } & ComponentProps<"input">)
  | ({ as: "textarea" } & ComponentProps<"textarea">)
  | ({ as: "select"; options: [string, string][] } & ComponentProps<"select">)
);

export function Field({ label, hint, ...props }: FieldProps) {
  let control: ReactNode;
  if (props.as === "textarea") {
    const { as: _, ...rest } = props;
    control = <textarea rows={4} className={inputClass} {...rest} />;
  } else if (props.as === "select") {
    const { as: _, options, ...rest } = props;
    control = (
      <select className={inputClass} {...rest}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    );
  } else {
    const { as: _, ...rest } = props;
    control = <input className={inputClass} {...rest} />;
  }
  // Wrapping the control in its label associates them without ids, so the same
  // field can appear in several forms on one page.
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      {control}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}


