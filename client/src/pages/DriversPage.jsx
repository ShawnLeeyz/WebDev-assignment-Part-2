import { useCallback, useEffect, useState } from "react";
import { hasSupabaseEnv, supabase } from "../supabase.js";

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    vehicle: "",
    plate_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(
    /** @type {string | null} */ (null)
  );

  const loadDrivers = useCallback(async () => {
    if (!hasSupabaseEnv()) {
      setError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      setDrivers([]);
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);
    const { data, error: qErr } = await supabase
      .from("drivers")
      .select("*")
      .order("name", { ascending: true });

    if (qErr) {
      setError(qErr.message);
      setDrivers([]);
    } else {
      setDrivers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDrivers();

    if (!hasSupabaseEnv()) return undefined;

    const channel = supabase
      .channel("drivers-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => {
          void loadDrivers();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDrivers]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!hasSupabaseEnv()) {
      setError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      return;
    }

    const name = form.name.trim();
    const vehicle = form.vehicle.trim();
    const plate_number = form.plate_number.trim();
    if (!name || !vehicle || !plate_number) {
      setError("Name, vehicle, and plate number are required.");
      return;
    }

    setSaving(true);
    try {
      const { error: insErr } = await supabase.from("drivers").insert({
        name,
        vehicle,
        plate_number,
        status: "available",
      });
      if (insErr) {
        setError(insErr.message || "Could not add driver");
        return;
      }
      setForm({ name: "", vehicle: "", plate_number: "" });
      void loadDrivers();
    } catch (e) {
      setError(e.message || "Could not add driver");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDriverStatus(driver) {
    if (!hasSupabaseEnv()) {
      setError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      return;
    }

    const next = driver.status === "busy" ? "available" : "busy";

    setError("");
    setTogglingId(driver.id);
    try {
      const { error: uErr } = await supabase
        .from("drivers")
        .update({ status: next })
        .eq("id", driver.id);

      if (uErr) {
        setError(uErr.message || "Could not update status");
        return;
      }
      void loadDrivers();
    } catch (e) {
      setError(e.message || "Could not update status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="card">
      <h1>Drivers</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Add drivers and manage the fleet. New drivers start as{" "}
        <strong>available</strong> until a booking is assigned to them in Admin.
      </p>

      <form className="form-grid drivers-form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="dname">Name *</label>
          <input
            id="dname"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="dvehicle">Vehicle *</label>
          <input
            id="dvehicle"
            placeholder="e.g. Toyota Prius"
            value={form.vehicle}
            onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="dplate">Plate number *</label>
          <input
            id="dplate"
            autoComplete="off"
            value={form.plate_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, plate_number: e.target.value }))
            }
          />
        </div>
        <div>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Adding…" : "Add driver"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="drivers-page-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="table-wrap drivers-table-wrap">
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading drivers…</p>
        ) : drivers.length === 0 ? (
          <p style={{ color: "#64748b" }}>No drivers yet. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.vehicle}</td>
                  <td>{d.plate_number}</td>
                  <td>
                    <div className="driver-status-cell">
                      <span
                        className={
                          d.status === "available"
                            ? "driver-status driver-status--available"
                            : "driver-status driver-status--busy"
                        }
                      >
                        {d.status}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary driver-status-toggle"
                        disabled={togglingId === d.id}
                        aria-label={
                          d.status === "available"
                            ? `Set ${d.name} to busy`
                            : `Set ${d.name} to available`
                        }
                        onClick={() => void toggleDriverStatus(d)}
                      >
                        {togglingId === d.id
                          ? "…"
                          : d.status === "available"
                            ? "Set busy"
                            : "Set available"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
