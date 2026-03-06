// App.jsx — raiz de la app
// Muestra Login si no hay sesión, Dashboard si hay sesión activa.

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import Registro     from "./pages/Registro";
import Presupuesto  from "./pages/Presupuesto";
import Tarjetas     from "./pages/Tarjetas";
import Ingresos     from "./pages/Ingresos";
import Deudas       from "./pages/Deudas";
import { useState } from "react";

const PAGES = {
  dashboard:   Dashboard,
  registro:    Registro,
  presupuesto: Presupuesto,
  tarjetas:    Tarjetas,
  ingresos:    Ingresos,
  deudas:      Deudas,
};

// Spinner de carga mientras Supabase verifica la sesión
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-base)" }}>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"var(--text-ghost)" }}>
        Cargando...
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  // Mientras verifica sesión guardada
  if (loading) return <LoadingScreen/>;

  // Sin sesión → pantalla de login
  if (!user) return <Login/>;

  // Con sesión → app completa envuelta en AppProvider (datos del usuario)
  const PageComponent = PAGES[page] || Dashboard;

  return (
    <AppProvider>
      <div className="app-layout">
        <Sidebar activePage={page} onNavigate={setPage} onLogout={logout} userEmail={user.email}/>
        <main style={{ marginLeft: 215, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          <PageComponent/>
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell/>
    </AuthProvider>
  );
}
