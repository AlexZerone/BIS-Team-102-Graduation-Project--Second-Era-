import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { migrate } from "@/db/migrate";
import { payments, studentProfiles, users } from "@/db/schema";
import { applyPaymobTransaction, markPaid, startCheckout } from "./payments";
import { fieldsFromCallback, fieldsFromRedirect, signTransaction, verifyTransaction, type TransactionFields } from "./paymob";
import { studentPlan } from "./learning";

await migrate();

const SECRET = "test-hmac-secret";
const PAYMOB_ENV = {
  PAYMOB_SECRET_KEY: "sk_test",
  PAYMOB_PUBLIC_KEY: "pk_test",
  PAYMOB_HMAC_SECRET: SECRET,
  PAYMOB_INTEGRATION_IDS: "111, 222",
  APP_URL: "https://secondera.test/",
};

let n = 0;
async function student() {
  const [u] = await db
    .insert(users)
    .values({ email: `p${++n}@t`, passwordHash: "x", name: "Sara Ali Hassan", role: "student", status: "active" })
    .returning();
  await db.insert(studentProfiles).values({ userId: u.id });
  return u;
}

// A callback body as Paymob sends it.
const callbackObj = (orderId: string, over: Record<string, unknown> = {}) => ({
  id: 987654,
  amount_cents: 150000,
  created_at: "2026-10-03T12:00:00.000000",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  integration_id: 111,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: Number(orderId), merchant_order_id: "se-1" },
  owner: 42,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
  ...over,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Paymob HMAC", () => {
  it("verifies callbacks and rejects tampered or unsigned ones", () => {
    const fields = fieldsFromCallback(callbackObj("5001"));
    const hmac = signTransaction(fields, SECRET);
    expect(verifyTransaction(fields, hmac, SECRET)).toBe(true);
    expect(verifyTransaction({ ...fields, amount_cents: "1" }, hmac, SECRET)).toBe(false);
    expect(verifyTransaction(fields, hmac, "other-secret")).toBe(false);
    expect(verifyTransaction(fields, null, SECRET)).toBe(false);
    expect(verifyTransaction(fields, "zz", SECRET)).toBe(false);
  });

  it("serializes booleans as lowercase and reads the redirect's flattened params identically", () => {
    const fromPost = fieldsFromCallback(callbackObj("5001"));
    expect(fromPost.success).toBe("true");
    expect(fromPost.order).toBe("5001");
    expect(fromPost["source_data.pan"]).toBe("2346");
    const q = new URLSearchParams({ ...fromPost, order: "5001", hmac: "x", "data.message": "Approved" } as Record<string, string>);
    expect(fieldsFromRedirect(q)).toEqual(fromPost);
  });
});

describe("checkout", () => {
  it("simulates payment when Paymob is not configured", async () => {
    const s = await student();
    const url = await startCheckout(s, "standard", "+201012345678");
    expect(url).toMatch(/^\/plans\/return\/\d+$/);
    expect(await studentPlan(s.id)).toBe("standard");
    const [p] = await db.select().from(payments).where(eq(payments.studentId, s.id));
    expect(p).toMatchObject({ provider: "simulated", status: "paid", amountEgp: 1500 });
  });

  it("creates a Paymob intention and leaves the payment pending until confirmed", async () => {
    vi.stubEnv("DATABASE_URL", "");
    for (const [k, v] of Object.entries(PAYMOB_ENV)) vi.stubEnv(k, v);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ client_secret: "cs_123", intention_order_id: 5001 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const s = await student();
    const url = await startCheckout(s, "standard", "+201012345678");
    expect(url).toBe("https://accept.paymob.com/unifiedcheckout/?publicKey=pk_test&clientSecret=cs_123");

    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toBe("https://accept.paymob.com/v1/intention/");
    expect(init.headers.Authorization).toBe("Token sk_test");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      amount: 150000,
      currency: "EGP",
      payment_methods: [111, 222],
      billing_data: { first_name: "Sara", last_name: "Ali Hassan", phone_number: "+201012345678" },
      notification_url: "https://secondera.test/api/payments/paymob",
    });
    expect(body.redirection_url).toMatch(/^https:\/\/secondera\.test\/plans\/return\/\d+$/);

    const [p] = await db.select().from(payments).where(eq(payments.studentId, s.id));
    expect(p).toMatchObject({ provider: "paymob", status: "pending", providerRef: "5001" });
    expect(await studentPlan(s.id)).toBe("free");
  });

  it("marks the payment failed and shows a friendly error when Paymob is down", async () => {
    for (const [k, v] of Object.entries(PAYMOB_ENV)) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const s = await student();
    await expect(startCheckout(s, "basic", "+201012345678")).rejects.toThrow(/unavailable/);
    const [p] = await db.select().from(payments).where(eq(payments.studentId, s.id));
    expect(p.status).toBe("failed");
  });

  it("refuses a plan the student already has", async () => {
    const s = await student();
    await startCheckout(s, "premium", "+201012345678");
    await expect(startCheckout(s, "basic", "+201012345678")).rejects.toThrow(/already have/);
  });
});

