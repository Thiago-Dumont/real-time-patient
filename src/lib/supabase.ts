import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uvdelreayemjkuuhxgoc.supabase.co";
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_QA1OgRvRbuosGtO2I707Ww_7Vq3q-cf";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type Conversation = {
  id: string | number;
  number: string;
  user_message: string | null;
  ai_response: string | null;
  intent: string | null;
  status: string | null;
  created_at: string;
};

export const N8N_WEBHOOKS = {
  create: import.meta.env.VITE_N8N_WEBHOOK_CREATE_EVENT || "",
  update: import.meta.env.VITE_N8N_WEBHOOK_UPDATE_EVENT || "",
  cancel: import.meta.env.VITE_N8N_WEBHOOK_CANCEL_EVENT || "",
};