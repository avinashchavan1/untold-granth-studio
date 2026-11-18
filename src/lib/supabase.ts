import { createClient } from "@supabase/supabase-js";

// Public values: the publishable key only identifies the project. All data is protected by
// row-level security — only emails listed in app_admins can read or write anything.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://spsrryrycowxmgiofyxo.supabase.co";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_wZsdbYBPgVSg9Mp10mKqMg_nxMWHjmD";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

export const MEDIA_BUCKET = "reel-media";
