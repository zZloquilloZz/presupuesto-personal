// Gestion de tarjetas — BCP Visa e Interbank AMEX.
// Permite registrar cuotas activas y marcar pagos.
// Las cuotas se reflejan en el panel de Deudas.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TARJETAS } from "../constants";
import { fmt, diasPara } from "../utils";
import { Card, SectionTitle, KPICard, PageHeader, Badge, ProgressBar, Btn, Field } from "../components/UI";

const CRONOGRAMA_BCP = [
  { mes:"Enero",     desde:"10 Dic", hasta:"09 Ene", pago:"Jue 05 Feb" },
  { mes:"Febrero",   desde:"10 Ene", hasta:"09 Feb", pago:"Jue 05 Mar" },
  { mes:"Marzo",     desde:"10 Feb", hasta:"09 Mar", pago:"Jue 02 Abr" },
  { mes:"Abril",     desde:"10 Mar", hasta:"09 Abr", pago:"Lun 04 May" },
  { mes:"Mayo",      desde:"10 Abr", hasta:"09 May", pago:"Jue 05 Jun" },
  { mes:"Junio",     desde:"10 May", hasta:"09 Jun", pago:"Vie 03 Jul" },
  { mes:"Julio",     desde:"10 Jun", hasta:"09 Jul", pago:"Jue 07 Ago" },
  { mes:"Agosto",    desde:"10 Jul", hasta:"09 Ago", pago:"Jue 04 Sep" },
  { mes:"Septiembre",desde:"10 Ago", hasta:"09 Sep", pago:"Sab 04 Oct" },
  { mes:"Octubre",   desde:"10 Sep", hasta:"09 Oct", pago:"Mie 05 Nov" },
  { mes:"Noviembre", desde:"10 Oct", hasta:"09 Nov", pago:"Jue 04 Dic" },
  { mes:"Diciembre", desde:"10 Nov", hasta:"09 Dic", pago:"Jue 08 Ene" },
];
const MES_ACTUAL = new Date().getMonth();

const EMPTY_CUOTA = { desc:"", montoTotal:"", cuota:"", totalCuotas:"", pagadas:"0" };

