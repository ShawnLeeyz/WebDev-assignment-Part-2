import { createClient } from "@supabase/supabase-js";

/**
 * Env: copy client/.env.example → client/.env (Vite only exposes VITE_*).
 *
 * If inserts/selects fail with "row-level security", open Supabase → SQL and
 * add policies for the `bookings` table (or disable RLS for local testing only).
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[CabsOnline] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env"
  );
}

export const supabase = createClient(url || "", anonKey || "");
