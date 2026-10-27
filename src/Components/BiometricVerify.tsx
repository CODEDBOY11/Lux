/**
 * BiometricVerify.tsx
 *
 * Post-login biometric gate. Shown after Supabase auth succeeds,
 * before the dashboard loads. Two modes:
 *
 *   1. SETUP — user has no passkey yet → prompt them to register
 *   2. VERIFY — user has passkey → prompt biometric, or fallback OTP
 *
 * USAGE — in your login flow, after supabase.auth.signInWithPassword succeeds:
 *
 *   const [biometricPassed, setBiometricPassed] = useState(false);
 *
 *   // Show BiometricVerify instead of dashboard until verified
 *   if (!biometricPassed) {
 *     return (
 *       <BiometricVerify
 *         userId={user.id}
 *         email={user.email}
 *         isHost={true}          // false for admin
 *         onVerified={() => setBiometricPassed(true)}
 *         onSignOut={() => supabase.auth.signOut()}
 *       />
 *     );
 *   }
 *
 *   return <HostDashboard />;
 */

import { useState, useEffect } from "react";
import {
  FingerPrintIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useBiometric } from "../useBiometric";

interface Props {
  userId: string;
  email: string;
  isHost?: boolean; // true = host (gold), false = admin (blue)
  onVerified: () => void;
  onSignOut: () => void;
}

type Screen = "detecting" | "setup" | "verify" | "otp" | "success";

