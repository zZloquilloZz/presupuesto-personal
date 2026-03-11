// AuthContext.jsx — maneja sesión de usuario con Supabase Auth (PKCE flow)
// Provee: user, loading, login(), register(), logout()
// PKCE: después de confirmar email, Supabase redirige con ?code=xxx
// El cliente intercambia ese code por una sesión válida, luego cierra sesión
// para que el usuario haga login manualmente.

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

/** Limpia params de auth de la URL (?code=, #access_token=) */
function limpiarUrlAuth() {
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.has("code")) { url.searchParams.delete("code"); changed = true; }
  if (url.hash && url.hash.includes("access_token")) { url.hash = ""; changed = true; }
  if (changed) window.history.replaceState(null, "", url.pathname);
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Flag para bloquear onAuthStateChange durante confirmación de email
  const confirmingRef = useRef(false);

  useEffect(() => {
    async function initAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // Activar flag ANTES de exchangeCode para bloquear el listener
        confirmingRef.current = true;

        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            // Email confirmado — cerrar sesión inmediatamente
            await supabase.auth.signOut();
            setEmailConfirmed(true);
            setUser(null);
            setLoading(false);
            limpiarUrlAuth();
            confirmingRef.current = false;
            return;
          }
          console.error("Error al intercambiar code:", error.message);
        } catch (e) {
          console.error("Error PKCE:", e);
        }

        confirmingRef.current = false;
        limpiarUrlAuth();
      }

      // Flujo normal: obtener sesión existente
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    initAuth();

    // Escuchar cambios de sesión — IGNORA eventos durante confirmación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (confirmingRef.current) return; // ← bloquea durante confirmación
      setUser(session?.user ?? null);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, emailConfirmed, setEmailConfirmed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
