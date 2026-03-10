// ── AFP INTEGRA ──────────────────────────────────────
export const AFP = {
  FONDO:           10.00,
  INVALIDEZ:        1.37,
  COMISION_FLUJO:   0.00,
  TOTAL:           11.37,
  COMISION_SALDO:   1.20,
};

// ── SUELDO BASE ──────────────────────────────────────
export const SUELDO = {
  HABER_BASICO:  1443.00,
  ASIG_FAMILIAR:  113.00,
  VALOR_HE25:       8.10,
  VALOR_HE100:     12.968,
  DIA_DEPOSITO:      28,
};

// ── EMAILJS ──────────────────────────────────────────
export const EMAILJS = {
  SERVICE_ID:  "service_4gu8pjb",
  TEMPLATE_ID: "template_tinan0o",
  PUBLIC_KEY:  "RuW3rufBECJykKP-F",
  SCRIPT_URL:  "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js",
};

// ── MESES ────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];

// ── CATEGORIAS (fallback local si los catálogos aún no cargaron) ──
// La fuente de verdad es la tabla `categorias` en Supabase.
export const CATEGORIAS_FALLBACK = [
  { id: "alimentacion", label: "Alimentación", color: "#F59E0B", emoji: "🍽" },
  { id: "transporte",   label: "Transporte",   color: "#3B82F6", emoji: "🚌" },
  { id: "entrete",      label: "Entretenimiento", color: "#8B5CF6", emoji: "🎮" },
  { id: "salud",        label: "Salud",         color: "#10B981", emoji: "💊" },
  { id: "educacion",    label: "Educación",     color: "#06B6D4", emoji: "📚" },
  { id: "hogar",        label: "Hogar",         color: "#F97316", emoji: "🏠" },
  { id: "ropa",         label: "Ropa",          color: "#EC4899", emoji: "👕" },
  { id: "otros",        label: "Otros",         color: "#6B7280", emoji: "📦" },
];

// ── METODOS (fallback local) ──────────────────────────
export const METODOS_FALLBACK = [
  { id: "debito",   label: "Débito"   },
  { id: "efectivo", label: "Efectivo" },
  { id: "credito",  label: "Crédito"  },
];
