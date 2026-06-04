/**
 * AdminVerificationPanel.tsx
 *
 * Internal admin tool to review, approve, reject, or request
 * more info on host verification submissions.
 *
 * USAGE (wrap in an admin-only route guard):
 *   <AdminVerificationPanel adminId={currentAdmin.id} />
 */

import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import {
  VerificationDB,
  type AdminVerificationItem,
  type SubmissionStatus,
} from "../index";

/* ─────────────── helpers ─────────────── */

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending Review",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  approved: {
    label: "Approved",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
  },
  rejected: {
    label: "Rejected",
    color: "#e07070",
    bg: "rgba(220,60,60,0.1)",
  },
  needs_more_info: {
    label: "More Info Needed",
    color: "#C9A96E",
    bg: "rgba(201,169,110,0.1)",
  },
};

/* ─────────────── Status Badge ─────────────── */
function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 99,
        padding: "4px 10px",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────── Document Link ─────────────── */
function DocLink({
  url,
  label,
  icon,
}: {
  url?: string;
  label: string;
  icon: React.ReactNode;
}) {
  if (!url)
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "rgba(245,240,232,0.2)",
          background: "rgba(245,240,232,0.03)",
          border: "1px solid rgba(245,240,232,0.06)",
          borderRadius: 8,
          padding: "7px 12px",
        }}
      >
        {icon}
        {label}
        <span style={{ marginLeft: "auto", fontSize: 10 }}>Not provided</span>
      </span>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#C9A96E",
        background: "rgba(201,169,110,0.06)",
        border: "1px solid rgba(201,169,110,0.15)",
        borderRadius: 8,
        padding: "7px 12px",
        textDecoration: "none",
        transition: "background 0.15s",
      }}
      onMouseOver={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(201,169,110,0.12)")
      }
      onMouseOut={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(201,169,110,0.06)")
      }
    >
      {icon}
      {label}
      <span style={{ marginLeft: "auto", fontSize: 10 }}>View ↗</span>
    </a>
  );
}

