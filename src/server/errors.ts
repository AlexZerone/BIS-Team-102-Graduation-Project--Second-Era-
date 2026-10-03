import { translate, type Params } from "@/i18n/translate";

/**
 * A rule violation that's safe to show the user. The message is an English template (also the
 * translation key) plus values; ActionForm renders it in the user's language.
 */
export class DomainError extends Error {
  constructor(
    readonly template: string,
    readonly opts: { params?: Params; field?: string } = {},
  ) {
    super(translate("en", template, opts.params)); // readable in logs and tests
  }
}

/** Result of a form action: an English template + values, and the field to highlight. */
export type ActionState = { error?: string; ok?: string; params?: Params; field?: string } | undefined;

type Ok = string | { ok: string; params: Params } | void;

/** Run a mutation for useActionState: DomainErrors become form messages, everything else rethrows. */
export async function attempt(fn: () => Promise<Ok>): Promise<ActionState> {
  try {
    const ok = await fn();
    if (!ok) return {};
    return typeof ok === "string" ? { ok } : ok;
  } catch (e) {
    if (e instanceof DomainError) return { error: e.template, params: e.opts.params, field: e.opts.field };
    throw e;
  }
}
