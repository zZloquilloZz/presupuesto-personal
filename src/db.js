// db.js — todas las queries a Supabase en un solo lugar
// Cada función recibe userId para filtrar datos del usuario

import { supabase } from "./supabase";

// ── Helpers ───────────────────────────────────────────

// Lanza error si Supabase devuelve uno
function check(error) {
  if (error) throw new Error(error.message);
}

// ── GASTOS ────────────────────────────────────────────

export const db = {

  gastos: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .eq("user_id", userId)
        .order("fecha", { ascending: false });
      check(error);
      return data;
    },

    async add(userId, gasto) {
      const { data, error } = await supabase
        .from("gastos")
        .insert({ ...gasto, user_id: userId })
        .select()
        .single();
      check(error);
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("gastos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      check(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      check(error);
    },
  },

  // ── GASTOS FIJOS ──────────────────────────────────

  gastosFijos: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .select("*")
        .eq("user_id", userId)
        .order("dia");
      check(error);
      return data;
    },

    async add(userId, fijo) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .insert({ ...fijo, user_id: userId })
        .select()
        .single();
      check(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
      check(error);
    },
  },

  // ── GASTOS RECURRENTES ────────────────────────────

  recurrentes: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .select("*")
        .eq("user_id", userId);
      check(error);
      return data;
    },

    async add(userId, rec) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .insert({ ...rec, user_id: userId })
        .select()
        .single();
      check(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_recurrentes").delete().eq("id", id);
      check(error);
    },
  },

  // ── INGRESOS ──────────────────────────────────────

  ingresos: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("historial_ingresos")
        .select("*")
        .eq("user_id", userId)
        .order("anio").order("mes_idx");
      check(error);
      // Normalizar snake_case → camelCase para que el resto del app no cambie
      return data.map(normalizeIngreso);
    },

    async save(userId, ingreso) {
      // upsert: inserta o actualiza si ya existe el mismo mes/año
      const { data, error } = await supabase
        .from("historial_ingresos")
        .upsert(
          { ...toSnakeIngreso(ingreso), user_id: userId },
          { onConflict: "user_id,mes_idx,anio" }
        )
        .select()
        .single();
      check(error);
      return normalizeIngreso(data);
    },
  },

  // ── PRESUPUESTOS ──────────────────────────────────

  presupuestos: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("user_id", userId);
      check(error);
      // Convertir array [{ categoria, monto }] → objeto { alimentacion: 800, ... }
      return Object.fromEntries((data || []).map(p => [p.categoria, p.monto]));
    },

    async set(userId, categoria, monto) {
      const { error } = await supabase
        .from("presupuestos")
        .upsert(
          { user_id: userId, categoria, monto, updated_at: new Date().toISOString() },
          { onConflict: "user_id,categoria" }
        );
      check(error);
    },
  },

  // ── CUOTAS TARJETAS ───────────────────────────────

  cuotas: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .select("*")
        .eq("user_id", userId);
      check(error);
      // Agrupar por tarjeta: { bcp: { cuotasActivas: [...] }, amex: { ... } }
      const bcp  = (data || []).filter(c => c.tarjeta === "bcp").map(normalizeCuota);
      const amex = (data || []).filter(c => c.tarjeta === "amex").map(normalizeCuota);
      return { bcp: { cuotasActivas: bcp }, amex: { cuotasActivas: amex } };
    },

    async add(userId, tarjeta, cuota) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .insert({ ...toSnakeCuota(cuota), tarjeta, user_id: userId })
        .select()
        .single();
      check(error);
      return normalizeCuota(data);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .update(toSnakeCuota(payload))
        .eq("id", id)
        .select()
        .single();
      check(error);
      return normalizeCuota(data);
    },

    async delete(id) {
      const { error } = await supabase.from("cuotas_tarjetas").delete().eq("id", id);
      check(error);
    },
  },

  // ── DEUDAS ────────────────────────────────────────

  deudas: {
    async getAll(userId) {
      const { data, error } = await supabase
        .from("deudas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");
      check(error);
      return (data || []).map(normalizeDeuda);
    },

    async add(userId, deuda) {
      const { data, error } = await supabase
        .from("deudas")
        .insert({ ...toSnakeDeuda(deuda), user_id: userId })
        .select()
        .single();
      check(error);
      return normalizeDeuda(data);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("deudas")
        .update(toSnakeDeuda(payload))
        .eq("id", id)
        .select()
        .single();
      check(error);
      return normalizeDeuda(data);
    },

    async delete(id) {
      const { error } = await supabase.from("deudas").delete().eq("id", id);
      check(error);
    },
  },

  // ── CONFIG ────────────────────────────────────────

  config: {
    async get(userId) {
      const { data, error } = await supabase
        .from("config")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      check(error);
      if (!data) return null;
      return { haberBasico: data.haber_basico, diaDeposito: data.dia_deposito };
    },

    async save(userId, config) {
      const { error } = await supabase
        .from("config")
        .upsert({
          user_id:      userId,
          haber_basico: config.haberBasico,
          dia_deposito: config.diaDeposito,
          updated_at:   new Date().toISOString(),
        }, { onConflict: "user_id" });
      check(error);
    },
  },
};

