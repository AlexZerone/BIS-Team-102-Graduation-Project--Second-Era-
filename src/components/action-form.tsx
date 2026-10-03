"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/server/errors";
import { btn } from "./ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submit: string;
  variant?: keyof typeof btn;
  className?: string;
  /** Clear the fields after a successful submit (for "add another" forms). */
  resetOnSuccess?: boolean;
};

/** A form bound to a server action, showing its error/success message and pending state. */
export function ActionForm({ action, children, submit, variant = "primary", className = "space-y-4", resetOnSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      // React resets uncontrolled fields after every action; submitting manually keeps
      // what the user typed when validation fails. Without JS the plain action still works.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={className}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btn[variant]}>
          {pending ? "Working…" : submit}
        </button>
        <p aria-live="polite" className={`text-sm ${state?.error ? "text-danger" : "text-brand"}`}>
          {state?.error ?? state?.ok}
        </p>
      </div>
    </form>
  );
}
