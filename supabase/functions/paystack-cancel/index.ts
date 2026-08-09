// supabase/functions/paystack-cancel/index.ts
// ─────────────────────────────────────────────────────────────
// Called when a host clicks "Cancel Subscription" in Billing.
// Tells Paystack to stop future renewals. The host keeps Pro access
// until current_period_end (the frontend just checks that date),
// matching how most subscription billing behaves.
//
// DEPLOY:
//   supabase functions deploy paystack-cancel
// (PAYSTACK_SECRET_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY /
//  SUPABASE_ANON_KEY are already set from your other functions.)
// ─────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!PAYSTACK_SECRET) throw new Error("PAYSTACK_SECRET_KEY is not set.");

    const { hostId } = await req.json();
    if (!hostId) return fail("hostId is required");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || user.id !== hostId) return fail("Not authorized for this host account", 401);

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("host_subscriptions")
      .select("paystack_subscription_code, paystack_email_token")
      .eq("host_id", hostId)
      .maybeSingle();

    if (subErr || !sub?.paystack_subscription_code || !sub?.paystack_email_token) {
      return fail("No active subscription found to cancel", 404);
    }

    const res = await fetch("https://api.paystack.co/subscription/disable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: sub.paystack_subscription_code,
        token: sub.paystack_email_token,
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.status) {
      console.error("Paystack cancel failed:", result);
      return fail(result.message ?? "Cancellation failed", 502);
    }

    await supabaseAdmin
      .from("host_subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("host_id", hostId);

    return ok({ cancelled: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("paystack-cancel error:", message);
    return fail(message, 500);
  }
});