// ── Normalizadores snake_case ↔ camelCase ─────────────

function normalizeIngreso(r) {
  return {
    id:            r.id,
    mesIdx:        r.mes_idx,
    anio:          r.anio,
    haberBasico:   r.haber_basico,
    he25:          r.he25,
    he100:         r.he100,
    gratificacion: r.gratificacion,
    cts:           r.cts,
    bono:          r.bono,
    otroExtra:     r.otro_extra,
    otroLabel:     r.otro_label,
    bruto:         r.bruto,
    afp:           r.afp,
    neto:          r.neto,
  };
}

function toSnakeIngreso(r) {
  return {
    mes_idx:       r.mesIdx,
    anio:          r.anio,
    haber_basico:  r.haberBasico,
    he25:          r.he25,
    he100:         r.he100,
    gratificacion: r.gratificacion,
    cts:           r.cts,
    bono:          r.bono,
    otro_extra:    r.otroExtra,
    otro_label:    r.otroLabel,
    bruto:         r.bruto,
    afp:           r.afp,
    neto:          r.neto,
  };
}

function normalizeCuota(r) {
  return {
    id:          r.id,
    desc:        r.descripcion,
    montoTotal:  r.monto_total,
    cuota:       r.cuota,
    totalCuotas: r.total_cuotas,
    pagadas:     r.pagadas,
  };
}

function toSnakeCuota(r) {
  return {
    descripcion:  r.desc,
    monto_total:  r.montoTotal,
    cuota:        r.cuota,
    total_cuotas: r.totalCuotas,
    pagadas:      r.pagadas,
  };
}

function normalizeDeuda(r) {
  return {
    id:              r.id,
    tipo:            r.tipo,
    descripcion:     r.descripcion,
    acreedor:        r.acreedor,
    montoOriginal:   r.monto_original,
    cuotaMensual:    r.cuota_mensual,
    mesesPactados:   r.meses_pactados,
    pagosRealizados: r.pagos_realizados,
    diaVencimiento:  r.dia_vencimiento,
    fechaInicio:     r.fecha_inicio,
    notas:           r.notas,
  };
}

function toSnakeDeuda(r) {
  return {
    tipo:             r.tipo,
    descripcion:      r.descripcion,
    acreedor:         r.acreedor,
    monto_original:   r.montoOriginal,
    cuota_mensual:    r.cuotaMensual,
    meses_pactados:   r.mesesPactados,
    pagos_realizados: r.pagosRealizados,
    dia_vencimiento:  r.diaVencimiento,
    fecha_inicio:     r.fechaInicio,
    notas:            r.notas,
  };
}
