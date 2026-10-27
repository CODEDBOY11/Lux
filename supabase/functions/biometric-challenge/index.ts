// supabase/functions/biometric-challenge/index.ts
// ─────────────────────────────────────────────────────────────
// Handles all WebAuthn + OTP biometric 2FA operations.
//
// Actions (passed in request body):
//   { action: "register-options", userId }
//       → returns WebAuthn registration options (challenge)
//   { action: "register-verify", userId, credential }
//       → verifies registration, stores passkey
//   { action: "auth-options", userId }
//       → returns WebAuthn authentication options (challenge)
//   { action: "auth-verify", userId, assertion }
//       → verifies assertion, returns { verified: true }
//   { action: "send-otp", userId, email }
//       → sends 6-digit OTP to email
//   { action: "verify-otp", userId, code }
//       → verifies OTP, returns { verified: true }
//
// DEPLOY:
//   supabase functions deploy biometric-challenge
// ─────────────────────────────────────────────────────────────

// @ts-ignore Deno resolves this URL import at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: { env: { get(name: string): string | undefined } };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://lux-d1ok.vercel.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

// ── Crypto helpers ─────────────────────────────────────────────

function randomBase64url(bytes = 32): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlToBuffer(b64: string): ArrayBuffer {
  const b64std = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64std.padEnd(
    b64std.length + ((4 - (b64std.length % 4)) % 4),
    "=",
  );
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

function bufferToBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function readCborHeader(
  bytes: Uint8Array,
  offset: number,
): { majorType: number; value: number; nextOffset: number } {
  if (offset >= bytes.length) throw new Error("Unexpected end of CBOR data");

  const initialByte = bytes[offset];
  const additionalInfo = initialByte & 0x1f;
  let value: number;
  let nextOffset = offset + 1;

  if (additionalInfo < 24) {
    value = additionalInfo;
  } else if (additionalInfo === 24) {
    if (nextOffset >= bytes.length) throw new Error("Invalid CBOR length");
    value = bytes[nextOffset++];
  } else if (additionalInfo === 25) {
    if (nextOffset + 2 > bytes.length) throw new Error("Invalid CBOR length");
    value = (bytes[nextOffset] << 8) | bytes[nextOffset + 1];
    nextOffset += 2;
  } else if (additionalInfo === 26) {
    if (nextOffset + 4 > bytes.length) throw new Error("Invalid CBOR length");
    value =
      bytes[nextOffset] * 0x1000000 +
      (bytes[nextOffset + 1] << 16) +
      (bytes[nextOffset + 2] << 8) +
      bytes[nextOffset + 3];
    nextOffset += 4;
  } else {
    throw new Error("Unsupported CBOR length");
  }

  return {
    majorType: initialByte >> 5,
    value,
    nextOffset,
  };
}

// ── CBOR decode (minimal — just enough for COSE EC2 public keys) ─
// We only need x/y coords from the authenticator data for ES256
function parseCOSEPublicKey(coseBytes: Uint8Array): {
  x: Uint8Array;
  y: Uint8Array;
} {
  const mapHeader = readCborHeader(coseBytes, 0);
  if (mapHeader.majorType !== 5) throw new Error("COSE key must be a map");

  const coordinates = new Map<number, Uint8Array>();
  let offset = mapHeader.nextOffset;

  for (let entry = 0; entry < mapHeader.value; entry++) {
    const keyHeader = readCborHeader(coseBytes, offset);
    if (keyHeader.majorType !== 0 && keyHeader.majorType !== 1)
      throw new Error("Invalid COSE key label");
    const key =
      keyHeader.majorType === 0 ? keyHeader.value : -1 - keyHeader.value;
    offset = keyHeader.nextOffset;

    const valueHeader = readCborHeader(coseBytes, offset);
    offset = valueHeader.nextOffset;

    if (valueHeader.majorType === 2) {
      const end = offset + valueHeader.value;
      if (end > coseBytes.length) throw new Error("Invalid COSE byte string");
      if (key === -2 || key === -3)
        coordinates.set(key, coseBytes.slice(offset, end));
      offset = end;
    } else if (
      valueHeader.majorType === 0 ||
      valueHeader.majorType === 1
    ) {
      // COSE metadata values such as kty, alg, and crv are integers.
    } else {
      throw new Error("Unsupported COSE key value");
    }
  }

  const x = coordinates.get(-2);
  const y = coordinates.get(-3);
  if (!x || !y || x.length !== 32 || y.length !== 32)
    throw new Error("Invalid ES256 public key coordinates");

  return { x, y };
}

// ── Verify ES256 signature ────────────────────────────────────
async function verifyES256(
  publicKeyBase64: string,
  authenticatorData: ArrayBuffer,
  clientDataHash: ArrayBuffer,
  signatureBytes: ArrayBuffer,
): Promise<boolean> {
  try {
    const coseBytes = new Uint8Array(base64urlToBuffer(publicKeyBase64));
    const { x, y } = parseCOSEPublicKey(coseBytes);

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        x: bufferToBase64url(x),
        y: bufferToBase64url(y),
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );

    const sigData = new Uint8Array(
      authenticatorData.byteLength + clientDataHash.byteLength,
    );
    sigData.set(new Uint8Array(authenticatorData), 0);
    sigData.set(new Uint8Array(clientDataHash), authenticatorData.byteLength);

    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      signatureBytes,
      sigData,
    );
  } catch {
    return false;
  }
}

