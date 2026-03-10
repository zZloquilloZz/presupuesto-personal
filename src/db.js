// db.js — queries a Supabase alineadas con el schema normalizado 3FN
// Convención: snake_case en BD ↔ camelCase en app

import { supabase } from "./supabase";

function check(error) {
  if (error) throw new Error(error.message);
}

export const db = {

  // ── CATÁLOGOS (solo lectura) ───────────────────────────────

  catalogos: {
    async getCategorias() {
      const { data, error } = await supabase
        .from("categorias").select("*").order("orden");
      check(error);
      return data || [];
    },
    async getMetodos() {
      const { data, error } = await supabase.from("metodos_pago").select("*");
      check(error);
      return data || [];
    },
    async getBancos() {
      const { data, error } = await supabase.from("bancos").select("*").order("label");
      check(error);
      return data || [];
    },
    async getTiposDeuda() {
      const { data, error } = await supabase.from("tipos_deuda").select("*");
      check(error);
      return data || [];
    },
  },

  // ── TARJETAS DE CRÉDITO ───────────────────────────────────

  tarjetas: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .select("*, bancos(label)")
        .eq("usuario_id", usuarioId)
        .eq("activa", true)
        .order("created_at");
      check(error);
      return (data || []).map(normalizeTarjeta);
    },

    async add(usuarioId, tarjeta) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .insert({
          usuario_id:    usuarioId,
          banco_id:      tarjeta.bancoId,
          nombre:        tarjeta.nombre,
          color:         tarjeta.color || "#38BDF8",
          linea_credito: tarjeta.lineaCredito,
          cierre:        tarjeta.cierre,
          pago_dia:      tarjeta.pagoDia,
        })
        .select("*, bancos(label)")
        .single();
      check(error);
      return normalizeTarjeta(data);
    },

    async update(id, tarjeta) {
      const { data, error } = await supabase
        .from("tarjetas_credito")
        .update({
          banco_id:      tarjeta.bancoId,
          nombre:        tarjeta.nombre,
          color:         tarjeta.color,
          linea_credito: tarjeta.lineaCredito,
          cierre:        tarjeta.cierre,
          pago_dia:      tarjeta.pagoDia,
          updated_at:    new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, bancos(label)")
        .single();
      check(error);
      return normalizeTarjeta(data);
    },

    async delete(id) {
      const { error } = await supabase
        .from("tarjetas_credito")
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      check(error);
    },
  },

  // ── GASTOS ────────────────────────────────────────────────

  gastos: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("gastos")
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .eq("usuario_id", usuarioId)
        .order("fecha", { ascending: false });
      check(error);
      return (data || []).map(normalizeGasto);
    },

    async add(usuarioId, gasto) {
      const { data, error } = await supabase
        .from("gastos")
        .insert({
          usuario_id:   usuarioId,
          tarjeta_id:   gasto.tarjetaId || null,
          categoria_id: gasto.categoriaId,
          metodo_id:    gasto.metodoId,
          descripcion:  gasto.descripcion,
          monto:        gasto.monto,
          fecha:        gasto.fecha,
          es_cuota:     gasto.esCuota || false,
          notas:        gasto.notas || null,
        })
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .single();
      check(error);
      return normalizeGasto(data);
    },

    async update(id, gasto) {
      const { data, error } = await supabase
        .from("gastos")
        .update({
          tarjeta_id:   gasto.tarjetaId || null,
          categoria_id: gasto.categoriaId,
          metodo_id:    gasto.metodoId,
          descripcion:  gasto.descripcion,
          monto:        gasto.monto,
          fecha:        gasto.fecha,
          notas:        gasto.notas || null,
        })
        .eq("id", id)
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .single();
      check(error);
      return normalizeGasto(data);
    },

    async delete(id) {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      check(error);
    },
  },

  // ── CUOTAS TARJETAS ───────────────────────────────────────

  cuotas: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .select("*, tarjetas_credito(id,nombre,color,cierre,pago_dia,linea_credito,banco_id)")
        .eq("usuario_id", usuarioId);
      check(error);
      // Agrupar por tarjeta_id
      const agrupado = {};
      (data || []).forEach(r => {
        const tid = r.tarjeta_id;
        if (!agrupado[tid]) {
          agrupado[tid] = { tarjeta: normalizeTarjeta(r.tarjetas_credito), cuotasActivas: [] };
        }
        agrupado[tid].cuotasActivas.push(normalizeCuota(r));
      });
      return agrupado;
    },

    async add(usuarioId, tarjetaId, cuota) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .insert({
          usuario_id:       usuarioId,
          tarjeta_id:       tarjetaId,
          descripcion:      cuota.desc,
          monto_total:      cuota.montoTotal,
          cuota:            cuota.cuota,
          total_cuotas:     cuota.totalCuotas,
          pagadas:          cuota.pagadas || 0,
          con_interes:      cuota.conInteres || false,
          mes_primer_pago:  cuota.mesPrimerPago  || null,
          anio_primer_pago: cuota.anioPrimerPago || null,
        })
        .select().single();
      check(error);
      return normalizeCuota(data);
    },

    async update(id, cuota) {
      const { data, error } = await supabase
        .from("cuotas_tarjetas")
        .update({
          descripcion:      cuota.desc,
          monto_total:      cuota.montoTotal,
          cuota:            cuota.cuota,
          total_cuotas:     cuota.totalCuotas,
          pagadas:          cuota.pagadas,
          con_interes:      cuota.conInteres,
          mes_primer_pago:  cuota.mesPrimerPago  || null,
          anio_primer_pago: cuota.anioPrimerPago || null,
        })
        .eq("id", id)
        .select().single();
      check(error);
      return normalizeCuota(data);
    },

    async delete(id) {
      const { error } = await supabase.from("cuotas_tarjetas").delete().eq("id", id);
      check(error);
    },
  },

  // ── GASTOS FIJOS ──────────────────────────────────────────

  gastosFijos: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .eq("usuario_id", usuarioId)
        .order("dia");
      check(error);
      return (data || []).map(normalizeGastoFijo);
    },

    async add(usuarioId, fijo) {
      const { data, error } = await supabase
        .from("gastos_fijos")
        .insert({
          usuario_id:   usuarioId,
          tarjeta_id:   fijo.tarjetaId || null,
          categoria_id: fijo.categoriaId || "otros",
          metodo_id:    fijo.metodoId   || "debito",
          descripcion:  fijo.descripcion,
          monto:        fijo.monto,
          dia:          fijo.dia,
        })
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .single();
      check(error);
      return normalizeGastoFijo(data);
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
      check(error);
    },
  },

  // ── GASTOS RECURRENTES ────────────────────────────────────

  recurrentes: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .eq("usuario_id", usuarioId)
        .eq("activo", true);
      check(error);
      return (data || []).map(normalizeRecurrente);
    },

    async add(usuarioId, rec) {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .insert({
          usuario_id:   usuarioId,
          tarjeta_id:   rec.tarjetaId || null,
          categoria_id: rec.categoriaId,
          metodo_id:    rec.metodoId,
          descripcion:  rec.descripcion,
          monto:        rec.monto,
          es_cuota:     rec.esCuota || false,
          notas:        rec.notas || null,
        })
        .select("*, categorias(label,color,emoji), metodos_pago(label), tarjetas_credito(nombre,color)")
        .single();
      check(error);
      return normalizeRecurrente(data);
    },

    async delete(id) {
      const { error } = await supabase.from("gastos_recurrentes").delete().eq("id", id);
      check(error);
    },
  },

  // ── INGRESOS ──────────────────────────────────────────────

  ingresos: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("historial_ingresos")
        .select("*")
        .eq("usuario_id", usuarioId)
        .order("anio").order("mes_idx");
      check(error);
      return (data || []).map(normalizeIngreso);
    },

    async save(usuarioId, ingreso) {
      const { data, error } = await supabase
        .from("historial_ingresos")
        .upsert(
          { ...toSnakeIngreso(ingreso), usuario_id: usuarioId },
          { onConflict: "usuario_id,mes_idx,anio" }
        )
        .select().single();
      check(error);
      return normalizeIngreso(data);
    },
  },

  // ── PRESUPUESTOS ──────────────────────────────────────────

  presupuestos: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("categoria_id, monto")
        .eq("usuario_id", usuarioId);
      check(error);
      return Object.fromEntries((data || []).map(p => [p.categoria_id, p.monto]));
    },

    async set(usuarioId, categoriaId, monto) {
      const { error } = await supabase
        .from("presupuestos")
        .upsert(
          { usuario_id: usuarioId, categoria_id: categoriaId, monto, updated_at: new Date().toISOString() },
          { onConflict: "usuario_id,categoria_id" }
        );
      check(error);
    },
  },

  // ── DEUDAS ────────────────────────────────────────────────

  deudas: {
    async getAll(usuarioId) {
      const { data, error } = await supabase
        .from("deudas")
        .select("*, tipos_deuda(label)")
        .eq("usuario_id", usuarioId)
        .eq("activa", true)
        .order("created_at");
      check(error);
      return (data || []).map(normalizeDeuda);
    },

    async add(usuarioId, deuda) {
      const { data, error } = await supabase
        .from("deudas")
        .insert({ ...toSnakeDeuda(deuda), usuario_id: usuarioId })
        .select("*, tipos_deuda(label)")
        .single();
      check(error);
      return normalizeDeuda(data);
    },

    async update(id, deuda) {
      const { data, error } = await supabase
        .from("deudas")
        .update({ ...toSnakeDeuda(deuda), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, tipos_deuda(label)")
        .single();
      check(error);
      return normalizeDeuda(data);
    },

    async delete(id) {
      const { error } = await supabase
        .from("deudas")
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      check(error);
    },
  },

  // ── CONFIG ────────────────────────────────────────────────

  config: {
    async get(usuarioId) {
      const { data, error } = await supabase
        .from("config")
        .select("*")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      check(error);
      if (!data) return null;
      return { haberBasico: data.haber_basico, diaDeposito: data.dia_deposito };
    },

    async save(usuarioId, config) {
      const { error } = await supabase
        .from("config")
        .upsert({
          usuario_id:   usuarioId,
          haber_basico: config.haberBasico,
          dia_deposito: config.diaDeposito,
          updated_at:   new Date().toISOString(),
        }, { onConflict: "usuario_id" });
      check(error);
    },
  },
};

// ── Normalizadores ────────────────────────────────────────────

function normalizeTarjeta(r) {
  if (!r) return null;
  return {
    id:           r.id,
    bancoId:      r.banco_id,
    bancoLabel:   r.bancos?.label || r.banco_id,
    nombre:       r.nombre,
    color:        r.color,
    lineaCredito: parseFloat(r.linea_credito),
    cierre:       r.cierre,
    pagoDia:      r.pago_dia,
    activa:       r.activa,
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
    // Aliases para compatibilidad con componentes
    categoria:      r.categoria_id,
    metodo:         r.tarjeta_id || r.metodo_id,
  };
}

function normalizeGastoFijo(r) {
  return {
    id:             r.id,
    tarjetaId:      r.tarjeta_id,
    categoriaId:    r.categoria_id,
    categoriaLabel: r.categorias?.label || r.categoria_id,
    metodoId:       r.metodo_id,
    metodoLabel:    r.metodos_pago?.label || r.metodo_id,
    descripcion:    r.descripcion,
    monto:          parseFloat(r.monto),
    dia:            r.dia,
    categoria:      r.categoria_id,
    metodo:         r.metodo_id,
  };
}

function normalizeRecurrente(r) {
  return {
    id:           r.id,
    tarjetaId:    r.tarjeta_id,
    categoriaId:  r.categoria_id,
    metodoId:     r.metodo_id,
    descripcion:  r.descripcion,
    monto:        parseFloat(r.monto),
    esCuota:      r.es_cuota,
    notas:        r.notas,
    activo:       r.activo,
    categoria:    r.categoria_id,
    metodo:       r.metodo_id,
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

function normalizeDeuda(r) {
  return {
    id:              r.id,
    tipoId:          r.tipo_id,
    tipoLabel:       r.tipos_deuda?.label || r.tipo_id,
    descripcion:     r.descripcion,
    acreedor:        r.acreedor,
    montoOriginal:   parseFloat(r.monto_original),
    cuotaMensual:    parseFloat(r.cuota_mensual),
    mesesPactados:   r.meses_pactados,
    pagosRealizados: r.pagos_realizados,
    diaVencimiento:  r.dia_vencimiento,
    fechaInicio:     r.fecha_inicio,
    notas:           r.notas,
    activa:          r.activa,
    tipo:            r.tipo_id,
  };
}

function toSnakeDeuda(r) {
  return {
    tipo_id:          r.tipoId || r.tipo,
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
