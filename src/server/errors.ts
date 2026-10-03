/** A rule violation whose message is safe to show the user. */
export class DomainError extends Error {}

/** Result of a form action. `field` names the input to highlight and focus. */
export type ActionState = { error?: string; ok?: string; field?: string } | undefined;

/** Run a mutation for useActionState: DomainErrors become form messages, everything else rethrows. */
export async function attempt(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const ok = await fn();
    return ok ? { ok } : {};
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    throw e;
  }
}
