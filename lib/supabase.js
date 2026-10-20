import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Copy .env.example to .env.local and fill in your project credentials."
  );
}

/**
 * Browser-side Supabase client (uses the anon key).
 * Import this anywhere in client components.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
