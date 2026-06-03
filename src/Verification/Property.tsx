/**
 * PropertyVerificationForm.tsx
 *
 * Shown to a host after they create a new listing (or when they
 * click "Submit for Verification" from their dashboard).
 *
 * USAGE:
 *   <PropertyVerificationForm
 *     listingId={listing.id}
 *     onComplete={() => router.push("/dashboard")}
 *   />
 */

import { useState, useRef } from "react";
import {
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { useAuth } from "../AuthContext";
import { VerificationDB } from "../index";

/* ─────────────── helpers ─────────────── */

const ACCEPTED_DOCS = ".pdf,.jpg,.jpeg,.png,.webp";
const ACCEPTED_MEDIA = ".jpg,.jpeg,.png,.webp,.mp4,.mov";
const MAX_PHOTOS = 10;

type UploadState = {
  file: File | null;
  url: string;
  uploading: boolean;
  error: string;
};

const emptyUpload = (): UploadState => ({
  file: null,
  url: "",
  uploading: false,
  error: "",
});

/* ─────────────── File Drop Zone ─────────────── */
function DropZone({
  label,
  hint,
  accept,
  icon,
  state,
  onChange,
  multiple,
}: {
  label: string;
  hint: string;
  accept: string;
  icon: React.ReactNode;
  state: UploadState | UploadState[];
  onChange: (files: FileList) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isArray = Array.isArray(state);
  const hasFile = isArray
    ? (state as UploadState[]).some((s) => s.file)
    : !!(state as UploadState).file;
  const isUploading = isArray
    ? (state as UploadState[]).some((s) => s.uploading)
    : (state as UploadState).uploading;
  const error = isArray
    ? (state as UploadState[]).find((s) => s.error)?.error
    : (state as UploadState).error;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) onChange(e.dataTransfer.files);
        }}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#C9A96E" : hasFile ? "rgba(201,169,110,0.4)" : "rgba(245,240,232,0.12)"}`,
          borderRadius: 16,
          padding: "22px 20px",
          cursor: "pointer",
          background: dragging
            ? "rgba(201,169,110,0.06)"
            : hasFile
              ? "rgba(201,169,110,0.04)"
              : "rgba(245,240,232,0.02)",
          transition: "all 0.2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={(e) => e.target.files && onChange(e.target.files)}
        />

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: hasFile
              ? "rgba(201,169,110,0.12)"
              : "rgba(245,240,232,0.06)",
            border: `1px solid ${hasFile ? "rgba(201,169,110,0.25)" : "rgba(245,240,232,0.1)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUploading ? (
            <span
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(201,169,110,0.3)",
                borderTopColor: "#C9A96E",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block",
              }}
            />
          ) : hasFile ? (
            <CheckCircleSolid
              style={{ width: 22, height: 22, color: "#C9A96E" }}
            />
          ) : (
            icon
          )}
        </div>

        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: hasFile ? "#C9A96E" : "#f5f0e8",
              marginBottom: 3,
            }}
          >
            {isUploading
              ? "Uploading…"
              : hasFile
                ? isArray
                  ? `${(state as UploadState[]).filter((s) => s.file).length} file(s) selected`
                  : (state as UploadState).file!.name
                : label}
          </p>
          <p style={{ fontSize: 11, color: "rgba(245,240,232,0.3)" }}>{hint}</p>
        </div>
      </div>

      {error && (
        <p
          style={{
            fontSize: 11,
            color: "#e07070",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ExclamationTriangleIcon style={{ width: 12, height: 12 }} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────── Gate header ─────────────── */
function GateHeader({
  number,
  title,
  subtitle,
  done,
}: {
  number: string;
  title: string;
  subtitle: string;
  done: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: done ? "#C9A96E" : "rgba(201,169,110,0.1)",
          border: `2px solid ${done ? "#C9A96E" : "rgba(201,169,110,0.25)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.3s",
        }}
      >
        {done ? (
          <CheckCircleSolid
            style={{ width: 18, height: 18, color: "#0e0d0b" }}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 800, color: "#C9A96E" }}>
            {number}
          </span>
        )}
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
          {title}
        </p>
        <p style={{ fontSize: 12, color: "rgba(245,240,232,0.38)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */

export default function PropertyVerificationForm({
  listingId,
  onComplete,
}: {
  listingId: string;
  onComplete?: () => void;
}) {
  const { user } = useAuth();

  // Gate 1
  const [hostIdDoc, setHostIdDoc] = useState<UploadState>(emptyUpload());
  const [hostSelfie, setHostSelfie] = useState<UploadState>(emptyUpload());

  // Gate 2
  const [ownershipDoc, setOwnershipDoc] = useState<UploadState>(emptyUpload());
  const [utilityBill, setUtilityBill] = useState<UploadState>(emptyUpload());

  // Gate 3
  const [photos, setPhotos] = useState<UploadState[]>([]);
  const [video, setVideo] = useState<UploadState>(emptyUpload());

  // Misc
  const [hostNotes, setHostNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  /* ── upload single file ── */
  const uploadSingle = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<UploadState>>,
    category: Parameters<typeof VerificationDB.uploadFile>[3],
  ) => {
    if (!user) return;
    setter((s) => ({ ...s, file, uploading: true, error: "" }));
    try {
      const url = await VerificationDB.uploadFile(
        user.id,
        listingId,
        file,
        category,
      );
      setter((s) => ({ ...s, url, uploading: false }));
    } catch (err: any) {
      setter((s) => ({
        ...s,
        uploading: false,
        error: err.message ?? "Upload failed",
      }));
    }
  };

  /* ── upload multiple photos ── */
  const uploadPhotos = async (files: FileList) => {
    if (!user) return;
    const newStates: UploadState[] = Array.from(files).map((f) => ({
      file: f,
      url: "",
      uploading: true,
      error: "",
    }));
    setPhotos((prev) => {
      const combined = [...prev, ...newStates].slice(0, MAX_PHOTOS);
      return combined;
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await VerificationDB.uploadFile(
          user.id,
          listingId,
          file,
          "photo",
        );
        setPhotos((prev) =>
          prev.map((s) =>
            s.file === file ? { ...s, url, uploading: false } : s,
          ),
        );
      } catch (err: any) {
        setPhotos((prev) =>
          prev.map((s) =>
            s.file === file
              ? {
                  ...s,
                  uploading: false,
                  error: err.message ?? "Upload failed",
                }
              : s,
          ),
        );
      }
    }
  };

  /* ── gate completion checks ── */
  const gate1Done = !!hostIdDoc.url && !!hostSelfie.url;
  const gate2Done = !!ownershipDoc.url && !!utilityBill.url;
  const gate3Done = photos.filter((p) => !!p.url).length >= 3; // min 3 photos

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!user) return;
    if (!gate1Done || !gate2Done || !gate3Done) {
      setSubmitError("Please complete all three gates before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await VerificationDB.submit({
        listingId,
        hostId: user.id,
        hostIdDocUrl: hostIdDoc.url,
        hostSelfieUrl: hostSelfie.url,
        ownershipDocUrl: ownershipDoc.url,
        utilityBillUrl: utilityBill.url,
        photoUrls: photos.filter((p) => !!p.url).map((p) => p.url),
        videoUrl: video.url || undefined,
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

  /* ─────── Done screen ─────── */
  if (done) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0d0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(201,169,110,0.1)",
              border: "2px solid rgba(201,169,110,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <CheckCircleIcon
              style={{ width: 36, height: 36, color: "#C9A96E" }}
            />
          </div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "#C9A96E",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Submitted
          </p>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 30,
              fontWeight: 600,
              color: "#f5f0e8",
              marginBottom: 14,
            }}
          >
            Verification Pending
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(245,240,232,0.45)",
              lineHeight: 1.8,
              marginBottom: 28,
            }}
          >
            Our team will review your documents within{" "}
            <strong style={{ color: "#f5f0e8" }}>24–48 hours</strong>. You'll be
            notified by email once your property is approved and live.
          </p>
          <div
            style={{
              background: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.18)",
              borderRadius: 14,
              padding: "14px 20px",
              fontSize: 13,
              color: "rgba(245,240,232,0.5)",
              lineHeight: 1.7,
            }}
          >
            🔒 All documents are encrypted and stored securely.
            <br />
            They are only used to verify your property.
          </div>
        </div>
      </div>
    );
  }

  /* ─────── Main form ─────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#f5f0e8",
        fontFamily: "sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        textarea::placeholder, input::placeholder { color: rgba(245,240,232,0.2); }
      `}</style>

      {/* Header */}
      <div
        style={{
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
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(201,169,110,0.1)",
            border: "1px solid rgba(201,169,110,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheckIcon
            style={{ width: 18, height: 18, color: "#C9A96E" }}
          />
        </div>
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#C9A96E",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Property Verification
          </p>
          <p style={{ fontSize: 12, color: "rgba(245,240,232,0.35)" }}>
            Complete all three gates to go live
          </p>
        </div>

        {/* Progress pills */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
          }}
        >
          {[gate1Done, gate2Done, gate3Done].map((done, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 6,
                borderRadius: 99,
                background: done ? "#C9A96E" : "rgba(245,240,232,0.1)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "32px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          animation: "fadeUp 0.4s ease both",
        }}
      >
        {/* Intro */}
        <div
          style={{
            background: "rgba(201,169,110,0.05)",
            border: "1px solid rgba(201,169,110,0.15)",
            borderRadius: 16,
            padding: "16px 20px",
            fontSize: 13,
            color: "rgba(245,240,232,0.5)",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#f5f0e8" }}>
            Why we verify properties.
          </strong>{" "}
          To protect guests and maintain trust on the platform, every listing
          must pass a three-gate verification before going live. This typically
          takes 24–48 hours.
        </div>

        {/* ════ GATE 1 ════ */}
        <div
          style={{
            background: "rgba(245,240,232,0.03)",
            border: "1px solid rgba(245,240,232,0.08)",
            borderRadius: 20,
            padding: "24px",
          }}
        >
          <GateHeader
            number="1"
            title="Host Identity"
            subtitle="Prove you are who you say you are"
            done={gate1Done}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <DropZone
              label="Government-Issued ID"
              hint="Passport, national ID, or driver's licence (PDF / JPG / PNG)"
              accept={ACCEPTED_DOCS}
              icon={
                <DocumentTextIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={hostIdDoc}
              onChange={(files) =>
                uploadSingle(files[0], setHostIdDoc, "host_id")
              }
            />
            <DropZone
              label="Selfie Holding Your ID"
              hint="Clear photo of you holding the document above"
              accept={ACCEPTED_DOCS}
              icon={
                <UserIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={hostSelfie}
              onChange={(files) =>
                uploadSingle(files[0], setHostSelfie, "selfie")
              }
            />
          </div>
        </div>

        {/* ════ GATE 2 ════ */}
        <div
          style={{
            background: "rgba(245,240,232,0.03)",
            border: "1px solid rgba(245,240,232,0.08)",
            borderRadius: 20,
            padding: "24px",
          }}
        >
          <GateHeader
            number="2"
            title="Property Ownership"
            subtitle="Prove you own or have the right to list this property"
            done={gate2Done}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <DropZone
              label="Ownership Document"
              hint="Title deed, land certificate, or property tax receipt"
              accept={ACCEPTED_DOCS}
              icon={
                <DocumentTextIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={ownershipDoc}
              onChange={(files) =>
                uploadSingle(files[0], setOwnershipDoc, "ownership")
              }
            />
            <DropZone
              label="Utility Bill (≤ 3 months old)"
              hint="Electricity, water, or internet bill showing property address"
              accept={ACCEPTED_DOCS}
              icon={
                <DocumentTextIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={utilityBill}
              onChange={(files) =>
                uploadSingle(files[0], setUtilityBill, "utility")
              }
            />
          </div>
        </div>

        {/* ════ GATE 3 ════ */}
        <div
          style={{
            background: "rgba(245,240,232,0.03)",
            border: "1px solid rgba(245,240,232,0.08)",
            borderRadius: 20,
            padding: "24px",
          }}
        >
          <GateHeader
            number="3"
            title="Physical Evidence"
            subtitle="Show us the property is real and matches your listing"
            done={gate3Done}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Photo grid preview */}
            {photos.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                {photos.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "rgba(245,240,232,0.05)",
                      border: "1px solid rgba(245,240,232,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.url ? (
                      <img
                        src={p.url}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : p.uploading ? (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(201,169,110,0.3)",
                          borderTopColor: "#C9A96E",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <XMarkIcon
                        style={{ width: 14, height: 14, color: "#e07070" }}
                      />
                    )}
                    <button
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, j) => j !== i))
                      }
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <XMarkIcon
                        style={{ width: 10, height: 10, color: "#fff" }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <DropZone
              label={`Upload Property Photos (min 3, max ${MAX_PHOTOS})`}
              hint="Exterior, living areas, bedrooms, bathrooms — timestamped preferred"
              accept={ACCEPTED_MEDIA}
              icon={
                <PhotoIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={photos}
              onChange={uploadPhotos}
              multiple
            />
            {photos.filter((p) => !!p.url).length > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color:
                    photos.filter((p) => !!p.url).length >= 3
                      ? "#C9A96E"
                      : "rgba(245,240,232,0.3)",
                }}
              >
                {photos.filter((p) => !!p.url).length} / {MAX_PHOTOS} photos
                uploaded
                {photos.filter((p) => !!p.url).length >= 3
                  ? " ✓"
                  : " — upload at least 3"}
              </p>
            )}

            <DropZone
              label="Walkthrough Video (optional but recommended)"
              hint="Short video tour of the property — MP4 or MOV"
              accept=".mp4,.mov"
              icon={
                <VideoCameraIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: "rgba(245,240,232,0.3)",
                  }}
                />
              }
              state={video}
              onChange={(files) => uploadSingle(files[0], setVideo, "video")}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "rgba(245,240,232,0.35)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 8,
            }}
          >
            Additional Notes (optional)
          </label>
          <textarea
            value={hostNotes}
            onChange={(e) => setHostNotes(e.target.value)}
            rows={3}
            placeholder="Anything you'd like to tell our review team about this property…"
            style={{
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
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(245,240,232,0.1)")
            }
          />
        </div>

        {/* Error */}
        {submitError && (
          <div
            style={{
              background: "rgba(220,60,60,0.1)",
              border: "1px solid rgba(220,60,60,0.28)",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: "#e07070",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ExclamationTriangleIcon
              style={{ width: 16, height: 16, flexShrink: 0 }}
            />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !gate1Done || !gate2Done || !gate3Done}
          style={{
            width: "100%",
            background:
              gate1Done && gate2Done && gate3Done
                ? "#C9A96E"
                : "rgba(201,169,110,0.2)",
            color:
              gate1Done && gate2Done && gate3Done
                ? "#0e0d0b"
                : "rgba(14,13,11,0.4)",
            fontWeight: 700,
            fontSize: 14,
            padding: "17px 0",
            borderRadius: 14,
            border: "none",
            cursor:
              gate1Done && gate2Done && gate3Done && !submitting
                ? "pointer"
                : "not-allowed",
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
              Submitting for review…
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
          All documents are encrypted and stored securely.
          <br />
          They are only used to verify your property and never shared publicly.
        </p>
      </div>
    </div>
  );
}
