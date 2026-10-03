import { applyPaymobTransaction } from "@/server/payments";
import { fieldsFromCallback, paymobConfig, verifyTransaction } from "@/server/paymob";

/** Paymob's server-to-server "transaction processed" callback. The source of truth for payments. */
export async function POST(req: Request) {
  const cfg = paymobConfig();
  if (!cfg) return new Response("Paymob not configured", { status: 404 });

  const body = (await req.json().catch(() => null)) as { type?: string; obj?: Record<string, unknown> } | null;
  if (body?.type !== "TRANSACTION" || !body.obj) return new Response("ignored", { status: 200 });

  const fields = fieldsFromCallback(body.obj);
  if (!verifyTransaction(fields, new URL(req.url).searchParams.get("hmac"), cfg.hmacSecret)) {
    console.warn(`Rejected Paymob callback with bad HMAC for order ${fields.order}`);
    return new Response("invalid signature", { status: 401 });
  }
  const outcome = await applyPaymobTransaction(fields);
  console.info(`Paymob transaction ${fields.id} for order ${fields.order}: ${outcome}`);
  return new Response("ok", { status: 200 });
}
