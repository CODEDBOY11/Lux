// supabase/functions/paystack-init/index.ts
// ─────────────────────────────────────────────────────────────
// Called from the dashboard (via supabase.functions.invoke) when a
// host clicks "Upgrade to Pro". Talks to Paystack's API using the
// SECRET key (safe here — this runs on Supabase's servers, never in
// the browser) and returns a hosted checkout URL to redirect to.
//
// DEPLOY:
//   supabase functions deploy paystack-init
//   supabase secrets set PAYSTACK_PLAN_CODE=PLN_xxx   (from your Paystack Plan)
//   supabase secrets set APP_URL=https://your-deployed-dashboard-url.com
// ─────────────────────────────────────────────────────────────

// @ts-ignore Deno resolves this remote module; standard TypeScript tooling may not.
import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
// @ts-ignore Deno resolves this remote module; standard TypeScript tooling may not.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(name: string): string | undefined };
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_PLAN_CODE = Deno.env.get("PAYSTACK_PLAN_CODE");
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

interface PaystackInitRequest {
  hostId: string;
  email: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    reference: string;
  };
}

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
function fail(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  // ✅ Fix: null body + explicit 200 — browsers require this for preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors });
  }

  try {
    if (!PAYSTACK_SECRET) throw new Error("PAYSTACK_SECRET_KEY is not set.");
    if (!PAYSTACK_PLAN_CODE)
      throw new Error(
        "PAYSTACK_PLAN_CODE is not set — create a monthly Plan in Paystack and set its plan_code.",
      );

    const { hostId, email } = (await req.json()) as PaystackInitRequest;
    if (!hostId || !email) return fail("hostId and email are required");

    // Verify the caller really is this host
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user || user.id !== hostId)
      return fail("Not authorized for this host account", 401);

    const initRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: 1500000, // ₦15,000 in kobo
          plan: PAYSTACK_PLAN_CODE,
          callback_url: `${APP_URL}?upgraded=1`,
          metadata: { hostId },
        }),
      },
    );
    const initData = (await initRes.json()) as PaystackInitializeResponse;
    if (!initRes.ok || !initData.status) {
      console.error("Paystack init failed:", initData);
      return fail(initData.message ?? "Paystack initialization failed", 502);
    }

    return ok({
      authorization_url: initData.data.authorization_url,
      reference: initData.data.reference,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("paystack-init error:", message);
    return fail(message, 500);
  }
});