export default function BiometricVerify({
  userId,
  email,
  isHost = true,
  onVerified,
  onSignOut,
}: Props) {
  const bio = useBiometric(userId);
  const [screen, setScreen] = useState<Screen>("detecting");
  const [otpCode, setOtpCode] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const gold = isHost ? "#C9A96E" : "#6E9DC9";
  const bg = "#0e0d0b";
  const card = "#1a1814";

  /* Once bio hook resolves, decide first screen */
  useEffect(() => {
    if (bio.loading) return;
    if (!bio.isSupported) {
      // No biometric hardware — go straight to OTP
      handleSendOtp();
      setScreen("otp");
    } else if (bio.hasPasskey) {
      setScreen("verify");
      // Auto-trigger biometric prompt
      triggerAuth();
    } else {
      setScreen("setup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bio.loading]);

  /* ── actions ─────────────────────────────────────────────── */
  async function triggerAuth() {
    setBusy(true);
    setLocalErr(null);
    const ok = await bio.authenticate();
    setBusy(false);
    if (ok) {
      setScreen("success");
      setTimeout(onVerified, 900);
    } else if (bio.error) {
      setLocalErr(bio.error);
    }
  }

  async function handleRegister() {
    setBusy(true);
    setLocalErr(null);
    const ok = await bio.register();
    setBusy(false);
    if (ok) {
      setScreen("success");
      setTimeout(onVerified, 900);
    } else if (bio.error) {
      setLocalErr(bio.error);
    }
  }

  async function handleSendOtp() {
    setBusy(true);
    setLocalErr(null);
    const res = await bio.sendOtp(email);
    setBusy(false);
    if (res) {
      setOtpHint(res.hint ?? `Code sent to ${email}`);
      setScreen("otp");
    } else {
      setLocalErr(bio.error ?? "Failed to send code");
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) return;
    setBusy(true);
    setLocalErr(null);
    const ok = await bio.verifyOtp(otpCode);
    setBusy(false);
    if (ok) {
      setScreen("success");
      setTimeout(onVerified, 900);
    } else {
      setLocalErr("Incorrect or expired code. Try again.");
    }
  }

  /* ── shared styles ───────────────────────────────────────── */
  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "14px 20px",
    background: busy ? `${gold}60` : gold,
    color: isHost ? "#0e0d0b" : "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 15,
    cursor: busy ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "all 0.15s",
    letterSpacing: "0.02em",
  };

  const btnGhost: React.CSSProperties = {
    width: "100%",
    padding: "12px 20px",
    background: "transparent",
    color: "rgba(245,240,232,0.45)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.15s",
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: card,
          borderRadius: 24,
          border: `1px solid rgba(255,255,255,0.08)`,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: gold }} />

        <div style={{ padding: "36px 32px 32px" }}>
          {/* ── Logo / brand ── */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${gold}18`,
                border: `1px solid ${gold}40`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {screen === "success" ? (
                <CheckCircleIcon
                  style={{ width: 28, height: 28, color: "#22c55e" }}
                />
              ) : screen === "otp" ? (
                <EnvelopeIcon style={{ width: 28, height: 28, color: gold }} />
              ) : (
                <FingerPrintIcon
                  style={{ width: 28, height: 28, color: gold }}
                />
              )}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#f5f0e8",
                letterSpacing: "0.02em",
              }}
            >
              {screen === "setup" && "Set Up Biometric"}
              {screen === "verify" && "Verify Your Identity"}
              {screen === "otp" && "Enter Your Code"}
              {screen === "success" && "Verified!"}
              {screen === "detecting" && "Checking…"}
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "rgba(245,240,232,0.45)",
                lineHeight: 1.5,
              }}
            >
              {screen === "setup" &&
                "Register your fingerprint or Face ID to secure your Eden account."}
              {screen === "verify" && "Use your biometric to complete sign-in."}
              {screen === "otp" && otpHint}
              {screen === "success" && "Taking you to your dashboard…"}
              {screen === "detecting" && "One moment…"}
            </p>
          </div>

          {/* ── Error ── */}
          {(localErr || bio.error) && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <XMarkIcon
                style={{
                  width: 15,
                  height: 15,
                  color: "#f87171",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#f87171",
                  lineHeight: 1.5,
                }}
              >
                {localErr || bio.error}
              </p>
            </div>
          )}

          {/* ── SETUP screen ── */}
          {screen === "setup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: "16px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "rgba(245,240,232,0.55)",
                    lineHeight: 1.6,
                  }}
                >
                  Eden uses your device's built-in biometric (Touch ID, Face ID,
                  Windows Hello) as a required second factor. Your biometric
                  data never leaves your device.
                </p>
              </div>
              <button
                style={btnPrimary}
                onClick={handleRegister}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <ArrowPathIcon
                      style={{
                        width: 18,
                        height: 18,
                        animation: "spin 0.8s linear infinite",
                      }}
                    />{" "}
                    Setting up…
                  </>
                ) : (
                  <>
                    <FingerPrintIcon style={{ width: 18, height: 18 }} /> Set Up
                    Biometric
                  </>
                )}
              </button>
              <button style={btnGhost} onClick={handleSendOtp} disabled={busy}>
                <EnvelopeIcon style={{ width: 15, height: 15 }} />
                Use email code instead
              </button>
              <button
                style={{
                  ...btnGhost,
                  borderColor: "transparent",
                  marginTop: 4,
                }}
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          )}

          {/* ── VERIFY screen ── */}
          {screen === "verify" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button style={btnPrimary} onClick={triggerAuth} disabled={busy}>
                {busy ? (
                  <>
                    <ArrowPathIcon
                      style={{
                        width: 18,
                        height: 18,
                        animation: "spin 0.8s linear infinite",
                      }}
                    />{" "}
                    Waiting for biometric…
                  </>
                ) : (
                  <>
                    <FingerPrintIcon style={{ width: 18, height: 18 }} /> Verify
                    with Biometric
                  </>
                )}
              </button>
              <button style={btnGhost} onClick={handleSendOtp} disabled={busy}>
                <EnvelopeIcon style={{ width: 15, height: 15 }} />
                Use email code instead
              </button>
              <button
                style={{ ...btnGhost, borderColor: "transparent" }}
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          )}

          {/* ── OTP screen ── */}
          {screen === "otp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* 6-digit input */}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${otpCode.length === 6 ? gold : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 12,
                  color: "#f5f0e8",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: 12,
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                autoFocus
              />
              <button
                style={{ ...btnPrimary, opacity: otpCode.length < 6 ? 0.4 : 1 }}
                onClick={handleVerifyOtp}
                disabled={busy || otpCode.length < 6}
              >
                {busy ? (
                  <>
                    <ArrowPathIcon
                      style={{
                        width: 18,
                        height: 18,
                        animation: "spin 0.8s linear infinite",
                      }}
                    />{" "}
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon style={{ width: 18, height: 18 }} /> Verify
                    Code
                  </>
                )}
              </button>
              <button
                style={btnGhost}
                onClick={() => {
                  setOtpCode("");
                  handleSendOtp();
                }}
                disabled={busy}
              >
                Resend code
              </button>
              <button
                style={{ ...btnGhost, borderColor: "transparent" }}
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          )}

          {/* ── SUCCESS screen ── */}
          {screen === "success" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircleIcon
                  style={{ width: 32, height: 32, color: "#22c55e" }}
                />
              </div>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: 14,
                  color: "rgba(245,240,232,0.55)",
                }}
              >
                Identity confirmed. Loading your dashboard…
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
