// Tarjetas de crédito — dinámico, lee state.tarjetasCredito desde Supabase
// El usuario puede agregar/editar/eliminar tarjetas

import { useState } from "react";
import { uid } from "../utils";
import { useApp } from "../context/AppContext";
import { fmt, diasPara } from "../utils";
import { Card, SectionTitle, KPICard, PageHeader, Badge, ProgressBar, Btn, Field } from "../components/UI";

const MESES_LABEL = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];

// ── CronogramaCard ──────────────────────────────────────────────────────────
function CronogramaCard({ tarjeta, cuotas, gastos }) {
  const hoy        = new Date();
  const mesActual  = hoy.getMonth();   // 0-indexed
  const anioActual = hoy.getFullYear();
  const [mesSel, setMesSel] = useState(mesActual);

  // Gastos directos cuya fecha de cargo cae en este mes
  const gastosDelMes = (gastos||[]).filter(g => {
    if (g.tarjetaId !== tarjeta.id || g.esCuota) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesSel && d.getFullYear() === anioActual;
  });

  // Cuotas que se pagan en este mes (mesSel es 0-indexed, mesPrimerPago es 1-indexed)
  const cuotasDelMes = (cuotas||[]).filter(c => {
    const anioIni  = c.anioPrimerPago || anioActual;
    const mesIni   = c.mesPrimerPago  || (mesActual + 1); // 1-indexed
    const diff     = (anioActual - anioIni) * 12 + (mesSel - (mesIni - 1));
    const numCuota = diff + 1;
    return numCuota >= 1 && numCuota <= parseInt(c.totalCuotas||0);
  });

  const totalMes = gastosDelMes.reduce((s,g)=>s+(parseFloat(g.monto)||0),0)
                 + cuotasDelMes.reduce((s,c)=>s+(parseFloat(c.cuota)||0),0);
  const esActual = mesSel === mesActual;
  const mesNombre = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][mesSel];

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <SectionTitle style={{marginBottom:0}}>Cronograma {tarjeta.nombre}</SectionTitle>
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          <button onClick={()=>setMesSel(m=>Math.max(0,m-1))} disabled={mesSel===0}
            style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-muted)", width:24, height:24, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color:esActual?tarjeta.color:"var(--text-secondary)", minWidth:70, textAlign:"center" }}>
            {mesNombre}
            {esActual&&<span style={{ display:"block", fontSize:8, color:tarjeta.color }}>MES ACTUAL</span>}
          </span>
          <button onClick={()=>setMesSel(m=>Math.min(11,m+1))} disabled={mesSel===11}
            style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-muted)", width:24, height:24, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      {tarjeta.cierre && (
        <div style={{ fontSize:9, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", marginBottom:10, padding:"6px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)" }}>
          Cierre día {tarjeta.cierre} — Pago día <span style={{ color:tarjeta.color, fontWeight:700 }}>{tarjeta.pagoDia}</span>
        </div>
      )}

      {gastosDelMes.length===0&&cuotasDelMes.length===0 ? (
        <div style={{ fontSize:9, color:"var(--text-ghost)", textAlign:"center", padding:"14px 0", fontFamily:"var(--font-sans)" }}>Sin compras registradas en este ciclo</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {gastosDelMes.map((g,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", borderLeft:`2px solid ${tarjeta.color}` }}>
              <div>
                <div style={{ fontSize:10, color:"var(--text-primary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{g.descripcion}</div>
                <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)" }}>Compra directa</div>
              </div>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:tarjeta.color }}>S/. {fmt(g.monto)}</span>
            </div>
          ))}
          {cuotasDelMes.map((c,i)=>{
            const anioIni  = c.anioPrimerPago||anioActual;
            const mesIni   = c.mesPrimerPago||(mesActual+1);
            const numCuota = (anioActual-anioIni)*12+(mesSel-(mesIni-1))+1;
            return (
              <div key={"c"+i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"var(--blue-bg)", borderRadius:"var(--radius-sm)", borderLeft:"2px solid var(--blue)" }}>
                <div>
                  <div style={{ fontSize:10, color:"var(--text-primary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{c.desc}</div>
                  <div style={{ fontSize:8, color:"var(--blue)", fontFamily:"var(--font-sans)" }}>Cuota {numCuota}/{c.totalCuotas}</div>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--blue)" }}>S/. {fmt(c.cuota)}</span>
              </div>
            );
          })}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", borderTop:"1px solid var(--border)", marginTop:2 }}>
            <span style={{ fontSize:10, fontFamily:"var(--font-sans)", color:"var(--text-muted)", fontWeight:700 }}>Total a pagar</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:tarjeta.color, fontWeight:600 }}>S/. {fmt(totalMes)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── PanelTarjeta ─────────────────────────────────────────────────────────────
function PanelTarjeta({ tarjeta, cuotas, gastos, onEdit, onDelete }) {
  const hoy        = new Date();
  const mesActual  = hoy.getMonth() + 1;   // 1-indexed
  const anioActual = hoy.getFullYear();
  const diaHoy     = hoy.getDate();

  const calcPagadasAuto = (c) => {
    const anioIni = c.anioPrimerPago||anioActual;
    const mesIni  = c.mesPrimerPago||mesActual;
    const diff = (anioActual-anioIni)*12+(mesActual-mesIni)+1;
    return Math.min(Math.max(diff,parseInt(c.pagadas)||0),parseInt(c.totalCuotas)||0);
  };

  const totalCuotasMes = cuotas.reduce((s,c)=>{
    const pAuto  = calcPagadasAuto(c);
    const totalC = parseInt(c.totalCuotas)||0;
    return pAuto<totalC ? s+(parseFloat(c.cuota)||0) : s;
  },0);

  // Línea de crédito usada — gastos directos no pagados + deuda cuotas pendientes
  const calcLineaUsada = () => {
    const pagoDia = tarjeta.pagoDia;
    let ultimoPago;
    if (diaHoy>=pagoDia) {
      ultimoPago = new Date(anioActual,hoy.getMonth(),pagoDia);
    } else {
      ultimoPago = new Date(anioActual,hoy.getMonth()-1,pagoDia);
    }
    const directosPendientes = (gastos||[])
      .filter(g=>g.tarjetaId===tarjeta.id&&!g.esCuota)
      .filter(g=>new Date(g.fecha)>ultimoPago)
      .reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
    const deudaCuotas = cuotas.reduce((s,c)=>{
      const pAuto  = calcPagadasAuto(c);
      const totalC = parseInt(c.totalCuotas)||0;
      const rest   = totalC-pAuto;
      return rest>0 ? s+(parseFloat(c.cuota)||0)*rest : s;
    },0);
    return directosPendientes+deudaCuotas;
  };

  const lineaUsada    = calcLineaUsada();
  const lineaDisp     = (tarjeta.lineaCredito||0)-lineaUsada;
  const pctLinea      = tarjeta.lineaCredito ? (lineaUsada/tarjeta.lineaCredito)*100 : 0;
  const diasProxPago  = tarjeta.pagoDia ? diasPara(tarjeta.pagoDia) : null;

  // Gastos directos pendientes de pago
  const directosPendientes = (gastos||[]).filter(g=>{
    if(g.tarjetaId!==tarjeta.id||g.esCuota) return false;
    const pagoDia = tarjeta.pagoDia;
    let ultimoPago;
    if(diaHoy>=pagoDia){
      ultimoPago = new Date(anioActual,hoy.getMonth(),pagoDia);
    } else {
      ultimoPago = new Date(anioActual,hoy.getMonth()-1,pagoDia);
    }
    return new Date(g.fecha)>ultimoPago;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Header tarjeta */}
      <Card style={{ borderColor:tarjeta.color+"44" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:tarjeta.color }}/>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{tarjeta.bancoLabel}</span>
            </div>
            <div style={{ fontFamily:"var(--font-sans)", fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>{tarjeta.nombre}</div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={onEdit} style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, padding:"6px 12px", cursor:"pointer" }}>✏ Editar</button>
            <button onClick={onDelete} style={{ background:"none", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontSize:10, padding:"6px 10px", cursor:"pointer" }} onMouseOver={e=>e.currentTarget.style.color="var(--red)"} onMouseOut={e=>e.currentTarget.style.color="var(--text-ghost)"}>✕</button>
          </div>
        </div>

        {/* KPIs tarjeta */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
          {[
            { l:"Línea de crédito", v:`S/. ${fmt(tarjeta.lineaCredito||0)}`, c:"var(--text-primary)" },
            { l:"Cuotas este mes",  v:`S/. ${fmt(totalCuotasMes)}`,          c:"var(--blue)"         },
            { l:"Próximo pago",     v:diasProxPago!=null?`${diasProxPago} días`:"—", c:diasProxPago!=null&&diasProxPago<=7?"var(--red)":"var(--green)" },
          ].map((kpi,i)=>(
            <div key={i} style={{ background:"var(--bg-input)", borderRadius:"var(--radius-md)", padding:"10px 12px" }}>
              <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{kpi.l}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:14, color:kpi.c, fontWeight:600 }}>{kpi.v}</div>
            </div>
          ))}
        </div>

        {/* Barra línea de crédito */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:9, color:"var(--text-ghost)", fontFamily:"var(--font-sans)" }}>Línea usada</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:pctLinea>80?"var(--red)":pctLinea>60?"var(--yellow)":"var(--green)" }}>S/. {fmt(lineaUsada)} / S/. {fmt(tarjeta.lineaCredito||0)}</span>
          </div>
          <ProgressBar pct={pctLinea} color={pctLinea>80?"var(--red)":pctLinea>60?"var(--yellow)":"var(--green)"}/>
          <div style={{ fontSize:9, color:"var(--text-ghost)", textAlign:"right", marginTop:3 }}>
            S/. {fmt(lineaDisp)} disponible
          </div>
        </div>

        {/* Info cierre/pago */}
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, padding:"8px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>
            Cierre: <strong>día {tarjeta.cierre}</strong>
          </div>
          <div style={{ flex:1, padding:"8px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>
            Pago: <strong style={{color:tarjeta.color}}>día {tarjeta.pagoDia}</strong>
          </div>
        </div>
      </Card>

      {/* Compras directas pendientes */}
      {directosPendientes.length>0&&(
        <Card>
          <SectionTitle>Compras directas pendientes</SectionTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {directosPendientes.map((g,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", borderLeft:`2px solid ${tarjeta.color}` }}>
                <div>
                  <div style={{ fontSize:11, fontFamily:"var(--font-sans)", fontWeight:600, color:"var(--text-primary)" }}>{g.descripcion}</div>
                  <div style={{ fontSize:8, color:"var(--text-ghost)" }}>{g.fecha}</div>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:tarjeta.color }}>S/. {fmt(g.monto)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cuotas activas */}
      {cuotas.length>0&&(
        <Card>
          <SectionTitle>Cuotas activas ({cuotas.length})</SectionTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {cuotas.map((c,i)=>{
              const pAuto  = calcPagadasAuto(c);
              const totalC = parseInt(c.totalCuotas)||0;
              const pct    = totalC>0?(pAuto/totalC)*100:0;
              const liq    = pAuto>=totalC;
              return (
                <div key={i} className="fade-up" style={{ animationDelay:`${i*0.04}s` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{c.desc}</div>
                      <div style={{ display:"flex", gap:5 }}>
                        <Badge color={liq?"var(--green)":"var(--blue)"}>{liq?"Liquidada":`Cuota ${pAuto}/${totalC}`}</Badge>
                        {c.conInteres&&<Badge color="var(--red)">Con intereses</Badge>}
                      </div>
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:liq?"var(--green)":tarjeta.color }}>S/. {fmt(c.cuota)}/mes</span>
                  </div>
                  <ProgressBar pct={pct} color={liq?"var(--green)":tarjeta.color}/>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:8, color:"var(--text-ghost)", marginTop:3 }}>
                    <span>Total: S/. {fmt(c.montoTotal)}</span>
                    <span>Primer pago: {MESES_LABEL[c.mesPrimerPago||1]} {c.anioPrimerPago||""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── FormTarjeta ──────────────────────────────────────────────────────────────
function FormTarjeta({ bancos, tarjetaTipos, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { bancoId: bancos[0]?.id || "", tipoId: "", color: "#38BDF8", lineaCredito: "", cierre: "", pagoDia: "" });
  const [errors, setErrors] = useState({});
  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const tiposFiltrados = tarjetaTipos.filter(t => t.banco_id === form.bancoId);

  const validate = () => {
    const e = {};
    if (!form.tipoId)                                                          e.tipoId      = "Selecciona un tipo";
    if (!form.lineaCredito || parseFloat(form.lineaCredito) <= 0)              e.lineaCredito = "Requerido";
    if (!form.cierre  || parseInt(form.cierre) < 1  || parseInt(form.cierre) > 31)  e.cierre  = "Día 1-31";
    if (!form.pagoDia || parseInt(form.pagoDia) < 1 || parseInt(form.pagoDia) > 31) e.pagoDia = "Día 1-31";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const tipo  = tarjetaTipos.find(t => t.id === form.tipoId);
    const banco = bancos.find(b => b.id === form.bancoId);
    onSave({
      bancoId:      form.bancoId,
      bancoLabel:   banco?.label || form.bancoId,
      tipoId:       form.tipoId,
      tipoLabel:    tipo?.label || form.tipoId,
      nombre:       tipo?.label || form.tipoId,
      color:        form.color,
      lineaCredito: parseFloat(form.lineaCredito),
      cierre:       parseInt(form.cierre),
      pagoDia:      parseInt(form.pagoDia),
    });
  };

  const COLORES = ["#38BDF8", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#F97316", "#6B7280"];

  return (
    <Card className="fade-up" style={{ borderColor: "var(--blue-border)" }}>
      <SectionTitle color="var(--blue)">{initial?.id ? "Editar tarjeta" : "Nueva tarjeta"}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Banco">
            <select value={form.bancoId} onChange={e => { sf("bancoId", e.target.value); sf("tipoId", ""); }}
              style={{ width: "100%", padding: "8px 10px", fontSize: 11 }}>
              <option value="">Selecciona...</option>
              {bancos.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Tipo de tarjeta" error={errors.tipoId}>
            <select value={form.tipoId} onChange={e => sf("tipoId", e.target.value)}
              disabled={!form.bancoId || tiposFiltrados.length === 0}
              style={{ width: "100%", padding: "8px 10px", fontSize: 11 }}>
              <option value="">{form.bancoId ? "Selecciona..." : "Primero el banco"}</option>
              {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Color">
          <div style={{ display: "flex", gap: 8 }}>
            {COLORES.map(c => (
              <button key={c} onClick={() => sf("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "white" : "transparent"}`, cursor: "pointer", outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Línea de crédito (S/.)" error={errors.lineaCredito}>
            <input type="number" placeholder="5000" value={form.lineaCredito} onChange={e => sf("lineaCredito", e.target.value)} />
          </Field>
          <Field label="Día de cierre" error={errors.cierre}>
            <input type="number" min="1" max="31" placeholder="10" value={form.cierre} onChange={e => sf("cierre", e.target.value)} />
          </Field>
          <Field label="Día de pago" error={errors.pagoDia}>
            <input type="number" min="1" max="31" placeholder="5" value={form.pagoDia} onChange={e => sf("pagoDia", e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" size="full" onClick={handleSave}>{initial?.id ? "Guardar cambios" : "Agregar tarjeta"}</Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        </div>
      </div>
    </Card>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Tarjetas() {
  const { state, dispatch } = useApp();
  const [tabId, setTabId]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null); // tarjeta a editar

  const tarjetas     = state.tarjetasCredito || [];
  const bancos       = state.bancos || [];
  const tarjetaTipos = state.tarjetaTipos || [];

  // Auto-seleccionar primera tarjeta si no hay tab
  const tarjetaActiva = tabId
    ? tarjetas.find(t=>t.id===tabId) || tarjetas[0]
    : tarjetas[0];

  const cuotasTarjeta = tarjetaActiva ? (state.cuotas?.[tarjetaActiva.id]?.cuotasActivas || []) : [];

  const totalCuotasTodas = tarjetas.reduce((s,t)=>{
    const cuotas = state.cuotas?.[t.id]?.cuotasActivas||[];
    return s+cuotas.reduce((ss,c)=>ss+(parseFloat(c.cuota)||0),0);
  },0);
  const totalLineaTodas = tarjetas.reduce((s,t)=>s+(t.lineaCredito||0),0);

  const handleSaveTarjeta = async (data) => {
    if (editando) {
      dispatch({ type:"UPDATE_TARJETA", id:editando.id, payload:data });
    } else {
      dispatch({ type:"ADD_TARJETA", payload:{ id: uid(), ...data } });
    }
    setShowForm(false);
    setEditando(null);
  };

  const handleDeleteTarjeta = (id) => {
    if (confirm("¿Eliminar esta tarjeta? Se perderán sus cuotas asociadas.")) {
      dispatch({ type:"DELETE_TARJETA", id });
      if (tabId===id) setTabId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Tarjetas de Crédito" accentColor="var(--blue)">
        <Btn variant="primary" onClick={()=>{ setShowForm(true); setEditando(null); }}>+ Nueva tarjeta</Btn>
      </PageHeader>

      <div className="page-container">
        {/* KPIs globales */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Tarjetas activas"     value={`${tarjetas.length}`}              valueColor="var(--blue)"   delay={0}/>
          <KPICard label="Línea total"           value={`S/. ${fmt(totalLineaTodas)}`}     valueColor="var(--text-primary)" delay={0.06}/>
          <KPICard label="Cuotas activas"        value={`${Object.values(state.cuotas||{}).reduce((s,e)=>s+e.cuotasActivas.length,0)}`} sub="cuotas vigentes" delay={0.12}/>
          <KPICard label="Compromiso mensual"    value={`S/. ${fmt(totalCuotasTodas)}`}    valueColor="var(--orange)" delay={0.18}/>
        </div>

        {/* Form nueva/editar tarjeta */}
        {(showForm||editando) && (
          <FormTarjeta
            bancos={bancos}
            tarjetaTipos={tarjetaTipos}
            initial={editando}
            onSave={handleSaveTarjeta}
            onCancel={()=>{ setShowForm(false); setEditando(null); }}
          />
        )}

        {tarjetas.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", background:"var(--bg-card)", border:"1px dashed var(--border)", borderRadius:"var(--radius-lg)" }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:.3 }}>💳</div>
            <div style={{ fontFamily:"var(--font-sans)", fontSize:14, fontWeight:700, color:"var(--text-secondary)", marginBottom:8 }}>Sin tarjetas registradas</div>
            <div style={{ fontSize:11, color:"var(--text-ghost)", marginBottom:20 }}>Agrega tu primera tarjeta de crédito para comenzar a registrar tus compras y cuotas.</div>
            <Btn variant="primary" onClick={()=>setShowForm(true)}>+ Agregar primera tarjeta</Btn>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            {/* Tabs tarjetas */}
            <div>
              <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3, marginBottom:16, flexWrap:"wrap" }}>
                {tarjetas.map(t=>(
                  <button key={t.id} onClick={()=>setTabId(t.id)} style={{ flex:1, padding:"7px 12px", background:tarjetaActiva?.id===t.id?"var(--bg-hover)":"transparent", border:`1px solid ${tarjetaActiva?.id===t.id?t.color:"transparent"}`, borderRadius:"var(--radius-sm)", color:tarjetaActiva?.id===t.id?t.color:"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:t.color, flexShrink:0 }}/>
                    {t.nombre}
                  </button>
                ))}
              </div>

              {tarjetaActiva&&(
                <PanelTarjeta
                  tarjeta={tarjetaActiva}
                  cuotas={cuotasTarjeta}
                  gastos={state.gastos}
                  onEdit={()=>{ setEditando(tarjetaActiva); setShowForm(false); }}
                  onDelete={()=>handleDeleteTarjeta(tarjetaActiva.id)}
                />
              )}
            </div>

            {/* Cronograma */}
            <div>
              {tarjetaActiva&&(
                <CronogramaCard
                  tarjeta={tarjetaActiva}
                  cuotas={cuotasTarjeta}
                  gastos={state.gastos}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
