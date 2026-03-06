// Sidebar.jsx — Navegacion lateral fija.
// En mobile se convierte en drawer (transform CSS).
// NAV_ITEMS se exporta para usarlo en App.jsx (topbar mobile).

const NAV_ITEMS = [
  { id:"dashboard",   label:"Dashboard",   sub:"Resumen del mes",     icon:"DSH", color:"var(--blue)"   },
  { id:"registro",    label:"Registro",    sub:"Gastos y movimientos", icon:"REG", color:"var(--green)"  },
  { id:"presupuesto", label:"Presupuesto", sub:"vs Real",              icon:"PRE", color:"var(--yellow)" },
  { id:"tarjetas",    label:"Tarjetas",    sub:"BCP y AMEX",           icon:"TRJ", color:"var(--pink)"   },
  { id:"ingresos",    label:"Ingresos",    sub:"Sueldo y extras",      icon:"ING", color:"var(--lime)"   },
  { id:"deudas",      label:"Deudas",      sub:"Prestamos",            icon:"DEU", color:"var(--red)"    },
];

export default function Sidebar({ modulo, setModulo, open, setOpen }) {
  return (
    <>
      {/* Overlay mobile */}
      <div onClick={() => setOpen(false)} style={{
        display: open ? "block" : "none",
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.65)", zIndex: 40,
      }}/>

      <aside className={`sidebar${open ? " open" : ""}`} style={{
        width: "var(--sidebar-w)",
        background: "var(--bg-base)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.2em", color: "var(--text-ghost)",
            textTransform: "uppercase", marginBottom: 4,
          }}>Dashboard</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 800,
            color: "var(--text-primary)", lineHeight: 1.25,
          }}>Presupuesto<br/>Personal</div>
          <div style={{ marginTop: 7, fontSize: 9, color: "var(--text-ghost)", fontFamily: "var(--font-mono)" }}>
            {new Date().toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
          {NAV_ITEMS.map(item => {
            const active = modulo === item.id;
            return (
              <button key={item.id}
                onClick={() => { setModulo(item.id); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px",
                  background: active ? `color-mix(in srgb, ${item.color} 12%, transparent)` : "transparent",
                  border: active ? `1px solid color-mix(in srgb, ${item.color} 35%, transparent)` : "1px solid transparent",
                  borderRadius: "var(--radius-lg)",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  transition: "all .15s",
                }}
                onMouseOver={e => { if(!active) e.currentTarget.style.background = "var(--bg-input)"; }}
                onMouseOut={e  => { if(!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "var(--radius-sm)",
                  background: active ? `color-mix(in srgb, ${item.color} 18%, transparent)` : "var(--bg-input)",
                  border: `1px solid ${active ? `color-mix(in srgb, ${item.color} 40%, transparent)` : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700,
                  color: active ? item.color : "var(--text-dim)",
                  flexShrink: 0, fontFamily: "var(--font-sans)",
                }}>{item.icon}</div>

                <div>
                  <div style={{
                    fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
                    color: active ? item.color : "var(--text-muted)",
                  }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: "var(--text-ghost)", marginTop: 1 }}>{item.sub}</div>
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
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>Sesion activa</div>
            <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{userEmail}</div>
          </div>
          <button onClick={onLogout} style={{
            background:"var(--red-bg)", border:"1px solid var(--red-border)",
            borderRadius:"var(--radius-sm)", color:"var(--red)",
            fontFamily:"var(--font-sans)", fontSize:8, fontWeight:700,
            padding:"5px 8px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase", flexShrink:0,
          }}>Salir</button>
        </div>

        {/* Footer AFP */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 8, color: "var(--text-ghost)", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>AFP Integra</div>
          <div style={{ fontSize: 9, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>11.37% descuento en boleta</div>
        </div>
      </aside>
    </>
  );
}

export { NAV_ITEMS };
