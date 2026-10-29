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

import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function bufferToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function ecdsaSignatureToP1363(signature: ArrayBuffer): Uint8Array {
  const der = new Uint8Array(signature);
  if (der.length === 64) return der;
  if (der.length < 8 || der[0] !== 0x30 || der[1] !== der.length - 2)
    throw new Error("Invalid ECDSA signature encoding");

  const readInteger = (offset: number): {
    value: Uint8Array;
    nextOffset: number;
  } => {
    if (der[offset] !== 0x02) throw new Error("Invalid ECDSA signature integer");
    const length = der[offset + 1];
    const endOffset = offset + 2 + length;
    if (!length || endOffset > der.length)
      throw new Error("Truncated ECDSA signature integer");
    let start = offset + 2;
    while (start < endOffset - 32 && der[start] === 0) start++;
    const value = der.slice(start, endOffset);
    if (value.length > 32) throw new Error("ECDSA signature integer is too large");
    return { value, nextOffset: endOffset };
  };

  const r = readInteger(2);
  const s = readInteger(r.nextOffset);
  if (s.nextOffset !== der.length)
    throw new Error("Invalid ECDSA signature length");

  const p1363 = new Uint8Array(64);
  p1363.set(r.value, 32 - r.value.length);
  p1363.set(s.value, 64 - s.value.length);
  return p1363;
}

type CborHead = {
  majorType: number;
  value: number;
  nextOffset: number;
};

function readCborHead(bytes: Uint8Array, offset: number): CborHead {
  if (offset >= bytes.length) throw new Error("Truncated CBOR item");

  const initial = bytes[offset];
  const additionalInfo = initial & 0x1f;
  let value: number;
  let nextOffset = offset + 1;

  if (additionalInfo <= 23) {
    value = additionalInfo;
  } else {
    const byteLength =
      additionalInfo === 24 ? 1 :
      additionalInfo === 25 ? 2 :
      additionalInfo === 26 ? 4 :
      additionalInfo === 27 ? 8 :
      0;
    if (!byteLength || nextOffset + byteLength > bytes.length)
      throw new Error("Invalid or truncated CBOR length");

    value = 0;
    for (let i = 0; i < byteLength; i++)
      value = value * 256 + bytes[nextOffset + i];
    nextOffset += byteLength;
    if (!Number.isSafeInteger(value)) throw new Error("CBOR value is too large");
  }

  return { majorType: initial >> 5, value, nextOffset };
}

function skipCborValue(bytes: Uint8Array, offset: number, depth = 0): number {
  if (depth > 32) throw new Error("CBOR nesting is too deep");

  const head = readCborHead(bytes, offset);
  let nextOffset = head.nextOffset;

  if (head.majorType === 2 || head.majorType === 3) {
    nextOffset += head.value;
    if (nextOffset > bytes.length) throw new Error("Truncated CBOR data");
    return nextOffset;
  }
  if (head.majorType === 4 || head.majorType === 5) {
    const itemCount = head.majorType === 5 ? head.value * 2 : head.value;
    for (let i = 0; i < itemCount; i++)
      nextOffset = skipCborValue(bytes, nextOffset, depth + 1);
    return nextOffset;
  }
  if (head.majorType === 6)
    return skipCborValue(bytes, nextOffset, depth + 1);
  return nextOffset;
}

function decodeCborInteger(bytes: Uint8Array, offset: number): {
  value: number;
  nextOffset: number;
} {
  const head = readCborHead(bytes, offset);
  if (head.majorType !== 0 && head.majorType !== 1)
    throw new Error("Expected CBOR integer");
  return {
    value: head.majorType === 0 ? head.value : -1 - head.value,
    nextOffset: head.nextOffset,
  };
}

function parseCOSEKey(coseBytes: Uint8Array): {
  algorithm: number;
  values: Map<number, number | Uint8Array>;
  endOffset: number;
} {
  const head = readCborHead(coseBytes, 0);
  if (head.majorType !== 5) throw new Error("COSE key must be a CBOR map");

  const values = new Map<number, number | Uint8Array>();
  let offset = head.nextOffset;
  for (let i = 0; i < head.value; i++) {
    const key = decodeCborInteger(coseBytes, offset);
    offset = key.nextOffset;
    const valueHead = readCborHead(coseBytes, offset);

    if (valueHead.majorType === 0 || valueHead.majorType === 1) {
      const value = decodeCborInteger(coseBytes, offset);
      values.set(key.value, value.value);
      offset = value.nextOffset;
    } else if (valueHead.majorType === 2) {
      const endOffset = valueHead.nextOffset + valueHead.value;
      if (endOffset > coseBytes.length) throw new Error("Truncated COSE key");
      values.set(key.value, coseBytes.slice(valueHead.nextOffset, endOffset));
      offset = endOffset;
    } else {
      offset = skipCborValue(coseBytes, offset);
    }
  }

  const algorithm = values.get(3);
  if (typeof algorithm !== "number" || (algorithm !== -7 && algorithm !== -257))
    throw new Error("Unsupported COSE algorithm");
  return { algorithm, values, endOffset: offset };
}

