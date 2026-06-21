import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: cors,
    });
  }

  try {
    const body = await req.json();
    const {
      reference,
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      listingId,
      listingName,
      hostId,
      checkIn,
      checkOut,
      guests,
      nights,
      totalAmount,
      specialRequests,
    } = body;

    if (!reference) return fail("Missing payment reference");

    // 1. Verify the payment actually happened — never trust the client's claim
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
    );
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || verifyJson.data?.status !== "success") {
      return fail("Payment could not be verified");
    }

    const paidAmount = verifyJson.data.amount / 100; // kobo -> naira
    if (Math.abs(paidAmount - totalAmount) > 1) {
      return fail("Paid amount does not match booking total");
    }

    // 2. Prevent double-processing the same reference
    const { data: existingBooking } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("ref", reference)
      .maybeSingle();
    if (existingBooking) {
      return ok({ alreadyProcessed: true, bookingId: existingBooking.id });
    }

    // 3. Create the booking — the DB exclusion constraint is the final
    //    authority on overlap, so this insert is the atomic checkpoint
    const { data: booking, error: insertErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        ref: reference,
        guest_id: guestId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone ?? "",
        listing_id: listingId,
        listing_name: listingName,
        host_id: hostId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        nights,
        total_amount: totalAmount,
        special_requests: specialRequests ?? "",
        status: "confirmed",
      })
      .select()
      .single();

    if (insertErr) {
      // Overlap rejected by the exclusion constraint — refund the guest
      if (insertErr.code === "23P01") {
        await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction: reference }),
        });
        return fail(
          "These dates were just booked by someone else. You have been refunded automatically.",
          409,
        );
      }
      return fail(insertErr.message);
    }

    // 4. Split payment 90/10 between host and platform
    const platformCut = Math.round(totalAmount * 0.1 * 100) / 100;
    const hostCut = Math.round((totalAmount - platformCut) * 100) / 100;

    await supabaseAdmin.rpc("credit_wallet", {
      p_user_id: hostId,
      p_amount: hostCut,
      p_desc: `Booking earned: ${listingName}`,
      p_booking_id: booking.id,
    });
    await supabaseAdmin.rpc("credit_wallet", {
      p_user_id: "7d597621-1416-4c1a-be9c-582dd68c5270", // PLATFORM_ADMIN_ID
      p_amount: platformCut,
      p_desc: `Platform fee (10%): ${listingName}`,
      p_booking_id: booking.id,
    });

    // 5. Notifications
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: hostId,
        type: "booking_confirmed",
        title: "New booking confirmed!",
        body: `${guestName} booked ${listingName} for ${nights} night${nights > 1 ? "s" : ""}.`,
        link: "/dashboard?tab=bookings",
      },
      {
        user_id: guestId,
        type: "payment",
        title: "Payment successful",
        body: `Your booking at ${listingName} is confirmed. Ref: ${reference}`,
        link: `/listing/${listingId}`,
      },
    ]);

    return ok({ booking });
  } catch (e) {
    return fail(e.message ?? "Unexpected error", 500);
  }
});