// Onboarding.jsx — wizard de configuración inicial para cuentas nuevas
// Pasos: bienvenida → AFP → tarjetas (opcional) → listo

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { uid } from "../utils";

const COLORS = [
  "#22C55E", "#38BDF8", "#F59E0B", "#EC4899",
  "#8B5CF6", "#F97316", "#EF4444", "#06B6D4",
];

// Fallback de tipos de tarjeta por banco (si la tabla tarjeta_tipos está vacía)
const TIPOS_FALLBACK = [
  { id:"bcp-visa-clasica",  banco_id:"bcp",        label:"Visa Clásica",              red:"visa",       tipo:"credito" },
  { id:"bcp-visa-oro",      banco_id:"bcp",        label:"Visa Oro",                  red:"visa",       tipo:"credito" },
  { id:"bcp-visa-plat",     banco_id:"bcp",        label:"Visa Platinum",             red:"visa",       tipo:"credito" },
  { id:"bcp-debito",        banco_id:"bcp",        label:"Débito BCP",                red:"visa",       tipo:"debito"  },
  { id:"bbva-visa",         banco_id:"bbva",       label:"Visa Continental",          red:"visa",       tipo:"credito" },
  { id:"bbva-mc",           banco_id:"bbva",       label:"Mastercard BBVA",           red:"mastercard", tipo:"credito" },
  { id:"bbva-debito",       banco_id:"bbva",       label:"Débito BBVA",               red:"visa",       tipo:"debito"  },
  { id:"ibank-visa",        banco_id:"interbank",  label:"Visa Interbank",            red:"visa",  tipo:"credito" },
  { id:"ibank-amex-green",  banco_id:"interbank",  label:"AmEx Green (Interbank)",    red:"amex",  tipo:"credito" },
  { id:"ibank-amex-gold",   banco_id:"interbank",  label:"AmEx Gold (Interbank)",     red:"amex",  tipo:"credito" },
  { id:"ibank-amex-plat",   banco_id:"interbank",  label:"AmEx Platinum (Interbank)", red:"amex",  tipo:"credito" },
  { id:"ibank-debito",      banco_id:"interbank",  label:"Débito Interbank",          red:"visa",  tipo:"debito"  },
  { id:"scot-visa",         banco_id:"scotiabank", label:"Visa Scotiabank",           red:"visa",       tipo:"credito" },
  { id:"scot-mc",           banco_id:"scotiabank", label:"Mastercard Scotiabank",     red:"mastercard", tipo:"credito" },
  { id:"scot-debito",       banco_id:"scotiabank", label:"Débito Scotiabank",         red:"mastercard", tipo:"debito"  },
  { id:"banbif-visa",       banco_id:"banbif",     label:"Visa BanBif",               red:"visa",       tipo:"credito" },
  { id:"banbif-debito",     banco_id:"banbif",     label:"Débito BanBif",             red:"visa",       tipo:"debito"  },
  { id:"pich-visa",         banco_id:"pichincha",  label:"Visa Pichincha",            red:"visa",       tipo:"credito" },
  { id:"pich-debito",       banco_id:"pichincha",  label:"Débito Pichincha",          red:"visa",       tipo:"debito"  },
  { id:"ripley-mc",         banco_id:"ripley",     label:"Mastercard Ripley",         red:"mastercard", tipo:"credito" },
  { id:"falabella-cmr",     banco_id:"falabella",  label:"CMR Visa",                  red:"visa",       tipo:"credito" },
  { id:"oh-mc",             banco_id:"oh",         label:"Mastercard Oh!",            red:"mastercard", tipo:"credito" },
  { id:"cen-mc",            banco_id:"cencosud",   label:"Mastercard Cencosud",       red:"mastercard", tipo:"credito" },
  { id:"otro-credito",      banco_id:"otro",       label:"Tarjeta de Crédito",        red:"otro",       tipo:"credito" },
  { id:"otro-debito",       banco_id:"otro",       label:"Tarjeta de Débito",         red:"otro",       tipo:"debito"  },
];

