// db.js — queries Supabase, schema normalizado 3FN
// snake_case en BD ↔ camelCase en app

import { supabase } from "./supabase";

function check(error) {
  if (error) throw new Error(error.message);
}

export const db = {

  // ── Catálogos (global, sin RLS) ────────────────────────────

  catalogos: {
    async getCategorias() {
      const { data, error } = await supabase.from("categorias").select("*").order("orden");
      check(error); return data || [];
    },
    async getMetodos() {
      const { data, error } = await supabase.from("metodos_pago").select("*");
      check(error); return data || [];
    },
    async getBancos() {
      const { data, error } = await supabase.from("bancos").select("*").order("label");
      check(error); return data || [];
    },
    async getTiposDeuda() {
      const { data, error } = await supabase.from("tipos_deuda").select("*");
      check(error); return data || [];
    },
    async getAfps() {
      const { data, error } = await supabase.from("afps").select("*").order("label");
      check(error); return data || [];
    },
    async getTarjetaTipos() {
      const { data, error } = await supabase.from("tarjeta_tipos").select("*").order("banco_id,label");
      check(error); return data || [];
    },
  },

  // ── Tarjetas de crédito ────────────────────────────────────

  tarjetas: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .select("*, bancos(label), tarjeta_tipos(label, red)")
        .eq("usuario_id", uid)
        .eq("activa", true)
        .order("created_at");
      check(error);
      return (data || []).map(normalizeTarjeta);
    },

    async add(uid, t) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .insert({ usuario_id: uid, banco_id: t.bancoId, tipo_id: t.tipoId || null, nombre: t.nombre, color: t.color, linea_credito: t.lineaCredito, cierre: t.cierre, pago_dia: t.pagoDia })
        .select("*, bancos(label), tarjeta_tipos(label, red)").single();
      check(error);
      return normalizeTarjeta(data);
    },

    async update(id, t) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .update({ banco_id: t.bancoId, tipo_id: t.tipoId || null, nombre: t.nombre, color: t.color, linea_credito: t.lineaCredito, cierre: t.cierre, pago_dia: t.pagoDia, updated_at: new Date().toISOString() })
        .eq("id", id).select("*, bancos(label), tarjeta_tipos(label, red)").single();
      check(error);
      return normalizeTarjeta(data);
    },

    async delete(id) {
      const { error } = await supabase.from("tarjetas_credito")
        .update({ activa: false, updated_at: new Date().toISOString() }).eq("id", id);
      check(error);
    },
  },

  // ── Gastos ─────────────────────────────────────────────────

  gastos: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("gastos")
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .eq("usuario_id", uid)
        .order("fecha", { ascending: false });
      check(error);
      return (data || []).map(normalizeGasto);
    },

    async add(uid, g) {
      const { data, error } = await supabase
        .from("gastos")
        .insert({ usuario_id: uid, tarjeta_id: g.tarjetaId || null, categoria_id: g.categoriaId, metodo_id: g.metodoId, descripcion: g.descripcion, monto: g.monto, fecha: g.fecha, es_cuota: g.esCuota || false, notas: g.notas || null })
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)").single();
      check(error);
      return normalizeGasto(data);
    },

    async update(id, g) {
      const { data, error } = await supabase
        .from("gastos")
        .update({ tarjeta_id: g.tarjetaId || null, categoria_id: g.categoriaId, metodo_id: g.metodoId, descripcion: g.descripcion, monto: g.monto, fecha: g.fecha, notas: g.notas || null, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)").single();
      check(error);
      return normalizeGasto(data);
    },

    async delete(id) {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      check(error);
    },
  },

  // ── Cuotas tarjetas ────────────────────────────────────────

  cuotas: {
    // Devuelve { [tarjetaId]: { tarjeta, cuotasActivas: [] } }
    async getAll(uid) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .select("*, tarjetas_credito(id,nombre,color,cierre,pago_dia,linea_credito,banco_id)")
        .eq("usuario_id", uid);
      check(error);
      const agrupado = {};
      (data || []).forEach(r => {
        const tid = r.tarjeta_id;
        if (!agrupado[tid]) {
          const tc = r.tarjetas_credito;
          agrupado[tid] = {
            tarjeta: tc ? { id: tc.id, nombre: tc.nombre, color: tc.color, cierre: tc.cierre, pagoDia: tc.pago_dia, lineaCredito: parseFloat(tc.linea_credito) || 0 } : null,
            cuotasActivas: [],
          };
        }
        agrupado[tid].cuotasActivas.push(normalizeCuota(r));
      });
      return agrupado;
    },

    async add(uid, tarjetaId, c) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .insert({ usuario_id: uid, tarjeta_id: tarjetaId, descripcion: c.desc, monto_total: c.montoTotal, cuota: c.cuota, total_cuotas: c.totalCuotas, pagadas: c.pagadas || 0, con_interes: c.conInteres || false, mes_primer_pago: c.mesPrimerPago || null, anio_primer_pago: c.anioPrimerPago || null })
        .select().single();
      check(error);
      return normalizeCuota(data);
    },

    async update(id, c) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .update({ descripcion: c.desc, monto_total: c.montoTotal, cuota: c.cuota, total_cuotas: c.totalCuotas, pagadas: c.pagadas, con_interes: c.conInteres, mes_primer_pago: c.mesPrimerPago || null, anio_primer_pago: c.anioPrimerPago || null })
        .eq("id", id).select().single();
      check(error);
      return normalizeCuota(data);
    },

    async delete(id) {
      const { error } = await supabase.from("cuotas_tarjetas").delete().eq("id", id);
      check(error);
    },
  },

  // ── Gastos fijos ───────────────────────────────────────────

  gastosFijos: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .eq("usuario_id", uid).order("dia");
      check(error);
      return (data || []).map(r => ({
        id:           r.id,
        descripcion:  r.descripcion,
        monto:        parseFloat(r.monto),
        dia:          r.dia,
        categoriaId:  r.categoria_id,
        categoriaLabel: r.categorias?.label || r.categoria_id,
        categoriaColor: r.categorias?.color || "#6B7280",
        categoriaEmoji: r.categorias?.emoji || "📦",
        metodoId:     r.metodo_id,
        metodoLabel:  r.metodos_pago?.label || r.metodo_id,
        tarjetaId:    r.tarjeta_id,
      }));
    },

    async add(uid, f) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .insert({ usuario_id: uid, tarjeta_id: f.tarjetaId || null, categoria_id: f.categoriaId || "otros", metodo_id: f.metodoId || "debito", descripcion: f.descripcion, monto: f.monto, dia: f.dia })
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)").single();
      check(error);
      return {
        id: data.id, descripcion: data.descripcion, monto: parseFloat(data.monto), dia: data.dia,
        categoriaId: data.categoria_id, categoriaLabel: data.categorias?.label || data.categoria_id,
        categoriaColor: data.categorias?.color || "#6B7280", categoriaEmoji: data.categorias?.emoji || "📦",
        metodoId: data.metodo_id, metodoLabel: data.metodos_pago?.label || data.metodo_id, tarjetaId: data.tarjeta_id,
      };
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
      check(error);
    },
  },

  // ── Gastos recurrentes ─────────────────────────────────────

  recurrentes: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .select("*, categorias(label,color,emoji), metodos_pago(label)")
        .eq("usuario_id", uid).eq("activo", true);
      check(error);
      return (data || []).map(r => ({
        id:           r.id,
        descripcion:  r.descripcion,
        monto:        parseFloat(r.monto),
        categoriaId:  r.categoria_id,
        categoriaLabel: r.categorias?.label || r.categoria_id,
        categoriaColor: r.categorias?.color || "#6B7280",
        categoriaEmoji: r.categorias?.emoji || "📦",
        metodoId:     r.metodo_id,
        tarjetaId:    r.tarjeta_id,
        esCuota:      r.es_cuota,
        notas:        r.notas,
      }));
    },

    async add(uid, r) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .insert({ usuario_id: uid, tarjeta_id: r.tarjetaId || null, categoria_id: r.categoriaId, metodo_id: r.metodoId, descripcion: r.descripcion, monto: r.monto, es_cuota: r.esCuota || false, notas: r.notas || null })
        .select("*, categorias(label,color,emoji), metodos_pago(label)").single();
      check(error);
      return {
        id: data.id, descripcion: data.descripcion, monto: parseFloat(data.monto),
        categoriaId: data.categoria_id, categoriaLabel: data.categorias?.label || data.categoria_id,
        categoriaColor: data.categorias?.color || "#6B7280", categoriaEmoji: data.categorias?.emoji || "📦",
        metodoId: data.metodo_id, tarjetaId: data.tarjeta_id, esCuota: data.es_cuota, notas: data.notas,
      };
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_recurrentes")
        .update({ activo: false }).eq("id", id);
      check(error);
    },
  },

  // ── Ingresos ───────────────────────────────────────────────

  ingresos: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("historial_ingresos").select("*")
        .eq("usuario_id", uid).order("anio").order("mes_idx");
      check(error);
      return (data || []).map(normalizeIngreso);
    },

    async save(uid, h) {
      const { data, error } = await supabase
        .from("historial_ingresos")
        .upsert({ usuario_id: uid, mes_idx: h.mesIdx, anio: h.anio, haber_basico: h.haberBasico, he25: h.he25, he100: h.he100, gratificacion: h.gratificacion, cts: h.cts, bono: h.bono, otro_extra: h.otroExtra, otro_label: h.otroLabel, bruto: h.bruto, afp: h.afp, neto: h.neto },
          { onConflict: "usuario_id,mes_idx,anio" })
        .select().single();
      check(error);
      return normalizeIngreso(data);
    },
  },

  // ── Presupuestos ───────────────────────────────────────────

  presupuestos: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("presupuestos").select("categoria_id, monto").eq("usuario_id", uid);
      check(error);
      return Object.fromEntries((data || []).map(p => [p.categoria_id, parseFloat(p.monto)]));
    },

    async set(uid, categoriaId, monto) {
      const { error } = await supabase.from("presupuestos")
        .upsert({ usuario_id: uid, categoria_id: categoriaId, monto, updated_at: new Date().toISOString() },
          { onConflict: "usuario_id,categoria_id" });
      check(error);
    },
  },

  // ── Deudas ─────────────────────────────────────────────────

  deudas: {
    async getAll(uid) {
      const { data, error } = await supabase
        .from("deudas").select("*, tipos_deuda(label)")
        .eq("usuario_id", uid).eq("activa", true).order("created_at");
      check(error);
      return (data || []).map(normalizeDeuda);
    },

    async add(uid, d) {
      const { data, error } = await supabase
        .from("deudas")
        .insert({ usuario_id: uid, tipo_id: d.tipoId, descripcion: d.descripcion, acreedor: d.acreedor, monto_original: d.montoOriginal, cuota_mensual: d.cuotaMensual, meses_pactados: d.mesesPactados, pagos_realizados: d.pagosRealizados || 0, dia_vencimiento: d.diaVencimiento || null, fecha_inicio: d.fechaInicio, notas: d.notas || null })
        .select("*, tipos_deuda(label)").single();
      check(error);
      return normalizeDeuda(data);
    },

    async update(id, d) {
      const { data, error } = await supabase
        .from("deudas")
        .update({ pagos_realizados: d.pagosRealizados, updated_at: new Date().toISOString() })
        .eq("id", id).select("*, tipos_deuda(label)").single();
      check(error);
      return normalizeDeuda(data);
    },

    async delete(id) {
      const { error } = await supabase.from("deudas")
        .update({ activa: false, updated_at: new Date().toISOString() }).eq("id", id);
      check(error);
    },
  },

  // ── Config ─────────────────────────────────────────────────

  config: {
    async get(uid) {
      const { data, error } = await supabase.from("config").select("*").eq("usuario_id", uid).maybeSingle();
      check(error);
      if (!data) return null;
      return { haberBasico: data.haber_basico, diaDeposito: data.dia_deposito, afpId: data.afp_id ?? null };
    },

    async save(uid, c) {
      const { error } = await supabase.from("config")
        .upsert({ usuario_id: uid, haber_basico: c.haberBasico, dia_deposito: c.diaDeposito, afp_id: c.afpId ?? null, updated_at: new Date().toISOString() },
          { onConflict: "usuario_id" });
      check(error);
    },
  },
};

