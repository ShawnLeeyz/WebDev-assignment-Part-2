import { useState } from "react";
import { supabase } from "../supabase.js";
import { filterUpcomingUnassigned } from "../lib/upcomingBookings.js";

const REF_PATTERN = /^BRN\d{5}$/;

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    setError("");
    setConfirm("");
    const term = search.trim();

    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      setError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      if (term !== "") {
        if (!REF_PATTERN.test(term)) {
          setError(
            "Invalid reference number format. Use BRN followed by 5 digits (e.g. BRN00001)."
          );
          setRows([]);
          return;
        }
        const { data, error: qErr } = await supabase
          .from("bookings")
          .select("*")
          .eq("booking_ref", term)
          .maybeSingle();

        if (qErr) {
          setError(qErr.message);
          setRows([]);
          return;
        }
        if (!data) {
          setError("Booking not found");
          setRows([]);
          return;
        }
        setRows([data]);
      } else {
        const { data, error: qErr } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "unassigned");

        if (qErr) {
          setError(qErr.message);
          setRows([]);
          return;
        }
        setRows(filterUpcomingUnassigned(data ?? []));
      }
    } catch (e) {
      setError(e.message || "Could not load bookings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function assignDriver(bookingRef) {
    setConfirm("");
    try {
      const { error: uErr } = await supabase
        .from("bookings")
        .update({ status: "assigned" })
        .eq("booking_ref", bookingRef);

      if (uErr) {
        setConfirm(uErr.message || `Failed to assign ${bookingRef}`);
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.booking_ref === bookingRef ? { ...r, status: "assigned" } : r
        )
      );
      setConfirm(`Booking ${bookingRef} has been assigned`);
    } catch (e) {
      setConfirm(e.message || "Update failed");
    }
  }

  return (
    <div className="card">
      <h1>Admin — Booking management</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Enter a reference like <code>BRN00001</code> to look up one booking, or
        leave the field empty and search to list unassigned pickups due within
        the next two hours today (Supabase + local filter).
      </p>

      <div className="inline-row">
        <div className="field" style={{ flex: 2 }}>
          <label htmlFor="bsearch">Booking reference (optional)</label>
          <input
            id="bsearch"
            placeholder="e.g. BRN00042"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={runSearch}
          disabled={loading}
        >
          {loading ? "Loading…" : "Search bookings"}
        </button>
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: "1rem" }}>{error}</p>
      ) : null}

      {confirm ? <div className="confirm-banner">{confirm}</div> : null}

      <div className="table-wrap">
        {rows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Pickup suburb</th>
                <th>Destination</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.booking_ref}>
                  <td>{row.booking_ref}</td>
                  <td>{row.cname}</td>
                  <td>{row.phone}</td>
                  <td>{row.sbname}</td>
                  <td>{row.dsbname}</td>
                  <td>{row.date}</td>
                  <td>{row.time}</td>
                  <td>{row.status}</td>
                  <td>
                    {row.status === "unassigned" ? (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                        onClick={() => assignDriver(row.booking_ref)}
                      >
                        Assign
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