// AFP fallback si la tabla aún no tiene datos
const AFP_FALLBACK = [
  { id: "integra",    label: "AFP Integra",    tasa: 11.37 },
  { id: "prima",      label: "AFP Prima",      tasa: 13.29 },
  { id: "habitat",    label: "AFP Hábitat",    tasa: 11.74 },
  { id: "profuturo",  label: "AFP Profuturo",  tasa: 13.53 },
  { id: "onp",        label: "ONP",            tasa: 13.00 },
  { id: "ninguna",    label: "Sin aporte",     tasa: 0     },
];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const { logout, setEmailConfirmed } = useAuth();
  const [step,    setStep]    = useState(0);
  const [afpId,   setAfpId]   = useState(null);
  const [tarjetas, setTarjetas] = useState([]);
  const [saving,  setSaving]  = useState(false);

  // Form para nueva tarjeta
  const [bancoId,  setBancoId]  = useState("");
  const [tipoId,   setTipoId]   = useState("");
  const [linea,    setLinea]    = useState("");
  const [cierre,   setCierre]   = useState("");
  const [pagoDia,  setPagoDia]  = useState("");
  const [color,    setColor]    = useState(COLORS[0]);

  const afps           = state.afps.length ? state.afps : AFP_FALLBACK;
  const allTipos       = state.tarjetaTipos.length ? state.tarjetaTipos : TIPOS_FALLBACK;
  const tiposFiltrados = allTipos.filter(t => t.banco_id === bancoId);
  const tipoSel        = allTipos.find(t => t.id === tipoId);
  const esDebito       = tipoSel?.tipo === "debito";

  function resetTarjetaForm() {
    setBancoId(""); setTipoId(""); setLinea("");
    setCierre(""); setPagoDia(""); setColor(COLORS[0]);
  }

  function agregarTarjeta() {
    if (!bancoId || !tipoId) return;
    const tipo  = allTipos.find(t => t.id === tipoId);
    const banco = state.bancos.find(b => b.id === bancoId);
    setTarjetas(prev => [...prev, {
      id:           uid(),
      bancoId,
      bancoLabel:   banco?.label || bancoId,
      tipoId,
      tipoLabel:    tipo?.label || tipoId,
      nombre:       tipo?.label || tipoId,
      lineaCredito: parseFloat(linea) || 0,
      cierre:       parseInt(cierre) || null,
      pagoDia:      parseInt(pagoDia) || null,
      color,
    }]);
    resetTarjetaForm();
  }

  async function finalizar() {
    setSaving(true);
    try {
      await dispatch({ type: "SET_CONFIG", payload: { ...state.config, afpId } });
      for (const t of tarjetas) {
        await dispatch({ type: "ADD_TARJETA", payload: t });
      }
      // Mostrar banner "cuenta lista" en Login y cerrar sesión
      // Cerrar sesión: el login mostrará banner de éxito
      setEmailConfirmed(true);
      await logout();
    } catch {
      setSaving(false);
    }
  }

  // ── Estilos base ────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg-base)", padding: 16,
    },
    card: {
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)", padding: "32px 28px",
      width: "100%", maxWidth: 440, boxShadow: "0 8px 40px #00000044",
    },
    title: {
      fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 800,
      color: "var(--text-primary)", marginBottom: 6,
    },
    sub: {
      fontSize: 11, color: "var(--text-dim)",
      fontFamily: "var(--font-sans)", lineHeight: 1.7, marginBottom: 20,
    },
    btn: {
      width: "100%", background: "linear-gradient(135deg,#22C55E,#4ADE80)",
      border: "none", borderRadius: "var(--radius-md)", color: "#0A0C10",
      fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 800,
      padding: "12px 0", cursor: "pointer", letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    btnSecondary: {
      width: "100%", background: "transparent",
      border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
      color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 11,
      fontWeight: 700, padding: "10px 0", cursor: "pointer",
      letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 8,
    },
    label: {
      fontSize: 9, color: "var(--text-ghost)", fontFamily: "var(--font-sans)",
      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5,
    },
    progress: {
      display: "flex", gap: 4, marginBottom: 24,
    },
  };

  // ── Barra de progreso ───────────────────────────────────────
  function Progress() {
    return (
      <div style={S.progress}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? "var(--green)" : "var(--border)",
            transition: "background .3s",
          }} />
        ))}
      </div>
    );
  }

  // ── PASO 0: Bienvenida ──────────────────────────────────────
  if (step === 0) return (
    <div style={S.page}>
      <div style={S.card}>
        <Progress />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700,
            background: "linear-gradient(135deg,#22C55E,#38BDF8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ¡Bienvenido!
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
            color: "var(--text-primary)", marginTop: 4 }}>
            Presupuesto Personal
          </div>
        </div>

        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "var(--radius-md)", padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#22C55E", fontFamily: "var(--font-sans)",
            fontWeight: 700, marginBottom: 4 }}>🔒 Tu privacidad es lo primero</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.7 }}>
            Toda tu información está cifrada y protegida en la nube.
            Solo tú tienes acceso a tus datos — nadie más puede verlos.
          </div>
        </div>

        <div style={{ ...S.sub, marginBottom: 24 }}>
          En los próximos pasos configuraremos tu perfil para que la app
          calcule correctamente tu sueldo neto y gestione tus tarjetas.
          Solo toma un minuto.
        </div>

        <button style={S.btn} onClick={() => setStep(1)}>
          Comenzar configuración
        </button>
      </div>
    </div>
  );

  // ── PASO 1: AFP ─────────────────────────────────────────────
  if (step === 1) return (
    <div style={S.page}>
      <div style={S.card}>
        <Progress />
        <div style={S.title}>Sistema previsional</div>
        <div style={S.sub}>
          ¿Con qué sistema realizas tus aportes de pensiones?
          Esto nos permite calcular tu descuento mensual correctamente.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
          {afps.map(a => (
            <button key={a.id} onClick={() => setAfpId(a.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", background: afpId === a.id ? "rgba(34,197,94,0.1)" : "var(--bg-input)",
              border: `1px solid ${afpId === a.id ? "var(--green)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", transition: "all .15s",
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700,
                  color: afpId === a.id ? "var(--green)" : "var(--text-primary)" }}>
                  {a.label}
                </div>
                {a.tasa > 0 && (
                  <div style={{ fontSize: 9, color: "var(--text-ghost)", marginTop: 2 }}>
                    Descuento: {a.tasa}% del sueldo bruto
                  </div>
                )}
              </div>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: `2px solid ${afpId === a.id ? "var(--green)" : "var(--border)"}`,
                background: afpId === a.id ? "var(--green)" : "transparent",
                flexShrink: 0,
              }} />
            </button>
          ))}
        </div>

        <button style={{ ...S.btn, opacity: afpId ? 1 : 0.4 }}
          disabled={!afpId} onClick={() => setStep(2)}>
          Siguiente
        </button>
        <button style={S.btnSecondary} onClick={() => setStep(0)}>
          Atrás
        </button>
      </div>
    </div>
  );

  // ── PASO 2: Tarjetas ────────────────────────────────────────
  if (step === 2) return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 480 }}>
        <Progress />
        <div style={S.title}>Tus tarjetas</div>
        <div style={S.sub}>
          Agrega tus tarjetas de crédito o débito para poder registrar gastos
          y cuotas. Puedes agregar más desde la sección Tarjetas en cualquier momento.
        </div>

        {/* Form agregar tarjeta */}
        <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "16px", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={S.label}>Banco</div>
              <select value={bancoId} onChange={e => { setBancoId(e.target.value); setTipoId(""); }}
                style={{ width: "100%", boxSizing: "border-box" }}>
                <option value="">Selecciona...</option>
                {state.bancos.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Tipo de tarjeta</div>
              <select value={tipoId} onChange={e => setTipoId(e.target.value)}
                disabled={!bancoId || tiposFiltrados.length === 0}
                style={{ width: "100%", boxSizing: "border-box" }}>
                <option value="">{bancoId ? "Selecciona..." : "Primero el banco"}</option>
                {tiposFiltrados.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!esDebito && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={S.label}>Línea (S/.)</div>
                <input type="number" placeholder="5000" value={linea}
                  onChange={e => setLinea(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={S.label}>Día cierre</div>
                <input type="number" placeholder="25" min="1" max="31" value={cierre}
                  onChange={e => setCierre(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={S.label}>Día pago</div>
                <input type="number" placeholder="5" min="1" max="31" value={pagoDia}
                  onChange={e => setPagoDia(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={S.label}>Color</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 22, height: 22, borderRadius: "50%", background: c,
                  border: color === c ? `2px solid white` : "2px solid transparent",
                  cursor: "pointer", outline: color === c ? `2px solid ${c}` : "none",
                }} />
              ))}
            </div>
          </div>

          <button onClick={agregarTarjeta}
            disabled={!bancoId || !tipoId}
            style={{
              background: (!bancoId || !tipoId) ? "var(--bg-hover)" : "var(--blue-bg)",
              border: `1px solid ${(!bancoId || !tipoId) ? "var(--border)" : "var(--blue)"}`,
              borderRadius: "var(--radius-sm)", color: (!bancoId || !tipoId) ? "var(--text-ghost)" : "var(--blue)",
              fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700,
              padding: "8px 16px", cursor: (!bancoId || !tipoId) ? "not-allowed" : "pointer",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
            + Agregar tarjeta
          </button>
        </div>

        {/* Lista de tarjetas agregadas */}
        {tarjetas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {tarjetas.map((t, i) => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", background: "var(--bg-input)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                borderLeft: `3px solid ${t.color}`,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700,
                    color: "var(--text-primary)" }}>
                    {t.bancoLabel} — {t.nombre}
                  </div>
                  {t.lineaCredito > 0 && (
                    <div style={{ fontSize: 9, color: "var(--text-ghost)" }}>
                      Línea: S/. {t.lineaCredito.toLocaleString()}
                      {t.cierre ? ` · Cierre: ${t.cierre}` : ""}
                      {t.pagoDia ? ` · Pago: ${t.pagoDia}` : ""}
                    </div>
                  )}
                </div>
                <button onClick={() => setTarjetas(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "var(--text-ghost)",
                    cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}
          disabled={saving} onClick={finalizar}>
          {saving ? "Guardando..." : "Finalizar configuración"}
        </button>
        <button style={S.btnSecondary} onClick={() => setStep(1)}>
          Atrás
        </button>
      </div>
    </div>
  );

  return null;
}
