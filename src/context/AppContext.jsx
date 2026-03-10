// AppContext.jsx — estado global conectado a Supabase (schema normalizado 3FN)

import { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../db";
import { SUELDO } from "../constants";

const INITIAL_STATE = {
  // Catálogos (globales, cargados una vez)
  categorias:    [],
  metodos:       [],
  bancos:        [],
  tiposDeuda:    [],
  // Datos del usuario
  tarjetasCredito:   [],   // Array de tarjetas del usuario
  cuotas:            {},   // { [tarjetaId]: { tarjeta, cuotasActivas: [] } }
  gastos:            [],
  gastosFijos:       [],
  gastosRecurrentes: [],
  historialIngresos: [],
  presupuestos:      {},
  deudas:            [],
  config: {
    haberBasico: SUELDO.HABER_BASICO,
    diaDeposito: SUELDO.DIA_DEPOSITO,
  },
};

function reducer(state, action) {
  switch (action.type) {

    case "HYDRATE":
      return { ...state, ...action.payload };

    // ── Tarjetas ──────────────────────────────────────────
    case "ADD_TARJETA":
      return { ...state, tarjetasCredito: [...state.tarjetasCredito, action.payload] };
    case "UPDATE_TARJETA":
      return { ...state, tarjetasCredito: state.tarjetasCredito.map(t => t.id === action.id ? action.payload : t) };
    case "DELETE_TARJETA":
      return { ...state, tarjetasCredito: state.tarjetasCredito.filter(t => t.id !== action.id) };

    // ── Gastos ────────────────────────────────────────────
    case "ADD_GASTO":
      return { ...state, gastos: [action.payload, ...state.gastos] };
    case "UPDATE_GASTO":
      return { ...state, gastos: state.gastos.map(g => g.id === action.id ? { ...g, ...action.payload } : g) };
    case "DELETE_GASTO":
      return { ...state, gastos: state.gastos.filter(g => g.id !== action.id) };

    // ── Gastos Fijos ──────────────────────────────────────
    case "ADD_GASTO_FIJO":
      return { ...state, gastosFijos: [...state.gastosFijos, action.payload] };
    case "UPDATE_GASTO_FIJO":
      return { ...state, gastosFijos: state.gastosFijos.map(g => g.id === action.tempId ? action.payload : g) };
    case "DELETE_GASTO_FIJO":
      return { ...state, gastosFijos: state.gastosFijos.filter(g => g.id !== action.id) };

    // ── Recurrentes ───────────────────────────────────────
    case "ADD_RECURRENTE":
      return { ...state, gastosRecurrentes: [...state.gastosRecurrentes, action.payload] };
    case "DELETE_RECURRENTE":
      return { ...state, gastosRecurrentes: state.gastosRecurrentes.filter(g => g.id !== action.id) };
    case "APLICAR_RECURRENTES":
      return { ...state, gastos: [...(action.nuevos || []), ...state.gastos] };

    // ── Presupuestos ──────────────────────────────────────
    case "SET_PRESUPUESTO":
      return { ...state, presupuestos: { ...state.presupuestos, [action.categoriaId]: action.monto } };

    // ── Ingresos ──────────────────────────────────────────
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

    // ── Deudas ────────────────────────────────────────────
    case "ADD_DEUDA":
      return { ...state, deudas: [...state.deudas, action.payload] };
    case "DELETE_DEUDA":
      return { ...state, deudas: state.deudas.filter(d => d.id !== action.id) };
    case "ADD_PAGO_DEUDA":
      return {
        ...state,
        deudas: state.deudas.map(d =>
          d.id === action.deudaId
            ? { ...d, pagosRealizados: (d.pagosRealizados || 0) + 1 }
            : d
        ),
      };

    // ── Cuotas (compra a cuotas atómica) ──────────────────
    case "ADD_CUOTA_COMPRA": {
      const { gasto, tarjetaId, cuota } = action.payload;
      const cuotasActuales = state.cuotas?.[tarjetaId]?.cuotasActivas || [];
      return {
        ...state,
        gastos: [gasto, ...state.gastos],
        cuotas: {
          ...state.cuotas,
          [tarjetaId]: {
            ...state.cuotas?.[tarjetaId],
            cuotasActivas: [...cuotasActuales, cuota],
          },
        },
      };
    }

    // ── Config ────────────────────────────────────────────
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

  useEffect(() => {
    if (!user) { localDispatch({ type: "HYDRATE", payload: INITIAL_STATE }); return; }

    Promise.all([
      db.catalogos.getCategorias(),
      db.catalogos.getMetodos(),
      db.catalogos.getBancos(),
      db.catalogos.getTiposDeuda(),
      db.tarjetas.getAll(user.id),
      db.cuotas.getAll(user.id),
      db.gastos.getAll(user.id),
      db.gastosFijos.getAll(user.id),
      db.recurrentes.getAll(user.id),
      db.ingresos.getAll(user.id),
      db.presupuestos.getAll(user.id),
      db.deudas.getAll(user.id),
      db.config.get(user.id),
    ]).then(([
      categorias, metodos, bancos, tiposDeuda,
      tarjetasCredito, cuotas,
      gastos, gastosFijos, gastosRecurrentes,
      historialIngresos, presupuestos, deudas, config,
    ]) => {
      localDispatch({
        type: "HYDRATE",
        payload: {
          categorias,
          metodos,
          bancos,
          tiposDeuda,
          tarjetasCredito,
          cuotas,
          gastos,
          gastosFijos,
          gastosRecurrentes,
          historialIngresos,
          presupuestos: { ...INITIAL_STATE.presupuestos, ...presupuestos },
          deudas,
          config: config || INITIAL_STATE.config,
        },
      });

      // Aplicar recurrentes del mes actual una sola vez
      if (gastosRecurrentes.length > 0) {
        const ahora   = new Date();
        const mesKey  = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
        const fecha   = ahora.toISOString().slice(0, 10);
        const gastosEsteMes = new Set(
          gastos
            .filter(g => g.fecha?.slice(0, 7) === mesKey)
            .map(g => g.descripcion)
        );
        const pendientes = gastosRecurrentes.filter(r => !gastosEsteMes.has(r.descripcion));
        if (pendientes.length > 0) {
          Promise.all(
            pendientes.map(r => db.gastos.add(user.id, {
              tarjetaId:   r.tarjetaId || null,
              categoriaId: r.categoriaId,
              metodoId:    r.metodoId,
              descripcion: r.descripcion,
              monto:       r.monto,
              fecha,
              esCuota:     r.esCuota || false,
              notas:       r.notas || null,
            }))
          ).then(nuevos => {
            localDispatch({ type: "APLICAR_RECURRENTES", nuevos });
          }).catch(console.error);
        }
      }
    }).catch(console.error);
  }, [user?.id]);

  const dispatch = async (action) => {
    localDispatch(action);
    if (!user) return;
    try {
      switch (action.type) {

        // ── Tarjetas ────────────────────────────────────────
        case "ADD_TARJETA": {
          const saved = await db.tarjetas.add(user.id, action.payload);
          localDispatch({ type: "UPDATE_TARJETA", id: action.payload.id || "", payload: saved });
          break;
        }
        case "UPDATE_TARJETA": {
          const saved = await db.tarjetas.update(action.id, action.payload);
          localDispatch({ type: "UPDATE_TARJETA", id: action.id, payload: saved });
          break;
        }
        case "DELETE_TARJETA":
          await db.tarjetas.delete(action.id);
          break;

        // ── Gastos ──────────────────────────────────────────
        case "ADD_GASTO": {
          const saved = await db.gastos.add(user.id, action.payload);
          localDispatch({ type: "UPDATE_GASTO", id: action.payload.id || "", payload: saved });
          break;
        }
        case "UPDATE_GASTO":
          await db.gastos.update(action.id, action.payload);
          break;
        case "DELETE_GASTO":
          await db.gastos.delete(action.id);
          break;

        // ── Gastos Fijos ────────────────────────────────────
        case "ADD_GASTO_FIJO": {
          const saved = await db.gastosFijos.add(user.id, action.payload);
          localDispatch({ type: "UPDATE_GASTO_FIJO", tempId: action.payload.id, payload: saved });
          break;
        }
        case "DELETE_GASTO_FIJO":
          await db.gastosFijos.delete(action.id);
          break;

        // ── Recurrentes ─────────────────────────────────────
        case "ADD_RECURRENTE": {
          const saved = await db.recurrentes.add(user.id, action.payload);
          localDispatch({ type: "HYDRATE", payload: {
            ...state,
            gastosRecurrentes: [...state.gastosRecurrentes.filter(g => g.id !== action.payload.id), saved],
          }});
          break;
        }
        case "DELETE_RECURRENTE":
          await db.recurrentes.delete(action.id);
          break;

        case "APLICAR_RECURRENTES":
          break;

        // ── Presupuestos ────────────────────────────────────
        case "SET_PRESUPUESTO":
          await db.presupuestos.set(user.id, action.categoriaId, action.monto);
          break;

        // ── Ingresos ────────────────────────────────────────
        case "SAVE_INGRESO": {
          const saved = await db.ingresos.save(user.id, action.payload);
          localDispatch({ type: "SAVE_INGRESO", payload: saved });
          break;
        }

        // ── Deudas ──────────────────────────────────────────
        case "ADD_DEUDA": {
          const saved = await db.deudas.add(user.id, action.payload);
          localDispatch({ type: "HYDRATE", payload: {
            ...state,
            deudas: [...state.deudas.filter(d => d.id !== action.payload.id), saved],
          }});
          break;
        }
        case "DELETE_DEUDA":
          await db.deudas.delete(action.id);
          break;
        case "ADD_PAGO_DEUDA": {
          const deuda = state.deudas.find(d => d.id === action.deudaId);
          if (deuda) await db.deudas.update(action.deudaId, {
            ...deuda,
            pagosRealizados: (deuda.pagosRealizados || 0) + 1,
          });
          break;
        }

        // ── Cuotas (compra atómica) ─────────────────────────
        case "ADD_CUOTA_COMPRA": {
          const { gasto, tarjetaId, cuota, recurrente } = action.payload;
          const gastoSaved = await db.gastos.add(user.id, {
            tarjetaId:   gasto.tarjetaId || tarjetaId,
            categoriaId: gasto.categoriaId,
            metodoId:    "credito",
            descripcion: gasto.descripcion,
            monto:       gasto.monto,
            fecha:       gasto.fecha,
            esCuota:     true,
            notas:       gasto.notas || null,
          });
          if (recurrente) {
            await db.recurrentes.add(user.id, {
              tarjetaId:   tarjetaId,
              categoriaId: recurrente.categoriaId || gasto.categoriaId,
              metodoId:    "credito",
              descripcion: recurrente.descripcion,
              monto:       recurrente.monto,
              esCuota:     true,
              notas:       recurrente.notas || null,
            });
          }
          await db.cuotas.add(user.id, tarjetaId, cuota);
          // Recargar todo para tener IDs frescos
          const [cuotasNuevas, gastosNuevos, recurrentesNuevos] = await Promise.all([
            db.cuotas.getAll(user.id),
            db.gastos.getAll(user.id),
            db.recurrentes.getAll(user.id),
          ]);
          localDispatch({ type: "HYDRATE", payload: {
            ...state,
            cuotas:            cuotasNuevas,
            gastos:            gastosNuevos,
            gastosRecurrentes: recurrentesNuevos,
          }});
          break;
        }

        // ── Config ──────────────────────────────────────────
        case "SET_CONFIG":
          await db.config.save(user.id, action.payload);
          break;
      }
    } catch (err) {
      console.error("Error sincronizando con Supabase:", err);
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

// ── Selectors ──────────────────────────────────────────────

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
