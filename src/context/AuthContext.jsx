// AuthContext.jsx — maneja sesión de usuario con Supabase Auth (PKCE flow)
// Provee: user, loading, login(), register(), logout()
// PKCE: después de confirmar email, Supabase redirige con ?code=xxx
// El cliente intercambia ese code por una sesión válida.

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

/** Limpia params de auth de la URL (?code=, #access_token=) */
function limpiarUrlAuth() {
  const url = new URL(window.location.href);
  let changed = false;

  // PKCE: ?code= en query params
  if (url.searchParams.has("code")) {
    url.searchParams.delete("code");
    changed = true;
  }

  // Legacy: #access_token= en hash (por si acaso)
  if (url.hash && url.hash.includes("access_token")) {
    url.hash = "";
    changed = true;
  }

  if (changed) {
    window.history.replaceState(null, "", url.pathname);
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      // PKCE: si hay ?code= en la URL, intercambiar por sesión
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error("Error al intercambiar code:", error.message);
        } catch (e) {
          console.error("Error PKCE:", e);
        }
      }

      // Obtener sesión (ya sea existente o recién creada por PKCE)
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      limpiarUrlAuth();
    }

    initAuth();

    // Escuchar cambios de sesión (login, logout, token refresh, email confirm)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        limpiarUrlAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://zzloquillozz.github.io/presupuesto-personal/",
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
