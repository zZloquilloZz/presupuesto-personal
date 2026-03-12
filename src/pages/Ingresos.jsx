// Ingresos mensuales — registro de boleta AFP Integra.
// Calcula neto automaticamente segun haber basico, HE y extras.
// El neto registrado alimenta los KPIs del Dashboard.

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { useApp, useIngresoMes } from "../context/AppContext";
import { SUELDO, MESES } from "../constants";
import { fmt, calcNeto, diasPara } from "../utils";
import { Card, SectionTitle, KPICard, PageHeader, ChartTooltip, NumberStepper, Field, Btn } from "../components/UI";

const HOY        = new Date();
const MES_HOY    = HOY.getMonth();
const ANIO_HOY   = HOY.getFullYear();

const EMPTY = {
  haberBasico: SUELDO.HABER_BASICO,
  he25: 0, he100: 0,
  gratificacion: 0, cts: 0, bono: 0, otroExtra: 0, otroLabel: "",
};

export default function Ingresos() {
  const { state, dispatch } = useApp();
  const [mesIdx, setMesIdx]  = useState(MES_HOY);
  const [anio,   setAnio]    = useState(ANIO_HOY);
  const [form,   setForm]    = useState(EMPTY);
  const [saved,  setSaved]   = useState(false);
  const [diaDeposito, setDiaDeposito] = useState(state.config?.diaDeposito || 28);

  const sf = (k,v) => setForm(f => ({...f,[k]:v}));

  const afpTasa      = state.afps?.find(a => a.id === state.config?.afpId)?.tasa ?? 0;
  const afpLabel     = state.afps?.find(a => a.id === state.config?.afpId)?.label ?? null;
  const mesActual    = useIngresoMes();
  const mesExiste    = state.historialIngresos.some(h => h.mesIdx===mesIdx && h.anio===anio);
  const historial    = state.historialIngresos;

  // Cargar un mes registrado al editor
  const cargarMes = (mi, ai) => {
    setMesIdx(mi); setAnio(ai);
    const ex = state.historialIngresos.find(h => h.mesIdx===mi && h.anio===ai);
    setForm(ex ? { haberBasico:ex.haberBasico, he25:ex.he25, he100:ex.he100, gratificacion:ex.gratificacion||0, cts:ex.cts||0, bono:ex.bono||0, otroExtra:ex.otroExtra||0, otroLabel:ex.otroLabel||"" } : EMPTY);
  };

  const guardar = () => {
    const extras = (parseFloat(form.gratificacion)||0)+(parseFloat(form.cts)||0)+(parseFloat(form.bono)||0)+(parseFloat(form.otroExtra)||0);
    const { bruto, afp, neto } = calcNeto(parseFloat(form.haberBasico)||SUELDO.HABER_BASICO, parseFloat(form.he25)||0, parseFloat(form.he100)||0, extras, afpTasa);
    dispatch({ type:"SAVE_INGRESO", payload: { ...form, mesIdx, anio, bruto, afp, neto, haberBasico:parseFloat(form.haberBasico)||SUELDO.HABER_BASICO, he25:parseFloat(form.he25)||0, he100:parseFloat(form.he100)||0, gratificacion:parseFloat(form.gratificacion)||0, cts:parseFloat(form.cts)||0, bono:parseFloat(form.bono)||0, otroExtra:parseFloat(form.otroExtra)||0 } });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const extras   = (parseFloat(form.gratificacion)||0)+(parseFloat(form.cts)||0)+(parseFloat(form.bono)||0)+(parseFloat(form.otroExtra)||0);
  const preview  = calcNeto(parseFloat(form.haberBasico)||SUELDO.HABER_BASICO, parseFloat(form.he25)||0, parseFloat(form.he100)||0, extras, afpTasa);
  const baseEdit = (parseFloat(form.haberBasico)||SUELDO.HABER_BASICO) + SUELDO.ASIG_FAMILIAR;
  const diasDep  = diasPara(diaDeposito);
  const promedioNeto = historial.length ? historial.reduce((s,h)=>s+h.neto,0)/historial.length : 0;
  const mejorMes     = historial.length ? [...historial].sort((a,b)=>b.neto-a.neto)[0] : null;
  const totalAnio    = historial.filter(h=>h.anio===ANIO_HOY).reduce((s,h)=>s+h.neto,0);

  // Datos para el grafico: bruto, AFP y neto — para comparativa
  const chartData = historial.slice(-12).map(h => ({
    mes:    MESES[h.mesIdx],
    bruto:  h.bruto,
    afp:    parseFloat((h.afp || 0).toFixed(2)),
    neto:   h.neto,
    activo: h.mesIdx === MES_HOY && h.anio === ANIO_HOY,
  }));

  const [chartMode, setChartMode]   = useState("comparar"); // "comparar" | "neto"
  const [editAfp,   setEditAfp]     = useState(false);
  const [afpSel,    setAfpSel]      = useState(state.config?.afpId || "");

  return (
    <div>
      <PageHeader title="Ingresos" accentColor="var(--lime)">
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"6px 12px" }}>
          <span style={{ fontSize:9, color:"var(--text-ghost)", fontFamily:"var(--font-sans)" }}>Dia deposito</span>
          <input type="number" min="1" max="31" value={diaDeposito} onChange={e=>setDiaDeposito(e.target.value)}
            style={{ background:"transparent", border:"none", color:"var(--blue)", fontFamily:"var(--font-mono)", fontSize:13, width:28, outline:"none", textAlign:"center", padding:0 }}/>
        </div>
      </PageHeader>

      <div className="page-container">
        {/* KPIs */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Neto mes actual"   value={mesActual?`S/. ${fmt(mesActual.neto)}`:"Sin registrar"} valueColor={mesActual?"var(--green)":"var(--text-dim)"} bg={mesActual?"var(--green-bg)":"var(--bg-input)"} border={mesActual?"var(--green-border)":"var(--border)"} sub={mesActual?`Bruto S/. ${fmt(mesActual.bruto)}`:"Registra este mes"} delay={0}/>
          <KPICard label="Sueldo base neto"  value={`S/. ${fmt(baseEdit*(1-(afpTasa||0)/100))}`} sub={afpLabel ? afpLabel : "Sin AFP configurada"} delay={0.06}/>
          <KPICard label="Promedio neto"     value={historial.length?`S/. ${fmt(promedioNeto)}`:"—"} valueColor="var(--blue)" bg="var(--blue-bg)" border="var(--blue-border)" sub={`${historial.length} meses`} delay={0.12}/>
          <KPICard label="Proximo deposito"  value={diasDep!==null?`${diasDep} dias`:"—"} valueColor={diasDep<=3?"var(--red)":diasDep<=7?"var(--yellow)":"var(--green)"} sub={`Dia ${diaDeposito} de cada mes`} delay={0.18}/>
        </div>

        {/* AFP configurada */}
        <div style={{ background: afpLabel ? "var(--bg-input)" : "var(--red-bg)", border: `1px solid ${afpLabel ? "var(--border)" : "var(--red-border)"}`, borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {!editAfp ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🏦</span>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                    {afpLabel || "AFP no configurada"}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-ghost)", marginTop: 2 }}>
                    {afpTasa > 0 ? `Descuento: ${afpTasa}% del bruto` : afpLabel ? "Sin descuento AFP" : "Configura tu AFP para calcular el neto correctamente"}
                  </div>
                </div>
              </div>
              <button onClick={() => { setEditAfp(true); setAfpSel(state.config?.afpId || ""); }}
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, padding: "6px 12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                ✏ Cambiar AFP
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 9, color: "var(--text-ghost)", fontFamily: "var(--font-sans)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>AFP</span>
                <select value={afpSel} onChange={e => setAfpSel(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: 11 }}>
                  <option value="">Selecciona...</option>
                  {(state.afps || []).map(a => (
                    <option key={a.id} value={a.id}>{a.label}{a.tasa > 0 ? ` (${a.tasa}%)` : ""}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => { dispatch({ type: "SET_CONFIG", payload: { ...state.config, afpId: afpSel || null } }); setEditAfp(false); }}
                  disabled={!afpSel}
                  style={{ background: "var(--green)", border: "none", borderRadius: "var(--radius-sm)", color: "#0A0C10", fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 800, padding: "6px 14px", cursor: afpSel ? "pointer" : "not-allowed", opacity: afpSel ? 1 : 0.4, textTransform: "uppercase" }}>
                  Guardar
                </button>
                <button onClick={() => setEditAfp(false)}
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-ghost)", fontFamily: "var(--font-sans)", fontSize: 9, padding: "6px 10px", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:18 }}>
          {/* Editor */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Selector meses */}
            <Card>
              <SectionTitle>Selecciona el mes a registrar</SectionTitle>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
                {MESES.map((m,i) => {
                  const tieneReg = historial.some(h=>h.mesIdx===i&&h.anio===anio);
                  const esActual = i===MES_HOY && anio===ANIO_HOY;
                  const selec    = i===mesIdx;
                  return (
                    <button key={i} onClick={()=>cargarMes(i,anio)} style={{
                      background: selec?"var(--bg-hover)":tieneReg?"var(--green-bg)":"var(--bg-input)",
                      border:`1.5px solid ${selec?"var(--blue)":tieneReg?"var(--green)":esActual?"var(--border-light)":"var(--border)"}`,
                      borderRadius:"var(--radius-sm)", color:selec?"var(--blue)":tieneReg?"var(--green)":esActual?"var(--text-secondary)":"var(--text-dim)",
                      fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700,
                      padding:"8px 4px", cursor:"pointer", transition:"all .15s", textAlign:"center", position:"relative",
                    }}>
                      {m}
                      {tieneReg && <div style={{ position:"absolute", top:3, right:4, width:4, height:4, borderRadius:"50%", background:"var(--green)" }}/>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
                <span style={{ fontSize:9, color:"var(--text-ghost)", fontFamily:"var(--font-sans)" }}>Año:</span>
                <input type="number" value={anio} onChange={e=>setAnio(parseInt(e.target.value)||ANIO_HOY)}
                  style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-secondary)", fontFamily:"var(--font-mono)", fontSize:12, padding:"5px 10px", width:80, outline:"none" }}/>
              </div>
            </Card>

            {/* Form boleta */}
            <Card style={{ borderColor: mesIdx===MES_HOY&&anio===ANIO_HOY?"var(--blue-border)":"var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)" }}>
                  {MESES[mesIdx]} {anio}
                  {mesIdx===MES_HOY&&anio===ANIO_HOY && <span style={{ fontSize:9, color:"var(--blue)", marginLeft:8, background:"var(--blue-bg)", padding:"2px 8px", borderRadius:4 }}>MES ACTUAL</span>}
                </div>
                {mesExiste && <span style={{ fontSize:9, color:"var(--green)", background:"var(--green-bg)", padding:"2px 8px", borderRadius:4, border:"1px solid var(--green-border)", fontFamily:"var(--font-sans)", fontWeight:600 }}>Ya registrado</span>}
              </div>

              {/* Sueldo base */}
              <div style={{ background:"var(--bg-input)", borderRadius:"var(--radius-md)", padding:"11px 14px", marginBottom:14 }}>
                <SectionTitle color="var(--orange)" style={{marginBottom:10}}>Sueldo base</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <Field label={<span>Haber basico <span style={{color:"var(--text-ghost)",textTransform:"none",letterSpacing:0}}>(editable)</span></span>} labelColor="var(--orange)">
                    <input type="number" min="0" step="10" value={form.haberBasico} onChange={e=>sf("haberBasico",parseFloat(e.target.value)||0)}
                      style={{ borderColor:"var(--orange)44", color:"var(--orange)", fontSize:15, fontWeight:500 }}/>
                    <div style={{ fontSize:8, color:"var(--text-ghost)", marginTop:3, fontFamily:"var(--font-sans)" }}>Actualiza si hay aumento</div>
                  </Field>
                  <Field label={<span>Asig. familiar <span style={{color:"var(--text-ghost)",textTransform:"none",letterSpacing:0}}>(fija por ley)</span></span>}>
                    <div style={{ background:"var(--bg-base)", color:"var(--text-dim)", border:"1px solid var(--bg-base)", borderRadius:"var(--radius-md)", padding:"10px 13px", fontSize:13 }}>S/. {fmt(SUELDO.ASIG_FAMILIAR)}</div>
                  </Field>
                  <Field label="Total base">
                    <div style={{ background:"var(--bg-base)", color:"var(--text-secondary)", border:"1px solid var(--bg-base)", borderRadius:"var(--radius-md)", padding:"10px 13px", fontSize:13 }}>S/. {fmt(baseEdit)}</div>
                  </Field>
                </div>
              </div>

              {/* HE */}
              <div style={{ marginBottom:14 }}>
                <SectionTitle style={{marginBottom:10}}>Horas extras — variables cada mes</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    {l:"HE 25%", k:"he25", v:SUELDO.VALOR_HE25,  c:"var(--blue)",   h:"S/. 8.10/hora"},
                    {l:"HE 100%",k:"he100",v:SUELDO.VALOR_HE100, c:"var(--yellow)", h:"S/. 12.97/hora"},
                  ].map(he=>(
                    <div key={he.k} style={{ background:"var(--bg-input)", borderRadius:"var(--radius-md)", padding:"12px 14px" }}>
                      <SectionTitle color={he.c} style={{marginBottom:8}}>{he.l} <span style={{color:"var(--text-ghost)",textTransform:"none"}}>{he.h}</span></SectionTitle>
                      <NumberStepper value={form[he.k]} onChange={v=>sf(he.k,v)} min={0} step={1} color={he.c}/>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                        <span style={{ fontSize:9, color:"var(--text-ghost)" }}>Subtotal</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:he.c }}>S/. {fmt((parseFloat(form[he.k])||0)*he.v)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div style={{ marginBottom:16 }}>
                <SectionTitle style={{marginBottom:10}}>Ingresos adicionales (si aplica)</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    {l:"Gratificacion",k:"gratificacion",c:"var(--green)",  h:"Jul y Dic"},
                    {l:"CTS",          k:"cts",          c:"var(--purple)", h:"May y Nov"},
                    {l:"Bono",         k:"bono",         c:"var(--orange)", h:"Variable"},
                  ].map(ex=>(
                    <Field key={ex.k} label={<span style={{color:ex.c}}>{ex.l} <span style={{color:"var(--text-ghost)",textTransform:"none"}}>{ex.h}</span></span>}>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={form[ex.k]||""} onChange={e=>sf(ex.k,e.target.value)}
                        style={{ borderColor:parseFloat(form[ex.k])>0?ex.c+"44":"var(--border)", color:parseFloat(form[ex.k])>0?ex.c:"var(--text-muted)" }}/>
                    </Field>
                  ))}
                  <div>
                    <Field label="Otro ingreso">
                      <input placeholder="Descripcion..." value={form.otroLabel||""} onChange={e=>sf("otroLabel",e.target.value)} style={{ marginBottom:6, fontSize:11 }}/>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={form.otroExtra||""} onChange={e=>sf("otroExtra",e.target.value)}/>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div style={{ background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:"var(--radius-md)", padding:"13px 16px", marginBottom:14 }}>
                <SectionTitle color="var(--text-dim)" style={{marginBottom:10}}>Preview boleta</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>Total bruto</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>S/. {fmt(preview.bruto)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>{afpLabel || "AFP"}{afpTasa > 0 ? ` (${afpTasa}%)` : ""}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--red)" }}>- S/. {fmt(preview.afp)}</span>
                  </div>
                  {extras > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>Ingresos adicionales</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--green)" }}>S/. {fmt(extras)}</span>
                    </div>
                  )}
                  <div style={{ borderTop:"1px solid var(--blue-border)", paddingTop:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color:"var(--blue)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Neto a cobrar</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:20, color:"var(--green)", fontWeight:500 }}>S/. {fmt(preview.neto)}</span>
                  </div>
                </div>
              </div>

              <Btn variant="primary" size="full" onClick={guardar}>
                {mesExiste ? "Actualizar registro" : `Guardar ${MESES[mesIdx]} ${anio}`}
              </Btn>
            </Card>
          </div>

          {/* Columna derecha */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Grafico historial: neto simple vs comparativa bruto/AFP/neto */}
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <SectionTitle style={{ marginBottom:0 }}>
                  {chartMode === "comparar" ? "Bruto vs AFP vs Neto" : "Historial neto mensual"}
                </SectionTitle>
                <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:2, gap:2 }}>
                  {[{k:"comparar",l:"Comparar"},{k:"neto",l:"Solo neto"}].map(opt => (
                    <button key={opt.k} onClick={() => setChartMode(opt.k)} style={{
                      background: chartMode === opt.k ? "var(--bg-hover)" : "transparent",
                      border: chartMode === opt.k ? "1px solid var(--lime)" : "1px solid transparent",
                      borderRadius:"var(--radius-sm)", color: chartMode === opt.k ? "var(--lime)" : "var(--text-ghost)",
                      fontFamily:"var(--font-sans)", fontSize:8, fontWeight:700,
                      padding:"4px 8px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase",
                    }}>{opt.l}</button>
                  ))}
                </div>
              </div>

              {historial.length === 0 ? (
                <div style={{ padding:"30px 0", textAlign:"center", color:"var(--text-ghost)" }}>
                  <div style={{ fontSize:22, marginBottom:8, opacity:.3 }}>[ ]</div>
                  <div style={{ fontFamily:"var(--font-sans)", fontSize:11 }}>Registra tu primer mes</div>
                </div>
              ) : chartMode === "comparar" ? (
                <>
                  {/* Grafico comparativo: bruto (fondo) + AFP (rojo) + neto (verde) */}
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} barSize={16} barCategoryGap="35%">
                      <XAxis dataKey="mes" tick={{ fill:"var(--text-dim)", fontSize:9, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false}/>
                      <YAxis hide/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Bar dataKey="bruto" name="Bruto"  fill="#94A3B833" radius={[3,3,0,0]}/>
                      <Bar dataKey="afp"   name="AFP"    fill="var(--red)" radius={[3,3,0,0]} opacity={0.7}/>
                      <Bar dataKey="neto"  name="Neto"   radius={[3,3,0,0]}>
                        {chartData.map((d,i) => <Cell key={i} fill={d.activo ? "var(--green)" : "#4ADE8066"}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Leyenda */}
                  <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:8 }}>
                    {[{c:"#94A3B833",l:"Bruto"},{c:"var(--red)",l:"AFP"},{c:"var(--green)",l:"Neto"}].map((lg,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:lg.c }}/>
                        <span style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-sans)" }}>{lg.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Grafico neto simple */
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={22}>
                    <XAxis dataKey="mes" tick={{ fill:"var(--text-dim)", fontSize:9, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip content={<ChartTooltip/>}/>
                    {promedioNeto > 0 && <ReferenceLine y={promedioNeto} stroke="var(--border-light)" strokeDasharray="3 3"/>}
                    <Bar dataKey="neto" name="Neto" radius={[4,4,0,0]}>
                      {chartData.map((d,i) => <Cell key={i} fill={d.activo ? "var(--green)" : "var(--green-bg)"}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:12 }}>
                {[
                  { l:"Promedio neto",  v:`S/. ${fmt(promedioNeto)}`, c:"var(--text-muted)" },
                  { l:"Mejor mes",      v: mejorMes ? MESES[mejorMes.mesIdx] : "—", c:"var(--green)" },
                  { l:`Total ${ANIO_HOY}`, v:`S/. ${fmt(totalAnio)}`, c:"var(--blue)" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"var(--bg-input)", borderRadius:"var(--radius-sm)", padding:"9px 10px" }}>
                    <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{s.l}</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AFP info — dinámica según la AFP configurada */}
            <Card style={{ borderColor: afpLabel ? "var(--red-border)" : "var(--border)" }}>
              <SectionTitle color={afpLabel ? "var(--red)" : "var(--text-dim)"}>
                {afpLabel ? `${afpLabel} — Descuento en boleta` : "AFP — Sin configurar"}
              </SectionTitle>
              {afpLabel ? (
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:9, borderBottom:"1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>Tasa total de descuento</div>
                      <div style={{ fontSize:8, color:"var(--text-ghost)", marginTop:1 }}>Se descuenta del sueldo bruto cada mes</div>
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:"var(--red)", fontWeight:500 }}>{afpTasa}%</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)" }}>Descuento mensual estimado</div>
                      <div style={{ fontSize:8, color:"var(--text-ghost)", marginTop:1 }}>Sobre haber básico + asig. familiar</div>
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--red)" }}>S/. {fmt(preview.bruto * afpTasa / 100)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize:10, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", padding:"8px 0" }}>
                  Usa el botón "Cambiar AFP" de arriba para configurar tu sistema previsional.
                </div>
              )}
            </Card>

            {/* Lista registros */}
            {historial.length > 0 && (
              <Card>
                <SectionTitle>Meses registrados</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:220, overflowY:"auto" }}>
                  {[...historial].reverse().map((h,i)=>(
                    <div key={i} onClick={()=>cargarMes(h.mesIdx,h.anio)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:h.mesIdx===mesIdx&&h.anio===anio?"var(--bg-hover)":"var(--bg-input)", border:`1px solid ${h.mesIdx===mesIdx&&h.anio===anio?"var(--blue)":"var(--border)"}`, borderRadius:"var(--radius-sm)", cursor:"pointer", transition:"all .15s" }}>
                      <div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:600, color:"var(--text-primary)" }}>{MESES[h.mesIdx]} {h.anio}</div>
                        <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:1 }}>Bruto S/. {fmt(h.bruto)} — AFP S/. {fmt(h.afp)}</div>
                      </div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"var(--green)" }}>S/. {fmt(h.neto)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {saved && (
        <div style={{ position:"fixed", top:22, right:22, background:"var(--green-bg)", border:"1px solid var(--green)", borderRadius:"var(--radius-lg)", color:"var(--green)", fontFamily:"var(--font-sans)", fontSize:12, fontWeight:600, padding:"12px 18px", zIndex:999 }} className="slide-in">
          Mes guardado correctamente ✓
        </div>
      )}
    </div>
  );
}
