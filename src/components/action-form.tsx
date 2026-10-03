"use client";

import { startTransition, useActionState, useEffect, useId, useRef, type ReactNode } from "react";
import type { ActionState } from "@/server/errors";
import { useT } from "@/i18n/client";
import { btn } from "./ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submit: string;
  variant?: keyof typeof btn;
  className?: string;
  /** Clear the fields after a successful submit (for "add another" forms). */
  resetOnSuccess?: boolean;
  /** Ask before submitting, for actions that can't be undone. Name the target in the message. */
  confirm?: string;
};

/** A form bound to a server action, showing its error/success message and pending state. */
export function ActionForm({ action, children, submit, variant = "primary", className = "space-y-4", resetOnSuccess, confirm }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const messageId = useId();

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    if (resetOnSuccess && state?.ok) form.reset();
    // Mark the field the server rejected, tie it to the message, and move focus there.
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
    const field = state?.field && form.elements.namedItem(state.field);
    if (field instanceof HTMLElement) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", messageId);
      field.focus();
    }
  }, [state, resetOnSuccess, messageId]);

  return (
    <form
      ref={ref}
      action={formAction}
      // React resets uncontrolled fields after every action; submitting manually keeps
      // what the user typed when validation fails. Without JS the plain action still works.
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={className}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btn[variant]}>
          {pending ? t("Working…") : submit}
        </button>
        <p id={messageId} aria-live="polite" className={`text-sm ${state?.error ? "text-danger" : "text-brand"}`}>
          {(state?.error || state?.ok) && t((state.error ?? state.ok)!, state.params)}
        </p>
      </div>
    </form>
  );
}
