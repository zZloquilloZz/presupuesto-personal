import { SUELDO } from "../constants";

// Formatea un numero como moneda peruana: 1234.5 → "1,234.50"
export function fmt(v, decimals = 2) {
  const n = parseFloat(v);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Cuantos dias faltan para el dia N del mes
// Si el dia ya paso, apunta al mes siguiente
export function diasPara(dia) {
  if (!dia) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // normalizar a inicio del día para comparación exacta
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), parseInt(dia));
  if (fecha < hoy) fecha.setMonth(fecha.getMonth() + 1);
  return Math.ceil((fecha - hoy) / 86400000);
}

// Calcula neto segun boleta
// afpTasa: porcentaje de descuento AFP (ej: 11.37 para Integra, 13 para ONP, 0 sin aporte)
// Retorna { base, bruto, afp, neto }
export function calcNeto(haberBasico, he25 = 0, he100 = 0, extras = 0, afpTasa = 0) {
  const base  = haberBasico + SUELDO.ASIG_FAMILIAR;
  const bruto = base + (he25 * SUELDO.VALOR_HE25) + (he100 * SUELDO.VALOR_HE100);
  const afp   = parseFloat((bruto * (afpTasa || 0) / 100).toFixed(2));
  const neto  = parseFloat((bruto - afp + extras).toFixed(2));
  return { base, bruto, afp, neto };
}

// Periodo activo del ciclo BCP (cierre dia 10)
export function periodoActual() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const desde = dia >= 10
    ? new Date(hoy.getFullYear(), hoy.getMonth(), 10)
    : new Date(hoy.getFullYear(), hoy.getMonth() - 1, 10);
  const hasta = dia >= 10
    ? new Date(hoy.getFullYear(), hoy.getMonth() + 1, 9)
    : new Date(hoy.getFullYear(), hoy.getMonth(), 9);
  return {
    desde,
    hasta,
    label: `${desde.getDate()}/${desde.getMonth() + 1} → ${hasta.getDate()}/${hasta.getMonth() + 1}`,
  };
}

// Agrupa gastos por categoria y suma montos, omite categorias en cero
export function agruparPorCategoria(gastos, categorias) {
  return categorias
    .map(c => ({
      ...c,
      total: gastos
        .filter(g => g.categoriaId === c.id)
        .reduce((sum, g) => sum + g.monto, 0),
    }))
    .filter(c => c.total > 0);
}

// Fecha ISO → "05 mar. 2026"
export function fechaLegible(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ID unico basado en timestamp
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
