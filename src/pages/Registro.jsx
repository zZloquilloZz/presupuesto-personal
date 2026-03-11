// Registro de gastos — formulario adaptado al schema normalizado 3FN
// categoriaId/metodoId/tarjetaId en lugar de strings libres

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { CATEGORIAS_FALLBACK, METODOS_FALLBACK } from "../constants";
import { fmt, uid, fechaLegible } from "../utils";
import { Card, SectionTitle, KPICard, Btn, Field, EmptyState, Badge, PageHeader, ProgressBar } from "../components/UI";

const HOY = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  descripcion: "", categoriaId: "alimentacion", monto: "",
  metodoId: "debito", tarjetaId: null,
  fecha: HOY, notas: "", recurrente: false,
  esCuota: false, totalCuotas: "", conInteres: false, cuotaManual: "", pagadasYa: "1",
  fechaCompra: HOY,
};

// Calcula cuota con TEA
function calcCuota(monto, n, tea) {
  if (!monto || !n || n <= 0) return 0;
  const P   = parseFloat(monto);
  const tem = Math.pow(1 + tea / 100, 1 / 12) - 1;
  if (tem === 0) return parseFloat((P / n).toFixed(2));
  return parseFloat((P * (tem * Math.pow(1+tem,n)) / (Math.pow(1+tem,n)-1)).toFixed(2));
}

function getPrimerPago(fechaCompra, cierreDia) {
  const [anio, mes, dia] = fechaCompra.split("-").map(Number);
  let mesPago = dia < cierreDia ? mes + 1 : mes + 2;
  let anioPago = anio;
  if (mesPago > 12) { mesPago -= 12; anioPago += 1; }
  return { anio: anioPago, mes: mesPago };
}

const MESES_LABEL = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];