// ── Main handler ───────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { action, userId } = body;
    if (!action || !userId) return fail("action and userId are required");

    // ── register-options ──────────────────────────────────────
    if (action === "register-options") {
      const challenge = randomBase64url(32);

      await admin.from("webauthn_challenges").insert({
        user_id: userId,
        challenge,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      // Fetch existing credentials so authenticator can exclude them
      const { data: existing } = await admin
        .from("passkeys")
        .select("credential_id")
        .eq("user_id", userId);

      const rpId = new URL(APP_URL).hostname;

      return ok({
        challenge,
        rp: { id: rpId, name: "Eden" },
        user: { id: userId, name: userId, displayName: "Eden User" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
        timeout: 60000,
        excludeCredentials: (existing ?? []).map((r) => ({
          type: "public-key",
          id: r.credential_id,
        })),
        authenticatorSelection: {
          authenticatorAttachment: "platform", // built-in biometric only
          userVerification: "required",
          residentKey: "preferred",
        },
        attestation: "none",
      });
    }

    // ── register-verify ───────────────────────────────────────
    if (action === "register-verify") {
      const { credential, deviceName } = body;
      if (!credential) return fail("credential required");

      // Fetch + consume challenge
      const { data: cRow } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cRow) return fail("Challenge expired or not found", 400);
      await admin
        .from("webauthn_challenges")
        .update({ used: true })
        .eq("id", cRow.id);

      // Decode attestation object to get authenticator data
      const attObj = new Uint8Array(
        base64urlToBuffer(credential.response.attestationObject),
      );
      // attestationObject is CBOR: { fmt, attStmt, authData }
      // authData starts at offset that varies — for "none" fmt, after fmt string
      // We find authData by looking for the credentialData flag in authData
      // Simplified: for "none" attestation, extract authData from CBOR manually
      // authData = attObj bytes after CBOR map headers for "authData" key
      // Quick approach: find authData marker in CBOR
      const authDataMarker = new TextEncoder().encode("authData");
      let authDataStart = -1;
      for (let i = 0; i < attObj.length - authDataMarker.length; i++) {
        let match = true;
        for (let j = 0; j < authDataMarker.length; j++) {
          if (attObj[i + j] !== authDataMarker[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          authDataStart = i + authDataMarker.length;
          break;
        }
      }

      if (authDataStart === -1)
        return fail("Could not parse attestation object");

      // After "authData" key: CBOR byte string header then data
      const lenByte = attObj[authDataStart];
      let authDataBytes: Uint8Array;
      if ((lenByte & 0xe0) === 0x40) {
        const len = lenByte & 0x1f;
        authDataBytes = attObj.slice(
          authDataStart + 1,
          authDataStart + 1 + len,
        );
      } else if (lenByte === 0x58) {
        const len = attObj[authDataStart + 1];
        authDataBytes = attObj.slice(
          authDataStart + 2,
          authDataStart + 2 + len,
        );
      } else if (lenByte === 0x59) {
        const len =
          (attObj[authDataStart + 1] << 8) | attObj[authDataStart + 2];
        authDataBytes = attObj.slice(
          authDataStart + 3,
          authDataStart + 3 + len,
        );
      } else {
        return fail("Unexpected authData CBOR encoding");
      }

      // authData layout: rpIdHash(32) + flags(1) + counter(4) + credData
      // credData: aaguid(16) + credIdLen(2) + credId + coseKey
      if (authDataBytes.length < 55) return fail("authData too short");
      const credIdLen = (authDataBytes[53] << 8) | authDataBytes[54];
      const credIdBytes = authDataBytes.slice(55, 55 + credIdLen);
      const coseKeyBytes = authDataBytes.slice(55 + credIdLen);

      const credentialId = bufferToBase64url(credIdBytes);
      const publicKey = bufferToBase64url(coseKeyBytes);

      // Store passkey
      const { error: insertErr } = await admin.from("passkeys").insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        counter: 0,
        device_name: deviceName ?? "Unknown device",
      });

      if (insertErr) return fail(insertErr.message, 500);
      return ok({ registered: true, credentialId });
    }

    // ── auth-options ──────────────────────────────────────────
    if (action === "auth-options") {
      const challenge = randomBase64url(32);

      await admin.from("webauthn_challenges").insert({
        user_id: userId,
        challenge,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      const { data: passkeys } = await admin
        .from("passkeys")
        .select("credential_id")
        .eq("user_id", userId);

      if (!passkeys?.length)
        return fail("No passkeys registered for this user", 404);

      const rpId = new URL(APP_URL).hostname;

      return ok({
        challenge,
        rpId,
        timeout: 60000,
        allowCredentials: passkeys.map((p) => ({
          type: "public-key",
          id: p.credential_id,
        })),
        userVerification: "required",
      });
    }

    // ── auth-verify ───────────────────────────────────────────
    if (action === "auth-verify") {
      const { assertion } = body;
      if (!assertion) return fail("assertion required");

      // Fetch + consume challenge
      const { data: cRow } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cRow) return fail("Challenge expired or not found", 400);
      await admin
        .from("webauthn_challenges")
        .update({ used: true })
        .eq("id", cRow.id);

      // Fetch matching passkey
      const { data: passkey } = await admin
        .from("passkeys")
        .select("*")
        .eq("user_id", userId)
        .eq("credential_id", assertion.id)
        .maybeSingle();

      if (!passkey) return fail("Passkey not found", 404);

      // Verify clientData
      const clientDataJSON = JSON.parse(
        new TextDecoder().decode(
          base64urlToBuffer(assertion.response.clientDataJSON),
        ),
      );
      if (clientDataJSON.type !== "webauthn.get")
        return fail("Invalid clientData type");
      if (clientDataJSON.challenge !== cRow.challenge)
        return fail("Challenge mismatch");

      // Verify signature
      const authDataBuf = base64urlToBuffer(
        assertion.response.authenticatorData,
      );
      const clientDataHash = await crypto.subtle.digest(
        "SHA-256",
        base64urlToBuffer(assertion.response.clientDataJSON),
      );
      const sigBuf = base64urlToBuffer(assertion.response.signature);

      const verified = await verifyES256(
        passkey.public_key,
        authDataBuf,
        clientDataHash,
        sigBuf,
      );
      if (!verified) return fail("Signature verification failed", 401);

      // Update counter
      const authDataBytes = new Uint8Array(authDataBuf);
      const counter =
        (authDataBytes[33] << 24) |
        (authDataBytes[34] << 16) |
        (authDataBytes[35] << 8) |
        authDataBytes[36];
      if (counter <= passkey.counter && passkey.counter > 0) {
        return fail("Counter regression — possible cloned authenticator", 401);
      }
      await admin.from("passkeys").update({ counter }).eq("id", passkey.id);

      return ok({ verified: true });
    }

    // ── send-otp ──────────────────────────────────────────────
    if (action === "send-otp") {
      const { email } = body;
      if (!email) return fail("email required");

      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Invalidate old OTPs
      await admin
        .from("biometric_otps")
        .update({ used: true })
        .eq("user_id", userId)
        .eq("used", false);

      await admin.from("biometric_otps").insert({
        user_id: userId,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      // Send via Supabase Auth email (uses your SMTP config)
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email, // We piggyback on Supabase's email infra
      });

      // Use Supabase's built-in email or send directly via your SMTP
      // For simplicity: use the admin API to send a custom email
      // Supabase doesn't have a raw "send email" API, so we use fetch to
      // a simple email endpoint, or use the invite flow as a workaround.
      // Best practice: set up a Resend / SendGrid key and call their API.
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Eden <noreply@yourdomain.com>",
            to: [email],
            subject: "Your Eden verification code",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#C9A96E">Eden Security Code</h2>
                <p>Your one-time verification code is:</p>
                <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0e0d0b;
                  background:#f5f0e8;padding:20px;border-radius:12px;text-align:center">
                  ${code}
                </div>
                <p style="color:#888;font-size:13px;margin-top:16px">
                  This code expires in 10 minutes. Do not share it with anyone.
                </p>
              </div>
            `,
          }),
        });
      }
      // If no RESEND_API_KEY, code is still stored — for dev you can read it from DB

      return ok({
        sent: true,
        hint: `Code sent to ${email.replace(/(.{2}).+(@.+)/, "$1***$2")}`,
      });
    }

    // ── verify-otp ────────────────────────────────────────────
    if (action === "verify-otp") {
      const { code } = body;
      if (!code) return fail("code required");

      const { data: otp } = await admin
        .from("biometric_otps")
        .select("*")
        .eq("user_id", userId)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!otp) return fail("Invalid or expired code", 401);
      await admin
        .from("biometric_otps")
        .update({ used: true })
        .eq("id", otp.id);

      return ok({ verified: true });
    }

    return fail(`Unknown action: ${action}`, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("biometric-challenge error:", msg);
    return fail(msg, 500);
  }
});
