import { createHmac, timingSafeEqual } from "node:crypto";

// Paymob (Egypt) Intention API + Unified Checkout.
// Docs: https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention

export type PaymobConfig = {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  integrationIds: number[];
  appUrl: string;
};

const REQUIRED = ["PAYMOB_SECRET_KEY", "PAYMOB_PUBLIC_KEY", "PAYMOB_HMAC_SECRET", "PAYMOB_INTEGRATION_IDS", "APP_URL"] as const;

/** Paymob settings, or null when not configured (the app then uses simulated payments). */
export function paymobConfig(env: NodeJS.ProcessEnv = process.env): PaymobConfig | null {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length === REQUIRED.length) return null;
  if (missing.length) throw new Error(`Paymob is partly configured; missing ${missing.join(", ")}`);
  const integrationIds = env.PAYMOB_INTEGRATION_IDS!.split(",").map((s) => Number(s.trim()));
  if (integrationIds.some((n) => !Number.isInteger(n) || n <= 0)) throw new Error("PAYMOB_INTEGRATION_IDS must be comma-separated integers");
  return {
    baseUrl: (env.PAYMOB_BASE_URL ?? "https://accept.paymob.com").replace(/\/$/, ""),
    secretKey: env.PAYMOB_SECRET_KEY!,
    publicKey: env.PAYMOB_PUBLIC_KEY!,
    hmacSecret: env.PAYMOB_HMAC_SECRET!,
    integrationIds,
    appUrl: env.APP_URL!.replace(/\/$/, ""),
  };
}

type IntentionInput = {
  amountCents: number;
  reference: string;
  itemName: string;
  customer: { name: string; email: string; phone: string };
  notificationUrl: string;
  redirectionUrl: string;
};

/** Creates a payment intention and returns the Unified Checkout URL plus Paymob's order id. */
export async function createIntention(cfg: PaymobConfig, input: IntentionInput) {
  const [first, ...rest] = input.customer.name.trim().split(/\s+/);
  const res = await fetch(`${cfg.baseUrl}/v1/intention/`, {
    method: "POST",
    headers: { Authorization: `Token ${cfg.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "EGP",
      payment_methods: cfg.integrationIds,
      items: [{ name: input.itemName, amount: input.amountCents, quantity: 1 }],
      // Paymob requires these address fields; "NA" is its documented placeholder.
      billing_data: {
        first_name: first || "NA",
        last_name: rest.join(" ") || "NA",
        email: input.customer.email,
        phone_number: input.customer.phone,
        apartment: "NA", floor: "NA", street: "NA", building: "NA",
        city: "NA", state: "NA", country: "EG", postal_code: "NA",
      },
      special_reference: input.reference,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Paymob intention failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { client_secret?: string; intention_order_id?: number };
  if (!data.client_secret || !data.intention_order_id) throw new Error("Paymob intention response is missing client_secret");
  return {
    orderId: String(data.intention_order_id),
    checkoutUrl: `${cfg.baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(cfg.publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`,
  };
}

// Fixed field order for the transaction HMAC (Paymob "HMAC Transaction Callback").
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
  "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order", "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success",
] as const;

export type TransactionFields = Record<(typeof HMAC_FIELDS)[number], string>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v)); // booleans become "true"/"false"

/** Fields from the server-to-server POST callback body (`obj`). */
export function fieldsFromCallback(obj: Record<string, unknown>): TransactionFields {
  const order = obj.order as { id?: unknown } | undefined;
  const source = (obj.source_data ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    HMAC_FIELDS.map((k) => [
      k,
      k === "order" ? str(order?.id) : k.startsWith("source_data.") ? str(source[k.slice(12)]) : str(obj[k]),
    ]),
  ) as TransactionFields;
}

/** Fields from the browser redirect's query string (same data, flattened). */
export function fieldsFromRedirect(q: URLSearchParams): TransactionFields {
  return Object.fromEntries(HMAC_FIELDS.map((k) => [k, k === "order" ? (q.get("order") ?? q.get("order_id") ?? "") : (q.get(k) ?? "")])) as TransactionFields;
}

export function signTransaction(fields: TransactionFields, secret: string) {
  return createHmac("sha512", secret).update(HMAC_FIELDS.map((k) => fields[k]).join("")).digest("hex");
}

export function verifyTransaction(fields: TransactionFields, hmac: string | null, secret: string) {
  if (!hmac) return false;
  const expected = Buffer.from(signTransaction(fields, secret), "hex");
  const given = Buffer.from(hmac, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
