// Dashboard principal — muestra KPIs, ciclos de tarjetas y graficos del mes.
// Lee gastos e ingresos reales desde AppContext.
// Cuando no hay datos registrados muestra estado vacio en lugar de datos demo.

import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useApp, useTotalesMes, useGastosMes } from "../context/AppContext";
import { CATEGORIAS, TARJETAS, EMAILJS, MESES } from "../constants";
import { fmt, diasPara, periodoActual, agruparPorCategoria } from "../utils";
import { KPICard, Card, SectionTitle, ChartTooltip, PageHeader, Badge, EmptyState } from "../components/UI";

// Alertas: se construyen desde state.gastosFijos dinámicamente

export default function Dashboard() {
  const [vista, setVista]           = useState("periodo");
  const [showAlerts, setShowAlerts] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [ejsReady, setEjsReady]     = useState(false);
  const ejsRef = useRef(false);

  const { state, dispatch } = useApp();
  const [showFijosEditor, setShowFijosEditor] = useState(false);
  const [fijoForm, setFijoForm] = useState({ descripcion:"", monto:"", dia:"" });
  const totales   = useTotalesMes();
  const gastosMes = useGastosMes();
  const periodo   = periodoActual();

  // Carga EmailJS una sola vez al montar
  useEffect(() => {
    if (ejsRef.current) return;
    ejsRef.current = true;
    if (window.emailjs) { window.emailjs.init(EMAILJS.PUBLIC_KEY); setEjsReady(true); return; }
    const s = document.createElement("script");
    s.src = EMAILJS.SCRIPT_URL;
    s.onload = () => { window.emailjs.init(EMAILJS.PUBLIC_KEY); setEjsReady(true); };
    document.head.appendChild(s);
  }, []);

  // ── Alertas de pagos proximos ──────────────────────
  const alertas         = state.gastosFijos.map(p => ({ ...p, titulo: p.descripcion, dias: diasPara(p.dia) })).filter(p => p.dias !== null && p.dias <= 7).sort((a,b) => a.dias - b.dias);
  const alertasCriticas = alertas.filter(a => a.dias <= 3);
  const totalAlertaMonto = alertas.reduce((s,a) => s + a.monto, 0);

  // ── Calculos del mes — solo datos reales ──────────
  const totalGastos  = gastosMes.reduce((s,g) => s + g.monto, 0);
  const totalFijos   = state.gastosFijos.reduce((s,f) => s + (parseFloat(f.monto)||0), 0);
  const totalCredito = gastosMes.filter(g => g.metodo === "bcp" || g.metodo === "amex").reduce((s,g) => s + g.monto, 0);
  const totalDebito  = gastosMes.filter(g => g.metodo === "debito" || g.metodo === "efectivo").reduce((s,g) => s + g.monto, 0);
  const netoMes = totales.neto; // neto del mes actual (0 si no registrado)
  const promedioIngresos = state.historialIngresos.length > 0
    ? state.historialIngresos.reduce((s, h) => s + h.neto, 0) / state.historialIngresos.length
    : 0;
  // Usar promedio si no hay registro del mes actual
  const ingresoBase  = netoMes > 0 ? netoMes : promedioIngresos;
  const usandoPromedio = netoMes === 0 && promedioIngresos > 0;
  const saldo        = ingresoBase - totalGastos - totalFijos;
  const tasaAhorro   = ingresoBase > 0 ? (saldo / ingresoBase) * 100 : 0;
  const hayIngresos  = ingresoBase > 0;
  const hayGastos    = gastosMes.length > 0;

  // Grafico de torta — solo si hay gastos
  const pieData = agruparPorCategoria(gastosMes, CATEGORIAS);
  const catTop  = [...pieData].sort((a,b) => b.total - a.total)[0];

  // Historial de 6 meses — construido 100% desde datos registrados
  const historial = (() => {
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const fecha  = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      const mIdx   = fecha.getMonth();
      const anio   = fecha.getFullYear();
      const gasts  = state.gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth() === mIdx && d.getFullYear() === anio; });
      const ingr   = state.historialIngresos.find(h => h.mesIdx === mIdx && h.anio === anio);
      return {
        mes:     MESES[mIdx],
        gastado: gasts.reduce((s,g) => s + g.monto, 0),
        ingreso: ingr?.neto ?? 0,
        fijos:   totalFijos,  // usa gastosFijos del estado
      };
    });
  })();

  const enviarCorreo = async (dias) => {
    if (!ejsReady || !window.emailjs) return;
    setEmailStatus("sending");
    const pagos = state.gastosFijos.map(p => ({ ...p, titulo: p.descripcion, dias: diasPara(p.dia) })).filter(p => p.dias !== null && p.dias <= dias);
    const total = pagos.reduce((s,p) => s + p.monto, 0);
    const lista = pagos.map(p => `• ${p.titulo} — S/. ${fmt(p.monto)} (en ${p.dias} dia${p.dias===1?"":"s"})`).join("\n");
    try {
      await window.emailjs.send(EMAILJS.SERVICE_ID, EMAILJS.TEMPLATE_ID, {
        dias_label: `Proximos ${dias} dias`, lista_pagos: lista, total: fmt(total),
      });
      setEmailStatus(dias === 3 ? "sent_3" : "sent_7");
      setTimeout(() => setEmailStatus(null), 4000);
    } catch {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus(null), 3000);
    }
  };

  return (
    <div>
      <PageHeader title="Resumen del Mes" accentColor="var(--blue)">
        {alertas.length > 0 && (
          <button onClick={() => setShowAlerts(!showAlerts)} style={{
            display:"flex", alignItems:"center", gap:8,
            background: showAlerts ? "var(--red-bg)" : "var(--yellow-bg)",
            border:`1.5px solid ${alertasCriticas.length > 0 ? "var(--red)" : "var(--yellow)"}`,
            borderRadius:"var(--radius-md)", padding:"8px 14px",
            color: alertasCriticas.length > 0 ? "var(--red)" : "var(--yellow)",
            fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, cursor:"pointer",
          }}>
            <span className="pulse" style={{ width:7, height:7, borderRadius:"50%", background: alertasCriticas.length > 0 ? "var(--red)" : "var(--yellow)", display:"inline-block" }}/>
            {alertas.length} pago{alertas.length > 1 ? "s" : ""} proximo{alertas.length > 1 ? "s" : ""}
            <span style={{ background: alertasCriticas.length > 0 ? "var(--red)" : "var(--yellow)", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#0A0C10" }}>{alertas.length}</span>
          </button>
        )}
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3 }}>
          {[{ k:"periodo", l:`Ciclo ${periodo.label}` }, { k:"calendario", l:"Mes calendario" }].map(v => (
            <button key={v.k} onClick={() => setVista(v.k)} style={{
              background: vista === v.k ? "var(--bg-hover)" : "transparent",
              border: vista === v.k ? "1px solid var(--blue)" : "1px solid transparent",
              borderRadius:"var(--radius-sm)", color: vista === v.k ? "var(--blue)" : "var(--text-muted)",
              fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700,
              padding:"6px 11px", cursor:"pointer", transition:"all .15s",
              letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap",
            }}>{v.l}</button>
          ))}
        </div>
      </PageHeader>

      {/* Panel de alertas */}
      {showAlerts && (
        <div className="slide-in" style={{ background:"#0E0808", borderBottom:`1px solid ${alertasCriticas.length > 0 ? "var(--red-border)" : "var(--yellow-border)"}`, padding:"16px 28px" }}>
          <div style={{ maxWidth:1000, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <SectionTitle color="var(--red)" style={{ marginBottom:0 }}>Pagos proximos — accion requerida</SectionTitle>
              <div style={{ display:"flex", gap:8 }}>
                {["3","7"].map(d => (
                  <button key={d} onClick={() => enviarCorreo(parseInt(d))} disabled={emailStatus === "sending"} style={{
                    background: d === "3" ? "var(--red-bg)" : "var(--yellow-bg)",
                    border:`1px solid ${d === "3" ? "var(--red)" : "var(--yellow)"}`,
                    borderRadius:"var(--radius-sm)", color: d === "3" ? "var(--red)" : "var(--yellow)",
                    fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700,
                    padding:"6px 12px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase",
                    opacity: emailStatus === "sending" ? .6 : 1,
                  }}>
                    {emailStatus === "sending" ? "Enviando..." : emailStatus === `sent_${d}` ? "✓ Enviado" : `Correo ${d} dias`}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10, marginBottom:10 }}>
              {alertas.map((a,i) => (
                <div key={i} style={{ background: a.dias <= 3 ? "var(--red-bg)" : "var(--yellow-bg)", border:`1px solid ${a.dias <= 3 ? "var(--red-border)" : "var(--yellow-border)"}`, borderRadius:"var(--radius-md)", padding:"11px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:"var(--text-primary)" }}>{a.titulo}</div>
                    <div style={{ fontSize:9, color: a.dias <= 3 ? "var(--red)" : "var(--yellow)", marginTop:3, fontFamily:"var(--font-sans)", fontWeight:600 }}>
                      {a.dias === 0 ? "HOY" : a.dias === 1 ? "Manana" : `En ${a.dias} dias`} — dia {a.dia}
                    </div>
                  </div>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color: a.dias <= 3 ? "var(--red)" : "var(--yellow)", fontWeight:500 }}>S/. {fmt(a.monto)}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:"1px solid var(--red-border)" }}>
              <span style={{ fontSize:9, color:"var(--text-ghost)" }}>
                {emailStatus === "error" ? "Error al enviar — verifica tu conexion" : ejsReady ? "✓ EmailJS listo" : "Cargando EmailJS..."}
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-sans)" }}>Total:</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--red)" }}>S/. {fmt(totalAlertaMonto)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-container">
        {/* KPIs principales */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          <KPICard
            label="Ingresos del mes"
            value={hayIngresos ? `S/. ${fmt(ingresoBase)}` : "Sin registrar"}
            valueColor={hayIngresos ? "var(--green)" : "var(--text-ghost)"}
            bg={hayIngresos ? "var(--green-bg)" : "var(--bg-input)"}
            border={hayIngresos ? "var(--green-border)" : "var(--border)"}
            sub={!hayIngresos ? "→ Ve a Ingresos" : usandoPromedio ? `Promedio ${state.historialIngresos.length} meses` : "Neto AFP Integra"}
            delay={0}
          />
          <KPICard label="Gastos variables"   value={`S/. ${fmt(totalGastos)}`}  valueColor="var(--text-primary)" delay={0.06}/>
          <KPICard label="Compromisos fijos"  value={`S/. ${fmt(totalFijos)}`}   valueColor="var(--yellow)" bg="var(--yellow-bg)" border="var(--yellow-border)" sub={state.gastosFijos.length > 0 ? `${state.gastosFijos.length} compromisos` : "Sin configurar aun"} delay={0.12}/>
          <KPICard label="Total egresos"      value={`S/. ${fmt(totalGastos + totalFijos)}`} valueColor={hayIngresos && totalGastos + totalFijos > netoMes ? "var(--red)" : "var(--text-primary)"} delay={0.18}/>
          <KPICard
            label="Saldo disponible"
            value={hayIngresos ? `S/. ${fmt(Math.abs(saldo))}` : "—"}
            valueColor={!hayIngresos ? "var(--text-ghost)" : saldo >= 0 ? "var(--green)" : "var(--red)"}
            bg={!hayIngresos ? "var(--bg-input)" : saldo >= 0 ? "var(--green-bg)" : "var(--red-bg)"}
            border={!hayIngresos ? "var(--border)" : saldo >= 0 ? "var(--green-border)" : "var(--red-border)"}
            sub={hayIngresos ? `${saldo >= 0 ? "Ahorro" : "Deficit"} ${tasaAhorro.toFixed(1)}%` : "Registra tu ingreso"}
            subColor={!hayIngresos ? "var(--text-ghost)" : saldo >= 0 ? "var(--green)" : "var(--red)"}
            delay={0.24}
          />
        </div>

        {/* Ciclos de tarjetas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {Object.values(TARJETAS).map(t => {
            const cuotasT    = state.tarjetas?.[t.id]?.cuotasActivas || [];
            const cuotaTotal = cuotasT.reduce((s,c) => s + (parseFloat(c.cuota) || 0), 0);
            const usado      = cuotaTotal;
            const disponible = t.lineaCredito - usado;
            const pctUsado   = t.lineaCredito > 0 ? (usado / t.lineaCredito) * 100 : 0;
            const diasP      = diasPara(t.pagoDia);
            return (
              <Card key={t.id} style={{ borderColor: t.color + "33" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <SectionTitle style={{ marginBottom:3 }}>Proximo pago</SectionTitle>
                    <div style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700, color:t.color }}>{t.nombre}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:22, fontWeight:500, color: diasP <= 5 ? "var(--red)" : diasP <= 10 ? "var(--yellow)" : t.color }}>{diasP}</div>
                    <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-sans)" }}>dias restantes</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    { l:"Cierre ciclo",   v:`Dia ${t.cierre}`,  c:"var(--text-secondary)" },
                    { l:"Limite pago",    v:`Dia ${t.pagoDia}`, c:t.color },
                    { l:"Cuotas activas", v:`${cuotasT.length} cuotas`, c:"var(--text-secondary)" },
                  ].map((d,i) => (
                    <div key={i} style={{ background:"var(--bg-input)", borderRadius:"var(--radius-sm)", padding:"9px 10px" }}>
                      <div style={{ fontSize:8, color:"var(--text-dim)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{d.l}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:13, color:d.c, fontWeight:500 }}>{d.v}</div>
                    </div>
                  ))}
                </div>
                {/* Barra de uso de linea */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-dim)", marginBottom:5, fontFamily:"var(--font-sans)" }}>
                    <span>Linea de credito usada</span>
                    <span style={{ color: pctUsado > 80 ? "var(--red)" : pctUsado > 50 ? "var(--yellow)" : "var(--green)" }}>{pctUsado.toFixed(0)}%</span>
                  </div>
                  <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${Math.min(100,pctUsado)}%`, height:"100%", background: pctUsado > 80 ? "var(--red)" : pctUsado > 50 ? "var(--yellow)" : t.color, borderRadius:3, transition:"width .6s" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, marginTop:4, fontFamily:"var(--font-mono)" }}>
                    <span style={{ color:"var(--text-dim)" }}>Usado S/. {fmt(usado)}</span>
                    <span style={{ color: disponible < 200 ? "var(--red)" : "var(--green)" }}>Disponible S/. {fmt(disponible)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Graficos */}
        <div className="grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Card>
            <SectionTitle>Gasto por categoria</SectionTitle>
            {!hayGastos ? (
              <div style={{ padding:"30px 0", textAlign:"center" }}>
                <div style={{ fontSize:22, opacity:.2, marginBottom:8 }}>◌</div>
                <div style={{ fontFamily:"var(--font-sans)", fontSize:11, color:"var(--text-ghost)" }}>Registra gastos para ver el desglose</div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pieData.map(d => ({ name:d.label, value:d.total, color:d.color }))} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" strokeWidth={0}>
                      {pieData.map((d,i) => <Cell key={i} fill={d.color} opacity={.85}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                  {[...pieData].sort((a,b) => b.total - a.total).map((d,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:10, color:"var(--text-secondary)", fontFamily:"var(--font-sans)" }}>{d.label}</span>
                      </div>
                      <span style={{ fontSize:10, color:"var(--text-primary)", fontFamily:"var(--font-mono)" }}>S/. {fmt(d.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Ultimos 6 meses</SectionTitle>
            {historial.every(h => h.gastado === 0 && h.ingreso === 0) ? (
              <div style={{ padding:"30px 0", textAlign:"center" }}>
                <div style={{ fontSize:22, opacity:.2, marginBottom:8 }}>▭</div>
                <div style={{ fontFamily:"var(--font-sans)", fontSize:11, color:"var(--text-ghost)" }}>El historial se construye automaticamente</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={historial} barSize={12} barGap={2}>
                  <XAxis dataKey="mes" tick={{ fill:"var(--text-dim)", fontSize:9, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="ingreso" name="Ingreso"  fill="#4ADE8033" radius={[3,3,0,0]}/>
                  <Bar dataKey="gastado" name="Variable" fill="var(--blue)" radius={[3,3,0,0]}/>
                  <Bar dataKey="fijos"   name="Fijos"    fill="#FBBF2488" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Editor de gastos fijos */}
        <Card style={{ borderColor: showFijosEditor ? "var(--yellow-border)" : "var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: showFijosEditor || state.gastosFijos.length > 0 ? 14 : 0 }}>
            <div>
              <SectionTitle style={{ marginBottom:2 }}>Compromisos fijos mensuales</SectionTitle>
              {state.gastosFijos.length === 0 && !showFijosEditor && (
                <div style={{ fontSize:9, color:"var(--text-ghost)" }}>Pension, servicios, pagos tarjeta...</div>
              )}
            </div>
            <button onClick={() => setShowFijosEditor(!showFijosEditor)} style={{
              background: showFijosEditor ? "var(--yellow-bg)" : "var(--bg-input)",
              border:`1px solid ${showFijosEditor ? "var(--yellow)" : "var(--border)"}`,
              borderRadius:"var(--radius-sm)", color: showFijosEditor ? "var(--yellow)" : "var(--text-muted)",
              fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700,
              padding:"5px 12px", cursor:"pointer", letterSpacing:"0.08em", textTransform:"uppercase",
            }}>{showFijosEditor ? "Cerrar" : "+ Agregar"}</button>
          </div>

          {/* Formulario nuevo fijo */}
          {showFijosEditor && (
            <div className="slide-in" style={{ display:"grid", gridTemplateColumns:"1fr 100px 70px auto", gap:8, marginBottom:14, alignItems:"end" }}>
              <div>
                <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Descripcion</div>
                <input placeholder="Ej: Netflix, Pension..." value={fijoForm.descripcion} onChange={e => setFijoForm(f => ({...f, descripcion: e.target.value}))} style={{ padding:"8px 10px", fontSize:11 }}/>
              </div>
              <div>
                <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Monto S/.</div>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={fijoForm.monto} onChange={e => setFijoForm(f => ({...f, monto: e.target.value}))} style={{ padding:"8px 10px", fontSize:11 }}/>
              </div>
              <div>
                <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Dia vence</div>
                <input type="number" min="1" max="31" placeholder="1" value={fijoForm.dia} onChange={e => setFijoForm(f => ({...f, dia: e.target.value}))} style={{ padding:"8px 10px", fontSize:11 }}/>
              </div>
              <button
                onClick={() => {
                  if (!fijoForm.descripcion.trim() || !fijoForm.monto) return;
                  dispatch({ type:"ADD_GASTO_FIJO", payload: { descripcion: fijoForm.descripcion.trim(), monto: parseFloat(fijoForm.monto), dia: parseInt(fijoForm.dia) || 1 } });
                  setFijoForm({ descripcion:"", monto:"", dia:"" });
                }}
                style={{ background:"linear-gradient(135deg,#22C55E,#4ADE80)", border:"none", borderRadius:"var(--radius-sm)", color:"#0A0C10", fontFamily:"var(--font-sans)", fontSize:10, fontWeight:800, padding:"8px 14px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                + Agregar
              </button>
            </div>
          )}

          {/* Lista gastos fijos */}
          {state.gastosFijos.length === 0 ? (
            <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text-ghost)" }}>
              <div style={{ fontSize:11, fontFamily:"var(--font-sans)" }}>Sin compromisos fijos — agrega tus pagos mensuales recurrentes</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {state.gastosFijos.map((f, i) => {
                const dias = diasPara(f.dia);
                const urgente = dias !== null && dias <= 7;
                return (
                  <div key={f.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:"var(--bg-input)", border:`1px solid ${urgente ? "var(--yellow-border)" : "var(--border)"}`, borderRadius:"var(--radius-sm)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {urgente && <span className="pulse" style={{ width:6, height:6, borderRadius:"50%", background:"var(--yellow)", display:"inline-block", flexShrink:0 }}/>}
                      <div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:600, color:"var(--text-primary)" }}>{f.descripcion}</div>
                        <div style={{ fontSize:9, color: urgente ? "var(--yellow)" : "var(--text-ghost)", marginTop:1 }}>
                          Dia {f.dia} — {dias === 0 ? "HOY" : dias === 1 ? "manana" : dias !== null ? `en ${dias} dias` : "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:13, color: urgente ? "var(--yellow)" : "var(--text-primary)" }}>S/. {fmt(f.monto)}</span>
                      <button onClick={() => dispatch({ type:"DELETE_GASTO_FIJO", id: f.id })}
                        style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:12, padding:"2px 5px", transition:"color .15s" }}
                        onMouseOver={e => e.target.style.color="var(--red)"} onMouseOut={e => e.target.style.color="var(--text-ghost)"}>✕</button>
                    </div>
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderTop:"1px solid var(--border)", marginTop:2 }}>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700, color:"var(--text-ghost)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{state.gastosFijos.length} compromisos</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:"var(--yellow)" }}>S/. {fmt(totalFijos)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Metodo pago + insights */}
        <Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
            <div>
              <SectionTitle>Metodo de pago</SectionTitle>
              {!hayGastos ? (
                <div style={{ fontSize:10, color:"var(--text-ghost)", paddingTop:6 }}>Sin gastos registrados</div>
              ) : (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text-secondary)", marginBottom:6 }}>
                    <span>Credito</span><span>Debito</span>
                  </div>
                  <div style={{ height:8, background:"var(--border)", borderRadius:4, overflow:"hidden", display:"flex" }}>
                    <div style={{ width:`${(totalCredito / (totalGastos || 1) * 100).toFixed(1)}%`, background:"linear-gradient(90deg,#0EA5E9,#38BDF8)", borderRadius:"4px 0 0 4px" }}/>
                    <div style={{ flex:1, background:"linear-gradient(90deg,#4ADE8088,#4ADE80)", borderRadius:"0 4px 4px 0" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:6 }}>
                    <span style={{ color:"var(--blue)", fontFamily:"var(--font-mono)" }}>S/. {fmt(totalCredito)}</span>
                    <span style={{ color:"var(--green)", fontFamily:"var(--font-mono)" }}>S/. {fmt(totalDebito)}</span>
                  </div>
                </>
              )}
            </div>
            <div>
              <SectionTitle>Mayor categoria</SectionTitle>
              {catTop ? (
                <>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:"var(--orange)", marginBottom:3 }}>{catTop.label}</div>
                  <div style={{ fontSize:10, color:"var(--text-dim)" }}>S/. {fmt(catTop.total)}</div>
                </>
              ) : (
                <div style={{ fontSize:10, color:"var(--text-ghost)", paddingTop:6 }}>Sin datos aun</div>
              )}
            </div>
            <div>
              <SectionTitle>Tasa de ahorro</SectionTitle>
              {!hayIngresos ? (
                <div style={{ fontSize:10, color:"var(--text-ghost)", paddingTop:6 }}>Registra tu ingreso para calcular</div>
              ) : (
                <>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:22, color: tasaAhorro >= 20 ? "var(--green)" : tasaAhorro >= 10 ? "var(--yellow)" : "var(--red)" }}>
                    {tasaAhorro.toFixed(1)}%
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:3 }}>
                    {tasaAhorro >= 20 ? "Excelente" : tasaAhorro >= 10 ? "Aceptable" : "Mejorable"}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
