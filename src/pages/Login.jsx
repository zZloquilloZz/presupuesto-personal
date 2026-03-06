// Login.jsx — pantalla de acceso con email + contraseña
// También permite crear cuenta nueva desde aquí

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();

  const [modo,     setModo]     = useState("login");  // "login" | "register"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [ok,       setOk]       = useState(false);  // registro exitoso

  const submit = async () => {
    if (!email || !password) { setError("Completa email y contraseña"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }

    setLoading(true);
    setError(null);
    try {
      if (modo === "login") {
        await login(email, password);
        // App.jsx detecta el cambio de sesión y muestra el dashboard
      } else {
        await register(email, password);
        setOk(true); // Supabase envía email de confirmación
      }
    } catch (e) {
      setError(
        e.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : e.message === "User already registered"
          ? "Este email ya tiene cuenta — inicia sesión"
          : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Pantalla post-registro: pide confirmar email
  if (ok) {
    return (
      <div style={styles.bg}>
        <div style={{ ...styles.card, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:16 }}>📧</div>
          <div style={{ fontFamily:"var(--font-sans)", fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:10 }}>
            Revisa tu correo
          </div>
          <div style={{ fontSize:12, color:"var(--text-dim)", lineHeight:1.7, marginBottom:20 }}>
            Te enviamos un link de confirmación a<br/>
            <strong style={{ color:"var(--blue)" }}>{email}</strong>
          </div>
          <div style={{ fontSize:10, color:"var(--text-ghost)", marginBottom:20 }}>
            Después de confirmar, vuelve aquí e inicia sesión.
          </div>
          <button onClick={() => { setOk(false); setModo("login"); }} style={styles.btn}>
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:28, fontWeight:700, background:"linear-gradient(135deg,#22C55E,#38BDF8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            S/.
          </div>
          <div style={{ fontFamily:"var(--font-sans)", fontSize:15, fontWeight:800, color:"var(--text-primary)", marginTop:4 }}>
            Presupuesto Personal
          </div>
          <div style={{ fontSize:10, color:"var(--text-ghost)", marginTop:4 }}>
            {modo === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta — es gratis"}
          </div>
        </div>

        {/* Tabs login / registro */}
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3, marginBottom:22 }}>
          {[{ k:"login", l:"Iniciar sesión" }, { k:"register", l:"Crear cuenta" }].map(t => (
            <button key={t.k} onClick={() => { setModo(t.k); setError(null); }} style={{
              flex:1, background: modo === t.k ? "var(--bg-hover)" : "transparent",
              border: modo === t.k ? "1px solid var(--green)" : "1px solid transparent",
              borderRadius:"var(--radius-sm)", color: modo === t.k ? "var(--green)" : "var(--text-muted)",
              fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700,
              padding:"7px 0", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase",
            }}>{t.l}</button>
          ))}
        </div>

        {/* Campos */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={styles.label}>Email</div>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width:"100%", boxSizing:"border-box" }}
              autoComplete="email"
            />
          </div>
          <div>
            <div style={styles.label}>Contraseña</div>
            <input
              type="password"
              placeholder={modo === "register" ? "Mínimo 6 caracteres" : "••••••••"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width:"100%", boxSizing:"border-box" }}
              autoComplete={modo === "login" ? "current-password" : "new-password"}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:"var(--radius-sm)", padding:"9px 12px", fontSize:11, color:"var(--red)", fontFamily:"var(--font-sans)" }}>
              {error}
            </div>
          )}

          {/* Botón */}
          <button onClick={submit} disabled={loading} style={{ ...styles.btn, opacity: loading ? .6 : 1 }}>
            {loading
              ? "..."
              : modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop:20, textAlign:"center", fontSize:9, color:"var(--text-ghost)", lineHeight:1.7 }}>
          Datos guardados en la nube — accesibles desde cualquier dispositivo
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-base)",
    padding: 16,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "32px 28px",
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 8px 40px #00000044",
  },
  label: {
    fontSize: 9,
    color: "var(--text-ghost)",
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 6,
  },
  btn: {
    width: "100%",
    background: "linear-gradient(135deg,#22C55E,#4ADE80)",
    border: "none",
    borderRadius: "var(--radius-md)",
    color: "#0A0C10",
    fontFamily: "var(--font-sans)",
    fontSize: 11,
    fontWeight: 800,
    padding: "12px 0",
    cursor: "pointer",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};
