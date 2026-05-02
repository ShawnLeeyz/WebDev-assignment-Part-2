import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "../supabase.js";
import { filterUpcomingUnassigned } from "../lib/upcomingBookings.js";

const REF_PATTERN = /^BRN\d{5}$/;

/** @param {Date} d */
function localDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** @param {string} iso */
function localDayKeyFromTimestamp(iso) {
  return localDayKey(new Date(iso));
}

function lastSevenLocalDayMetas() {
  const metas = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    metas.push({
      dayKey: localDayKey(d),
      label: d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    });
  }
  return metas;
}

function localDayUtcIsoRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dayStart: start.toISOString(), dayEnd: end.toISOString() };
}

function hasSupabaseEnv() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    assigned: 0,
    today: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [chartSeries, setChartSeries] = useState(
    /** @type {{ label: string, count: number }[]} */ ([])
  );
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState("");

  const [availableDrivers, setAvailableDrivers] = useState(
    /** @type {{ id: string, name: string, vehicle: string, plate_number: string }[]} */ (
      []
    )
  );
  const [assignChoice, setAssignChoice] = useState(
    /** @type Record<string, string> */ ({})
  );

  const fetchAvailableDrivers = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const { data, error: dErr } = await supabase
      .from("drivers")
      .select("id, name, vehicle, plate_number")
      .eq("status", "available")
      .order("name", { ascending: true });
    if (dErr) return;
    setAvailableDrivers(data ?? []);
  }, []);

  const fetchBookingStats = useCallback(async (soft = false) => {
    if (!hasSupabaseEnv()) {
      setStatsLoading(false);
      setStatsError("");
      return;
    }

    if (!soft) setStatsLoading(true);
    setStatsError("");

    const { dayStart, dayEnd } = localDayUtcIsoRange();

    const [totalR, unR, asR, todayR] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "unassigned"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "assigned"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart)
        .lt("created_at", dayEnd),
    ]);

    const errMsg = [totalR.error, unR.error, asR.error, todayR.error]
      .filter(Boolean)
      .map((e) => e.message)
      .join(" ");

    if (errMsg) {
      setStatsError(errMsg);
      setStatsLoading(false);
      return;
    }

    setStats({
      total: totalR.count ?? 0,
      unassigned: unR.count ?? 0,
      assigned: asR.count ?? 0,
      today: todayR.count ?? 0,
    });
    setStatsLoading(false);
  }, []);

  const fetchDailyChartData = useCallback(async (soft = false) => {
    if (!hasSupabaseEnv()) {
      const dayMetas = lastSevenLocalDayMetas();
      setChartSeries(
        dayMetas.map((m) => ({ label: m.label, count: 0 }))
      );
      setChartError("");
      setChartLoading(false);
      return;
    }

    if (!soft) setChartLoading(true);
    setChartError("");

    const now = new Date();
    const rangeEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const rangeStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0
    );

    const { data, error } = await supabase
      .from("bookings")
      .select("created_at")
      .gte("created_at", rangeStart.toISOString())
      .lt("created_at", rangeEnd.toISOString())
      .limit(10000);

    if (error) {
      setChartError(error.message);
      setChartLoading(false);
      return;
    }

    const dayMetas = lastSevenLocalDayMetas();
    const counts = Object.fromEntries(dayMetas.map((m) => [m.dayKey, 0]));
    for (const row of data ?? []) {
      if (!row?.created_at) continue;
      const k = localDayKeyFromTimestamp(row.created_at);
      if (Object.prototype.hasOwnProperty.call(counts, k)) counts[k]++;
    }

    setChartSeries(
      dayMetas.map((m) => ({ label: m.label, count: counts[m.dayKey] }))
    );
    setChartLoading(false);
  }, []);

  const refreshDashboardSoft = useCallback(() => {
    void fetchBookingStats(true);
    void fetchDailyChartData(true);
    void fetchAvailableDrivers();
  }, [fetchBookingStats, fetchDailyChartData, fetchAvailableDrivers]);

  useEffect(() => {
    void fetchBookingStats();
    void fetchDailyChartData();
    void fetchAvailableDrivers();

    if (!hasSupabaseEnv()) return undefined;

    const channel = supabase
      .channel("admin-bookings-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          refreshDashboardSoft();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => {
          void fetchAvailableDrivers();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    fetchBookingStats,
    fetchDailyChartData,
    fetchAvailableDrivers,
    refreshDashboardSoft,
  ]);

  async function runSearch() {
    setError("");
    setConfirm("");
    const term = search.trim();

    if (!hasSupabaseEnv()) {
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
          .select("*, drivers(name, vehicle, plate_number)")
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
          .select("*, drivers(name, vehicle, plate_number)")
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

  async function assignBookingToDriver(bookingRef, driverId) {
    setConfirm("");
    if (!driverId) return;
    try {
      const { error: bErr } = await supabase
        .from("bookings")
        .update({ status: "assigned", assigned_driver_id: driverId })
        .eq("booking_ref", bookingRef)
        .eq("status", "unassigned");

      if (bErr) {
        setConfirm(bErr.message || `Failed to assign ${bookingRef}`);
        return;
      }

      const { data: driverRows, error: dErr } = await supabase
        .from("drivers")
        .update({ status: "busy" })
        .eq("id", driverId)
        .eq("status", "available")
        .select("id");

      if (dErr) {
        await supabase
          .from("bookings")
          .update({ status: "unassigned", assigned_driver_id: null })
          .eq("booking_ref", bookingRef);
        setConfirm(
          dErr.message ||
            "Could not mark driver as busy; booking left unassigned."
        );
        return;
      }

      if (!driverRows?.length) {
        await supabase
          .from("bookings")
          .update({ status: "unassigned", assigned_driver_id: null })
          .eq("booking_ref", bookingRef);
        setConfirm(
          "That driver was no longer available. Choose another and try again."
        );
        void fetchAvailableDrivers();
        return;
      }

      const driver = availableDrivers.find((d) => d.id === driverId);
      setRows((prev) =>
        prev.map((r) =>
          r.booking_ref === bookingRef
            ? {
                ...r,
                status: "assigned",
                assigned_driver_id: driverId,
                drivers: driver
                  ? {
                      name: driver.name,
                      vehicle: driver.vehicle,
                      plate_number: driver.plate_number,
                    }
                  : r.drivers,
              }
            : r
        )
      );
      setAssignChoice((c) => {
        const next = { ...c };
        delete next[bookingRef];
        return next;
      });
      setConfirm(
        `Booking ${bookingRef} assigned to ${driver?.name ?? "driver"}.`
      );
      refreshDashboardSoft();
    } catch (e) {
      setConfirm(e.message || "Update failed");
    }
  }

  return (
    <div className="card">
      <h1>Admin — Booking management</h1>

      <section className="admin-dashboard" aria-label="Booking statistics">
        <h2 className="admin-dashboard-title">Dashboard</h2>
        <div className="admin-stat-grid">
          <article className="admin-stat-card admin-stat-card--total">
            <p className="admin-stat-label">Total bookings</p>
            <p
              className={`admin-stat-value${statsLoading ? " admin-stat-value--loading" : ""}`}
            >
              {statsLoading ? "…" : stats.total}
            </p>
          </article>
          <article className="admin-stat-card admin-stat-card--unassigned">
            <p className="admin-stat-label">Unassigned</p>
            <p
              className={`admin-stat-value${statsLoading ? " admin-stat-value--loading" : ""}`}
            >
              {statsLoading ? "…" : stats.unassigned}
            </p>
          </article>
          <article className="admin-stat-card admin-stat-card--assigned">
            <p className="admin-stat-label">Assigned</p>
            <p
              className={`admin-stat-value${statsLoading ? " admin-stat-value--loading" : ""}`}
            >
              {statsLoading ? "…" : stats.assigned}
            </p>
          </article>
          <article className="admin-stat-card admin-stat-card--today">
            <p className="admin-stat-label">Bookings today</p>
            <p
              className={`admin-stat-value${statsLoading ? " admin-stat-value--loading" : ""}`}
            >
              {statsLoading ? "…" : stats.today}
            </p>
          </article>
        </div>

        <div className="admin-chart-block">
          <h3 className="admin-chart-title">Bookings per day (last 7 days)</h3>
          {chartLoading ? (
            <p className="admin-chart-loading">Loading chart…</p>
          ) : chartError ? (
            <p className="admin-stat-error" role="alert">
              {chartError}
            </p>
          ) : (
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartSeries}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                    }}
                    formatter={(value) => [value, "Bookings"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    name="Bookings"
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {statsError ? (
          <p className="admin-stat-error" role="alert">
            {statsError}
          </p>
        ) : (
          <p className="admin-stat-footnote">
          </p>
        )}
      </section>

      <p style={{ color: "#64748b", marginTop: 0 }}>
        Enter a reference like <code>BRN00001</code> to look up one booking, or
        leave the field empty and search to list unassigned pickups due within
        the next two hours today (Supabase + local filter). Add drivers on the{" "}
        <Link to="/drivers">Drivers</Link> page before assigning.
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
                <th>Driver</th>
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
                    {row.drivers?.name ? row.drivers.name : "—"}
                  </td>
                  <td>
                    {row.status === "unassigned" ? (
                      <div className="admin-assign-cell">
                        <select
                          className="admin-assign-select"
                          aria-label={`Driver for ${row.booking_ref}`}
                          value={assignChoice[row.booking_ref] ?? ""}
                          onChange={(e) =>
                            setAssignChoice((c) => ({
                              ...c,
                              [row.booking_ref]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Choose driver…</option>
                          {availableDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} — {d.vehicle} ({d.plate_number})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.85rem",
                          }}
                          disabled={!assignChoice[row.booking_ref]}
                          onClick={() =>
                            assignBookingToDriver(
                              row.booking_ref,
                              assignChoice[row.booking_ref]
                            )
                          }
                        >
                          Assign
                        </button>
                      </div>
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
