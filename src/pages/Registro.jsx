// Registro de gastos — formulario para ingresar movimientos del mes.
// Soporta gastos recurrentes que se auto-aplican al inicio de cada mes.
// Filtros por mes, categoria y metodo de pago.

import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { CATEGORIAS } from "../constants";
import { fmt, uid, fechaLegible } from "../utils";
import { Card, SectionTitle, KPICard, Btn, Field, EmptyState, Badge, PageHeader, ProgressBar } from "../components/UI";

const METODOS = [
  { id:"debito",   label:"Debito",         color:"var(--green)"  },
  { id:"bcp",      label:"BCP Visa",       color:"var(--blue)"   },
  { id:"amex",     label:"AMEX Interbank", color:"var(--orange)" },
  { id:"efectivo", label:"Efectivo",       color:"var(--yellow)" },
];

const HOY = new Date().toISOString().slice(0, 10);
const EMPTY_FORM = {
  descripcion:"", categoria:"alimentacion", monto:"",
  metodo:"debito", fecha: HOY, notas:"", recurrente: false,
};

export default function Registro() {
  const { state, dispatch } = useApp();

  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);

  // Filtros
  const [filtroMes, setFiltroMes]   = useState(new Date().toISOString().slice(0, 7));
  const [filtroCat, setFiltroCat]   = useState("todas");
  const [filtroMet, setFiltroMet]   = useState("todos");
  const [tabVista, setTabVista]     = useState("gastos"); // "gastos" | "recurrentes"

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  // Aplicar recurrentes al mes actual al montar
  useEffect(() => {
    if (state.gastosRecurrentes.length === 0) return;
    const ahora  = new Date();
    const mesKey = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2,"0")}`;
    const fecha  = HOY;
    dispatch({ type:"APLICAR_RECURRENTES", mesKey, fecha });
  }, []); // solo al montar

  const validate = () => {
    const e = {};
    if (!form.descripcion.trim()) e.descripcion = "Requerido";
    if (!form.monto || parseFloat(form.monto) <= 0) e.monto = "Ingresa un monto valido";
    if (!form.fecha) e.fecha = "Requerido";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (editId) {
      // Modo edicion
      dispatch({ type:"UPDATE_GASTO", id: editId, payload: { ...form, monto: parseFloat(form.monto) } });
      setEditId(null);
    } else {
      // Nuevo gasto normal
      dispatch({ type:"ADD_GASTO", payload: { ...form, monto: parseFloat(form.monto) } });

      // Si marcaron recurrente, guardarlo tambien en la lista de recurrentes
      if (form.recurrente) {
        dispatch({ type:"ADD_RECURRENTE", payload: {
          descripcion: form.descripcion,
          categoria:   form.categoria,
          monto:       parseFloat(form.monto),
          metodo:      form.metodo,
          notas:       form.notas,
        }});
      }
    }

    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const startEdit = (g) => {
    setForm({ descripcion:g.descripcion, categoria:g.categoria, monto:String(g.monto), metodo:g.metodo, fecha:g.fecha, notas:g.notas||"", recurrente:false });
    setEditId(g.id);
    setShowForm(true);
    setErrors({});
  };

  const cancelForm = () => { setForm(EMPTY_FORM); setShowForm(false); setEditId(null); setErrors({}); };

  // Meses disponibles para filtro
  const mesesDisp = [...new Set(state.gastos.map(g => g.fecha?.slice(0, 7)))].filter(Boolean).sort().reverse();
  if (!mesesDisp.includes(filtroMes) && mesesDisp.length > 0 && filtroMes !== new Date().toISOString().slice(0,7)) {
    // si el mes seleccionado no tiene datos, mantener igual (puede ser el mes actual vacio)
  }

  // Aplicar filtros
  const gastosFilt = state.gastos
    .filter(g => !filtroMes || g.fecha?.slice(0, 7) === filtroMes)
    .filter(g => filtroCat === "todas" || g.categoria === filtroCat)
    .filter(g => filtroMet === "todos" || g.metodo === filtroMet);

  // Estadisticas del filtro
  const totalFilt    = gastosFilt.reduce((s,g) => s + g.monto, 0);
  const totalMesAct  = state.gastos
    .filter(g => g.fecha?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s,g) => s + g.monto, 0);

  // Desglose por categoria del filtro actual
  const porCat = CATEGORIAS.map(c => ({
    ...c,
    total: gastosFilt.filter(g => g.categoria === c.id).reduce((s,g) => s + g.monto, 0),
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const getCat = (id) => CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1];
  const getMet = (id) => METODOS.find(m => m.id === id) || METODOS[0];

  return (
    <div>
      <PageHeader title="Registro de Gastos" accentColor="var(--green)">
        <Btn variant="primary" onClick={() => { if (showForm) { cancelForm(); } else { setShowForm(true); } }}>
          {showForm ? "Cancelar" : "+ Nuevo gasto"}
        </Btn>
      </PageHeader>

      <div className="page-container">
        {/* KPIs */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Gasto mes actual"   value={`S/. ${fmt(totalMesAct)}`} valueColor="var(--blue)" delay={0}/>
          <KPICard label="Gastos este mes"    value={`${state.gastos.filter(g=>g.fecha?.slice(0,7)===new Date().toISOString().slice(0,7)).length}`} sub="movimientos" delay={0.06}/>
          <KPICard label="Recurrentes activos" value={`${state.gastosRecurrentes.length}`} sub="se auto-registran" valueColor="var(--yellow)" delay={0.12}/>
          <KPICard label="Total historico"    value={`S/. ${fmt(state.gastos.reduce((s,g)=>s+g.monto,0))}`} valueColor="var(--text-muted)" delay={0.18}/>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3, width:"fit-content" }}>
          {[{k:"gastos",l:"Gastos del mes"},{k:"recurrentes",l:`Recurrentes (${state.gastosRecurrentes.length})`}].map(t => (
            <button key={t.k} onClick={() => setTabVista(t.k)} style={{
              background: tabVista === t.k ? "var(--bg-hover)" : "transparent",
              border: tabVista === t.k ? "1px solid var(--green)" : "1px solid transparent",
              borderRadius:"var(--radius-sm)", color: tabVista === t.k ? "var(--green)" : "var(--text-muted)",
              fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700,
              padding:"6px 14px", cursor:"pointer", transition:"all .15s",
              letterSpacing:"0.06em", textTransform:"uppercase",
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns: showForm ? "1fr 360px" : "1fr 280px", gap:18 }}>
          {/* Contenido principal */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {tabVista === "recurrentes" ? (
              // ── Vista recurrentes ──────────────────────────
              <div>
                <div style={{ marginBottom:12, padding:"10px 14px", background:"var(--yellow-bg)", border:"1px solid var(--yellow-border)", borderRadius:"var(--radius-md)" }}>
                  <div style={{ fontSize:10, color:"var(--yellow)", fontFamily:"var(--font-sans)", fontWeight:600, marginBottom:3 }}>¿Como funciona?</div>
                  <div style={{ fontSize:9, color:"var(--text-dim)", lineHeight:1.6 }}>
                    Los gastos marcados como recurrentes se registran automaticamente al abrir la app cada mes. Puedes eliminarlos de esta lista cuando ya no apliquen.
                  </div>
                </div>
                {state.gastosRecurrentes.length === 0 ? (
                  <EmptyState title="Sin gastos recurrentes" subtitle={"Al agregar un gasto, marca 'Repetir cada mes'\npara que se registre automaticamente"}/>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {state.gastosRecurrentes.map((r,i) => {
                      const cat = getCat(r.categoria);
                      const met = getMet(r.metodo);
                      return (
                        <div key={r.id} className="fade-up" style={{ background:"var(--bg-card)", border:"1px solid var(--yellow-border)", borderRadius:"var(--radius-lg)", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, animationDelay:`${i*0.04}s` }}>
                          <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:cat.color+"18", border:`1px solid ${cat.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{cat.emoji}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{r.descripcion}</div>
                            <div style={{ display:"flex", gap:6 }}>
                              <Badge color={cat.color}>{cat.label}</Badge>
                              <Badge color={met.color}>{met.label}</Badge>
                              <Badge color="var(--yellow)">Mensual</Badge>
                            </div>
                          </div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:"var(--yellow)", fontWeight:500 }}>S/. {fmt(r.monto)}</div>
                          <button onClick={() => dispatch({ type:"DELETE_RECURRENTE", id:r.id })}
                            style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:13, padding:"4px 6px", transition:"color .15s" }}
                            onMouseOver={e => e.target.style.color="var(--red)"} onMouseOut={e => e.target.style.color="var(--text-ghost)"}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // ── Vista gastos ───────────────────────────────
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Filtros */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  {/* Filtro mes */}
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {[new Date().toISOString().slice(0,7), ...mesesDisp.filter(m => m !== new Date().toISOString().slice(0,7))].slice(0,6).map(m => (
                      <button key={m} onClick={() => setFiltroMes(m)} style={{
                        background: filtroMes === m ? "var(--bg-hover)" : "var(--bg-input)",
                        border:`1px solid ${filtroMes === m ? "var(--blue)" : "var(--border)"}`,
                        borderRadius:"var(--radius-sm)", color: filtroMes === m ? "var(--blue)" : "var(--text-muted)",
                        fontFamily:"var(--font-sans)", fontSize:9, fontWeight:700,
                        padding:"5px 10px", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.06em",
                      }}>{m}</button>
                    ))}
                  </div>
                  {/* Separador */}
                  <div style={{ width:1, height:20, background:"var(--border)" }}/>
                  {/* Filtro categoria */}
                  <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} style={{ padding:"5px 10px", fontSize:10, width:"auto" }}>
                    <option value="todas">Todas las categorias</option>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                  {/* Filtro metodo */}
                  <select value={filtroMet} onChange={e => setFiltroMet(e.target.value)} style={{ padding:"5px 10px", fontSize:10, width:"auto" }}>
                    <option value="todos">Todos los metodos</option>
                    {METODOS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  {/* Limpiar filtros */}
                  {(filtroCat !== "todas" || filtroMet !== "todos") && (
                    <button onClick={() => { setFiltroCat("todas"); setFiltroMet("todos"); }} style={{ background:"none", border:"none", color:"var(--text-dim)", fontSize:9, cursor:"pointer", fontFamily:"var(--font-sans)", textDecoration:"underline" }}>Limpiar</button>
                  )}
                </div>

                {/* Lista gastos */}
                {gastosFilt.length === 0 ? (
                  <EmptyState title="Sin gastos registrados" subtitle={"Haz clic en '+ Nuevo gasto' para empezar\no cambia los filtros"}/>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...gastosFilt].reverse().map((g,i) => {
                      const cat = getCat(g.categoria);
                      const met = getMet(g.metodo);
                      return (
                        <div key={g.id||i} className="fade-up" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, animationDelay:`${i*0.03}s` }}>
                          <div style={{ width:34, height:34, borderRadius:"var(--radius-sm)", background:cat.color+"18", border:`1px solid ${cat.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{cat.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{g.descripcion}</div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              <Badge color={cat.color}>{cat.label}</Badge>
                              <Badge color={met.color}>{met.label}</Badge>
                              {g.recurrenteOrigen && <Badge color="var(--yellow)">Recurrente</Badge>}
                              <span style={{ fontSize:9, color:"var(--text-ghost)" }}>{fechaLegible(g.fecha)}</span>
                            </div>
                          </div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:15, color:"var(--text-primary)", fontWeight:500, flexShrink:0 }}>S/. {fmt(g.monto)}</div>
                          {/* Editar */}
                          <button onClick={() => startEdit(g)}
                            style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:12, padding:"4px 6px", transition:"color .15s" }}
                            onMouseOver={e => e.target.style.color="var(--blue)"} onMouseOut={e => e.target.style.color="var(--text-ghost)"}>✏</button>
                          {/* Borrar */}
                          <button onClick={() => dispatch({ type:"DELETE_GASTO", id: g.id })}
                            style={{ background:"none", border:"none", color:"var(--text-ghost)", cursor:"pointer", fontSize:13, padding:"4px 6px", transition:"color .15s" }}
                            onMouseOver={e => e.target.style.color="var(--red)"} onMouseOut={e => e.target.style.color="var(--text-ghost)"}>✕</button>
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
            {/* Formulario */}
            {showForm && (
              <Card className="fade-up" style={{ borderColor: editId ? "var(--blue-border)" : "var(--green-border)" }}>
                <SectionTitle color={editId ? "var(--blue)" : "var(--green)"}>{editId ? "Editar gasto" : "Nuevo gasto"}</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <Field label="Descripcion" error={errors.descripcion}>
                    <input placeholder="Ej: Almuerzo, Uber..." value={form.descripcion} onChange={e => sf("descripcion", e.target.value)} style={errors.descripcion ? { borderColor:"var(--red)" } : {}}/>
                  </Field>

                  <Field label="Categoria">
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
                      {CATEGORIAS.map(c => (
                        <button key={c.id} onClick={() => sf("categoria", c.id)} style={{
                          background: form.categoria === c.id ? c.color+"22" : "var(--bg-input)",
                          border:`1px solid ${form.categoria === c.id ? c.color+"66" : "var(--border)"}`,
                          borderRadius:"var(--radius-sm)", color: form.categoria === c.id ? c.color : "var(--text-muted)",
                          fontFamily:"var(--font-mono)", fontSize:9, padding:"7px 5px", cursor:"pointer", transition:"all .15s", textAlign:"center",
                        }}>{c.emoji} {c.label}</button>
                      ))}
                    </div>
                  </Field>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <Field label="Monto (S/.)" error={errors.monto}>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={form.monto} onChange={e => sf("monto", e.target.value)} style={errors.monto ? { borderColor:"var(--red)" } : {}}/>
                    </Field>
                    <Field label="Fecha" error={errors.fecha}>
                      <input type="date" value={form.fecha} onChange={e => sf("fecha", e.target.value)}/>
                    </Field>
                  </div>

                  <Field label="Metodo de pago">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {METODOS.map(m => (
                        <button key={m.id} onClick={() => sf("metodo", m.id)} style={{
                          background: form.metodo === m.id ? m.color+"22" : "var(--bg-input)",
                          border:`1px solid ${form.metodo === m.id ? m.color+"66" : "var(--border)"}`,
                          borderRadius:"var(--radius-sm)", color: form.metodo === m.id ? m.color : "var(--text-muted)",
                          fontFamily:"var(--font-mono)", fontSize:10, padding:"8px 5px", cursor:"pointer", transition:"all .15s",
                        }}>{m.label}</button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Notas (opcional)">
                    <textarea rows={2} placeholder="Descripcion adicional..." value={form.notas} onChange={e => sf("notas", e.target.value)} style={{ minHeight:50 }}/>
                  </Field>

                  {/* Recurrente — solo en modo nuevo */}
                  {!editId && (
                    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background: form.recurrente ? "var(--yellow-bg)" : "var(--bg-input)", border:`1px solid ${form.recurrente ? "var(--yellow-border)" : "var(--border)"}`, borderRadius:"var(--radius-md)", transition:"all .15s" }}>
                      <input type="checkbox" checked={form.recurrente} onChange={e => sf("recurrente", e.target.checked)} style={{ width:14, height:14, accentColor:"var(--yellow)" }}/>
                      <div>
                        <div style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color: form.recurrente ? "var(--yellow)" : "var(--text-muted)" }}>Repetir cada mes</div>
                        <div style={{ fontSize:9, color:"var(--text-ghost)", marginTop:2 }}>Se registrara automaticamente al inicio del mes</div>
                      </div>
                    </label>
                  )}

                  <Btn variant={editId ? "primary" : "primary"} size="full" onClick={submit} style={editId ? { background:"linear-gradient(135deg,#3B82F6,#60A5FA)" } : {}}>
                    {editId ? "Guardar cambios" : "Registrar gasto"}
                  </Btn>
                </div>
              </Card>
            )}

            {/* Desglose por categoria */}
            {porCat.length > 0 && tabVista === "gastos" && (
              <Card>
                <SectionTitle>Por categoria</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {porCat.slice(0, 7).map((c,i) => (
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:12 }}>{c.emoji}</span>
                          <span style={{ fontSize:10, color:"var(--text-secondary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{c.label}</span>
                        </div>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:c.color }}>S/. {fmt(c.total)}</span>
                      </div>
                      <ProgressBar pct={(c.total / totalFilt) * 100} color={c.color}/>
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
