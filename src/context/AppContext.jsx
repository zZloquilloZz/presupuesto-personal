// AppContext.jsx — estado global + sincronización Supabase (schema 3FN)
// Patrón: optimista (UI inmediata) → persist async → reconciliar IDs reales de BD

import { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../db";
import { SUELDO } from "../constants";

// ── Estado inicial ──────────────────────────────────────────
const INITIAL_STATE = {
  loading:           true,
  errorMsg:          null,
  categorias:        [],
  metodos:           [],
  bancos:            [],
  tiposDeuda:        [],
  tarjetasCredito:   [],
  cuotas:            {},   // { [tarjetaId]: { tarjeta, cuotasActivas[] } }
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

// ── Reducer ─────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case "HYDRATE":
      return { ...state, ...action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.value };

    case "SET_ERROR":
      return { ...state, errorMsg: action.msg };
    case "CLEAR_ERROR":
      return { ...state, errorMsg: null };

    // Tarjetas
    case "ADD_TARJETA":
      return { ...state, tarjetasCredito: [...state.tarjetasCredito, action.payload] };
    case "UPDATE_TARJETA":
      return { ...state, tarjetasCredito: state.tarjetasCredito.map(t => t.id === action.id ? { ...t, ...action.payload } : t) };
    case "DELETE_TARJETA": {
      const cuotas = { ...state.cuotas };
      delete cuotas[action.id];
      return { ...state, tarjetasCredito: state.tarjetasCredito.filter(t => t.id !== action.id), cuotas };
    }

    // Gastos
    case "ADD_GASTO":
      return { ...state, gastos: [action.payload, ...state.gastos] };
    case "UPDATE_GASTO":
      return { ...state, gastos: state.gastos.map(g => g.id === action.id ? { ...g, ...action.payload } : g) };
    case "DELETE_GASTO":
      return { ...state, gastos: state.gastos.filter(g => g.id !== action.id) };
    case "REPLACE_GASTO":
      return { ...state, gastos: state.gastos.map(g => g.id === action.tempId ? action.payload : g) };

    // Gastos fijos
    case "ADD_GASTO_FIJO":
      return { ...state, gastosFijos: [...state.gastosFijos, action.payload] };
    case "DELETE_GASTO_FIJO":
      return { ...state, gastosFijos: state.gastosFijos.filter(g => g.id !== action.id) };
    case "REPLACE_GASTO_FIJO":
      return { ...state, gastosFijos: state.gastosFijos.map(g => g.id === action.tempId ? action.payload : g) };

    // Recurrentes
    case "ADD_RECURRENTE":
      return { ...state, gastosRecurrentes: [...state.gastosRecurrentes, action.payload] };
    case "DELETE_RECURRENTE":
      return { ...state, gastosRecurrentes: state.gastosRecurrentes.filter(g => g.id !== action.id) };
    case "REPLACE_RECURRENTE":
      return { ...state, gastosRecurrentes: state.gastosRecurrentes.map(g => g.id === action.tempId ? action.payload : g) };
    case "APLICAR_RECURRENTES":
      return { ...state, gastos: [...action.nuevos, ...state.gastos] };

    // Presupuestos
    case "SET_PRESUPUESTO":
      return { ...state, presupuestos: { ...state.presupuestos, [action.categoriaId]: action.monto } };

    // Ingresos
    case "SAVE_INGRESO": {
      const sin = state.historialIngresos.filter(
        h => !(h.mesIdx === action.payload.mesIdx && h.anio === action.payload.anio)
      );
      return {
        ...state,
        historialIngresos: [...sin, action.payload].sort(
          (a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mesIdx - b.mesIdx
        ),
      };
    }

    // Deudas
    case "ADD_DEUDA":
      return { ...state, deudas: [...state.deudas, action.payload] };
    case "REPLACE_DEUDA":
      return { ...state, deudas: state.deudas.map(d => d.id === action.tempId ? action.payload : d) };
    case "DELETE_DEUDA":
      return { ...state, deudas: state.deudas.filter(d => d.id !== action.id) };
    case "ADD_PAGO_DEUDA":
      return {
        ...state,
        deudas: state.deudas.map(d =>
          d.id === action.deudaId ? { ...d, pagosRealizados: (d.pagosRealizados || 0) + 1 } : d
        ),
      };

    // Compra a cuotas — optimista
    case "ADD_CUOTA_COMPRA": {
      const { gasto, tarjetaId, cuota } = action.payload;
      const entrada    = state.cuotas[tarjetaId] || { tarjeta: null, cuotasActivas: [] };
      const tarjetaObj = state.tarjetasCredito.find(t => t.id === tarjetaId) || entrada.tarjeta;
      return {
        ...state,
        gastos: [gasto, ...state.gastos],
        cuotas: {
          ...state.cuotas,
          [tarjetaId]: {
            tarjeta:       tarjetaObj,
            cuotasActivas: [...entrada.cuotasActivas, cuota],
          },
        },
      };
    }
    // Reconciliar con IDs reales de BD tras persistir
    case "RECONCILE_CUOTA_COMPRA":
      return {
        ...state,
        gastos:            action.payload.gastos,
        cuotas:            action.payload.cuotas,
        gastosRecurrentes: action.payload.gastosRecurrentes,
      };

    // Revertir compra a cuotas si falló la persistencia en BD
    case "ROLLBACK_CUOTA_COMPRA": {
      const cuotasEntry = state.cuotas[action.tarjetaId];
      return {
        ...state,
        gastos: state.gastos.filter(g => g.id !== action.gastoId),
        cuotas: cuotasEntry ? {
          ...state.cuotas,
          [action.tarjetaId]: {
            ...cuotasEntry,
            cuotasActivas: cuotasEntry.cuotasActivas.filter(c => c.id !== action.cuotaId),
          },
        } : state.cuotas,
      };
    }

    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };

    default:
      return state;
  }
}