// ── Normalizadores ──────────────────────────────────────────

function normalizeTarjeta(r) {
  return {
    id:           r.id,
    bancoId:      r.banco_id,
    bancoLabel:   r.bancos?.label || r.banco_id,
    tipoId:       r.tipo_id || null,
    tipoLabel:    r.tarjeta_tipos?.label || null,
    tipoRed:      r.tarjeta_tipos?.red || null,
    nombre:       r.nombre,
    color:        r.color,
    lineaCredito: parseFloat(r.linea_credito) || 0,
    cierre:       r.cierre,
    pagoDia:      r.pago_dia,
  };
}

function normalizeGasto(r) {
  return {
    id:             r.id,
    tarjetaId:      r.tarjeta_id,
    tarjetaNombre:  r.tarjetas_credito?.nombre || null,
    tarjetaColor:   r.tarjetas_credito?.color  || null,
    categoriaId:    r.categoria_id,
    categoriaLabel: r.categorias?.label || r.categoria_id,
    categoriaColor: r.categorias?.color || "#6B7280",
    categoriaEmoji: r.categorias?.emoji || "📦",
    metodoId:       r.metodo_id,
    metodoLabel:    r.metodos_pago?.label || r.metodo_id,
    descripcion:    r.descripcion,
    monto:          parseFloat(r.monto),
    fecha:          r.fecha,
    esCuota:        r.es_cuota,
    notas:          r.notas,
  };
}

function normalizeCuota(r) {
  return {
    id:             r.id,
    tarjetaId:      r.tarjeta_id,
    desc:           r.descripcion,
    montoTotal:     parseFloat(r.monto_total),
    cuota:          parseFloat(r.cuota),
    totalCuotas:    r.total_cuotas,
    pagadas:        r.pagadas,
    conInteres:     r.con_interes,
    mesPrimerPago:  r.mes_primer_pago,
    anioPrimerPago: r.anio_primer_pago,
  };
}

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

function normalizeDeuda(r) {
  return {
    id:              r.id,
    tipoId:          r.tipo_id,
    tipoLabel:       r.tipos_deuda?.label || r.tipo_id,
    descripcion:     r.descripcion,
    acreedor:        r.acreedor,
    montoOriginal:   parseFloat(r.monto_original) || 0,
    cuotaMensual:    parseFloat(r.cuota_mensual),
    mesesPactados:   r.meses_pactados,
    pagosRealizados: r.pagos_realizados,
    diaVencimiento:  r.dia_vencimiento,
    fechaInicio:     r.fecha_inicio,
    notas:           r.notas,
    activa:          r.activa,
  };
}
