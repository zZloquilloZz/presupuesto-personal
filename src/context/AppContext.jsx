// AppContext.jsx — estado global conectado a Supabase
// dispatch() actualiza UI inmediatamente Y persiste en Supabase en segundo plano

import { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../db";
import { SUELDO, TARJETAS } from "../constants";

const INITIAL_STATE = {
  gastos:            [],
  gastosRecurrentes: [],
  gastosFijos:       [],
  presupuestos: {
    alimentacion: 0, transporte: 0, entrete: 0, salud: 0,
    educacion: 0, hogar: 0, ropa: 0, servicios: 0, otros: 0,
  },
  historialIngresos: [],
  deudas:            [],
  tarjetas: {
    bcp:  { cuotasActivas: [] },
    amex: { cuotasActivas: [] },
  },
  config: {
    haberBasico: SUELDO.HABER_BASICO,
    diaDeposito: SUELDO.DIA_DEPOSITO,
  },
};

// ── Reducer — solo maneja estado local (UI rápida) ──────
function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };

    case "ADD_GASTO":
      return { ...state, gastos: [action.payload, ...state.gastos] };
    case "UPDATE_GASTO":
      return { ...state, gastos: state.gastos.map(g => g.id === action.id ? { ...g, ...action.payload } : g) };
    case "DELETE_GASTO":
      return { ...state, gastos: state.gastos.filter(g => g.id !== action.id) };

    case "ADD_GASTO_FIJO":
      return { ...state, gastosFijos: [...state.gastosFijos, action.payload] };
    case "DELETE_GASTO_FIJO":
      return { ...state, gastosFijos: state.gastosFijos.filter(g => g.id !== action.id) };

    case "ADD_RECURRENTE":
      return { ...state, gastosRecurrentes: [...state.gastosRecurrentes, action.payload] };
    case "DELETE_RECURRENTE":
      return { ...state, gastosRecurrentes: state.gastosRecurrentes.filter(g => g.id !== action.id) };
    case "APLICAR_RECURRENTES":
      return { ...state, gastos: [...(action.nuevos || []), ...state.gastos] };

    case "SET_PRESUPUESTO":
      return { ...state, presupuestos: { ...state.presupuestos, [action.categoria]: action.monto } };

    case "SAVE_INGRESO": {
      const sinEste = state.historialIngresos.filter(
        h => !(h.mesIdx === action.payload.mesIdx && h.anio === action.payload.anio)
      );
      return {
        ...state,
        historialIngresos: [...sinEste, action.payload].sort(
          (a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mesIdx - b.mesIdx
        ),
      };
    }

    case "ADD_DEUDA":
      return { ...state, deudas: [...state.deudas, action.payload] };
    case "DELETE_DEUDA":
      return { ...state, deudas: state.deudas.filter(d => d.id !== action.id) };
    case "ADD_PAGO_DEUDA":
      return {
        ...state,
        deudas: state.deudas.map(d =>
          d.id === (action.payload?.deudaId || action.deudaId)
            ? { ...d, pagosRealizados: (d.pagosRealizados || 0) + 1 }
            : d
        ),
      };

    case "UPDATE_TARJETA":
      return {
        ...state,
        tarjetas: {
          ...state.tarjetas,
          [action.tarjeta]: { ...state.tarjetas[action.tarjeta], ...action.payload },
        },
      };

    // Registra compra a cuotas atomicamente: gasto + cuota en tarjeta + recurrente
    case "ADD_CUOTA_COMPRA": {
      const { gasto, tarjetaId, cuota, recurrente } = action.payload;
      const cuotasActuales = state.tarjetas?.[tarjetaId]?.cuotasActivas || [];
      return {
        ...state,
        gastos: [...state.gastos, gasto],
        gastosRecurrentes: [...state.gastosRecurrentes, recurrente],
        tarjetas: {
          ...state.tarjetas,
          [tarjetaId]: { cuotasActivas: [...cuotasActuales, cuota] },
        },
      };
    }

    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };

    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [state, localDispatch] = useReducer(reducer, INITIAL_STATE);

  // Cargar datos al iniciar sesion
  useEffect(() => {
    if (!user) { localDispatch({ type: "HYDRATE", payload: INITIAL_STATE }); return; }
    Promise.all([
      db.gastos.getAll(user.id),
      db.gastosFijos.getAll(user.id),
      db.recurrentes.getAll(user.id),
      db.ingresos.getAll(user.id),
      db.presupuestos.getAll(user.id),
      db.cuotas.getAll(user.id),
      db.deudas.getAll(user.id),
      db.config.get(user.id),
    ]).then(([gastos, gastosFijos, gastosRecurrentes, historialIngresos, presupuestos, tarjetas, deudas, config]) => {
      localDispatch({
        type: "HYDRATE",
        payload: {
          gastos,
          gastosFijos,
          gastosRecurrentes,
          historialIngresos,
          presupuestos: { ...INITIAL_STATE.presupuestos, ...presupuestos },
          tarjetas,
          deudas,
          config: config || INITIAL_STATE.config,
        },
      });

      // Aplicar recurrentes del mes actual UNA SOLA VEZ tras cargar datos
      // Guarda: comparar descripcion+mes para evitar duplicados aunque fallen los IDs
      if (gastosRecurrentes.length > 0) {
        const ahora  = new Date();
        const mesKey = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
        const fecha  = ahora.toISOString().slice(0,10);
        // Gastos ya existentes este mes (por descripcion exacta)
        const gastosEsteMes = new Set(
          gastos
            .filter(g => g.fecha && g.fecha.slice(0,7) === mesKey)
            .map(g => g.descripcion)
        );
        // Solo aplicar recurrentes cuya descripcion NO esté ya en este mes
        const pendientes = gastosRecurrentes.filter(r => !gastosEsteMes.has(r.descripcion));
        if (pendientes.length > 0) {
          Promise.all(
            pendientes.map(r => db.gastos.add(user.id, {
              descripcion: r.descripcion,
              categoria:   r.categoria,
              monto:       r.monto,
              metodo:      r.metodo,
              fecha,
              notas:       r.notas || "",
            }))
          ).then(nuevos => {
            localDispatch({ type: "APLICAR_RECURRENTES", nuevos });
          }).catch(console.error);
        }
      }
    }).catch(console.error);
  }, [user?.id]);

  // dispatch inteligente: actualiza UI + persiste en Supabase
  const dispatch = async (action) => {
    // 1. Actualizar UI inmediatamente
    localDispatch(action);

    // 2. Persistir en Supabase en segundo plano (si hay usuario)
    if (!user) return;
    try {
      switch (action.type) {

        case "ADD_GASTO": {
          const saved = await db.gastos.add(user.id, action.payload);
          // Reemplazar el item temporal con el que tiene ID real de Supabase
          localDispatch({ type: "UPDATE_GASTO", id: action.payload.id || "", payload: saved });
          break;
        }
        case "UPDATE_GASTO":
          await db.gastos.update(action.id, action.payload);
          break;
        case "DELETE_GASTO":
          await db.gastos.delete(action.id);
          break;

        case "ADD_GASTO_FIJO": {
          const saved = await db.gastosFijos.add(user.id, action.payload);
          localDispatch({ type: "HYDRATE", payload: { ...state, gastosFijos: [...state.gastosFijos.filter(g => g.id !== action.payload.id), saved] } });
          break;
        }
        case "DELETE_GASTO_FIJO":
          await db.gastosFijos.delete(action.id);
          break;

        case "ADD_RECURRENTE": {
          const saved = await db.recurrentes.add(user.id, action.payload);
          localDispatch({ type: "HYDRATE", payload: { ...state, gastosRecurrentes: [...state.gastosRecurrentes.filter(g => g.id !== action.payload.id), saved] } });
          break;
        }
        case "DELETE_RECURRENTE":
          await db.recurrentes.delete(action.id);
          break;

        case "APLICAR_RECURRENTES":
          // Ya manejado en el useEffect de hidratacion (AppContext), no hacer nada aqui
          break;

        case "SET_PRESUPUESTO":
          await db.presupuestos.set(user.id, action.categoria, action.monto);
          break;

        case "SAVE_INGRESO": {
          const saved = await db.ingresos.save(user.id, action.payload);
          localDispatch({ type: "SAVE_INGRESO", payload: saved });
          break;
        }

        case "ADD_DEUDA": {
          const saved = await db.deudas.add(user.id, action.payload);
          localDispatch({ type: "HYDRATE", payload: { ...state, deudas: [...state.deudas.filter(d => d.id !== action.payload.id), saved] } });
          break;
        }
        case "DELETE_DEUDA":
          await db.deudas.delete(action.id);
          break;

        case "ADD_PAGO_DEUDA": {
          const deudaId = action.payload?.deudaId || action.deudaId;
          const deuda = state.deudas.find(d => d.id === deudaId);
          if (deuda) await db.deudas.update(deudaId, { pagosRealizados: (deuda.pagosRealizados || 0) + 1 });
          break;
        }

        case "UPDATE_TARJETA": {
          // Sincronizar cuotas: borrar todas las del tab y reinsertar
          const tarjeta = action.tarjeta;
          const cuotasActuales = state.tarjetas[tarjeta]?.cuotasActivas || [];
          // Borrar las que ya no estan
          const nuevasIds = new Set((action.payload.cuotasActivas || []).map(c => c.id));
          await Promise.all(cuotasActuales.filter(c => c.id && !nuevasIds.has(c.id)).map(c => db.cuotas.delete(c.id)));
          // Agregar las nuevas (sin id aun)
          const sinId = (action.payload.cuotasActivas || []).filter(c => !c.id);
          await Promise.all(sinId.map(c => db.cuotas.add(user.id, tarjeta, c)));
          // Actualizar pagadas en las existentes
          const conId = (action.payload.cuotasActivas || []).filter(c => c.id);
          await Promise.all(conId.map(c => db.cuotas.update(c.id, c)));
          // Recargar para tener IDs frescos
          const tarjetas = await db.cuotas.getAll(user.id);
          localDispatch({ type: "HYDRATE", payload: { ...state, tarjetas } });
          break;
        }

        case "ADD_CUOTA_COMPRA": {
          const { gasto, tarjetaId, cuota, recurrente } = action.payload;
          // Solo campos que existen en la tabla gastos
          const gastoSaved = await db.gastos.add(user.id, {
            descripcion: gasto.descripcion,
            categoria:   gasto.categoria,
            monto:       gasto.monto,
            metodo:      gasto.metodo,
            fecha:       gasto.fecha,
            notas:       gasto.notas || "",
          });
          // Solo campos que existen en gastos_recurrentes
          const recurrenteSaved = await db.recurrentes.add(user.id, {
            descripcion: recurrente.descripcion,
            categoria:   recurrente.categoria,
            monto:       recurrente.monto,
            metodo:      recurrente.metodo,
            notas:       recurrente.notas || "",
          });
          // Cuota en tarjeta — solo campos del schema
          await db.cuotas.add(user.id, tarjetaId, {
            desc:        cuota.desc,
            montoTotal:  cuota.montoTotal,
            cuota:       cuota.cuota,
            totalCuotas: cuota.totalCuotas,
            pagadas:     cuota.pagadas,
            conInteres:  cuota.conInteres,
          });
          // Recargar todo para tener IDs de Supabase
          const [tarjetas, gastos, gastosRecurrentes] = await Promise.all([
            db.cuotas.getAll(user.id),
            db.gastos.getAll(user.id),
            db.recurrentes.getAll(user.id),
          ]);
          localDispatch({ type: "HYDRATE", payload: { ...state, gastos, gastosRecurrentes, tarjetas } });
          break;
        }

        case "SET_CONFIG":
          await db.config.save(user.id, { ...state.config, ...action.payload });
          break;
      }
    } catch (err) {
      console.error("Error sincronizando con Supabase:", err);
      // UI ya actualizada — el error es silencioso para no interrumpir al usuario
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}

// ── Selectors ─────────────────────────────────────────

export function useGastosMes(mesIdx, anio) {
  const { state } = useApp();
  const m = mesIdx ?? new Date().getMonth();
  const a = anio   ?? new Date().getFullYear();
  return state.gastos.filter(g => {
    const d = new Date(g.fecha);
    return d.getMonth() === m && d.getFullYear() === a;
  });
}

export function useIngresoMes(mesIdx, anio) {
  const { state } = useApp();
  const m = mesIdx ?? new Date().getMonth();
  const a = anio   ?? new Date().getFullYear();
  return state.historialIngresos.find(h => h.mesIdx === m && h.anio === a) ?? null;
}

// Ingreso disponible = el del mes anterior (el que ya fue depositado)
// Ej: en marzo se usa el ingreso de febrero
// Suma de cuotas activas de tarjeta para el mes actual
export function useCuotasMes() {
  const { state } = useApp();
  const hoy = new Date();
  const mesActual  = hoy.getMonth() + 1; // 1-indexed
  const anioActual = hoy.getFullYear();
  let total = 0;
  ["bcp", "amex"].forEach(t => {
    const cuotas = state.tarjetas?.[t]?.cuotasActivas || [];
    cuotas.forEach(c => {
      const totalC     = parseInt(c.totalCuotas) || 0;
      const anioInicio = c.anioPrimerPago || anioActual;
      const mesInicio  = c.mesPrimerPago  || mesActual;
      // Cuota numero que corresponde al mes actual
      const diffMeses   = (anioActual - anioInicio) * 12 + (mesActual - mesInicio);
      const numeroCuota = diffMeses + 1;
      // Mostrar si la cuota cae en el mes actual y no está liquidada
      if (numeroCuota >= 1 && numeroCuota <= totalC) {
        total += parseFloat(c.cuota) || 0;
      }
    });
  });
  return total;
}

export function useIngresoDisponible() {
  const { state } = useApp();
  const hoy = new Date();
  let m = hoy.getMonth() - 1;
  let a = hoy.getFullYear();
  if (m < 0) { m = 11; a -= 1; }
  return state.historialIngresos.find(h => h.mesIdx === m && h.anio === a) ?? null;
}

export function useTotalesMes(mesIdx, anio) {
  const gastos  = useGastosMes(mesIdx, anio);
  const ingreso = useIngresoMes(mesIdx, anio);
  const { state } = useApp();
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalFijos  = state.gastosFijos.reduce((s, f) => s + (parseFloat(f.monto) || 0), 0);
  const neto        = ingreso?.neto ?? 0;
  const saldo       = neto - totalGastos - totalFijos;
  return { totalGastos, totalFijos, neto, saldo, gastos, ingreso };
}
