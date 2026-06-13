// ErrorBoundary.jsx — captura errores de render para evitar pantalla blanca.
// React no provee error boundaries como hook: debe ser un componente de clase.

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log para depuración (en prod se podría enviar a un servicio de monitoreo)
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-base)", padding: 24,
      }}>
        <div style={{
          maxWidth: 420, textAlign: "center",
          background: "var(--bg-card)", border: "1px solid var(--red-border)",
          borderRadius: "var(--radius-lg)", padding: "32px 28px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 800,
            color: "var(--text-primary)", marginBottom: 8,
          }}>Algo salió mal</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-secondary)",
            lineHeight: 1.6, marginBottom: 20,
          }}>
            Ocurrió un error inesperado. Recarga la página para continuar.
          </div>
          <button onClick={() => window.location.reload()} style={{
            background: "linear-gradient(135deg,#22C55E,#4ADE80)", border: "none",
            borderRadius: "var(--radius-md)", color: "#0A0C10",
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "11px 20px", cursor: "pointer",
          }}>Recargar</button>
        </div>
      </div>
    );
  }
}
