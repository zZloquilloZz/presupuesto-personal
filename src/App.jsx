// App.jsx — raíz de la app
// Auth loading → Login → AppProvider (hidratación) → app completa

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar     from "./components/Sidebar";
import Login       from "./pages/Login";
import Onboarding  from "./pages/Onboarding";
import Dashboard   from "./pages/Dashboard";
import Registro    from "./pages/Registro";
import Presupuesto from "./pages/Presupuesto";
import Tarjetas    from "./pages/Tarjetas";
import Ingresos    from "./pages/Ingresos";
import Deudas      from "./pages/Deudas";
import { useState, useEffect } from "react";

const PAGES = {
  dashboard:   Dashboard,
  registro:    Registro,
  presupuesto: Presupuesto,
  tarjetas:    Tarjetas,
  ingresos:    Ingresos,
  deudas:      Deudas,
};

function LoadingScreen({ text = "Cargando..." }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-ghost)" }}>{text}</div>
    </div>
  );
}

function AppShellInner({ logout, userEmail }) {
  const { state, dispatch } = useApp();
  const [page, setPage] = useState("dashboard");

  const afpInfo  = state.afps?.find(a => a.id === state.config?.afpId);
  const afpLabel = afpInfo?.label ?? null;
  const afpTasa  = afpInfo?.tasa  ?? 0;

  // Auto-limpiar el mensaje de error después de 4 segundos
  useEffect(() => {
    if (!state.errorMsg) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 4000);
    return () => clearTimeout(t);
  }, [state.errorMsg]);

  if (state.loading) return <LoadingScreen text="Cargando datos..." />;
  if (!state.config?.afpId) return <Onboarding />;

  const PageComponent = PAGES[page] || Dashboard;
  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} onLogout={logout} userEmail={userEmail} afpLabel={afpLabel} afpTasa={afpTasa} />
      <main style={{ marginLeft: 215, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        <PageComponent />
      </main>
      {state.errorMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--red-bg)", border: "1px solid var(--red)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red)",
          boxShadow: "0 4px 24px #0006", zIndex: 9999, maxWidth: 420,
        }}>
          <span style={{ fontWeight: 700 }}>⚠</span>
          <span style={{ flex: 1 }}>{state.errorMsg}</span>
          <button onClick={() => dispatch({ type: "CLEAR_ERROR" })} style={{
            background: "none", border: "none", color: "var(--red)",
            cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1,
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

function AppShell() {
  const { user, loading, logout } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Login />;

  return (
    <AppProvider>
      <AppShellInner logout={logout} userEmail={user.email} />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
