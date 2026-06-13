// App.jsx — raíz de la app
// Auth loading → Login → AppProvider (hidratación) → app completa

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar     from "./components/Sidebar";
import Login       from "./pages/Login";
import { useState, useEffect, lazy, Suspense } from "react";

// Páginas con lazy load: cada una en su propio chunk.
// Recharts (pesado) sólo se descarga al abrir Dashboard.
const Onboarding  = lazy(() => import("./pages/Onboarding"));
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Registro    = lazy(() => import("./pages/Registro"));
const Presupuesto = lazy(() => import("./pages/Presupuesto"));
const Tarjetas    = lazy(() => import("./pages/Tarjetas"));
const Ingresos    = lazy(() => import("./pages/Ingresos"));
const Deudas      = lazy(() => import("./pages/Deudas"));

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navegar cierra el drawer en móvil
  const navegar = (id) => { setPage(id); setSidebarOpen(false); };

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
  if (!state.config?.afpId) return (
    <Suspense fallback={<LoadingScreen />}>
      <Onboarding />
    </Suspense>
  );

  const PageComponent = PAGES[page] || Dashboard;
  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={navegar} onLogout={logout} userEmail={userEmail} afpLabel={afpLabel} afpTasa={afpTasa} open={sidebarOpen} />

      {/* Topbar móvil — solo visible <768px vía CSS */}
      <header className="topbar">
        <button className="topbar-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Abrir menú" aria-expanded={sidebarOpen}>
          <span/><span/><span/>
        </button>
        <span className="topbar-title">Presupuesto Personal</span>
      </header>

      {/* Backdrop para cerrar el drawer al tocar fuera */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <Suspense fallback={<LoadingScreen />}>
          <PageComponent />
        </Suspense>
      </main>
      {state.errorMsg && (
        <div role="alert" aria-live="assertive" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--red-bg)", border: "1px solid var(--red)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red)",
          boxShadow: "0 4px 24px #0006", zIndex: 9999, maxWidth: 420,
        }}>
          <span style={{ fontWeight: 700 }} aria-hidden="true">⚠</span>
          <span style={{ flex: 1 }}>{state.errorMsg}</span>
          <button onClick={() => dispatch({ type: "CLEAR_ERROR" })} aria-label="Cerrar" style={{
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
