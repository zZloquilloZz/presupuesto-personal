// supabase.js — cliente único para toda la app
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: "pkce",        // PKCE flow: redirige con ?code= en vez de #access_token=
    detectSessionInUrl: true, // detecta el code en la URL automáticamente
  },
});
