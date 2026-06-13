// Tests de la lógica de dominio (boleta peruana, ciclo de tarjeta, formato).
// Ejecutar: pnpm test

import { describe, it, expect, vi, afterEach } from "vitest";
import { fmt, diasPara, calcNeto, periodoActual, agruparPorCategoria, uid } from "./index";
import { SUELDO } from "../constants";

describe("fmt", () => {
  it("formatea con 2 decimales por defecto", () => {
    expect(fmt(1234.5)).toBe("1,234.50");
  });
  it("devuelve 0.00 ante valores no numéricos", () => {
    expect(fmt("abc")).toBe("0.00");
    expect(fmt(null)).toBe("0.00");
  });
  it("respeta el parámetro de decimales", () => {
    expect(fmt(10, 0)).toBe("10");
  });
});

describe("calcNeto — boleta peruana", () => {
  it("suma asignación familiar a la base", () => {
    const { base } = calcNeto(1443);
    expect(base).toBe(1443 + SUELDO.ASIG_FAMILIAR);
  });

  it("sin horas extra ni AFP, bruto = base y neto = bruto", () => {
    const { bruto, afp, neto } = calcNeto(1443, 0, 0, 0, 0);
    expect(bruto).toBe(1556);   // 1443 + 113
    expect(afp).toBe(0);
    expect(neto).toBe(1556);
  });

  it("descuenta AFP sobre el bruto", () => {
    // bruto 1556, AFP 11.37% = 176.92 → neto 1379.08
    const { afp, neto } = calcNeto(1443, 0, 0, 0, 11.37);
    expect(afp).toBeCloseTo(176.92, 2);
    expect(neto).toBeCloseTo(1379.08, 2);
  });

  it("suma horas extra al bruto con sus valores hora", () => {
    const { bruto } = calcNeto(1443, 2, 1, 0, 0);
    const esperado = 1556 + 2 * SUELDO.VALOR_HE25 + 1 * SUELDO.VALOR_HE100;
    expect(bruto).toBeCloseTo(esperado, 2);
  });

  it("suma extras al neto después de descontar AFP", () => {
    const { neto } = calcNeto(1443, 0, 0, 500, 0);
    expect(neto).toBe(2056); // 1556 + 500
  });
});

describe("diasPara", () => {
  afterEach(() => vi.useRealTimers());

  it("devuelve null si no hay día", () => {
    expect(diasPara(null)).toBeNull();
    expect(diasPara(0)).toBeNull();
  });

  it("calcula días hasta un día futuro del mes en curso", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 13)); // 13 jun 2026
    expect(diasPara(20)).toBe(7);
  });

  it("apunta al mes siguiente si el día ya pasó", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 20)); // 20 jun 2026
    // día 10 ya pasó → siguiente es 10 jul = 20 días
    expect(diasPara(10)).toBe(20);
  });
});

describe("periodoActual — ciclo BCP (cierre día 10)", () => {
  afterEach(() => vi.useRealTimers());

  it("antes del día 10, el periodo empezó el mes anterior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 5)); // 5 jun
    const p = periodoActual();
    expect(p.desde.getMonth()).toBe(4); // mayo
    expect(p.desde.getDate()).toBe(10);
    expect(p.hasta.getMonth()).toBe(5); // junio
    expect(p.hasta.getDate()).toBe(9);
  });

  it("desde el día 10, el periodo empieza este mes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15)); // 15 jun
    const p = periodoActual();
    expect(p.desde.getMonth()).toBe(5); // junio
    expect(p.desde.getDate()).toBe(10);
    expect(p.hasta.getMonth()).toBe(6); // julio
  });
});

describe("agruparPorCategoria", () => {
  const cats = [
    { id: "alimentacion", label: "Alimentación" },
    { id: "transporte", label: "Transporte" },
    { id: "salud", label: "Salud" },
  ];
  const gastos = [
    { categoriaId: "alimentacion", monto: 50 },
    { categoriaId: "alimentacion", monto: 30 },
    { categoriaId: "transporte", monto: 20 },
  ];

  it("suma montos por categoría", () => {
    const r = agruparPorCategoria(gastos, cats);
    expect(r.find(c => c.id === "alimentacion").total).toBe(80);
    expect(r.find(c => c.id === "transporte").total).toBe(20);
  });

  it("omite categorías sin gasto", () => {
    const r = agruparPorCategoria(gastos, cats);
    expect(r.find(c => c.id === "salud")).toBeUndefined();
    expect(r).toHaveLength(2);
  });
});

describe("uid", () => {
  it("genera ids distintos", () => {
    expect(uid()).not.toBe(uid());
  });
});
