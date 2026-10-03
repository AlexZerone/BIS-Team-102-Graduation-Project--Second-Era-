import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
  secondary:
    "inline-flex items-center justify-center rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-background disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
  danger:
    "inline-flex items-center justify-center rounded-md border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50",
};

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

const tones = {
  neutral: "bg-line/60 text-foreground",
  brand: "bg-brand/15 text-brand",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
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

const inputClass =
  "mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

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

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-2 py-1 text-sm text-muted hover:bg-line/50 hover:text-foreground">
      {children}
    </Link>
  );
}

export const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
