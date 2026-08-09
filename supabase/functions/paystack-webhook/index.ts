// supabase/functions/paystack-webhook/index.ts
// ─────────────────────────────────────────────────────────────
// Paystack calls this URL directly (not your browser) whenever
// something happens with a payment or subscription — successful
// charge, renewal, failed renewal, cancellation. This is the ONLY
// thing allowed to write to host_subscriptions (it uses the service
// role key, which bypasses RLS).
//
// DEPLOY:
//   supabase functions deploy paystack-webhook --no-verify-jwt
//   (--no-verify-jwt because Paystack calls this directly, not through
//    a logged-in Supabase user — we verify it a different way, via
//    Paystack's own signature header, below)
//
// PAYSTACK_SECRET_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
// already set as secrets from this project's other Paystack functions
// (confirm-booking, paystack-transfers) — no need to set them again.
//
// Then in Paystack Dashboard → Settings → API Keys & Webhooks, paste
// this function's URL as the webhook URL. (This project didn't have
// one registered before — confirm-booking verifies payments by
// pulling status via /transaction/verify instead of listening for a
// push — so this is safe to add as the first and only webhook.)
// ─────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hmacSha512Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// deno-lint-ignore no-explicit-any
async function upsertSubscription(hostId: string, patch: Record<string, any>) {
  const { error } = await supabase
    .from("host_subscriptions")
    .upsert({ host_id: hostId, updated_at: new Date().toISOString(), ...patch }, { onConflict: "host_id" });
  if (error) console.error("upsertSubscription failed:", error.message);
}

function addOneMonth(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // Verify this really came from Paystack.
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (signature !== expected) {
    console.warn("Webhook signature mismatch — rejecting.");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const type = event.event as string;
  const data = event.data ?? {};

  console.log("Paystack webhook:", type);

  switch (type) {
    case "charge.success": {
      const hostId = data.metadata?.hostId;
      if (!hostId) {
        console.warn("charge.success with no hostId in metadata — ignoring.");
        break;
      }
      await upsertSubscription(hostId, {
        plan: "pro",
        status: "active",
        paystack_customer_code: data.customer?.customer_code ?? null,
        current_period_end: addOneMonth(),
      });
      break;
    }

    case "subscription.create": {
      // Fires shortly after charge.success for the first payment on a
      // plan — this is where Paystack gives us the subscription_code
      // and email_token we need later to let the host cancel.
      const hostId = data.metadata?.hostId ?? data.customer?.metadata?.hostId;
      if (!hostId) {
        console.warn("subscription.create with no hostId in metadata — cannot link. " +
          "If this keeps happening, store hostId via customer_code lookup instead.");
        break;
      }
      await upsertSubscription(hostId, {
        plan: "pro",
        status: "active",
        paystack_subscription_code: data.subscription_code ?? null,
        paystack_email_token: data.email_token ?? null,
        current_period_end: data.next_payment_date ?? addOneMonth(),
      });
      break;
    }

    case "invoice.update": {
      // Fires on each renewal attempt. data.status is "success" or "failed".
      const hostId = data.subscription?.metadata?.hostId ?? data.customer?.metadata?.hostId;
      if (!hostId) break;
      if (data.status === "success") {
        await upsertSubscription(hostId, {
          plan: "pro",
          status: "active",
          current_period_end: addOneMonth(),
        });
      } else {
        await upsertSubscription(hostId, { status: "past_due" });
      }
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      const hostId = data.metadata?.hostId ?? data.customer?.metadata?.hostId;
      if (!hostId) break;
      await upsertSubscription(hostId, { status: "cancelled" });
      break;
    }

    default:
      // Unhandled event types are fine to ignore.
      break;
  }

  return new Response("ok", { status: 200 });
});