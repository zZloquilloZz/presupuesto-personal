// ── AFP INTEGRA ──────────────────────────────────────
// Porcentajes vigentes hasta Dic 2026 segun licitacion SBS
export const AFP = {
  FONDO:           10.00,  // Aporte obligatorio al fondo
  INVALIDEZ:        1.37,  // Seguro de invalidez y sobrevivencia
  COMISION_FLUJO:   0.00,  // Integra no cobra comision en boleta
  TOTAL:           11.37,  // Total descuento sobre bruto
  COMISION_SALDO:   1.20,  // % anual sobre fondo acumulado (no aparece en boleta)
};

// ── SUELDO BASE ──────────────────────────────────────
export const SUELDO = {
  HABER_BASICO:  1443.00,  // Editable desde Modulo Ingresos
  ASIG_FAMILIAR:  113.00,  // Fija por ley, no cambia
  VALOR_HE25:       8.10,  // Valor por hora extra al 25%
  VALOR_HE100:     12.968, // Valor por hora extra al 100%
  DIA_DEPOSITO:      28,   // Dia habitual de deposito
};

// ── TARJETAS DE CREDITO ──────────────────────────────
export const TARJETAS = {
  BCP: {
    id:            "bcp",
    nombre:        "BCP Visa",
    color:         "#38BDF8",
    lineaCredito:  5500,
    cierre:        10,   // Dia de cierre del ciclo
    pagoDia:       5,    // Dia limite de pago
    tea:           39.99,
    tcea:          46.97,
  },
  AMEX: {
    id:            "amex",
    nombre:        "Interbank AMEX Gold",
    color:         "#F59E0B",
    lineaCredito:  1260,
    cierre:        6,
    pagoDia:       2,
    tea:           29.99,
    tcea:          34.97,
  },
};

// ── CATEGORIAS DE GASTO ──────────────────────────────
export const CATEGORIAS = [
  { id: "alimentacion", label: "Alimentacion",    color: "#F59E0B", emoji: "🍽" },
  { id: "transporte",   label: "Transporte",      color: "#3B82F6", emoji: "🚌" },
  { id: "entrete",      label: "Entretenimiento", color: "#8B5CF6", emoji: "🎮" },
  { id: "salud",        label: "Salud",           color: "#10B981", emoji: "💊" },
  { id: "educacion",    label: "Educacion",       color: "#06B6D4", emoji: "📚" },
  { id: "hogar",        label: "Hogar",           color: "#F97316", emoji: "🏠" },
  { id: "ropa",         label: "Ropa",            color: "#EC4899", emoji: "👕" },
  { id: "servicios",    label: "Servicios",       color: "#84CC16", emoji: "📱" },
  { id: "otros",        label: "Otros",           color: "#6B7280", emoji: "📦" },
];

// ── GASTOS FIJOS ─────────────────────────────────────
// Lista vacia por defecto — el usuario agrega los suyos desde Dashboard
// Estructura de cada item: { id, descripcion, monto, dia }
export const GASTOS_FIJOS_DEFAULT = [];

// ── EMAILJS ──────────────────────────────────────────
export const EMAILJS = {
  SERVICE_ID:  "service_4gu8pjb",
  TEMPLATE_ID: "template_tinan0o",
  PUBLIC_KEY:  "RuW3rufBECJykKP-F",
  SCRIPT_URL:  "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js",
};

// ── MESES ────────────────────────────────────────────
export const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
