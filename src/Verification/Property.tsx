/**
 * PropertyVerificationForm.tsx
 * Simplified: video verification only (required)
 */

import { useState, useRef } from "react";
import {
  ShieldCheckIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { useAuth } from "../AuthContext";
import { VerificationDB } from "../index";

export default function PropertyVerificationForm({
  listingId,
  onComplete,
}: {
  listingId: string;
  onComplete?: () => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [hostNotes, setHostNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const handleFile = async (f: File) => {
    if (!user) return;
    setFile(f);
    setUrl("");
    setUploadError("");
    setUploading(true);
    try {
      const uploaded = await VerificationDB.uploadFile(
        user.id,
        listingId,
        f,
        "video",
      );
      setUrl(uploaded);
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed. Please try again.");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!user || !url) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await VerificationDB.submit({
        listingId,
        hostId: user.id,
        videoUrl: url,
        hostNotes: hostNotes.trim() || undefined,
      });
      setDone(true);
      onComplete?.();
    } catch (err: any) {
      setSubmitError(err.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Done screen ── */
  if (done) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={styles.iconRing}>
            <CheckCircleIcon
              style={{ width: 36, height: 36, color: "#C9A96E" }}
            />
          </div>
          <p style={styles.eyebrow}>Submitted</p>
          <h2 style={styles.heading}>Verification Pending</h2>
          <p style={styles.body}>
            Our team will review your video within{" "}
            <strong style={{ color: "#f5f0e8" }}>24–48 hours</strong>. You'll be
            notified by email once your property is approved and live.
          </p>
          <div style={styles.infoBox}>
            🔒 Your video is encrypted and stored securely.
            <br />
            It is only used to verify your property.
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        textarea::placeholder { color: rgba(245,240,232,0.2); }
      `}</style>

      {/* Sticky header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <ShieldCheckIcon
            style={{ width: 18, height: 18, color: "#C9A96E" }}
          />
        </div>
        <div>
          <p style={styles.eyebrow}>Property Verification</p>
          <p style={{ fontSize: 12, color: "rgba(245,240,232,0.35)" }}>
            Upload a walkthrough video to go live
          </p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Intro */}
        <div style={styles.infoBox}>
          <strong style={{ color: "#f5f0e8" }}>
            Why we verify properties.
          </strong>{" "}
          A short walkthrough video helps us confirm the property is real and
          matches your listing. Review typically takes 24–48 hours.
        </div>

        {/* Video upload card */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ ...styles.headerIcon, width: 36, height: 36 }}>
              <VideoCameraIcon
                style={{ width: 18, height: 18, color: "#C9A96E" }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#f5f0e8",
                  marginBottom: 2,
                }}
              >
                Walkthrough Video
              </p>
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.38)" }}>
                MP4 or MOV — walk through every room of the property
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#C9A96E" : url ? "rgba(201,169,110,0.4)" : "rgba(245,240,232,0.12)"}`,
              borderRadius: 16,
              padding: "32px 20px",
              cursor: file ? "default" : "pointer",
              background: dragging
                ? "rgba(201,169,110,0.06)"
                : url
                  ? "rgba(201,169,110,0.04)"
                  : "rgba(245,240,232,0.02)",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              textAlign: "center",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".mp4,.mov"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: url
                  ? "rgba(201,169,110,0.12)"
                  : "rgba(245,240,232,0.06)",
                border: `1px solid ${url ? "rgba(201,169,110,0.25)" : "rgba(245,240,232,0.1)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid rgba(201,169,110,0.3)",
                    borderTopColor: "#C9A96E",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
              ) : url ? (
                <CheckCircleSolid
                  style={{ width: 24, height: 24, color: "#C9A96E" }}
                />
              ) : (
                <VideoCameraIcon
                  style={{
                    width: 22,
                    height: 22,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              )}
            </div>

            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: url ? "#C9A96E" : "#f5f0e8",
                  marginBottom: 4,
                }}
              >
                {uploading
                  ? "Uploading…"
                  : url
                    ? file?.name
                    : "Drag & drop or click to upload"}
              </p>
              {!url && !uploading && (
                <p style={{ fontSize: 12, color: "rgba(245,240,232,0.3)" }}>
                  MP4 or MOV format
                </p>
              )}
              {url && (
                <p style={{ fontSize: 12, color: "rgba(201,169,110,0.6)" }}>
                  Upload complete ✓
                </p>
              )}
            </div>

            {/* Remove button */}
            {file && !uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setUrl("");
                  setUploadError("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                style={{
                  marginTop: 4,
                  background: "rgba(220,60,60,0.1)",
                  border: "1px solid rgba(220,60,60,0.25)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  color: "#e07070",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <XMarkIcon style={{ width: 12, height: 12 }} />
                Remove
              </button>
            )}
          </div>

          {uploadError && (
            <p
              style={{
                fontSize: 12,
                color: "#e07070",
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ExclamationTriangleIcon style={{ width: 13, height: 13 }} />
              {uploadError}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={styles.label}>Additional Notes (optional)</label>
          <textarea
            value={hostNotes}
            onChange={(e) => setHostNotes(e.target.value)}
            rows={3}
            placeholder="Anything you'd like to tell our review team…"
            style={styles.textarea}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(245,240,232,0.1)")
            }
          />
        </div>

        {/* Submit error */}
        {submitError && (
          <div style={styles.errorBox}>
            <ExclamationTriangleIcon
              style={{ width: 16, height: 16, flexShrink: 0 }}
            />
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !url}
          style={{
            width: "100%",
            background: url ? "#C9A96E" : "rgba(201,169,110,0.2)",
            color: url ? "#0e0d0b" : "rgba(14,13,11,0.4)",
            fontWeight: 700,
            fontSize: 14,
            padding: "17px 0",
            borderRadius: 14,
            border: "none",
            cursor: url && !submitting ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "0.04em",
            transition: "all 0.2s",
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(0,0,0,0.2)",
                  borderTopColor: "#0e0d0b",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
              Submitting…
            </>
          ) : (
            <>
              <ShieldCheckIcon style={{ width: 17, height: 17 }} />
              Submit for Verification
            </>
          )}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(245,240,232,0.2)",
            lineHeight: 1.7,
          }}
        >
          Your video is encrypted and stored securely.
          <br />
          It is only used to verify your property and never shared publicly.
        </p>
      </div>
    </div>
  );
}

/* ── Shared styles ── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0e0d0b",
    color: "#f5f0e8",
    fontFamily: "sans-serif",
  } as React.CSSProperties,

  header: {
    borderBottom: "1px solid rgba(245,240,232,0.07)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    position: "sticky",
    top: 0,
    background: "rgba(14,13,11,0.97)",
    backdropFilter: "blur(12px)",
    zIndex: 10,
  } as React.CSSProperties,

  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(201,169,110,0.1)",
    border: "1px solid rgba(201,169,110,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "32px 24px 80px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
    animation: "fadeUp 0.4s ease both",
  } as React.CSSProperties,

  card: {
    background: "rgba(245,240,232,0.03)",
    border: "1px solid rgba(245,240,232,0.08)",
    borderRadius: 20,
    padding: 24,
  } as React.CSSProperties,

  infoBox: {
    background: "rgba(201,169,110,0.05)",
    border: "1px solid rgba(201,169,110,0.15)",
    borderRadius: 16,
    padding: "16px 20px",
    fontSize: 13,
    color: "rgba(245,240,232,0.5)",
    lineHeight: 1.7,
  } as React.CSSProperties,

  iconRing: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(201,169,110,0.1)",
    border: "2px solid rgba(201,169,110,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  } as React.CSSProperties,

  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.22em",
    color: "#C9A96E",
    textTransform: "uppercase",
    marginBottom: 10,
  } as React.CSSProperties,

  heading: {
    fontFamily: "Cormorant Garamond, serif",
    fontSize: 30,
    fontWeight: 600,
    color: "#f5f0e8",
    marginBottom: 14,
  } as React.CSSProperties,

  body: {
    fontSize: 13,
    color: "rgba(245,240,232,0.45)",
    lineHeight: 1.8,
    marginBottom: 28,
  } as React.CSSProperties,

  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "rgba(245,240,232,0.35)",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 8,
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    background: "rgba(245,240,232,0.04)",
    border: "1px solid rgba(245,240,232,0.1)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 13,
    color: "#f5f0e8",
    outline: "none",
    resize: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  } as React.CSSProperties,

  errorBox: {
    background: "rgba(220,60,60,0.1)",
    border: "1px solid rgba(220,60,60,0.28)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    color: "#e07070",
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as React.CSSProperties,
};
