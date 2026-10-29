/**
 * Supabase Edge Function: confirm-pro-subscription
 *
 * Called by the frontend after Paystack's onSuccess callback fires.
 * Mirrors the exact pattern of confirm-booking:
 *   1. Verify the Paystack payment is genuinely successful
 *   2. Guard against double-processing the same reference
 *   3. Upsert the subscription row (active, monthly, expires 30 days out)
 *   4. Credit the platform wallet with the subscription fee
 *   5. Fire a notification to the host
 *
 * Deploy:
 *   supabase functions deploy confirm-pro-subscription
 *
 * Required secrets (same as confirm-booking):
 *   PAYSTACK_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Frontend call:
 *   await supabase.functions.invoke("confirm-pro-subscription", {
 *     body: { reference, hostId, hostEmail, hostName, amountNgn }
 *   });
 */
// @ts-ignore Deno resolves this remote module at runtime.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore Deno resolves this remote module at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

interface ConfirmProSubscriptionBody {
  reference?: string;
  hostId?: string;
  hostEmail?: string;
  hostName?: string;
  amountNgn?: number;
}

interface ConfirmProSubscriptionRequestBody {
  reference?: string;
  hostId?: string;
  hostEmail?: string;
  hostName?: string;
  amountNgn?: number;
}

interface ConfirmProSubscriptionSuccessResponse {
  alreadyProcessed?: boolean;
  subscriptionId?: string;
  subscription?: HostSubscriptionRow;
}

interface PaymentHeaders {
  Authorization: string;
}

interface CorsHeaders extends Record<string, string> {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Max-Age": string;
}

interface SubscriptionUpsertPayload {
  host_id: string;
  plan: "pro";
  status: "active";
  paystack_ref: string;
  amount_ngn: number;
  started_at: string;
  expires_at: string;
  renewed_at: string;
}

interface NotificationInsertPayload {
  user_id: string;
  type: "subscription";
  title: string;
  body: string;
  link: string;
}

interface HostSubscriptionRow {
  id: string;
  host_id?: string;
  plan?: "pro";
  status?: "active";
  paystack_ref?: string;
  amount_ngn?: number;
  started_at?: string;
  expires_at?: string;
  renewed_at?: string;
}

interface DatabaseError {
  message: string;
}

interface PaystackTransactionData {
  status?: string;
  amount?: number;
}

interface PaystackVerifyResponse {
  data?: PaystackTransactionData;
}

const PAYSTACK_SECRET: string = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL: string = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE: string = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Same platform admin ID as confirm-booking ──────────────────────
const PLATFORM_ADMIN_ID: string = "7d597621-1416-4c1a-be9c-582dd68c5270";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors: CorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    const body: ConfirmProSubscriptionRequestBody =
      (await req.json()) as ConfirmProSubscriptionRequestBody;
    const { reference, hostId, hostEmail, hostName, amountNgn } = body;

    if (!reference) return fail("Missing payment reference");
    if (!hostId) return fail("Missing hostId");

    // ── 1. Verify payment with Paystack ──────────────────────────
    const verifyRes: Response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
    );
    const verifyJson: PaystackVerifyResponse =
      (await verifyRes.json()) as PaystackVerifyResponse;

    if (!verifyRes.ok || verifyJson.data?.status !== "success") {
      return fail("Payment could not be verified");
    }

    const paidAmountNgn: number = (verifyJson.data?.amount ?? 0) / 100;
    // Allow ±1 naira rounding tolerance
    if (amountNgn && Math.abs(paidAmountNgn - amountNgn) > 1) {
      return fail("Paid amount does not match plan price");
    }

    // ── 2. Prevent double-processing ────────────────────────────
    const {
      data: existing,
      error: existingError,
    }: { data: HostSubscriptionRow | null; error: DatabaseError | null } =
      await supabaseAdmin
        .from("host_subscriptions")
        .select("id")
        .eq("paystack_ref", reference)
        .maybeSingle();

    if (existingError) return fail(existingError.message);

    if (existing) {
      return ok({ alreadyProcessed: true, subscriptionId: existing.id });
    }

    // ── 3. Upsert subscription row ───────────────────────────────
    // One active row per host; renewing simply extends expires_at by 30 days
    const now: Date = new Date();
    const expiresAt: Date = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscriptionPayload: SubscriptionUpsertPayload = {
      host_id: hostId,
      plan: "pro",
      status: "active",
      paystack_ref: reference,
      amount_ngn: paidAmountNgn,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      renewed_at: now.toISOString(),
    };

    const {
      data: subscription,
      error: upsertErr,
    }: { data: HostSubscriptionRow | null; error: DatabaseError | null } =
      await supabaseAdmin
        .from("host_subscriptions")
        .upsert(subscriptionPayload, { onConflict: "host_id" }) // one row per host, update on renew
        .select()
        .single();

    if (upsertErr) return fail(upsertErr.message);

    // ── 4. Credit platform wallet ────────────────────────────────
    await supabaseAdmin.rpc("credit_wallet", {
      p_user_id: PLATFORM_ADMIN_ID,
      p_amount: paidAmountNgn,
      p_desc: `Pro subscription fee: ${hostName ?? hostEmail ?? hostId}`,
      p_booking_id: null,
    });

    // ── 5. Notify the host ───────────────────────────────────────
    const notificationPayload: NotificationInsertPayload = {
      user_id: hostId,
      type: "subscription",
      title: "Pro plan activated!",
      body: `Your EDEN Pro subscription is now active. It renews on ${expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
      link: "/dashboard?tab=billing",
    };

    await supabaseAdmin.from("notifications").insert(notificationPayload);

    return ok({ subscription });
  } catch (e) {
    return fail((e as Error).message ?? "Unexpected error", 500);
  }
});
