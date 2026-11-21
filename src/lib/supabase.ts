import { createClient } from "@supabase/supabase-js";
import channel from "../../channel.json";

// Public values: the publishable key only identifies the project. All data is protected by
// row-level security — only emails listed in app_admins can read or write anything.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? channel.infra.supabase_url;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? channel.infra.supabase_publishable_key;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

export const MEDIA_BUCKET = "reel-media";
