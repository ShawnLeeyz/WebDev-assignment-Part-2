import { useCallback, useEffect, useState } from "react";
import { hasSupabaseEnv, supabase } from "../supabase.js";

const REF_PATTERN = /^BRN\d{5}$/;

/** @param {string | null | undefined} iso */
function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export default function TrackingPage() {
  const [inputRef, setInputRef] = useState("");
  const [activeRef, setActiveRef] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBooking = useCallback(async (ref) => {
    if (!hasSupabaseEnv() || !ref) return null;
    const { data, error: qErr } = await supabase
      .from("bookings")
      .select("*, drivers(name, vehicle, plate_number)")
      .eq("booking_ref", ref)
      .maybeSingle();

    if (qErr) {
      const fallback = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_ref", ref)
        .maybeSingle();
      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
      return fallback.data;
    }
    return data;
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setBooking(null);

    const term = inputRef.trim().toUpperCase();

    if (!hasSupabaseEnv()) {
      setError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      return;
    }

    if (!REF_PATTERN.test(term)) {
      setError(
        "Use a reference like BRN00001 (BRN plus five digits)."
      );
      return;
    }

    setLoading(true);
    try {
      const row = await fetchBooking(term);
      if (!row) {
        setError("No booking found for that reference.");
        setActiveRef("");
        return;
      }
      setBooking(row);
      setActiveRef(term);
    } catch (err) {
      setError(err?.message || "Could not load booking.");
      setActiveRef("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeRef || !hasSupabaseEnv()) return undefined;

    const channel = supabase
      .channel(`track-booking-${activeRef}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_ref=eq.${activeRef}`,
        },
        () => {
          void (async () => {
            try {
              const row = await fetchBooking(activeRef);
              if (row) setBooking(row);
            } catch {
              /* keep last known booking */
            }
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRef, fetchBooking]);

  const status = booking?.status ?? "";
  const isAssigned = status === "assigned";
  const isUnassigned = status === "unassigned";
  const badgeClass = isAssigned
    ? "track-status-badge track-status-badge--assigned"
    : isUnassigned
      ? "track-status-badge track-status-badge--unassigned"
      : "track-status-badge track-status-badge--other";

  return (
    <div className="card">
      <h1>Track your booking</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Enter the reference you received (for example after booking) to see
        details and live status updates.
      </p>

      <form className="inline-row" onSubmit={handleLookup}>
        <div className="field" style={{ flex: 2 }}>
          <label htmlFor="track-ref">Booking reference</label>
          <input
            id="track-ref"
            placeholder="e.g. BRN00042"
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Looking up…" : "Track"}
        </button>
      </form>

      {error ? (
        <p className="track-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {booking ? (
        <div className="track-result">
          <div className="track-result-header">
            <h2 className="track-result-title">{booking.booking_ref}</h2>
            <span className={badgeClass}>{status || "unknown"}</span>
          </div>

          <dl className="track-details">
            <div className="track-detail-row">
              <dt>Customer name</dt>
              <dd>{booking.cname ?? "—"}</dd>
            </div>
            <div className="track-detail-row">
              <dt>Phone</dt>
              <dd>{booking.phone ?? "—"}</dd>
            </div>
            <div className="track-detail-row">
              <dt>Pickup address</dt>
              <dd>
                {[
                  [booking.unumber, booking.snumber].filter(Boolean).join(" "),
                  booking.stname,
                  booking.sbname,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div className="track-detail-row">
              <dt>Destination</dt>
              <dd>{booking.dsbname ?? "—"}</dd>
            </div>
            <div className="track-detail-row">
              <dt>Pickup date</dt>
              <dd>{booking.date ?? "—"}</dd>
            </div>
            <div className="track-detail-row">
              <dt>Pickup time</dt>
              <dd>{booking.time ?? "—"}</dd>
            </div>
            {booking.drivers?.name ? (
              <div className="track-detail-row">
                <dt>Assigned driver</dt>
                <dd>
                  {booking.drivers.name}
                  {booking.drivers.vehicle
                    ? ` · ${booking.drivers.vehicle}`
                    : ""}
                  {booking.drivers.plate_number
                    ? ` (${booking.drivers.plate_number})`
                    : ""}
                </dd>
              </div>
            ) : null}
            {booking.created_at ? (
              <div className="track-detail-row">
                <dt>Booked at</dt>
                <dd>{formatTimestamp(booking.created_at)}</dd>
              </div>
            ) : null}
          </dl>

          <p className="track-live-hint" aria-live="polite">
            Status updates automatically when your booking changes.
          </p>
        </div>
      ) : null}
    </div>
  );
}
