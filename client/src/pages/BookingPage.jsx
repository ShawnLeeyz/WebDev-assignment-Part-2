import { useEffect, useState } from "react";
import BookingLocationMap from "../components/BookingLocationMap.jsx";
import { supabase } from "../supabase.js";
import { generateNextBookingRef } from "../lib/bookingRef.js";
import { defaultDateTimeStrings, validateBookingForm } from "../validation.js";

export default function BookingPage() {
  const [form, setForm] = useState({
    cname: "",
    phone: "",
    unumber: "",
    snumber: "",
    stname: "",
    sbname: "",
    dsbname: "",
    date: "",
    time: "",
  });
  const [clientError, setClientError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { date, time } = defaultDateTimeStrings();
    setForm((f) => ({ ...f, date, time }));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setClientError("");
    setResult(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setClientError("");
    setResult(null);

    const err = validateBookingForm(form);
    if (err) {
      setClientError(err);
      return;
    }

    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      setClientError(
        "Missing Supabase env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
      return;
    }

    setLoading(true);
    try {
      const booking_ref = await generateNextBookingRef();
      const row = {
        booking_ref,
        cname: form.cname.trim(),
        phone: form.phone.trim(),
        unumber: form.unumber.trim(),
        snumber: form.snumber.trim(),
        stname: form.stname.trim(),
        sbname: form.sbname.trim(),
        dsbname: form.dsbname.trim(),
        date: form.date.trim(),
        time: form.time.trim(),
        status: "unassigned",
      };

      const { error } = await supabase.from("bookings").insert(row);

      if (error) {
        setClientError(error.message || "Could not save booking");
        return;
      }

      setResult({
        booking_ref,
        date: row.date,
        time: row.time,
      });
    } catch (e) {
      setClientError(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>CabsOnline — Taxi booking</h1>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="cname">Customer name *</label>
          <input
            id="cname"
            autoComplete="name"
            value={form.cname}
            onChange={(e) => update("cname", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number *</label>
          <input
            id="phone"
            inputMode="numeric"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="unumber">Unit number</label>
          <input
            id="unumber"
            value={form.unumber}
            onChange={(e) => update("unumber", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="snumber">Street number *</label>
          <input
            id="snumber"
            value={form.snumber}
            onChange={(e) => update("snumber", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="stname">Street name *</label>
          <input
            id="stname"
            value={form.stname}
            onChange={(e) => update("stname", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="sbname">Pickup suburb</label>
          <input
            id="sbname"
            placeholder="e.g. Flatbush, Auckland"
            value={form.sbname}
            onChange={(e) => update("sbname", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="dsbname">Destination suburb</label>
          <input
            id="dsbname"
            placeholder="e.g. Flatbush, Auckland"
            value={form.dsbname}
            onChange={(e) => update("dsbname", e.target.value)}
          />
        </div>
        <BookingLocationMap
          pickupStreetNumber={form.snumber}
          pickupStreetName={form.stname}
          pickupSuburb={form.sbname}
          destinationSuburb={form.dsbname}
        />
        <div className="field">
          <label htmlFor="date">Pickup date * (DD/MM/YYYY)</label>
          <input
            id="date"
            placeholder="DD/MM/YYYY"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="time">Pickup time *</label>
          <input
            id="time"
            type="time"
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Booking…" : "Book now"}
          </button>
        </div>
      </form>

      {clientError ? (
        <div className="message error" role="alert">
          {clientError}
        </div>
      ) : null}

      {result ? (
        <div className="message">
          <p>Thank you for your booking.</p>
          <p>
            <strong>Booking reference:</strong> {result.booking_ref}
          </p>
          <p>
            <strong>Pickup time:</strong> {result.time}
          </p>
          <p>
            <strong>Pickup date:</strong> {result.date}
          </p>
        </div>
      ) : null}
    </div>
  );
}
