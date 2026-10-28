/**
 * BillingSection.tsx
 *
 * Pro plan checkout + subscription status panel.
 * Used inside HostDashboard as the "billing" nav section.
 *
 * Export from Hostdashboardmodules.tsx:
 *   export { default as BillingSection } from "../BillingSection";
 *   // or wherever your modules file re-exports from
 *
 * Requires:
 *   - Paystack inline script in index.html:
 *     <script src="https://js.paystack.co/v1/inline.js"></script>
 *   - Edge function deployed: confirm-pro-subscription
 *   - SubscriptionsDB + PRO_PLAN_PRICE_NGN in src/index.ts
 */

import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  SparklesIcon,
  CreditCardIcon,
  ArrowPathIcon,
  XCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "./index";
import { SubscriptionsDB, PRO_PLAN_PRICE_NGN } from "./index";
import type { HostSubscription } from "./index";
import { useAuth } from "./AuthContext";

/* ── helpers ─────────────────────────────────────────────────── */
const fmt$ = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const daysLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string; status: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

/* ── pro features list ───────────────────────────────────────── */
const PRO_FEATURES = [
  "Sales analytics & revenue charts",
  "Staff management & attendance",
  "Camera grid integration",
  "Priority listing placement",
  "Unlimited booking exports",
  "Dedicated host support",
];