export default function GestionTarjetas() {
  const { state, dispatch } = useApp();
  const [tab, setTab]             = useState("bcp");
  const [showAddCuota, setShowAddCuota] = useState(false);
  const [cuotaForm, setCuotaForm] = useState(EMPTY_CUOTA);
  const [errors, setErrors]       = useState({});

  const tarjetaData = state.tarjetas?.[tab] || { cuotasActivas:[] };
  const cuotas      = tarjetaData.cuotasActivas || [];
  const tarjeta     = tab === "bcp" ? TARJETAS.BCP : TARJETAS.AMEX;

  const totalCuotasMes = cuotas.reduce((s,c) => s + (parseFloat(c.cuota)||0), 0);
  const totalDeuda     = cuotas.reduce((s,c) => {
    const restantes = (parseInt(c.totalCuotas)||0) - (parseInt(c.pagadas)||0);
    return s + restantes * (parseFloat(c.cuota)||0);
  }, 0);

  const scf = (k,v) => { setCuotaForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:null})); };

  const addCuota = () => {
    const e = {};
    if (!cuotaForm.desc.trim())    e.desc = "Requerido";
    if (!cuotaForm.cuota)          e.cuota = "Requerido";
    if (!cuotaForm.totalCuotas)    e.totalCuotas = "Requerido";
    if (Object.keys(e).length) { setErrors(e); return; }
    const nueva = { id: Date.now().toString(36), ...cuotaForm, montoTotal:parseFloat(cuotaForm.montoTotal)||0, cuota:parseFloat(cuotaForm.cuota), totalCuotas:parseInt(cuotaForm.totalCuotas), pagadas:parseInt(cuotaForm.pagadas)||0 };
    const nuevasCuotas = [...cuotas, nueva];
    dispatch({ type:"UPDATE_TARJETA", tarjeta:tab, payload:{ cuotasActivas: nuevasCuotas } });
    setCuotaForm(EMPTY_CUOTA);
    setShowAddCuota(false);
  };

  const pagarCuota = (id) => {
    const nuevasCuotas = cuotas.map(c => c.id===id ? {...c, pagadas:(c.pagadas||0)+1} : c);
    dispatch({ type:"UPDATE_TARJETA", tarjeta:tab, payload:{ cuotasActivas: nuevasCuotas } });
  };

  const deleteCuota = (id) => {
    dispatch({ type:"UPDATE_TARJETA", tarjeta:tab, payload:{ cuotasActivas: cuotas.filter(c=>c.id!==id) } });
  };

  const diasPago   = diasPara(tarjeta.pagoDia);
  const diasCierre = diasPara(tarjeta.cierre);

  return (
    <div>
      <PageHeader title="Gestion de Tarjetas" accentColor={tarjeta.color}>
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3 }}>
          {[{k:"bcp",t:"BCP Visa",c:TARJETAS.BCP.color},{k:"amex",t:"AMEX Interbank",c:TARJETAS.AMEX.color}].map(t=>(
            <button key={t.k} onClick={()=>{setTab(t.k);setShowAddCuota(false);}} style={{
              background:tab===t.k?"var(--bg-hover)":"transparent",
              border:tab===t.k?`1px solid ${t.c}44`:"1px solid transparent",
              borderRadius:"var(--radius-sm)", color:tab===t.k?t.c:"var(--text-muted)",
              fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700,
              padding:"6px 14px", cursor:"pointer", transition:"all .15s",
            }}>{t.t}</button>
          ))}
        </div>
      </PageHeader>

      <div className="page-container">
        {/* KPIs */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Cuota total mes"   value={`S/. ${fmt(totalCuotasMes)}`}  valueColor={tarjeta.color} delay={0}/>
          <KPICard label="Deuda total"       value={`S/. ${fmt(totalDeuda)}`}       valueColor="var(--red)"   bg="var(--red-bg)" border="var(--red-border)" delay={0.06}/>
          <KPICard label="Proximo pago"      value={`${diasPago} dias`}             valueColor={diasPago<=5?"var(--red)":diasPago<=10?"var(--yellow)":"var(--green)"} sub={`Dia ${tarjeta.pagoDia} de cada mes`} delay={0.12}/>
          <KPICard label="Cuotas activas"    value={`${cuotas.length}`}             valueColor={tarjeta.color} sub={`${cuotas.reduce((s,c)=>(parseInt(c.totalCuotas)||0)-(parseInt(c.pagadas)||0)+s,0)} pagos pendientes`} delay={0.18}/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:18 }}>
          {/* Cuotas */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700, color:tarjeta.color }}>{tarjeta.nombre} — Cuotas activas</div>
              <Btn variant="outline" size="sm" onClick={()=>setShowAddCuota(!showAddCuota)}>
                {showAddCuota?"Cancelar":"+ Agregar cuota"}
              </Btn>
            </div>

            {/* Form nueva cuota */}
            {showAddCuota && (
              <Card className="fade-up" style={{ borderColor: tarjeta.color+"44" }}>
                <SectionTitle color={tarjeta.color}>Nueva cuota en {tarjeta.nombre}</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <Field label="Descripcion" error={errors.desc}>
                    <input placeholder="Ej: Samsung Galaxy S25..." value={cuotaForm.desc} onChange={e=>scf("desc",e.target.value)}/>
                  </Field>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                    <Field label="Monto total">
                      <input type="number" placeholder="0.00" value={cuotaForm.montoTotal} onChange={e=>scf("montoTotal",e.target.value)}/>
                    </Field>
                    <Field label="Cuota mensual" error={errors.cuota}>
                      <input type="number" placeholder="0.00" value={cuotaForm.cuota} onChange={e=>scf("cuota",e.target.value)}/>
                    </Field>
                    <Field label="Total cuotas" error={errors.totalCuotas}>
                      <input type="number" placeholder="12" value={cuotaForm.totalCuotas} onChange={e=>scf("totalCuotas",e.target.value)}/>
                    </Field>
                    <Field label="Ya pagadas">
                      <input type="number" min="0" placeholder="0" value={cuotaForm.pagadas} onChange={e=>scf("pagadas",e.target.value)}/>
                    </Field>
                  </div>
                  <Btn variant="primary" size="full" onClick={addCuota}>Agregar cuota</Btn>
                </div>
              </Card>
            )}

            {/* Lista cuotas */}
            {cuotas.length === 0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center", background:"var(--bg-card)", border:"1px dashed var(--border)", borderRadius:"var(--radius-lg)", color:"var(--text-ghost)" }}>
                <div style={{ fontSize:22, marginBottom:8, opacity:.3 }}>[ ]</div>
                <div style={{ fontFamily:"var(--font-sans)", fontSize:12 }}>Sin cuotas activas en {tarjeta.nombre}</div>
              </div>
            ) : (
              cuotas.map((c,i)=>{
                const restantes = (parseInt(c.totalCuotas)||0) - (parseInt(c.pagadas)||0);
                const pct       = parseInt(c.totalCuotas)>0 ? (parseInt(c.pagadas)/parseInt(c.totalCuotas))*100 : 0;
                const deudaRest = restantes * parseFloat(c.cuota||0);
                const liquidada = restantes <= 0;
                return (
                  <Card key={c.id||i} className="fade-up" style={{ animationDelay:`${i*.06}s`, borderColor: liquidada?"var(--green-border)":tarjeta.color+"33", opacity:liquidada?.7:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{c.desc}</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <Badge color={tarjeta.color}>{tarjeta.nombre}</Badge>
                          {liquidada ? <Badge color="var(--green)">LIQUIDADA</Badge> : <Badge color="var(--text-muted)">{restantes} pagos restantes</Badge>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:16, color:liquidada?"var(--green)":tarjeta.color }}>S/. {fmt(c.cuota)}/mes</div>
                        <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:2 }}>Deuda: S/. {fmt(deudaRest)}</div>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={liquidada?"var(--green)":tarjeta.color} height={6} style={{marginBottom:8}}/>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-ghost)", marginBottom:12 }}>
                      <span>{parseInt(c.pagadas)||0}/{c.totalCuotas} pagadas ({pct.toFixed(0)}%)</span>
                      {c.montoTotal>0 && <span>Total compra: S/. {fmt(c.montoTotal)}</span>}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {!liquidada && (
                        <Btn variant="outline" size="sm" onClick={()=>pagarCuota(c.id)}>+ Registrar pago</Btn>
                      )}
                      <Btn variant="ghost" size="sm" style={{color:"var(--text-ghost)",marginLeft:"auto"}} onClick={()=>deleteCuota(c.id)}>Eliminar</Btn>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Panel derecho */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Info tarjeta */}
            <Card style={{ borderColor:tarjeta.color+"33" }}>
              <SectionTitle color={tarjeta.color}>Datos de la tarjeta</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  {l:"Linea de credito", v:`S/. ${fmt(tarjeta.lineaCredito)}`, c:tarjeta.color},
                  {l:"TEA",              v:`${tarjeta.tea}%`,                   c:"var(--text-secondary)"},
                  {l:"TCEA",             v:`${tarjeta.tcea}%`,                  c:"var(--red)"},
                  {l:"Cierre ciclo",     v:`Dia ${tarjeta.cierre}`,             c:"var(--text-secondary)"},
                  {l:"Limite pago",      v:`Dia ${tarjeta.pagoDia}`,            c:tarjeta.color},
                  {l:"Dias para pago",   v:`${diasPago} dias`,                  c:diasPago<=5?"var(--red)":diasPago<=10?"var(--yellow)":"var(--green)"},
                ].map((r,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)" }}>
                    <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>{r.l}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:r.c }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cronograma BCP */}
            {tab === "bcp" && (
              <Card>
                <SectionTitle>Cronograma BCP 2026</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:260, overflowY:"auto" }}>
                  {CRONOGRAMA_BCP.map((c,i)=>(
                    <div key={i} style={{ display:"flex", flexDirection:"column", padding:"7px 10px", background:i===MES_ACTUAL?"var(--blue-bg)":"var(--bg-input)", border:`1px solid ${i===MES_ACTUAL?"var(--blue)":"var(--border)"}`, borderRadius:"var(--radius-sm)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                        <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color:i===MES_ACTUAL?"var(--blue)":"var(--text-secondary)" }}>{c.mes}</span>
                        {i===MES_ACTUAL && <Badge color="var(--blue)">ACTUAL</Badge>}
                      </div>
                      <div style={{ fontSize:9, color:"var(--text-ghost)" }}>
                        Ciclo: {c.desde} → {c.hasta} — Pago: <span style={{color:i===MES_ACTUAL?"var(--blue)":"var(--text-dim)"}}>{c.pago}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
