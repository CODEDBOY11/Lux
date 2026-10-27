/**
 * useBiometric.ts
 *
 * React hook that wraps all WebAuthn operations for Eden's biometric 2FA.
 * Uses the `biometric-challenge` edge function for server-side challenge
 * generation and verification.
 *
 * Usage:
 *   const bio = useBiometric(userId);
 *   await bio.register();          // first-time setup
 *   await bio.authenticate();      // verify on login
 *   await bio.sendOtp(email);      // fallback: send email code
 *   await bio.verifyOtp(code);     // fallback: verify email code
 *   bio.isSupported                // boolean
 *   bio.hasPasskey                 // boolean (loaded on mount)
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./index";

/* ── Types ─────────────────────────────────────────────────── */
export interface BiometricState {
  isSupported: boolean;
  hasPasskey: boolean;
  loading: boolean;
  error: string | null;
}

export interface UseBiometricReturn extends BiometricState {
  register: (deviceName?: string) => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  sendOtp: (email: string) => Promise<{ hint: string } | null>;
  verifyOtp: (code: string) => Promise<boolean>;
}

/* ── Helpers ───────────────────────────────────────────────── */
function base64urlToBuffer(b64: string): ArrayBuffer {
  const b64std = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64std.padEnd(
    b64std.length + ((4 - (b64std.length % 4)) % 4),
    "=",
  );
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

function bufferToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === "function"
  );
}

async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function callBiometric(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(
    "biometric-challenge",
    { body },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.data ?? data;
}

/* ── Hook ──────────────────────────────────────────────────── */
export function useBiometric(userId: string): UseBiometricReturn {
  const [state, setState] = useState<BiometricState>({
    isSupported: false,
    hasPasskey: false,
    loading: true,
    error: null,
  });

  /* Check support + existing passkey on mount */
  useEffect(() => {
    if (!userId) return;

    (async () => {
      const supported =
        isBiometricSupported() && (await isPlatformAuthenticatorAvailable());

      // Check if user already has a registered passkey
      const { data } = await supabase
        .from("passkeys")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      setState({
        isSupported: supported,
        hasPasskey: (data?.length ?? 0) > 0,
        loading: false,
        error: null,
      });
    })();
  }, [userId]);

  const setError = (error: string | null) => setState((s) => ({ ...s, error }));

  /* ── Register ─────────────────────────────────────────────── */
  const register = useCallback(
    async (deviceName?: string): Promise<boolean> => {
      setError(null);
      try {
        // 1. Get registration options from server
        const options = await callBiometric({
          action: "register-options",
          userId,
        });

        // 2. Convert challenge to ArrayBuffer
        const createOptions: PublicKeyCredentialCreationOptions = {
          ...options,
          challenge: base64urlToBuffer(options.challenge),
          user: {
            id: new TextEncoder().encode(userId),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          excludeCredentials: (options.excludeCredentials ?? []).map(
            (c: { type: string; id: string }) => ({
              type: c.type as PublicKeyCredentialType,
              id: base64urlToBuffer(c.id),
            }),
          ),
        };

        // 3. Prompt biometric on device
        const credential = (await navigator.credentials.create({
          publicKey: createOptions,
        })) as PublicKeyCredential;

        if (!credential) throw new Error("No credential returned");

        const response =
          credential.response as AuthenticatorAttestationResponse;

        // 4. Send to server for verification + storage
        await callBiometric({
          action: "register-verify",
          userId,
          deviceName: deviceName ?? getBrowserLabel(),
          credential: {
            id: credential.id,
            type: credential.type,
            response: {
              attestationObject: bufferToBase64url(response.attestationObject),
              clientDataJSON: bufferToBase64url(response.clientDataJSON),
            },
          },
        });

        setState((s) => ({ ...s, hasPasskey: true }));
        return true;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Biometric registration failed";
        // User cancelled — don't treat as error
        if (msg.includes("NotAllowedError") || msg.includes("cancelled"))
          return false;
        setError(msg);
        return false;
      }
    },
    [userId],
  );

  /* ── Authenticate ─────────────────────────────────────────── */
  const authenticate = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      // 1. Get auth options (challenge + allowed credentials)
      const options = await callBiometric({ action: "auth-options", userId });

      const getOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(options.challenge),
        rpId: options.rpId,
        timeout: options.timeout ?? 60000,
        userVerification: "required",
        allowCredentials: (options.allowCredentials ?? []).map(
          (c: { type: string; id: string }) => ({
            type: c.type as PublicKeyCredentialType,
            id: base64urlToBuffer(c.id),
          }),
        ),
      };

      // 2. Prompt biometric
      const assertion = (await navigator.credentials.get({
        publicKey: getOptions,
      })) as PublicKeyCredential;

      if (!assertion) throw new Error("No assertion returned");

      const response = assertion.response as AuthenticatorAssertionResponse;

      // 3. Verify on server
      await callBiometric({
        action: "auth-verify",
        userId,
        assertion: {
          id: assertion.id,
          type: assertion.type,
          response: {
            authenticatorData: bufferToBase64url(response.authenticatorData),
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            signature: bufferToBase64url(response.signature),
          },
        },
      });

      return true;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Biometric verification failed";
      if (msg.includes("NotAllowedError") || msg.includes("cancelled"))
        return false;
      setError(msg);
      return false;
    }
  }, [userId]);

  /* ── Send OTP ─────────────────────────────────────────────── */
  const sendOtp = useCallback(
    async (email: string): Promise<{ hint: string } | null> => {
      setError(null);
      try {
        const res = await callBiometric({ action: "send-otp", userId, email });
        return res;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send OTP");
        return null;
      }
    },
    [userId],
  );

  /* ── Verify OTP ───────────────────────────────────────────── */
  const verifyOtp = useCallback(
    async (code: string): Promise<boolean> => {
      setError(null);
      try {
        await callBiometric({ action: "verify-otp", userId, code });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid code");
        return false;
      }
    },
    [userId],
  );

  return { ...state, register, authenticate, sendOtp, verifyOtp };
}

/* ── Detect device label ──────────────────────────────────── */
function getBrowserLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Unknown device";
}