/* ── component ───────────────────────────────────────────────── */
export default function BillingSection() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<HostSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPro = subscription !== null && SubscriptionsDB.isPro(subscription);

  useEffect(() => {
    if (!user) return;
    SubscriptionsDB.getByHost(user.id).then((sub) => {
      setSubscription(sub);
      setLoading(false);
    });
  }, [user]);

  /* ── Paystack checkout ─────────────────────────────────────── */
  const handleSubscribe = () => {
    if (!user) return;
    setError(null);

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: PRO_PLAN_PRICE_NGN * 100, // kobo
      currency: "NGN",
      ref: `ZB-PRO-${user.id.slice(0, 8).toUpperCase()}-${Date.now()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Host Name",
            variable_name: "host_name",
            value: `${user.firstName} ${user.lastName}`,
          },
          { display_name: "Plan", variable_name: "plan", value: "pro_monthly" },
        ],
      },
      callback: async (txn: { reference: string; status: string }) => {
        setPaying(true);
        try {
          const { error: fnErr } = await supabase.functions.invoke(
            "confirm-pro-subscription",
            {
              body: {
                reference: txn.reference,
                hostId: user.id,
                hostEmail: user.email,
                hostName: `${user.firstName} ${user.lastName}`,
                amountNgn: PRO_PLAN_PRICE_NGN,
              },
            },
          );

          if (fnErr) throw new Error(fnErr.message);

          // Refresh subscription state
          const updated = await SubscriptionsDB.getByHost(user.id);
          setSubscription(updated);
          setSuccess(true);
        } catch (e: unknown) {
          setError(
            (e as Error).message ?? "Something went wrong. Contact support.",
          );
        } finally {
          setPaying(false);
        }
      },
      onClose: () => {
        // User closed the Paystack modal — no action needed
      },
    });

    handler.openIframe();
  };

  /* ── render ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <ArrowPathIcon className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Billing & Subscription
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage your Eden Pro plan</p>
      </div>

      {/* ── Active subscription card ── */}
      {isPro && subscription && (
        <div
          style={{
            background: "linear-gradient(135deg, #fdf8ef 0%, #fef9f0 100%)",
            border: "1px solid rgba(201,169,110,0.35)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(201,169,110,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SparklesIcon
                  style={{ width: 20, height: 20, color: "#C9A96E" }}
                />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base">
                  Eden Pro · Active
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {subscription.currentPeriodEnd ? (
                    <>
                      Expires {fmtDate(subscription.currentPeriodEnd)} ·{" "}
                      <span
                        style={{
                          color:
                            daysLeft(subscription.currentPeriodEnd) <= 5
                              ? "#dc2626"
                              : "#16a34a",
                          fontWeight: 700,
                        }}
                      >
                        {daysLeft(subscription.currentPeriodEnd)} days left
                      </span>
                    </>
                  ) : (
                    "Expiration date unavailable"
                  )}
                </div>
              </div>
            </div>
            <span
              style={{
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                color: "#166534",
                borderRadius: 99,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ✓ Pro
            </span>
          </div>

          {/* Renew early prompt if ≤ 7 days left */}
          {subscription.currentPeriodEnd &&
            daysLeft(subscription.currentPeriodEnd) <= 7 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  background: "#fef9c3",
                  border: "1px solid #fef08a",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#854d0e",
                    fontWeight: 500,
                  }}
                >
                  Your Pro plan expires soon. Renew now to keep your features
                  active.
                </p>
              </div>
            )}

          {/* Renew button — only show when ≤ 7 days left */}
          {subscription.currentPeriodEnd &&
            daysLeft(subscription.currentPeriodEnd) <= 7 && (
              <button
                onClick={handleSubscribe}
                disabled={paying}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "11px 16px",
                  background: paying ? "rgba(201,169,110,0.4)" : "#C9A96E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: paying ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {paying ? (
                  <>
                    <ArrowPathIcon
                      style={{
                        width: 16,
                        height: 16,
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Processing…
                  </>
                ) : (
                  <>
                    <ArrowPathIcon style={{ width: 16, height: 16 }} />
                    Renew for {fmt$(PRO_PLAN_PRICE_NGN)}
                  </>
                )}
              </button>
            )}
        </div>
      )}

      {/* ── Success banner ── */}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <CheckCircleIcon
            style={{ width: 20, height: 20, color: "#16a34a", flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#166534",
                fontSize: 14,
              }}
            >
              Pro plan activated!
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#15803d",
                marginTop: 2,
              }}
            >
              All Pro features are now unlocked. Enjoy Eden Pro.
            </p>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <XCircleIcon
            style={{
              width: 18,
              height: 18,
              color: "#ef4444",
              flexShrink: 0,
              marginTop: 1,
            }}
          />
          <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p>
        </div>
      )}

      {/* ── Pro plan card (shown to non-pro or expired hosts) ── */}
      {!isPro && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Card header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1814 0%, #2a2520 100%)",
              padding: "24px",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <SparklesIcon
                style={{ width: 22, height: 22, color: "#C9A96E" }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#f5f0e8",
                  letterSpacing: "0.04em",
                }}
              >
                Eden Pro
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#C9A96E" }}>
                {fmt$(PRO_PLAN_PRICE_NGN)}
              </span>
              <span style={{ fontSize: 14, color: "rgba(245,240,232,0.5)" }}>
                / month
              </span>
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "rgba(245,240,232,0.55)",
              }}
            >
              Cancel anytime. No contracts.
            </p>
          </div>

          {/* Features list */}
          <div style={{ padding: "20px 24px" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Everything in Pro
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 0",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  <CheckCircleIcon
                    style={{
                      width: 16,
                      height: 16,
                      color: "#C9A96E",
                      flexShrink: 0,
                    }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={paying}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "14px 16px",
                background: paying ? "rgba(201,169,110,0.4)" : "#C9A96E",
                color: paying ? "rgba(255,255,255,0.5)" : "#0e0d0b",
                border: "none",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                cursor: paying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}
            >
              {paying ? (
                <>
                  <ArrowPathIcon
                    style={{
                      width: 16,
                      height: 16,
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Verifying payment…
                </>
              ) : (
                <>
                  <CreditCardIcon style={{ width: 18, height: 18 }} />
                  Subscribe for {fmt$(PRO_PLAN_PRICE_NGN)} / month
                </>
              )}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 10,
              }}
            >
              <LockClosedIcon
                style={{ width: 12, height: 12, color: "#9ca3af" }}
              />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Secured by Paystack · SSL encrypted
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Billing history ── */}
      {subscription && (
        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 12,
            }}
          >
            Billing History
          </h3>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                padding: "10px 16px",
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>Date</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                padding: "12px 16px",
                fontSize: 13,
                color: "#374151",
                alignItems: "center",
              }}
            >
              <span>
                {subscription.currentPeriodEnd
                  ? fmtDate(subscription.currentPeriodEnd)
                  : "—"}
              </span>
              <span style={{ fontWeight: 600 }}>Pro Monthly</span>
              <span>{fmt$(PRO_PLAN_PRICE_NGN)}</span>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  borderRadius: 99,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Paid
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