// ── Pagos Fijos Panel ──────────────────────────────────────────────────────────
function PagosFijosPanel({ state, dispatch }) {
  const categorias = state.categorias.length ? state.categorias : CATEGORIAS_FALLBACK;
  const metodos    = state.metodos.length    ? state.metodos    : METODOS_FALLBACK;

  const [form, setForm]   = useState({ descripcion:"", monto:"", dia:"", categoriaId:"otros", metodoId:"debito", tarjetaId:null });
  const [error, setError] = useState("");
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const getCat = id => categorias.find(c=>c.id===id) || categorias[categorias.length-1];
  const getMet = id => metodos.find(m=>m.id===id)    || metodos[0];

  const handleAdd = () => {
    if (!form.descripcion.trim()) return setError("Ingresa una descripción");
    if (!form.monto || parseFloat(form.monto) <= 0) return setError("Ingresa un monto válido");
    if (!form.dia || parseInt(form.dia)<1 || parseInt(form.dia)>31) return setError("Día debe ser entre 1 y 31");
    setError("");
    dispatch({ type:"ADD_GASTO_FIJO", payload:{
      id:          uid(),
      descripcion: form.descripcion.trim(),
      monto:       parseFloat(form.monto),
      dia:         parseInt(form.dia),
      categoriaId: form.categoriaId,
      metodoId:    form.metodoId,
      tarjetaId:   form.metodoId==="credito" ? form.tarjetaId : null,
    }});
    setForm({ descripcion:"", monto:"", dia:"", categoriaId:"otros", metodoId:"debito", tarjetaId:null });
  };

  return (
    <div>
      <div style={{ marginBottom:12, padding:"10px 14px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
        <div style={{ fontSize:10, color:"var(--text-primary)", fontFamily:"var(--font-sans)", fontWeight:600, marginBottom:3 }}>Pagos Fijos Mensuales</div>
        <div style={{ fontSize:9, color:"var(--text-dim)", lineHeight:1.6 }}>
          Pagos que se repiten todos los meses: alquiler, streaming, pensión, etc.
        </div>
      </div>

      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"14px 16px", marginBottom:12 }}>
        <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Nuevo pago fijo</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 60px", gap:8, marginBottom:8 }}>
          <div>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Descripción</div>
            <input placeholder="Ej: Netflix, Alquiler..." value={form.descripcion} onChange={e=>sf("descripcion",e.target.value)} style={{ width:"100%", padding:"8px 10px", fontSize:11, boxSizing:"border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Monto S/.</div>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.monto} onChange={e=>sf("monto",e.target.value)} style={{ width:"100%", padding:"8px 10px", fontSize:11, boxSizing:"border-box" }}/>
          </div>
          <div>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Día</div>
            <input type="number" min="1" max="31" placeholder="1" value={form.dia} onChange={e=>sf("dia",e.target.value)} style={{ width:"100%", padding:"8px 10px", fontSize:11, boxSizing:"border-box" }}/>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Categoría</div>
            <select value={form.categoriaId} onChange={e=>sf("categoriaId",e.target.value)} style={{ width:"100%", padding:"8px 10px", fontSize:11 }}>
              {categorias.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Método</div>
            <select value={form.metodoId} onChange={e=>{ sf("metodoId",e.target.value); if(e.target.value!=="credito") sf("tarjetaId",null); }} style={{ width:"100%", padding:"8px 10px", fontSize:11 }}>
              {metodos.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
        {form.metodoId==="credito" && state.tarjetasCredito.length>0 && (
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Tarjeta</div>
            <select value={form.tarjetaId||""} onChange={e=>sf("tarjetaId",e.target.value||null)} style={{ width:"100%", padding:"8px 10px", fontSize:11 }}>
              <option value="">Selecciona tarjeta</option>
              {state.tarjetasCredito.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        )}
        {error && <div style={{ fontSize:9, color:"var(--red)", marginBottom:8 }}>{error}</div>}
        <button onClick={handleAdd} style={{ background:"linear-gradient(135deg,#22C55E,#4ADE80)", border:"none", borderRadius:"var(--radius-sm)", color:"#0A0C10", fontFamily:"var(--font-sans)", fontSize:10, fontWeight:800, padding:"9px 20px", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase" }}>+ Agregar Pago Fijo</button>
      </div>

      {state.gastosFijos.length === 0 ? (
        <div style={{ padding:"32px 20px", textAlign:"center", background:"var(--bg-card)", border:"1px dashed var(--border)", borderRadius:"var(--radius-lg)", color:"var(--text-ghost)" }}>
          <div style={{ fontSize:20, marginBottom:8, opacity:.3 }}>📋</div>
          <div style={{ fontFamily:"var(--font-sans)", fontSize:12 }}>Sin pagos fijos aún</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {state.gastosFijos.map((f,i) => {
            const cat = categorias.find(c=>c.id===f.categoriaId) || categorias[categorias.length-1];
            const met = metodos.find(m=>m.id===f.metodoId) || metodos[0];
            return (
              <div key={f.id||i} className="fade-up" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, animationDelay:`${i*0.04}s` }}>
                <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:cat.color+"18", border:`1px solid ${cat.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{cat.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{f.descripcion}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Badge color={cat.color}>{cat.label}</Badge>
                    <Badge color="var(--text-ghost)">{met.label}</Badge>
                    <Badge color="var(--text-ghost)">Día {f.dia}</Badge>
                  </div>
                </div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:"var(--text-primary)", fontWeight:500 }}>S/. {fmt(f.monto)}</div>
                <button onClick={()=>dispatch({type:"DELETE_GASTO_FIJO",id:f.id})} style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:13, padding:"4px 6px" }} onMouseOver={e=>e.target.style.color="var(--red)"} onMouseOut={e=>e.target.style.color="var(--text-ghost)"}>✕</button>
              </div>
            );
          })}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderTop:"1px solid var(--border)", marginTop:2 }}>
            <span style={{ fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700, color:"var(--text-ghost)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{state.gastosFijos.length} pagos fijos</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:"var(--text-primary)" }}>S/. {fmt(state.gastosFijos.reduce((s,f)=>s+(parseFloat(f.monto)||0),0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Registro() {
  const { state, dispatch } = useApp();

  const categorias = state.categorias.length ? state.categorias : CATEGORIAS_FALLBACK;
  const metodos    = state.metodos.length    ? state.metodos    : METODOS_FALLBACK;

  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0,7));
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroMet, setFiltroMet] = useState("todos");
  const [tabVista, setTabVista]   = useState("gastos");

  const sf = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:null})); };

  // Tarjeta activa seleccionada
  const tarjetaActiva = form.tarjetaId
    ? state.tarjetasCredito.find(t=>t.id===form.tarjetaId) || null
    : null;

  const usandoTarjeta = form.metodoId === "credito" && tarjetaActiva;

  const primerPago = (form.esCuota && tarjetaActiva?.cierre && form.fechaCompra)
    ? getPrimerPago(form.fechaCompra, tarjetaActiva.cierre)
    : null;

  const cuotaPreview = (() => {
    if (!form.esCuota || !form.monto || !form.totalCuotas || !tarjetaActiva) return null;
    const monto = parseFloat(form.monto);
    const n     = parseInt(form.totalCuotas);
    if (!monto || !n) return null;
    const sinInt = parseFloat((monto/n).toFixed(2));
    if (form.conInteres) {
      const conInt     = calcCuota(monto, n, tarjetaActiva.tea || 0);
      const totalPagar = parseFloat((conInt*n).toFixed(2));
      return { cuota:conInt, sinInt, totalPagar, interesTotal:parseFloat((totalPagar-monto).toFixed(2)) };
    }
    const cuotaFinal = form.cuotaManual ? parseFloat(form.cuotaManual) : sinInt;
    return { cuota:cuotaFinal, sinInt, totalPagar:parseFloat((cuotaFinal*n).toFixed(2)), interesTotal:0 };
  })();

  const validate = () => {
    const e = {};
    if (!form.descripcion.trim()) e.descripcion = "Requerido";
    if (!form.monto || parseFloat(form.monto)<=0) e.monto = "Ingresa un monto válido";
    if (!form.esCuota && form.metodoId!=="credito" && !form.fecha) e.fecha = "Requerido";
    if (!form.esCuota && usandoTarjeta && !form.fechaCompra) e.fecha = "Ingresa la fecha de compra";
    if (form.esCuota) {
      if (!form.totalCuotas||parseInt(form.totalCuotas)<2) e.totalCuotas = "Mínimo 2 cuotas";
      if (!tarjetaActiva) e.tarjetaId = "Selecciona una tarjeta";
      if (!form.fechaCompra) e.fechaCompra = "Requerido";
    }
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (editId) {
      dispatch({ type:"UPDATE_GASTO", id:editId, payload:{
        tarjetaId:   form.tarjetaId || null,
        categoriaId: form.categoriaId,
        metodoId:    form.metodoId,
        descripcion: form.descripcion,
        monto:       parseFloat(form.monto),
        fecha:       form.fecha,
        notas:       form.notas || null,
      }});
      setEditId(null);

    } else if (form.esCuota && cuotaPreview && tarjetaActiva) {
      const n          = parseInt(form.totalCuotas);
      const montoTotal = parseFloat(form.monto);
      const cuotaMes   = cuotaPreview.cuota;
      const ppago      = getPrimerPago(form.fechaCompra, tarjetaActiva.cierre);
      const fechaPrimerPago = `${ppago.anio}-${String(ppago.mes).padStart(2,"0")}-${String(tarjetaActiva.pagoDia).padStart(2,"0")}`;

      dispatch({ type:"ADD_CUOTA_COMPRA", payload:{
        tarjetaId: tarjetaActiva.id,
        gasto:{
          id:          uid(),
          tarjetaId:   tarjetaActiva.id,
          categoriaId: form.categoriaId,
          metodoId:    "credito",
          descripcion: `${form.descripcion} — cuota (1/${n})`,
          monto:       cuotaMes,
          fecha:       fechaPrimerPago,
          esCuota:     true,
          notas:       `Cuota 1/${n}${form.conInteres?" con intereses":" sin intereses"}. Total: S/. ${fmt(montoTotal)}`,
        },
        cuota:{
          id:            uid(),
          desc:          form.descripcion,
          montoTotal,
          cuota:         cuotaMes,
          totalCuotas:   n,
          pagadas:       parseInt(form.pagadasYa)||1,
          conInteres:    form.conInteres,
          mesPrimerPago: ppago.mes,
          anioPrimerPago:ppago.anio,
        },
        recurrente:{
          tarjetaId:   tarjetaActiva.id,
          categoriaId: form.categoriaId,
          metodoId:    "credito",
          descripcion: `${form.descripcion} — cuota`,
          monto:       cuotaMes,
          esCuota:     true,
          notas:       `Cuota automática. ${n} cuotas. Inicio: ${ppago.mes}/${ppago.anio}`,
        },
      }});

    } else {
      dispatch({ type:"ADD_GASTO", payload:{
        id:          uid(),
        tarjetaId:   form.tarjetaId || null,
        categoriaId: form.categoriaId,
        metodoId:    form.metodoId,
        descripcion: form.descripcion,
        monto:       parseFloat(form.monto),
        fecha:       form.fecha,
        esCuota:     false,
        notas:       form.notas || null,
      }});
      if (form.recurrente) {
        dispatch({ type:"ADD_RECURRENTE", payload:{ id: uid(),
          tarjetaId:   form.tarjetaId || null,
          categoriaId: form.categoriaId,
          metodoId:    form.metodoId,
          descripcion: form.descripcion,
          monto:       parseFloat(form.monto),
          esCuota:     false,
          notas:       form.notas || null,
        }});
      }
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const startEdit = (g) => {
    setForm({ descripcion:g.descripcion, categoriaId:g.categoriaId, monto:String(g.monto), metodoId:g.metodoId, tarjetaId:g.tarjetaId||null, fecha:g.fecha, notas:g.notas||"", recurrente:false, esCuota:false, totalCuotas:"", conInteres:false, cuotaManual:"", fechaCompra:HOY, pagadasYa:"1" });
    setEditId(g.id);
    setShowForm(true);
    setErrors({});
  };

  const cancelForm = () => { setForm(EMPTY_FORM); setShowForm(false); setEditId(null); setErrors({}); };

  const mesesDisp  = [...new Set(state.gastos.map(g=>g.fecha?.slice(0,7)))].filter(Boolean).sort().reverse();
  const gastosFilt = state.gastos
    .filter(g=>!filtroMes||g.fecha?.slice(0,7)===filtroMes)
    .filter(g=>filtroCat==="todas"||g.categoriaId===filtroCat)
    .filter(g=>filtroMet==="todos"||g.metodoId===filtroMet);
  const totalFilt   = gastosFilt.reduce((s,g)=>s+g.monto,0);
  const totalMesAct = state.gastos.filter(g=>g.fecha?.slice(0,7)===new Date().toISOString().slice(0,7)).reduce((s,g)=>s+g.monto,0);

  const porCat = categorias.map(c=>({
    ...c, total: gastosFilt.filter(g=>g.categoriaId===c.id).reduce((s,g)=>s+g.monto,0),
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  return (
    <div>
      <PageHeader title="Registro de Gastos" accentColor="var(--green)">
        <Btn variant="primary" onClick={()=>{ if(showForm) cancelForm(); else setShowForm(true); }}>
          {showForm?"Cancelar":"+ Nuevo gasto"}
        </Btn>
      </PageHeader>

      <div className="page-container">
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Gasto mes actual"    value={`S/. ${fmt(totalMesAct)}`}   valueColor="var(--blue)"       delay={0}/>
          <KPICard label="Movimientos del mes" value={`${state.gastos.filter(g=>g.fecha?.slice(0,7)===new Date().toISOString().slice(0,7)).length}`} sub="gastos" delay={0.06}/>
          <KPICard label="Recurrentes activos" value={`${state.gastosRecurrentes.length}`} sub="auto-registran" valueColor="var(--yellow)" delay={0.12}/>
          <KPICard label="Total histórico"     value={`S/. ${fmt(state.gastos.reduce((s,g)=>s+g.monto,0))}`} valueColor="var(--text-muted)" delay={0.18}/>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3, width:"fit-content" }}>
          {[{k:"gastos",l:"Gastos del mes"},{k:"recurrentes",l:`Recurrentes (${state.gastosRecurrentes.length})`},{k:"fijos",l:`Pagos Fijos (${state.gastosFijos.length})`}].map(t=>(
            <button key={t.k} onClick={()=>setTabVista(t.k)} style={{ background:tabVista===t.k?"var(--bg-hover)":"transparent", border:tabVista===t.k?"1px solid var(--green)":"1px solid transparent", borderRadius:"var(--radius-sm)", color:tabVista===t.k?"var(--green)":"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700, padding:"6px 14px", cursor:"pointer", transition:"all .15s", letterSpacing:"0.06em", textTransform:"uppercase" }}>{t.l}</button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:showForm?"1fr 360px":"1fr 280px", gap:18 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {tabVista==="fijos" ? (
              <PagosFijosPanel state={state} dispatch={dispatch}/>
            ) : tabVista==="recurrentes" ? (
              <div>
                <div style={{ marginBottom:12, padding:"10px 14px", background:"var(--yellow-bg)", border:"1px solid var(--yellow-border)", borderRadius:"var(--radius-md)" }}>
                  <div style={{ fontSize:10, color:"var(--yellow)", fontFamily:"var(--font-sans)", fontWeight:600, marginBottom:3 }}>¿Cómo funciona?</div>
                  <div style={{ fontSize:9, color:"var(--text-dim)", lineHeight:1.6 }}>Los gastos recurrentes y las cuotas de tarjeta se registran automáticamente cada mes.</div>
                </div>
                {state.gastosRecurrentes.length===0 ? (
                  <EmptyState title="Sin gastos recurrentes" subtitle={"Marca 'Repetir cada mes' al registrar un gasto\no registra una compra a cuotas"}/>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {state.gastosRecurrentes.map((r,i)=>{
                      const cat = categorias.find(c=>c.id===r.categoriaId)||categorias[categorias.length-1];
                      return (
                        <div key={r.id} className="fade-up" style={{ background:"var(--bg-card)", border:`1px solid ${r.esCuota?"var(--blue-border)":"var(--yellow-border)"}`, borderRadius:"var(--radius-lg)", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, animationDelay:`${i*0.04}s` }}>
                          <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:cat.color+"18", border:`1px solid ${cat.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{cat.emoji}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{r.descripcion}</div>
                            <div style={{ display:"flex", gap:6 }}>
                              <Badge color={cat.color}>{cat.label}</Badge>
                              {r.esCuota?<Badge color="var(--blue)">Cuota tarjeta</Badge>:<Badge color="var(--yellow)">Mensual</Badge>}
                            </div>
                          </div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:r.esCuota?"var(--blue)":"var(--yellow)", fontWeight:500 }}>S/. {fmt(r.monto)}</div>
                          <button onClick={()=>dispatch({type:"DELETE_RECURRENTE",id:r.id})} style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:13, padding:"4px 6px" }} onMouseOver={e=>e.target.style.color="var(--red)"} onMouseOut={e=>e.target.style.color="var(--text-ghost)"}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Filtros */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {[new Date().toISOString().slice(0,7),...mesesDisp.filter(m=>m!==new Date().toISOString().slice(0,7))].slice(0,6).map(m=>(
                      <button key={m} onClick={()=>setFiltroMes(m)} style={{ background:filtroMes===m?"var(--bg-hover)":"var(--bg-input)", border:`1px solid ${filtroMes===m?"var(--blue)":"var(--border)"}`, borderRadius:"var(--radius-sm)", color:filtroMes===m?"var(--blue)":"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700, padding:"5px 10px", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.06em" }}>{m}</button>
                    ))}
                  </div>
                  <div style={{ width:1, height:20, background:"var(--border)" }}/>
                  <select value={filtroCat} onChange={e=>setFiltroCat(e.target.value)} style={{ padding:"5px 10px", fontSize:10, width:"auto" }}>
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                  <select value={filtroMet} onChange={e=>setFiltroMet(e.target.value)} style={{ padding:"5px 10px", fontSize:10, width:"auto" }}>
                    <option value="todos">Todos los métodos</option>
                    {metodos.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  {(filtroCat!=="todas"||filtroMet!=="todos")&&(
                    <button onClick={()=>{setFiltroCat("todas");setFiltroMet("todos");}} style={{ background:"none", border:"none", color:"var(--text-dim)", fontSize:9, cursor:"pointer", fontFamily:"var(--font-sans)", textDecoration:"underline" }}>Limpiar</button>
                  )}
                </div>

                {gastosFilt.length===0 ? (
                  <EmptyState title="Sin gastos registrados" subtitle={"Haz clic en '+ Nuevo gasto' para empezar\no cambia los filtros"}/>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...gastosFilt].reverse().map((g,i)=>{
                      const cat = categorias.find(c=>c.id===g.categoriaId)||categorias[categorias.length-1];
                      return (
                        <div key={g.id||i} className="fade-up" style={{ background:"var(--bg-card)", border:`1px solid ${g.esCuota?"var(--blue-border)":"var(--border)"}`, borderRadius:"var(--radius-lg)", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, animationDelay:`${i*0.03}s` }}>
                          <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:cat.color+"18", border:`1px solid ${cat.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{cat.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{g.descripcion}</div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              <Badge color={cat.color}>{cat.label}</Badge>
                              {g.metodoLabel&&<Badge color="var(--text-ghost)">{g.metodoLabel}</Badge>}
                              {g.esCuota&&<Badge color="var(--blue)">Cuota tarjeta</Badge>}
                              <span style={{ fontSize:9, color:"var(--text-ghost)" }}>{fechaLegible(g.fecha)}</span>
                            </div>
                          </div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:"var(--text-primary)", fontWeight:500, flexShrink:0 }}>S/. {fmt(g.monto)}</div>
                          <button onClick={()=>startEdit(g)} style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:12, padding:"4px 6px" }} onMouseOver={e=>e.target.style.color="var(--blue)"} onMouseOut={e=>e.target.style.color="var(--text-ghost)"}>✏</button>
                          <button onClick={()=>dispatch({type:"DELETE_GASTO",id:g.id})} style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:13, padding:"4px 6px" }} onMouseOver={e=>e.target.style.color="var(--red)"} onMouseOut={e=>e.target.style.color="var(--text-ghost)"}>✕</button>
                        </div>
                      );
                    })}
                    <div style={{ padding:"12px 16px", background:"var(--bg-input)", borderRadius:"var(--radius-md)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{gastosFilt.length} gastos</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--blue)" }}>S/. {fmt(totalFilt)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {showForm && (
              <Card className="fade-up" style={{ borderColor:editId?"var(--blue-border)":"var(--green-border)" }}>
                <SectionTitle color={editId?"var(--blue)":"var(--green)"}>{editId?"Editar gasto":"Nuevo gasto"}</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                  <Field label="Descripción" error={errors.descripcion}>
                    <input placeholder="Ej: Almuerzo, Samsung S25..." value={form.descripcion} onChange={e=>sf("descripcion",e.target.value)} style={errors.descripcion?{borderColor:"var(--red)"}:{}}/>
                  </Field>

                  <Field label="Categoría">
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
                      {categorias.map(c=>(
                        <button key={c.id} onClick={()=>sf("categoriaId",c.id)} style={{ background:form.categoriaId===c.id?c.color+"22":"var(--bg-input)", border:`1px solid ${form.categoriaId===c.id?c.color+"66":"var(--border)"}`, borderRadius:"var(--radius-sm)", color:form.categoriaId===c.id?c.color:"var(--text-muted)", fontFamily:"var(--font-mono)", fontSize:9, padding:"7px 5px", cursor:"pointer", transition:"all .15s", textAlign:"center" }}>{c.emoji} {c.label}</button>
                      ))}
                    </div>
                  </Field>

                  <div style={{ display:"grid", gridTemplateColumns:form.esCuota?"1fr":"1fr 1fr", gap:10 }}>
                    <Field label={form.esCuota?"Monto total de la compra (S/.)":"Monto (S/.)"} error={errors.monto}>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={form.monto} onChange={e=>sf("monto",e.target.value)} style={errors.monto?{borderColor:"var(--red)"}:{}}/>
                    </Field>
                    {!form.esCuota && usandoTarjeta ? (
                      <Field label="¿Cuándo compraste?" error={errors.fecha}>
                        <input type="date" value={form.fechaCompra} onChange={e=>{
                          sf("fechaCompra",e.target.value);
                          if(e.target.value&&tarjetaActiva){
                            const pp=getPrimerPago(e.target.value,tarjetaActiva.cierre);
                            sf("fecha",`${pp.anio}-${String(pp.mes).padStart(2,"0")}-${String(tarjetaActiva.pagoDia).padStart(2,"0")}`);
                          }
                        }}/>
                      </Field>
                    ) : !form.esCuota ? (
                      <Field label="Fecha del gasto" error={errors.fecha}>
                        <input type="date" value={form.fecha} onChange={e=>sf("fecha",e.target.value)}/>
                      </Field>
                    ) : null}
                  </div>

                  <Field label="Método de pago" error={errors.metodoId}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {metodos.map(m=>(
                        <button key={m.id} onClick={()=>{ sf("metodoId",m.id); if(m.id!=="credito"){sf("tarjetaId",null);sf("esCuota",false);} }} style={{ background:form.metodoId===m.id?"var(--blue-bg)":"var(--bg-input)", border:`1px solid ${form.metodoId===m.id?"var(--blue)":"var(--border)"}`, borderRadius:"var(--radius-sm)", color:form.metodoId===m.id?"var(--blue)":"var(--text-muted)", fontFamily:"var(--font-mono)", fontSize:10, padding:"8px 5px", cursor:"pointer", transition:"all .15s" }}>{m.label}</button>
                      ))}
                    </div>
                  </Field>

                  {/* Selector de tarjeta — solo si método es crédito */}
                  {form.metodoId==="credito" && (
                    <Field label="Tarjeta" error={errors.tarjetaId}>
                      {state.tarjetasCredito.length===0 ? (
                        <div style={{ padding:"10px 12px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:10, color:"var(--text-ghost)" }}>
                          No tienes tarjetas registradas. Ve a Tarjetas para agregar una.
                        </div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {state.tarjetasCredito.map(t=>(
                            <button key={t.id} onClick={()=>sf("tarjetaId",t.id)} style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:10, background:form.tarjetaId===t.id?"var(--bg-hover)":"var(--bg-input)", border:`1.5px solid ${form.tarjetaId===t.id?t.color:"var(--border)"}`, borderRadius:"var(--radius-md)", cursor:"pointer", transition:"all .15s" }}>
                              <div style={{ width:10, height:10, borderRadius:"50%", background:t.color, flexShrink:0 }}/>
                              <span style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:form.tarjetaId===t.id?t.color:"var(--text-muted)" }}>{t.nombre}</span>
                              <span style={{ marginLeft:"auto", fontFamily:"var(--font-sans)", fontSize:9, color:"var(--text-ghost)" }}>{t.bancoLabel}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </Field>
                  )}

                  {/* Info ciclo — compra directa con tarjeta */}
                  {!form.esCuota && usandoTarjeta && form.fechaCompra && tarjetaActiva?.cierre && (()=>{
                    const pp=getPrimerPago(form.fechaCompra,tarjetaActiva.cierre);
                    return (
                      <div style={{ padding:"8px 12px", background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:"var(--radius-sm)", fontSize:10, color:"var(--blue)" }}>
                        📅 Se registrará en: <strong>{MESES_LABEL[pp.mes]} {pp.anio}</strong> (día {tarjetaActiva.pagoDia})
                      </div>
                    );
                  })()}

                  {/* Toggle cuotas */}
                  {!editId && usandoTarjeta && (
                    <div>
                      <div style={{ display:"flex", gap:6, marginBottom:form.esCuota?10:0 }}>
                        {[{v:false,l:"Gasto directo"},{v:true,l:"Compra a cuotas"}].map(opt=>(
                          <button key={String(opt.v)} onClick={()=>sf("esCuota",opt.v)} style={{ flex:1, padding:"9px 0", background:form.esCuota===opt.v?(opt.v?"var(--blue-bg)":"var(--bg-hover)"):"var(--bg-input)", border:`1.5px solid ${form.esCuota===opt.v?(opt.v?"var(--blue)":"var(--border-light)"):"var(--border)"}`, borderRadius:"var(--radius-md)", color:form.esCuota===opt.v?(opt.v?"var(--blue)":"var(--text-secondary)"):"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, cursor:"pointer" }}>{opt.l}</button>
                        ))}
                      </div>

                      {form.esCuota && (
                        <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            <Field label="Número de cuotas" error={errors.totalCuotas}>
                              <input type="number" min="2" placeholder="12" value={form.totalCuotas} onChange={e=>sf("totalCuotas",e.target.value)} style={errors.totalCuotas?{borderColor:"var(--red)"}:{}}/>
                            </Field>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Tipo de cuota</div>
                              <div style={{ display:"flex", gap:5 }}>
                                {[{v:false,l:"Sin int."},{v:true,l:"Con int."}].map(opt=>(
                                  <button key={String(opt.v)} onClick={()=>sf("conInteres",opt.v)} style={{ flex:1, padding:"10px 0", background:form.conInteres===opt.v?(opt.v?"var(--red-bg)":"var(--green-bg)"):"var(--bg-input)", border:`1px solid ${form.conInteres===opt.v?(opt.v?"var(--red)":"var(--green)"):"var(--border)"}`, borderRadius:"var(--radius-sm)", color:form.conInteres===opt.v?(opt.v?"var(--red)":"var(--green)"):"var(--text-muted)", fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700, cursor:"pointer" }}>{opt.l}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            <Field label="¿Cuándo compraste?">
                              <input type="date" value={form.fechaCompra} onChange={e=>sf("fechaCompra",e.target.value)}/>
                            </Field>
                            <Field label="Cuotas ya pagadas">
                              <input type="number" min="0" placeholder="1" value={form.pagadasYa} onChange={e=>sf("pagadasYa",e.target.value)}/>
                            </Field>
                          </div>
                          {primerPago && (
                            <div style={{ padding:"8px 12px", background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:"var(--radius-sm)", fontSize:10, color:"var(--blue)" }}>
                              📅 Primer pago: <strong>{MESES_LABEL[primerPago.mes]} {primerPago.anio}</strong> (día {tarjetaActiva?.pagoDia})
                            </div>
                          )}
                          {!form.conInteres && (
                            <Field label="Cuota mensual (S/.) — si difiere del cálculo automático">
                              <input type="number" placeholder={cuotaPreview?`Auto: S/. ${fmt(cuotaPreview.sinInt)}`:"0.00"} value={form.cuotaManual} onChange={e=>sf("cuotaManual",e.target.value)}/>
                            </Field>
                          )}
                          {cuotaPreview && (
                            <div style={{ background:"var(--blue-bg)", border:`1px solid ${tarjetaActiva?.color||"var(--blue)"}44`, borderRadius:"var(--radius-md)", padding:"11px 14px" }}>
                              <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Resumen</div>
                              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                {form.conInteres && (
                                  <>
                                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:10, color:"var(--text-muted)" }}>Sin intereses sería</span><span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)" }}>S/. {fmt(cuotaPreview.sinInt)}/mes</span></div>
                                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:10, color:"var(--text-muted)" }}>Total a pagar</span><span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--red)" }}>S/. {fmt(cuotaPreview.totalPagar)}</span></div>
                                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:10, color:"var(--text-muted)" }}>Interés total</span><span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--red)" }}>S/. {fmt(cuotaPreview.interesTotal)}</span></div>
                                  </>
                                )}
                                <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid var(--blue-border)", paddingTop:6, marginTop:2 }}>
                                  <span style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"var(--font-sans)", fontWeight:700 }}>Cuota mensual</span>
                                  <span style={{ fontFamily:"var(--font-mono)", fontSize:17, color:tarjetaActiva?.color||"var(--blue)" }}>S/. {fmt(cuotaPreview.cuota)}</span>
                                </div>
                                <div style={{ fontSize:9, color:"var(--text-ghost)", textAlign:"right" }}>
                                  {primerPago?`Pagos: ${MESES_LABEL[primerPago.mes]} ${primerPago.anio} → ${form.totalCuotas} meses`:`Se crea recurrente por ${form.totalCuotas} meses`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Field label="Notas (opcional)">
                    <textarea rows={2} placeholder="Descripción adicional..." value={form.notas} onChange={e=>sf("notas",e.target.value)} style={{ minHeight:50 }}/>
                  </Field>

                  {!editId && !form.esCuota && form.metodoId!=="credito" && (
                    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:form.recurrente?"var(--yellow-bg)":"var(--bg-input)", border:`1px solid ${form.recurrente?"var(--yellow-border)":"var(--border)"}`, borderRadius:"var(--radius-md)", transition:"all .15s" }}>
                      <input type="checkbox" checked={form.recurrente} onChange={e=>sf("recurrente",e.target.checked)} style={{ width:14, height:14, accentColor:"var(--yellow)" }}/>
                      <div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:form.recurrente?"var(--yellow)":"var(--text-muted)" }}>Repetir cada mes</div>
                        <div style={{ fontSize:9, color:"var(--text-ghost)", marginTop:2 }}>Se registrará automáticamente al inicio del mes</div>
                      </div>
                    </label>
                  )}

                  <Btn variant="primary" size="full" onClick={submit} style={editId?{background:"linear-gradient(135deg,#3B82F6,#60A5FA)"}:{}}>
                    {editId?"Guardar cambios":form.esCuota?"Registrar compra a cuotas":"Registrar gasto"}
                  </Btn>
                </div>
              </Card>
            )}

            {porCat.length>0&&tabVista==="gastos"&&(
              <Card>
                <SectionTitle>Por categoría</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {porCat.slice(0,7).map((c,i)=>(
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:12 }}>{c.emoji}</span>
                          <span style={{ fontSize:10, color:"var(--text-secondary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{c.label}</span>
                        </div>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:c.color }}>S/. {fmt(c.total)}</span>
                      </div>
                      <ProgressBar pct={(c.total/totalFilt)*100} color={c.color}/>
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