// ── Provider ────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [state, localDispatch] = useReducer(reducer, INITIAL_STATE);

  // Hidratación al login / logout
  useEffect(() => {
    if (!user) {
      localDispatch({ type: "HYDRATE", payload: { ...INITIAL_STATE, loading: false } });
      return;
    }

    localDispatch({ type: "SET_LOADING", value: true });

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
          loading: false,
          categorias, metodos, bancos, tiposDeuda,
          tarjetasCredito, cuotas,
          gastos, gastosFijos, gastosRecurrentes,
          historialIngresos, presupuestos, deudas,
          config: config || INITIAL_STATE.config,
        },
      });

      // Aplicar recurrentes del mes en background
      aplicarRecurrentesPendientes(user.id, gastosRecurrentes, gastos, localDispatch);

    }).catch(err => {
      console.error("Error cargando datos:", err);
      localDispatch({ type: "SET_LOADING", value: false });
    });
  }, [user?.id]);

  // dispatch inteligente: actualiza UI inmediatamente, persiste en background
  const dispatch = async (action) => {
    localDispatch(action); // optimista

    if (!user) return;

    try {
      switch (action.type) {

        case "ADD_TARJETA": {
          const tempId = action.payload.id;
          const saved  = await db.tarjetas.add(user.id, action.payload);
          // Reemplazar id provisional por UUID real de BD
          localDispatch({ type: "DELETE_TARJETA", id: tempId });
          localDispatch({ type: "ADD_TARJETA", payload: saved });
          // Mover entrada de cuotas al nuevo id real si existe
          break;
        }
        case "UPDATE_TARJETA": {
          await db.tarjetas.update(action.id, action.payload);
          // No hace falta segundo dispatch — ya aplicamos action.payload optimistamente
          break;
        }
        case "DELETE_TARJETA":
          await db.tarjetas.delete(action.id);
          break;

        case "ADD_GASTO": {
          const saved = await db.gastos.add(user.id, action.payload);
          localDispatch({ type: "REPLACE_GASTO", tempId: action.payload.id, payload: saved });
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
          localDispatch({ type: "REPLACE_GASTO_FIJO", tempId: action.payload.id, payload: saved });
          break;
        }
        case "DELETE_GASTO_FIJO":
          await db.gastosFijos.delete(action.id);
          break;

        case "ADD_RECURRENTE": {
          const saved = await db.recurrentes.add(user.id, action.payload);
          localDispatch({ type: "REPLACE_RECURRENTE", tempId: action.payload.id, payload: saved });
          break;
        }
        case "DELETE_RECURRENTE":
          await db.recurrentes.delete(action.id);
          break;

        case "APLICAR_RECURRENTES":
          break; // ya persistido en aplicarRecurrentesPendientes

        case "SET_PRESUPUESTO":
          await db.presupuestos.set(user.id, action.categoriaId, action.monto);
          break;

        case "SAVE_INGRESO": {
          const saved = await db.ingresos.save(user.id, action.payload);
          // Actualizar con datos reales de BD (id incluido)
          localDispatch({ type: "SAVE_INGRESO", payload: saved });
          break;
        }

        case "ADD_DEUDA": {
          const saved = await db.deudas.add(user.id, action.payload);
          localDispatch({ type: "REPLACE_DEUDA", tempId: action.payload.id, payload: saved });
          break;
        }
        case "DELETE_DEUDA":
          await db.deudas.delete(action.id);
          break;
        case "ADD_PAGO_DEUDA": {
          // El reducer ya aplicó +1 optimistamente.
          // Calculamos el nuevo valor desde el state actual (post-optimista) usando el deudaId.
          // Usamos db.deudas.update con pagosRealizados ya incrementado.
          // NOTA: no hacemos getAll() para evitar race condition — pasamos directamente el valor.
          // El valor correcto ya está en el state gracias al reducer optimista.
          // Lo persistimos via action.newPagosRealizados que calculamos en el dispatch del componente.
          if (action.newPagosRealizados != null) {
            await db.deudas.update(action.deudaId, { pagosRealizados: action.newPagosRealizados });
          }
          break;
        }

        case "ADD_CUOTA_COMPRA": {
          const { gasto, tarjetaId, cuota, recurrente } = action.payload;
          const ops = [
            db.gastos.add(user.id, {
              tarjetaId,
              categoriaId: gasto.categoriaId,
              metodoId:    "credito",
              descripcion: gasto.descripcion,
              monto:       gasto.monto,
              fecha:       gasto.fecha,
              esCuota:     true,
              notas:       gasto.notas || null,
            }),
            db.cuotas.add(user.id, tarjetaId, cuota),
          ];
          if (recurrente) {
            ops.push(db.recurrentes.add(user.id, {
              tarjetaId,
              categoriaId: recurrente.categoriaId,
              metodoId:    "credito",
              descripcion: recurrente.descripcion,
              monto:       recurrente.monto,
              esCuota:     true,
              notas:       recurrente.notas || null,
            }));
          }
          await Promise.all(ops);
          // Recargar para obtener IDs reales de BD
          const [gastosF, cuotasF, recurrentesF] = await Promise.all([
            db.gastos.getAll(user.id),
            db.cuotas.getAll(user.id),
            db.recurrentes.getAll(user.id),
          ]);
          localDispatch({
            type: "RECONCILE_CUOTA_COMPRA",
            payload: { gastos: gastosF, cuotas: cuotasF, gastosRecurrentes: recurrentesF },
          });
          break;
        }

        case "SET_CONFIG":
          await db.config.save(user.id, action.payload);
          break;
      }
    } catch (err) {
      console.error(`[dispatch ${action.type}]:`, err.message || err);
      localDispatch({ type: "SET_ERROR", msg: "Error al guardar. Intenta de nuevo." });
      // Revertir actualización optimista según el tipo de acción
      switch (action.type) {
        case "ADD_GASTO":
          localDispatch({ type: "DELETE_GASTO", id: action.payload.id });
          break;
        case "ADD_GASTO_FIJO":
          localDispatch({ type: "DELETE_GASTO_FIJO", id: action.payload.id });
          break;
        case "ADD_RECURRENTE":
          localDispatch({ type: "DELETE_RECURRENTE", id: action.payload.id });
          break;
        case "ADD_DEUDA":
          localDispatch({ type: "DELETE_DEUDA", id: action.payload.id });
          break;
        case "ADD_TARJETA":
          localDispatch({ type: "DELETE_TARJETA", id: action.payload.id });
          break;
        case "ADD_CUOTA_COMPRA":
          localDispatch({
            type: "ROLLBACK_CUOTA_COMPRA",
            gastoId:   action.payload.gasto.id,
            cuotaId:   action.payload.cuota.id,
            tarjetaId: action.payload.tarjetaId,
          });
          break;
        default:
          break;
      }
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Aplicar recurrentes del mes si no se han aplicado aún ──
async function aplicarRecurrentesPendientes(userId, recurrentes, gastos, localDispatch) {
  if (!recurrentes.length) return;
  const ahora  = new Date();
  const mesKey = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  const fecha  = ahora.toISOString().slice(0, 10);

  // Deduplicar por descripcion+mesKey: si ya existe un gasto con esa descripcion este mes, no aplica
  // Se normaliza a minúsculas y sin espacios extremos para evitar falsos negativos por mayúsculas o espacios
  const yaEste = new Set(
    gastos
      .filter(g => g.fecha?.slice(0, 7) === mesKey)
      .map(g => g.descripcion?.toLowerCase().trim())
  );

  const pendientes = recurrentes.filter(r => !yaEste.has(r.descripcion?.toLowerCase().trim()));
  if (!pendientes.length) return;

  try {
    const nuevos = await Promise.all(
      pendientes.map(r => db.gastos.add(userId, {
        tarjetaId:   r.tarjetaId || null,
        categoriaId: r.categoriaId,
        metodoId:    r.metodoId,
        descripcion: r.descripcion,
        monto:       r.monto,
        fecha,
        esCuota:     r.esCuota || false,
        notas:       r.notas || null,
      }))
    );
    localDispatch({ type: "APLICAR_RECURRENTES", nuevos });
  } catch (err) {
    console.error("Error aplicando recurrentes:", err);
  }
}

// ── Hooks ───────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}

// Gastos del mes (corrige desfase UTC usando T00:00:00)
export function useGastosMes(mesIdx, anio) {
  const { state } = useApp();
  const m = mesIdx ?? new Date().getMonth();
  const a = anio   ?? new Date().getFullYear();
  return state.gastos.filter(g => {
    const d = new Date(g.fecha + "T00:00:00");
    return d.getMonth() === m && d.getFullYear() === a;
  });
}

// Ingreso registrado de un mes específico
export function useIngresoMes(mesIdx, anio) {
  const { state } = useApp();
  const m = mesIdx ?? new Date().getMonth();
  const a = anio   ?? new Date().getFullYear();
  return state.historialIngresos.find(h => h.mesIdx === m && h.anio === a) ?? null;
}

// Ingreso del mes anterior (ya cobrado, disponible este mes)
export function useIngresoDisponible() {
  const { state } = useApp();
  const hoy = new Date();
  let m = hoy.getMonth() - 1;
  let a = hoy.getFullYear();
  if (m < 0) { m = 11; a -= 1; }
  return state.historialIngresos.find(h => h.mesIdx === m && h.anio === a) ?? null;
}
