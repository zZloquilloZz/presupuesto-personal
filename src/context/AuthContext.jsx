// AuthContext.jsx — maneja sesión de usuario con Supabase Auth
// Provee: user, loading, login(), register(), logout()
// Detecta token de confirmación de email en la URL (GitHub Pages + Supabase)

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

/** Limpia el hash de la URL si contiene tokens de auth */
function limpiarHashAuth() {
  if (window.location.hash && window.location.hash.includes("access_token")) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true mientras verifica sesión

  useEffect(() => {
    // Supabase JS v2 detecta automáticamente el access_token en el hash
    // al llamar getSession(). Solo necesitamos asegurar que se ejecute
    // y después limpiar la URL.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) limpiarHashAuth();
    });

    // Escuchar cambios de sesión (login, logout, token refresh, email confirm)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        limpiarHashAuth();
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
    const { data, error } = await supabase.auth.signUp({ email, password });
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
