import { supabase } from "../supabase.js";

const REF_RE = /^BRN(\d{5})$/;

/** Next BRN00001-style ref from current rows (same idea as MAX(id)+1 on padded refs). */
export async function generateNextBookingRef() {
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_ref")
    .like("booking_ref", "BRN%");

  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const m = REF_RE.exec(row.booking_ref);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const next = max + 1;
  return `BRN${String(next).padStart(5, "0")}`;
}
