// App.jsx — raíz de la app
// Auth loading → Login → AppProvider (hidratación) → app completa

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard   from "./pages/Dashboard";
import Registro    from "./pages/Registro";
import Presupuesto from "./pages/Presupuesto";
import Tarjetas    from "./pages/Tarjetas";
import Ingresos    from "./pages/Ingresos";
import Deudas      from "./pages/Deudas";
import { useState } from "react";

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
  const { state } = useApp();
  const [page, setPage] = useState("dashboard");

  if (state.loading) return <LoadingScreen text="Cargando datos..." />;

  const PageComponent = PAGES[page] || Dashboard;
  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} onLogout={logout} userEmail={userEmail} />
      <main style={{ marginLeft: 215, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        <PageComponent />
      </main>
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
