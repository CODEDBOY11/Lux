import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function paystack(path: string, opts: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) throw new Error(json.message ?? "Paystack error");
  return json;
}

function ok(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req: { method: string; body: any; text: () => any; headers: { get: (arg0: string) => any; }; }) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!PAYSTACK_SECRET) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable is not set. Please configure it in Supabase dashboard under Settings → Edge Functions → Secrets");
    }

    let body: any = {};
    if (req.body) {
      try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON in request body");
      }
    }

    const action = body.action;
    if (!action) throw new Error("Missing action field");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (action === "list-banks") {
      const data = await paystack("/bank?currency=NGN&country=nigeria");
      return ok(data.data.map((b: any) => ({ name: b.name, code: b.code })));
    }

    if (action === "resolve-account") {
      const { accountNumber, bankCode } = body;
      if (!accountNumber) throw new Error("Missing accountNumber");
      if (!bankCode) throw new Error("Missing bankCode");
      
      const data = await paystack(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
      return ok({ accountName: data.data.account_name });
    }

    if (action === "initiate-transfer") {
      const { withdrawalId } = body;
      if (!withdrawalId) throw new Error("Missing withdrawalId");
      
      const { data: wr, error } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("id", withdrawalId)
        .single();
      
      if (error) throw new Error(`Database error: ${error.message}`);
      if (!wr) throw new Error("Withdrawal request not found");
      if (wr.status !== "pending") throw new Error(`Withdrawal already processed with status: ${wr.status}`);

      const { data: caller, error: callerError } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (callerError) throw new Error(`Failed to fetch user role: ${callerError.message}`);
      
      const isOwner = wr.host_id === user.id;
      const isAdmin = caller?.role === "admin";
      if (!isOwner && !isAdmin) throw new Error("You do not have permission to process this withdrawal");

      const recipient = await paystack("/transferrecipient", {
        method: "POST",
        body: JSON.stringify({
          type: "nuban",
          name: wr.account_name,
          account_number: wr.account_number,
          bank_code: wr.bank_code,
          currency: "NGN",
        }),
      });

      const transfer = await paystack("/transfer", {
        method: "POST",
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(Number(wr.amount) * 100),
          recipient: recipient.data.recipient_code,
          reason: `Withdrawal — ${wr.account_name}`,
          reference: `wr_${wr.id}_${Date.now()}`,
        }),
      });

      const { error: updateError } = await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          paystack_recipient_code: recipient.data.recipient_code,
          paystack_transfer_code: transfer.data.transfer_code,
          transfer_reference: transfer.data.reference,
          status: transfer.data.status === "success" ? "approved" : "pending",
          reviewed_by: isAdmin ? user.id : null,
          reviewed_at: transfer.data.status === "success" ? new Date().toISOString() : null,
        })
        .eq("id", withdrawalId);

      if (updateError) throw new Error(`Failed to update withdrawal status: ${updateError.message}`);

      return ok({ status: transfer.data.status });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Paystack function error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});