describe("settling Paymob transactions", () => {
  async function pendingPayment(orderId: string) {
    const s = await student();
    const [p] = await db
      .insert(payments)
      .values({ studentId: s.id, plan: "standard", amountEgp: 1500, provider: "paymob", providerRef: orderId, status: "pending" })
      .returning();
    return { s, p };
  }
  const fields = (orderId: string, over: Record<string, unknown> = {}): TransactionFields => fieldsFromCallback(callbackObj(orderId, over));

  it("activates the plan once, however many times Paymob notifies", async () => {
    const { s, p } = await pendingPayment("6001");
    expect(await applyPaymobTransaction(fields("6001"))).toBe("paid");
    expect(await applyPaymobTransaction(fields("6001"))).toBe("already-settled");
    expect(await markPaid(p.id)).toBe(false);
    expect(await studentPlan(s.id)).toBe("standard");
  });

  it("keeps declined attempts pending so a retry in the same checkout can still succeed", async () => {
    const { s } = await pendingPayment("6002");
    expect(await applyPaymobTransaction(fields("6002", { success: false }))).toBe("declined");
    expect(await applyPaymobTransaction(fields("6002", { pending: true }))).toBe("still-pending");
    expect(await applyPaymobTransaction(fields("6002"))).toBe("paid");
    expect(await studentPlan(s.id)).toBe("standard");
  });

  it("rejects a successful transaction for the wrong amount", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { s, p } = await pendingPayment("6003");
    expect(await applyPaymobTransaction(fields("6003", { amount_cents: 100 }))).toBe("amount-mismatch");
    expect((await db.select().from(payments).where(eq(payments.id, p.id)))[0].status).toBe("failed");
    expect(await studentPlan(s.id)).toBe("free");
  });

  it("ignores voided transactions and unknown orders", async () => {
    const { s } = await pendingPayment("6004");
    expect(await applyPaymobTransaction(fields("6004", { is_voided: true }))).toBe("declined");
    expect(await applyPaymobTransaction(fields("9999"))).toBe("unknown-order");
    expect(await studentPlan(s.id)).toBe("free");
  });
});

describe("Paymob callback route", () => {
  it("settles a payment from a signed callback and rejects a forged one", async () => {
    for (const [k, v] of Object.entries(PAYMOB_ENV)) vi.stubEnv(k, v);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { POST } = await import("@/app/api/payments/paymob/route");
    const s = await student();
    const [p] = await db
      .insert(payments)
      .values({ studentId: s.id, plan: "basic", amountEgp: 1000, provider: "paymob", providerRef: "7001", status: "pending" })
      .returning();
    const obj = callbackObj("7001", { amount_cents: 100000 });
    const hmac = signTransaction(fieldsFromCallback(obj), SECRET);
    const call = (sig: string) =>
      POST(new Request(`https://secondera.test/api/payments/paymob?hmac=${sig}`, { method: "POST", body: JSON.stringify({ type: "TRANSACTION", obj }) }));

    expect((await call("00".repeat(64))).status).toBe(401);
    expect(await studentPlan(s.id)).toBe("free");
    expect((await call(hmac)).status).toBe(200);
    expect(await studentPlan(s.id)).toBe("basic");
    expect((await db.select().from(payments).where(eq(payments.id, p.id)))[0].status).toBe("paid");
  });
});