// ── Extract authData from CBOR attestationObject ─────────────
// Scans for the UTF-8 string "authData" as a CBOR map key, then
// reads the byte string that follows. Works for "none", "packed",
// and "fido-u2f" attestation formats without a full CBOR library.
function extractAuthData(attObj: Uint8Array): Uint8Array | null {
  const key = new TextEncoder().encode("authData");
  for (let i = 0; i < attObj.length - key.length - 1; i++) {
    // Match the key bytes
    let match = true;
    for (let j = 0; j < key.length; j++) {
      if (attObj[i + j] !== key[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;

    // The byte before the key string is a CBOR text-string header.
    // e.g. 0x68 = text(8) for "authData" (8 chars).
    // Confirm the preceding byte encodes a text string of length key.length.
    const headerByte = attObj[i - 1];
    const expectedHeader = 0x60 | key.length; // major type 3, length
    if (headerByte !== expectedHeader) continue;

    // Value starts right after the key
    let pos = i + key.length;
    if (pos >= attObj.length) continue;

    try {
      const dataHead = readCborHead(attObj, pos);
      if (dataHead.majorType !== 2) continue;
      const endOffset = dataHead.nextOffset + dataHead.value;
      if (endOffset > attObj.length) continue;
      return attObj.slice(dataHead.nextOffset, endOffset);
    } catch {
      continue;
    }
  }
  return null;
}

// ── Verify signature (ES256 or RS256) ────────────────────────
async function verifySignature(
  publicKeyBase64: string,
  authenticatorData: ArrayBuffer,
  clientDataHash: ArrayBuffer,
  signatureBytes: ArrayBuffer,
): Promise<boolean> {
  try {
    const coseBytes = new Uint8Array(base64urlToBuffer(publicKeyBase64));
    const { algorithm, values } = parseCOSEKey(coseBytes);

    const sigData = new Uint8Array(
      authenticatorData.byteLength + clientDataHash.byteLength,
    );
    sigData.set(new Uint8Array(authenticatorData), 0);
    sigData.set(new Uint8Array(clientDataHash), authenticatorData.byteLength);

    if (algorithm === -257) {
      // RS256 — Windows Hello, some Android devices
      const n = values.get(-1);
      const e = values.get(-2);
      if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array))
        return false;
      const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        {
          kty: "RSA",
          alg: "RS256",
          ext: true,
          n: bufferToBase64url(n),
          e: bufferToBase64url(e),
        },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      );
      return await crypto.subtle.verify(
        { name: "RSASSA-PKCS1-v1_5" },
        cryptoKey,
        signatureBytes,
        sigData,
      );
    } else {
      // ES256 — most platform authenticators
      const x = values.get(-2);
      const y = values.get(-3);
      if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array))
        return false;
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
      return await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        cryptoKey,
        ecdsaSignatureToP1363(signatureBytes),
        sigData,
      );
    }
  } catch {
    return false;
  }
}

// ── Main handler ───────────────────────────────────────────────

serve(async (req) => {
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
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256 (required by some devices)
        ],
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
      // credential.id  = base64url credential ID (from browser PublicKeyCredential.id)
      // credential.response.attestationObject = base64url CBOR
      // credential.response.clientDataJSON    = base64url JSON

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

      // Verify clientData
      let clientData: { type: string; challenge: string; origin: string };
      try {
        clientData = JSON.parse(
          new TextDecoder().decode(
            base64urlToBuffer(credential.response.clientDataJSON),
          ),
        );
      } catch {
        return fail("Could not parse clientDataJSON");
      }
      if (clientData.type !== "webauthn.create")
        return fail("Invalid clientData type");
      if (clientData.challenge !== cRow.challenge)
        return fail("Challenge mismatch");

      // Extract authData from attestation object (CBOR)
      // We find the authData byte string by scanning for its CBOR key "authData"
      const attObj = new Uint8Array(
        base64urlToBuffer(credential.response.attestationObject),
      );
      const authDataBytes = extractAuthData(attObj);
      if (!authDataBytes)
        return fail("Could not extract authData from attestation object");

      // authData layout:
      //   rpIdHash (32) | flags (1) | signCount (4) | attData if AT flag set
      //   attData: aaguid (16) | credIdLen (2, big-endian) | credId | coseKey
      if (authDataBytes.length < 37) return fail("authData too short");

      const flags = authDataBytes[32];
      const AT_FLAG = 0x40; // attested credential data included
      if (!(flags & AT_FLAG))
        return fail("Attested credential data not present in authData");

      if (authDataBytes.length < 55)
        return fail("authData missing credential data");
      const credIdLen = (authDataBytes[53] << 8) | authDataBytes[54];
      if (authDataBytes.length < 55 + credIdLen)
        return fail("authData truncated");

      const credIdBytes = authDataBytes.slice(55, 55 + credIdLen);
      const coseKeyAndExtensions = authDataBytes.slice(55 + credIdLen);
      let coseKeyBytes: Uint8Array;
      try {
        const parsedKey = parseCOSEKey(coseKeyAndExtensions);
        const requiredKeyParts =
          parsedKey.algorithm === -257
            ? [parsedKey.values.get(-1), parsedKey.values.get(-2)]
            : [parsedKey.values.get(-2), parsedKey.values.get(-3)];
        if (!requiredKeyParts.every((part) => part instanceof Uint8Array))
          return fail("COSE public key is missing required parameters");
        coseKeyBytes = coseKeyAndExtensions.slice(0, parsedKey.endOffset);
      } catch {
        return fail("Could not parse COSE public key from authData");
      }

      // The credential ID from authData should match what the browser reported
      const credentialIdFromAuthData = bufferToBase64url(credIdBytes);
      // Use browser-provided id as primary (more reliable on some platforms)
      const credentialId = credential.id ?? credentialIdFromAuthData;
      const publicKey = bufferToBase64url(coseKeyBytes);

      if (!publicKey)
        return fail("Could not extract public key from authData");

      // Store passkey
      const { error: insertErr } = await admin.from("passkeys").insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        counter: 0,
        device_name: deviceName ?? "Unknown device",
      });

      if (insertErr) {
        // Unique constraint — credential already registered
        if (insertErr.code === "23505")
          return ok({ registered: true, credentialId, duplicate: true });
        return fail(insertErr.message, 500);
      }
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

      const verified = await verifySignature(
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
