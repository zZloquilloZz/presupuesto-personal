// ─────────────────────────────────────────────────────
// UI.jsx — Componentes reutilizables del design system
//
// Todos los componentes usan variables CSS de global.css
// (--bg-card, --border, --green, etc.) para mantener
// consistencia visual sin hardcodear colores.
//
// Componentes disponibles:
//   Card, SectionTitle, KPICard, Badge, Btn, Label
//   Field, EmptyState, ProgressBar, ChartTooltip
//   PageHeader, NumberStepper
// ─────────────────────────────────────────────────────
import { fmt } from "../utils";

// ── CARD ──
export function Card({ children, style, className = "" }) {
  return (
    <div className={className} style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: 18,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── SECTION TITLE ──
export function SectionTitle({ children, color, style }) {
  return (
    <div style={{
      fontFamily: "var(--font-sans)",
      fontSize: 10, fontWeight: 700,
      letterSpacing: "0.13em",
      textTransform: "uppercase",
      color: color || "var(--text-dim)",
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KPI CARD ──
export function KPICard({ label, value, sub, subColor, bg, border, valueColor, delay = 0 }) {
  return (
    <div className="fade-up" style={{
      background: bg || "var(--bg-input)",
      border: `1px solid ${border || "var(--border-light)"}`,
      borderRadius: 10, padding: "14px 16px",
      animationDelay: `${delay}s`,
    }}>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700,
        color: "var(--text-dim)", textTransform: "uppercase",
        letterSpacing: "0.13em", marginBottom: 8,
      }}>{label}</div>
      <div className="count-up" style={{
        fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 500,
        color: valueColor || "var(--text-primary)",
        animationDelay: `${delay || 0}s`,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 9, marginTop: 4,
          fontFamily: "var(--font-sans)",
          color: subColor || "var(--text-dim)",
        }}>{sub}</div>
      )}
    </div>
  );
}

// ── BADGE ──
export function Badge({ children, color, style }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700,
      color: color || "var(--text-muted)",
      background: (color || "#64748B") + "22",
      padding: "2px 7px", borderRadius: 4,
      fontFamily: "var(--font-sans)",
      letterSpacing: "0.08em",
      ...style,
    }}>
      {children}
    </span>
  );
}

// ── BUTTON ──
export function Btn({ children, onClick, variant = "default", size = "md", disabled, style }) {
  const variants = {
    default:  { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" },
    primary:  { background: "linear-gradient(135deg,#22C55E,#4ADE80)", border: "none", color: "#0A0C10" },
    danger:   { background: "linear-gradient(135deg,#EF4444,#F87171)", border: "none", color: "#fff" },
    warning:  { background: "linear-gradient(135deg,#D97706,#FBBF24)", border: "none", color: "#0A0C10" },
    ghost:    { background: "none", border: "none", color: "var(--text-ghost)" },
    outline:  { background: "none", border: "1px solid var(--border)", color: "var(--text-muted)" },
  };
  const sizes = {
    sm: { fontSize: 9,  padding: "5px 10px", borderRadius: "var(--radius-sm)" },
    md: { fontSize: 11, padding: "9px 16px", borderRadius: "var(--radius-md)" },
    lg: { fontSize: 12, padding: "12px 20px", borderRadius: "var(--radius-md)" },
    full: { fontSize: 12, padding: 13, borderRadius: "var(--radius-md)", width: "100%" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant],
      ...sizes[size],
      fontFamily: "var(--font-sans)", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .6 : 1, transition: "all .15s",
      display: "inline-flex", alignItems: "center", gap: 6,
      ...style,
    }}>
      {children}
    </button>
  );
}

// ── LABEL ──
export function Label({ children, color, style }) {
  return (
    <label style={{
      fontSize: 9, fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: color || "var(--text-muted)",
      marginBottom: 5, display: "block",
      fontFamily: "var(--font-sans)",
      ...style,
    }}>
      {children}
    </label>
  );
}

// ── FORM FIELD ──
export function Field({ label, error, children, labelColor }) {
  return (
    <div>
      {label && <Label color={labelColor}>{label}</Label>}
      {children}
      {error && (
        <div style={{ fontSize: 10, color: "var(--red)", marginTop: 3 }}>* {error}</div>
      )}
    </div>
  );
}

// ── EMPTY STATE ──
export function EmptyState({ icon = "[ ]", title, subtitle }) {
  return (
    <div style={{
      padding: "50px 20px", textAlign: "center",
      background: "var(--bg-card)",
      border: "1px dashed var(--border)",
      borderRadius: "var(--radius-lg)",
      color: "var(--text-ghost)",
    }}>
      <div style={{ fontSize: 26, marginBottom: 10, opacity: .3 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 10, color: "var(--text-ghost)", lineHeight: 1.6 }}>{subtitle}</div>}
    </div>
  );
}

// ── PROGRESS BAR ──
export function ProgressBar({ pct, color, height = 4, style }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height, background: "var(--border)", borderRadius: 2, overflow: "hidden", ...style }}>
      <div style={{
        width: `${clamped}%`, height: "100%",
        background: `linear-gradient(90deg,${color}88,${color})`,
        borderRadius: 2, transition: "width .6s",
      }}/>
    </div>
  );
}

// ── RECHARTS TOOLTIP ──
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-light)",
      borderRadius: 8, padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: 11,
    }}>
      {label && (
        <div style={{
          color: "var(--text-secondary)", marginBottom: 6,
          fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700,
        }}>{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: S/. {fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

// ── PAGE HEADER ──
export function PageHeader({ title, subtitle, accentColor, children }) {
  return (
    <div style={{
      borderBottom: "1px solid var(--border)", padding: "18px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "var(--bg-base)", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", color: accentColor || "var(--blue)",
          textTransform: "uppercase", marginBottom: 3,
        }}>Dashboard Presupuesto</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 19, fontWeight: 800,
          color: "var(--text-primary)",
        }}>{title}</div>
      </div>
      {children && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

// ── NUMERO CON +/- ──
export function NumberStepper({ value, onChange, min = 0, step = 1, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => onChange(Math.max(min, (parseFloat(value)||0) - step))}
        style={{ width:26, height:26, borderRadius:5, background:"var(--border)", border:"none", color:"var(--text-secondary)", fontSize:14, cursor:"pointer" }}>-</button>
      <input type="number" min={min} step={step} value={value}
        onChange={e => onChange(Math.max(min, parseFloat(e.target.value)||0))}
        style={{ textAlign:"center", width:70, border:`1px solid ${color ? color+"44":"var(--border)"}`, color: color||"var(--text-primary)", fontSize:16 }}/>
      <button onClick={() => onChange((parseFloat(value)||0) + step)}
        style={{ width:26, height:26, borderRadius:5, background:"var(--border)", border:"none", color:"var(--text-secondary)", fontSize:14, cursor:"pointer" }}>+</button>
    </div>
  );
}
