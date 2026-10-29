/**
 * BookingReceiptActions.tsx
 *
 * Drop-in for the BookingPage "done" step.
 * Adds two buttons below the existing success screen:
 *   1. Copy Reference  — copies booking.ref to clipboard
 *   2. Download Receipt — renders a styled receipt and triggers print/save
 *
 * USAGE in BookingPage (inside the step === "done" block, after the
 * "Back to Explore" button):
 *
 *   import BookingReceiptActions from "./BookingReceiptActions";
 *   ...
 *   {completedBooking && (
 *     <BookingReceiptActions booking={completedBooking} hotelName={hotel.name} />
 *   )}
 */

import { useState, useCallback } from "react";
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import type { Booking } from "../index";

/* ─── helpers ──────────────────────────────────────────── */
const fmt$ = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ─── receipt HTML (rendered off-screen, then printed) ─── */
function buildReceiptHTML(booking: Booking, hotelName: string): string {
  const rows: [string, string][] = [
    ["Booking Reference", booking.ref],
    ["Property", hotelName],
    ["Guest Name", booking.guestName],
    ["Guest Email", booking.guestEmail],
    ["Guest Phone", booking.guestPhone || "—"],
    ["Check-in", fmtDate(booking.checkIn)],
    ["Check-out", fmtDate(booking.checkOut)],
    ["Nights", String(booking.nights)],
    ["Guests", String(booking.guests)],
    ["Total Paid", fmt$(booking.totalAmount)],
    ["Status", "Confirmed & Paid"],
    ["Booked On", fmtDate(booking.createdAt)],
  ];

  if (booking.specialRequests) {
    rows.push(["Special Requests", booking.specialRequests]);
  }

  const rowsHTML = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6b6560;font-weight:600;
                   letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #f0ede8;
                   width:40%;white-space:nowrap;">${label}</td>
        <td style="padding:10px 16px;font-size:13px;color:#1a1814;font-weight:500;
                   border-bottom:1px solid #f0ede8;">${value}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Booking Receipt · ${booking.ref}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; font-family: 'Inter', sans-serif; color: #1a1814; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    .page { max-width: 600px; margin: 40px auto; padding: 0 24px 60px; }
    .header { text-align: center; padding: 32px 0 24px; border-bottom: 1px solid #e8e3db; margin-bottom: 0; }
    .brand { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; letter-spacing: 0.12em; color: #1a1814; }
    .brand-sub { font-size: 10px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: #C9A96E; margin-top: 4px; }
    .ref-block { background: #faf8f4; border: 1px solid #e8e3db; border-radius: 12px; padding: 20px 24px; margin: 24px 0; text-align: center; }
    .ref-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #a09890; margin-bottom: 8px; }
    .ref-value { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #C9A96E; letter-spacing: 0.1em; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #edfaf3; border: 1px solid #c6f0d9; border-radius: 99px; padding: 6px 16px; margin-top: 10px; font-size: 12px; font-weight: 600; color: #166534; }
    .table-wrap { border: 1px solid #e8e3db; border-radius: 12px; overflow: hidden; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #a09890; line-height: 1.7; }
    .gold-line { width: 40px; height: 2px; background: #C9A96E; margin: 16px auto; border-radius: 2px; }
    .print-btn { display: block; margin: 28px auto 0; padding: 12px 32px; background: #C9A96E; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">EDEN</div>
      <div class="brand-sub">Luxury Short Lets</div>
    </div>

    <div class="ref-block">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-value">${booking.ref}</div>
      <div>
        <span class="status-badge">✓ Confirmed &amp; Paid</span>
      </div>
    </div>

    <div class="table-wrap">
      <table>${rowsHTML}</table>
    </div>

    <div class="footer">
      <div class="gold-line"></div>
      <p>This receipt confirms your reservation. Please keep your booking reference safe —<br/>
      you will need it when you arrive at the property.</p>
      <p style="margin-top:8px;">For support, contact us at <strong>support@zibra.com</strong></p>
    </div>

    <button class="print-btn no-print" onclick="window.print()">
      Save as PDF / Print
    </button>
  </div>
</body>
</html>`;
}

/* ─── component ─────────────────────────────────────────── */
interface BookingReceiptActionsProps {
  booking: Booking;
  hotelName: string;
}

export default function BookingReceiptActions({
  booking,
  hotelName,
}: BookingReceiptActionsProps) {
  const [copied, setCopied] = useState(false);
  const [printing, setPrinting] = useState(false);

  /* Copy ref to clipboard */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(booking.ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = booking.ref;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [booking.ref]);

  /* Open receipt in a new window and trigger print dialog */
  const handleDownload = useCallback(() => {
    setPrinting(true);
    const html = buildReceiptHTML(booking, hotelName);
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) {
      setPrinting(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    // Give fonts a moment to load before print dialog
    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
        setPrinting(false);
      }, 600);
    };
  }, [booking, hotelName]);

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "13px 24px",
    borderRadius: 14,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.04em",
    transition: "all 0.2s",
    marginBottom: 10,
  };

  return (
    <div style={{ width: "100%", marginTop: 4 }}>
      {/* Copy Reference */}
      <button
        onClick={handleCopy}
        style={{
          ...btnBase,
          background: copied
            ? "rgba(74,222,128,0.1)"
            : "rgba(201,169,110,0.08)",
          border: copied
            ? "1px solid rgba(74,222,128,0.35)"
            : "1px solid rgba(201,169,110,0.25)",
          color: copied ? "#4ade80" : "#C9A96E",
        }}
      >
        {copied ? (
          <CheckIcon style={{ width: 16, height: 16 }} />
        ) : (
          <ClipboardDocumentIcon style={{ width: 16, height: 16 }} />
        )}
        {copied ? "Reference Copied!" : "Copy Booking Reference"}
      </button>

      {/* Download / Print Receipt */}
      <button
        onClick={handleDownload}
        disabled={printing}
        style={{
          ...btnBase,
          background: printing ? "rgba(201,169,110,0.05)" : "#C9A96E",
          border: "1px solid transparent",
          color: printing ? "rgba(201,169,110,0.5)" : "#0e0d0b",
          opacity: printing ? 0.7 : 1,
        }}
      >
        {printing ? (
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(201,169,110,0.3)",
              borderTopColor: "#C9A96E",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
        )}
        {printing ? "Opening receipt…" : "Download Receipt"}
      </button>
    </div>
  );
}
