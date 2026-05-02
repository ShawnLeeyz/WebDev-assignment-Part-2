import { createClient } from "@supabase/supabase-js";

/**
 * Hardcoded for static hosting (e.g. GitHub Pages) so no build-time env is required.
 * The anon key is public in the browser; protect data with RLS in Supabase.
 *
 * If inserts/selects fail with "row-level security", add policies for `bookings`
 * (or disable RLS for local testing only).
 *
 * Admin “bookings today” uses `created_at`. Drivers: see `supabase/migrations/001_drivers.sql`.
 */

const SUPABASE_URL = "https://zapatcyvjxhspihadtgz.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_nfFxOQj-5qfBWrzhftP6Gg_aTNL2se0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Used by pages that previously checked VITE_* (not set in CI / GitHub Pages). */
export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
