// Deudas y prestamos — solo prestamos personales/bancarios.
// Las cuotas de tarjetas de credito se gestionan en Tarjetas.
// Muestra un panel de referencia con los compromisos de cada tarjeta.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TARJETAS, MESES } from "../constants";
import { fmt, diasPara, uid } from "../utils";
import { Card, SectionTitle, KPICard, PageHeader, Badge, ProgressBar, Btn, Field, EmptyState } from "../components/UI";

const TIPOS = [
  { id:"personal", label:"Prestamo personal", color:"var(--orange)" },
  { id:"bancario", label:"Prestamo bancario", color:"var(--blue)"   },
];

const EMPTY = {
  tipo:"personal", descripcion:"", acreedor:"", montoOriginal:"",
  cuotaMensual:"", mesesPactados:"", pagosRealizados:"0",
  diaVencimiento:"", fechaInicio: new Date().toISOString().slice(0,7),
  notas:"",
};

export default function Deudas() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [pagoModal, setPagoModal] = useState(null);

  const sf = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:null})); };

  const deudas   = state.deudas || [];
  const pagos    = state.pagosDeudas || [];

  const validate = () => {
    const e = {};
    if (!form.descripcion.trim()) e.descripcion = "Requerido";
    if (!form.cuotaMensual || parseFloat(form.cuotaMensual)<=0) e.cuotaMensual = "Requerido";
    if (!form.mesesPactados || parseInt(form.mesesPactados)<=0) e.mesesPactados = "Requerido";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    dispatch({ type:"ADD_DEUDA", payload:{
      ...form,
      montoOriginal: parseFloat(form.montoOriginal)||0,
      cuotaMensual:  parseFloat(form.cuotaMensual),
      mesesPactados: parseInt(form.mesesPactados),
      pagosRealizados:parseInt(form.pagosRealizados)||0,
      diaVencimiento: parseInt(form.diaVencimiento)||1,
    }});
    setForm(EMPTY);
    setShowForm(false);
  };

  const registrarPago = (deudaId) => {
    dispatch({ type:"ADD_PAGO_DEUDA", payload:{
      deudaId, fecha: new Date().toISOString().slice(0,10), monto: deudas.find(d=>d.id===deudaId)?.cuotaMensual || 0,
    }});
    setPagoModal(null);
  };

  const delDeuda = (id) => dispatch({ type:"DELETE_DEUDA", id });

  const getTipo  = (id) => TIPOS.find(t=>t.id===id) || TIPOS[0];

  // KPIs
  const deudasActivas = deudas.filter(d => {
    const rest = (d.mesesPactados||0) - (d.pagosRealizados||0);
    return rest > 0;
  });
  const totalDeuda    = deudasActivas.reduce((s,d) => {
    const rest = (d.mesesPactados - d.pagosRealizados) * d.cuotaMensual;
    return s + rest;
  }, 0);
  const cuotaMes      = deudasActivas.reduce((s,d) => s + d.cuotaMensual, 0);
  const proxVence     = deudasActivas
    .filter(d=>d.diaVencimiento)
    .map(d=>({...d, dias:diasPara(d.diaVencimiento)}))
    .sort((a,b)=>a.dias-b.dias)[0];

  // Referencia tarjetas de credito
  const bcpCuotas  = state.tarjetas?.bcp?.cuotasActivas || [];
  const amexCuotas = state.tarjetas?.amex?.cuotasActivas || [];
  const cuotaBCP   = bcpCuotas.reduce((s,c)=>s+(parseFloat(c.cuota)||0),0);
  const cuotaAMEX  = amexCuotas.reduce((s,c)=>s+(parseFloat(c.cuota)||0),0);

  return (
    <div>
      <PageHeader title="Deudas y Prestamos" accentColor="var(--red)">
        <Btn variant="danger" onClick={()=>{setShowForm(!showForm);setForm(EMPTY);setErrors({});}}>
          {showForm?"Cancelar":"+ Nuevo prestamo"}
        </Btn>
      </PageHeader>

      <div className="page-container">
        {/* KPIs */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Deuda total acumulada" value={`S/. ${fmt(totalDeuda)}`}   valueColor="var(--red)"    bg="var(--red-bg)"    border="var(--red-border)" delay={0}/>
          <KPICard label="Cuota total del mes"   value={`S/. ${fmt(cuotaMes)}`}     valueColor="var(--yellow)" bg="var(--yellow-bg)" border="var(--yellow-border)" delay={0.06}/>
          <KPICard label="Prestamos activos"     value={`${deudasActivas.length}`}  valueColor="var(--text-primary)" delay={0.12}/>
          <KPICard label="Proximo vencimiento"   value={proxVence?`${proxVence.dias} dias`:"—"} valueColor={proxVence?.dias<=7?"var(--red)":"var(--green)"} sub={proxVence?.descripcion} delay={0.18}/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:18 }}>
          {/* Lista deudas + form */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Form */}
            {showForm && (
              <Card className="fade-up" style={{ borderColor:"var(--red-border)" }}>
                <SectionTitle color="var(--red)">Nuevo prestamo</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {/* Tipo */}
                  <Field label="Tipo de prestamo">
                    <div style={{ display:"flex", gap:8 }}>
                      {TIPOS.map(t=>(
                        <button key={t.id} onClick={()=>sf("tipo",t.id)} style={{
                          flex:1, padding:"9px", borderRadius:"var(--radius-sm)",
                          background:form.tipo===t.id?t.color+"22":"var(--bg-input)",
                          border:`1px solid ${form.tipo===t.id?t.color+"66":"var(--border)"}`,
                          color:form.tipo===t.id?t.color:"var(--text-muted)",
                          fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, cursor:"pointer",
                        }}>{t.label}</button>
                      ))}
                    </div>
                  </Field>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <Field label="Descripcion" error={errors.descripcion}>
                      <input placeholder="Ej: Prestamo vehicular..." value={form.descripcion} onChange={e=>sf("descripcion",e.target.value)}/>
                    </Field>
                    <Field label="Acreedor / entidad">
                      <input placeholder="Ej: BCP, Crediscotia..." value={form.acreedor} onChange={e=>sf("acreedor",e.target.value)}/>
                    </Field>
                    <Field label="Monto original">
                      <input type="number" placeholder="0.00" value={form.montoOriginal} onChange={e=>sf("montoOriginal",e.target.value)}/>
                    </Field>
                    <Field label="Cuota mensual" error={errors.cuotaMensual}>
                      <input type="number" placeholder="0.00" value={form.cuotaMensual} onChange={e=>sf("cuotaMensual",e.target.value)}/>
                    </Field>
                    <Field label="Meses pactados" error={errors.mesesPactados}>
                      <input type="number" placeholder="24" value={form.mesesPactados} onChange={e=>sf("mesesPactados",e.target.value)}/>
                    </Field>
                    <Field label="Pagos ya realizados">
                      <input type="number" min="0" placeholder="0" value={form.pagosRealizados} onChange={e=>sf("pagosRealizados",e.target.value)}/>
                    </Field>
                    <Field label="Dia de vencimiento">
                      <input type="number" min="1" max="31" placeholder="15" value={form.diaVencimiento} onChange={e=>sf("diaVencimiento",e.target.value)}/>
                    </Field>
                    <Field label="Mes inicio">
                      <input type="month" value={form.fechaInicio} onChange={e=>sf("fechaInicio",e.target.value)}/>
                    </Field>
                  </div>
                  <Field label="Notas">
                    <textarea rows={2} placeholder="Tasa, condiciones..." value={form.notas} onChange={e=>sf("notas",e.target.value)}/>
                  </Field>
                  <Btn variant="danger" size="full" onClick={submit}>Registrar prestamo</Btn>
                </div>
              </Card>
            )}

            {/* Lista */}
            {deudas.length === 0 ? (
              <EmptyState title="Sin prestamos registrados" subtitle={"Las tarjetas y cuotas están en el módulo Tarjetas\nAgrega solo prestamos personales o bancarios aquí"}/>
            ) : (
              deudas.map((d,i) => {
                const tipo      = getTipo(d.tipo);
                const restantes = (d.mesesPactados||0) - (d.pagosRealizados||0);
                const pct       = d.mesesPactados>0 ? (d.pagosRealizados/d.mesesPactados)*100 : 0;
                const liquidada = restantes <= 0;
                const deudaRest = restantes * d.cuotaMensual;
                const dias      = d.diaVencimiento ? diasPara(d.diaVencimiento) : null;
                const urgente   = dias !== null && dias <= 7;
                return (
                  <Card key={d.id||i} className="fade-up" style={{ animationDelay:`${i*.05}s`, borderColor:urgente?"var(--red-border)":liquidada?"var(--green-border)":"var(--border)" }}>
                    {urgente && (
                      <div style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:"var(--radius-sm)", padding:"6px 12px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:"var(--red)", fontFamily:"var(--font-sans)", fontWeight:700 }}>⚠ Vence en {dias} dia{dias!==1?"s":""}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--red)" }}>Dia {d.diaVencimiento}</span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                          <Badge color={tipo.color}>{tipo.label}</Badge>
                          {liquidada && <Badge color="var(--green)">LIQUIDADO</Badge>}
                        </div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{d.descripcion}</div>
                        {d.acreedor && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:2 }}>{d.acreedor}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:16, color:liquidada?"var(--green)":"var(--red)" }}>S/. {fmt(d.cuotaMensual)}/mes</div>
                        <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:2 }}>Deuda restante: S/. {fmt(deudaRest)}</div>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={liquidada?"var(--green)":"var(--red)"} height={6} style={{marginBottom:8}}/>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-ghost)", marginBottom:12 }}>
                      <span>{d.pagosRealizados||0}/{d.mesesPactados} pagos ({pct.toFixed(0)}%)</span>
                      {d.montoOriginal>0 && <span>Original: S/. {fmt(d.montoOriginal)}</span>}
                    </div>
                    {!liquidada && d.diaVencimiento && (
                      <div style={{ fontSize:9, color:urgente?"var(--red)":"var(--text-ghost)", marginBottom:8 }}>
                        Vence dia {d.diaVencimiento} — {dias} dias restantes
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8 }}>
                      {!liquidada && (
                        <Btn variant="outline" size="sm" onClick={()=>registrarPago(d.id)}>+ Registrar pago</Btn>
                      )}
                      <Btn variant="ghost" size="sm" style={{color:"var(--text-ghost)",marginLeft:"auto"}} onClick={()=>delDeuda(d.id)}>Eliminar</Btn>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Panel derecho */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Ref tarjetas */}
            <Card style={{ borderColor:"var(--border-light)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <SectionTitle style={{marginBottom:0}}>Tarjetas de credito</SectionTitle>
                <Badge color="var(--blue)">Modulo Tarjetas</Badge>
              </div>
              {[
                { t:TARJETAS.BCP,  cuotas:bcpCuotas,  cuotaTotal:cuotaBCP  },
                { t:TARJETAS.AMEX, cuotas:amexCuotas, cuotaTotal:cuotaAMEX },
              ].map(({t,cuotas,cuotaTotal},i)=>(
                <div key={i} style={{ background:"var(--bg-input)", borderRadius:"var(--radius-md)", padding:"11px 13px", marginBottom:i===0?10:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:t.color }}>{t.nombre}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:t.color }}>S/. {fmt(cuotaTotal)}/mes</span>
                  </div>
                  <div style={{ fontSize:9, color:"var(--text-ghost)" }}>
                    {cuotas.length} cuota{cuotas.length!==1?"s":""} activa{cuotas.length!==1?"s":""} — Pago dia {t.pagoDia} ({diasPara(t.pagoDia)} dias)
                  </div>
                  {cuotas.length>0 && (
                    <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
                      {cuotas.map((c,j)=>(
                        <div key={j} style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-muted)" }}>
                          <span>{c.desc}</span>
                          <span style={{ fontFamily:"var(--font-mono)", color:t.color }}>S/. {fmt(c.cuota)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>

            {/* Resumen compromisos */}
            <Card>
              <SectionTitle>Compromisos mensuales</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  {l:"Cuotas prestamos", v:`S/. ${fmt(cuotaMes)}`,           c:"var(--red)"},
                  {l:"Cuotas BCP Visa",  v:`S/. ${fmt(cuotaBCP)}`,           c:TARJETAS.BCP.color},
                  {l:"Cuotas AMEX",      v:`S/. ${fmt(cuotaAMEX)}`,          c:TARJETAS.AMEX.color},
                  {l:"Total tarjetas",   v:`S/. ${fmt(cuotaBCP+cuotaAMEX)}`, c:"var(--text-secondary)"},
                  {l:"TOTAL GENERAL",    v:`S/. ${fmt(cuotaMes+cuotaBCP+cuotaAMEX)}`, c:"var(--yellow)", bold:true},
                ].map((r,i,arr)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", borderTop:i===arr.length-1?"1px solid var(--border)":"none" }}>
                    <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)", fontWeight:r.bold?700:400 }}>{r.l}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:r.bold?14:12, color:r.c }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
