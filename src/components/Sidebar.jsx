// Sidebar.jsx — Navegacion lateral fija.
// En mobile se convierte en drawer (transform CSS).
// NAV_ITEMS se exporta para usarlo en App.jsx (topbar mobile).

const NAV_ITEMS = [
  { id:"dashboard",   label:"Dashboard",   sub:"Resumen del mes",     icon:"DSH", color:"var(--blue)"   },
  { id:"registro",    label:"Registro",    sub:"Gastos y movimientos", icon:"REG", color:"var(--green)"  },
  { id:"presupuesto", label:"Presupuesto", sub:"vs Real",              icon:"PRE", color:"var(--yellow)" },
  { id:"tarjetas",    label:"Tarjetas",    sub:"BCP y AMEX",           icon:"TRJ", color:"var(--pink)"   },
  { id:"ingresos",    label:"Ingresos",    sub:"Sueldo y extras",      icon:"ING", color:"var(--lime)"   },
  { id:"deudas",      label:"Deudas",      sub:"Prestamos",            icon:"DEU", color:"#F87171"    },
];

export default function Sidebar({ activePage, onNavigate, onLogout, userEmail }) {
  return (
    <>
      <aside style={{
        width: 215,
        minWidth: 215,
        backgroundColor: "#0A0C10",
        borderRight: "1px solid #1E2530",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 100,
        overflow: "hidden",
        boxSizing: "border-box",
        isolation: "isolate",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid #1E2530" }}>
          <div style={{
            fontFamily: "Syne, sans-serif", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.2em", color: "#374151",
            textTransform: "uppercase", marginBottom: 4,
          }}>Dashboard</div>
          <div style={{
            fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 800,
            color: "#F1F5F9", lineHeight: 1.25,
          }}>Presupuesto<br/>Personal</div>
          <div style={{ marginTop: 7, fontSize: 9, color: "#374151", fontFamily: "DM Mono, monospace" }}>
            {new Date().toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <button key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px",
                  background: active ? "#161B24" : "transparent",
                  border: active ? `1px solid #2D3748` : "1px solid transparent",
                  borderRadius: "11px",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  transition: "all .15s",
                }}
                onMouseOver={e => { if(!active) e.currentTarget.style.background = "#111318"; }}
                onMouseOut={e  => { if(!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "6px",
                  background: active ? "#1A2030" : "#111318",
                  border: active ? `1px solid ${item.color}44` : "1px solid #1E2530",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700,
                  color: active ? item.color : "#475569",
                  flexShrink: 0, fontFamily: "Syne, sans-serif",
                }}>{item.icon}</div>

                <div>
                  <div style={{
                    fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700,
                    color: active ? item.color : "#64748B",
                  }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: "#374151", marginTop: 1 }}>{item.sub}</div>
                </div>

                {active && (
                  <div style={{
                    marginLeft: "auto", width: 3, height: 20,
                    borderRadius: 2, background: item.color,
                  }}/>
                )}
              </button>
            );
          })}
        </nav>

        {/* Usuario + logout */}
        <div style={{ padding:"11px 16px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:8, color:"#374151", fontFamily:"Syne, sans-serif", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>Sesion activa</div>
            <div style={{ fontSize:9, color:"#475569", fontFamily:"DM Mono, monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{userEmail}</div>
          </div>
          <button onClick={onLogout} style={{
            background:"#1E0A0A", border:"1px solid var(--red-border)",
            borderRadius:"6px", color:"#F87171",
            fontFamily:"Syne, sans-serif", fontSize:8, fontWeight:700,
            padding:"5px 8px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase", flexShrink:0,
          }}>Salir</button>
        </div>

        {/* Footer AFP */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #1E2530" }}>
          <div style={{ fontSize: 8, color: "#374151", fontFamily: "Syne, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>AFP Integra</div>
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "DM Mono, monospace" }}>11.37% descuento en boleta</div>
        </div>
      </aside>
    </>
  );
}

export { NAV_ITEMS };