/* ─────────────── Submission Detail Card ─────────────── */
function SubmissionCard({
  item,
  adminId,
  onUpdated,
}: {
  item: AdminVerificationItem;
  adminId: string;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const act = async (type: "approve" | "reject" | "info") => {
    if ((type === "reject" || type === "info") && !actionNote.trim()) {
      setError("Please write a note explaining your decision.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (type === "approve") await VerificationDB.approve(item.id, adminId);
      if (type === "reject")
        await VerificationDB.reject(item.id, adminId, actionNote.trim());
      if (type === "info")
        await VerificationDB.requestMoreInfo(
          item.id,
          adminId,
          actionNote.trim(),
        );
      onUpdated();
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const isPending =
    item.status === "pending" || item.status === "needs_more_info";

  return (
    <div
      style={{
        background: "#141210",
        border: "1px solid rgba(245,240,232,0.08)",
        borderRadius: 18,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* ── Summary row ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Listing thumbnail */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(245,240,232,0.05)",
          }}
        >
          {item.listingImages?.[0] ? (
            <img
              src={item.listingImages[0]}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PhotoIcon
                style={{
                  width: 20,
                  height: 20,
                  color: "rgba(245,240,232,0.2)",
                }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#f5f0e8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.listingName}
            </p>
            <StatusBadge status={item.status} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(245,240,232,0.38)" }}>
            {item.listingLocation} · {item.listingCategory}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(245,240,232,0.25)",
              marginTop: 3,
            }}
          >
            {item.hostFirstName} {item.hostLastName} · {item.hostEmail} ·
            Submitted {fmtDate(item.createdAt)}
          </p>
        </div>

        <ChevronDownIcon
          style={{
            width: 18,
            height: 18,
            color: "rgba(245,240,232,0.3)",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(245,240,232,0.07)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Gate 1 */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#C9A96E",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Gate 1 — Host Identity
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DocLink
                url={item.hostIdDocUrl}
                label="Government-Issued ID"
                icon={<DocumentTextIcon style={{ width: 14, height: 14 }} />}
              />
              <DocLink
                url={item.hostSelfieUrl}
                label="Selfie with ID"
                icon={<DocumentTextIcon style={{ width: 14, height: 14 }} />}
              />
            </div>
          </div>

          {/* Gate 2 */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#C9A96E",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Gate 2 — Property Ownership
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DocLink
                url={item.ownershipDocUrl}
                label="Ownership Document"
                icon={<DocumentTextIcon style={{ width: 14, height: 14 }} />}
              />
              <DocLink
                url={item.utilityBillUrl}
                label="Utility Bill"
                icon={<DocumentTextIcon style={{ width: 14, height: 14 }} />}
              />
            </div>
          </div>

          {/* Gate 3 */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#C9A96E",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Gate 3 — Physical Evidence
            </p>
            {item.photoUrls.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {item.photoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      height: 64,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid rgba(245,240,232,0.08)",
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                ))}
              </div>
            )}
            <DocLink
              url={item.videoUrl}
              label="Walkthrough Video"
              icon={<VideoCameraIcon style={{ width: 14, height: 14 }} />}
            />
          </div>

          {/* Host notes */}
          {item.hostNotes && (
            <div
              style={{
                background: "rgba(245,240,232,0.03)",
                border: "1px solid rgba(245,240,232,0.07)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(245,240,232,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                Host Notes
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,232,0.55)",
                  lineHeight: 1.6,
                }}
              >
                {item.hostNotes}
              </p>
            </div>
          )}

          {/* Previous admin note */}
          {item.adminNote && (
            <div
              style={{
                background: "rgba(201,169,110,0.05)",
                border: "1px solid rgba(201,169,110,0.15)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#C9A96E",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                Previous Admin Note
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(245,240,232,0.55)",
                  lineHeight: 1.6,
                }}
              >
                {item.adminNote}
              </p>
            </div>
          )}

          {/* Action buttons — only for pending/needs_more_info */}
          {isPending && (
            <div
              style={{
                borderTop: "1px solid rgba(245,240,232,0.07)",
                paddingTop: 18,
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "rgba(245,240,232,0.3)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 7,
                  }}
                >
                  Note to Host (required for Reject / More Info)
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                  placeholder="Explain what's missing or why this was rejected…"
                  style={{
                    width: "100%",
                    background: "rgba(245,240,232,0.04)",
                    border: "1px solid rgba(245,240,232,0.1)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "#f5f0e8",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A96E")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(245,240,232,0.1)")
                  }
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#e07070", marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => act("approve")}
                  disabled={loading}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    borderRadius: 10,
                    padding: "11px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#4ade80",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) =>
                    !loading &&
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(74,222,128,0.16)")
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(74,222,128,0.1)")
                  }
                >
                  <CheckCircleIcon style={{ width: 16, height: 16 }} />
                  Approve
                </button>

                <button
                  onClick={() => act("info")}
                  disabled={loading}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "rgba(201,169,110,0.08)",
                    border: "1px solid rgba(201,169,110,0.2)",
                    borderRadius: 10,
                    padding: "11px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#C9A96E",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) =>
                    !loading &&
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(201,169,110,0.14)")
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(201,169,110,0.08)")
                  }
                >
                  <ChatBubbleLeftEllipsisIcon
                    style={{ width: 16, height: 16 }}
                  />
                  Need More Info
                </button>

                <button
                  onClick={() => act("reject")}
                  disabled={loading}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "rgba(220,60,60,0.08)",
                    border: "1px solid rgba(220,60,60,0.2)",
                    borderRadius: 10,
                    padding: "11px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#e07070",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) =>
                    !loading &&
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(220,60,60,0.14)")
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(220,60,60,0.08)")
                  }
                >
                  <XCircleIcon style={{ width: 16, height: 16 }} />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PANEL
═══════════════════════════════════════════ */

export default function AdminVerificationPanel({
  adminId,
}: {
  adminId: string;
}) {
  // allItems always holds the complete unfiltered list so stat counts are correct
  const [allItems, setAllItems] = useState<AdminVerificationItem[]>([]);
  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("pending");

  const load = async () => {
    setLoading(true);
    try {
      // Fetch everything once — filter locally so counts stay accurate
      const all = await VerificationDB.adminQueue();
      setAllItems(all);
      setItems(filter === "all" ? all : all.filter((i) => i.status === filter));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // Re-filter locally when tab changes — no extra network call needed
  useEffect(() => {
    setItems(
      filter === "all" ? allItems : allItems.filter((i) => i.status === filter),
    );
  }, [filter, allItems]);

  // Counts always come from the full unfiltered list
  const counts = {
    pending: allItems.filter((i) => i.status === "pending").length,
    needs_more_info: allItems.filter((i) => i.status === "needs_more_info")
      .length,
    approved: allItems.filter((i) => i.status === "approved").length,
    rejected: allItems.filter((i) => i.status === "rejected").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0908",
        color: "#f5f0e8",
        fontFamily: "sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(245,240,232,0.07)",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          background: "rgba(10,9,8,0.97)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <ShieldCheckIcon style={{ width: 22, height: 22, color: "#C9A96E" }} />
        <div>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 20,
              fontWeight: 600,
              color: "#f5f0e8",
            }}
          >
            Verification Queue
          </h1>
          <p style={{ fontSize: 11, color: "rgba(245,240,232,0.3)" }}>
            Review host property submissions
          </p>
        </div>
        <button
          onClick={load}
          style={{
            marginLeft: "auto",
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(245,240,232,0.06)",
            border: "1px solid rgba(245,240,232,0.1)",
            color: "#f5f0e8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Refresh"
        >
          <ArrowPathIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div
        style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 80px" }}
      >
        {/* Stat row — always from full list */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {(
            [
              { key: "pending", label: "Pending", color: "#f59e0b" },
              { key: "needs_more_info", label: "More Info", color: "#C9A96E" },
              { key: "approved", label: "Approved", color: "#4ade80" },
              { key: "rejected", label: "Rejected", color: "#e07070" },
            ] as const
          ).map(({ key, label, color }) => (
            <div
              key={key}
              style={{
                background: "#141210",
                border: "1px solid rgba(245,240,232,0.07)",
                borderRadius: 14,
                padding: "12px 18px",
                flex: 1,
                minWidth: 100,
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color,
                  fontFamily: "Cormorant Garamond, serif",
                  lineHeight: 1,
                }}
              >
                {counts[key]}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(245,240,232,0.35)",
                  marginTop: 4,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs — counts shown inline */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 20,
            borderBottom: "1px solid rgba(245,240,232,0.07)",
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { key: "all", label: `All (${allItems.length})` },
              { key: "pending", label: `Pending (${counts.pending})` },
              {
                key: "needs_more_info",
                label: `More Info (${counts.needs_more_info})`,
              },
              { key: "approved", label: `Approved (${counts.approved})` },
              { key: "rejected", label: `Rejected (${counts.rejected})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${filter === key ? "#C9A96E" : "transparent"}`,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: filter === key ? "#C9A96E" : "rgba(245,240,232,0.4)",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 88,
                  borderRadius: 18,
                  background: "rgba(245,240,232,0.04)",
                  border: "1px solid rgba(245,240,232,0.07)",
                  animation: "pulse 1.4s ease infinite",
                }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "rgba(245,240,232,0.02)",
              border: "1px solid rgba(245,240,232,0.06)",
              borderRadius: 18,
            }}
          >
            <ClockIcon
              style={{
                width: 40,
                height: 40,
                color: "rgba(245,240,232,0.15)",
                margin: "0 auto 14px",
              }}
            />
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 20,
                color: "#f5f0e8",
                marginBottom: 8,
              }}
            >
              Queue is clear
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,240,232,0.3)" }}>
              No submissions in this category right now.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            {items.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                adminId={adminId}
                onUpdated={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
