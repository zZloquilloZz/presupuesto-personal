// Presupuesto vs Real — compara lo planificado contra lo gastado.
// Los presupuestos por categoria son editables (click para editar).
// Los gastos reales vienen de los registros del Modulo Registro.

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApp, useGastosMes } from "../context/AppContext";

import { fmt } from "../utils";
import { CATEGORIAS_FALLBACK } from "../constants";
import { Card, SectionTitle, KPICard, PageHeader, ChartTooltip, ProgressBar, Btn } from "../components/UI";

export default function Presupuesto() {
  const { state, dispatch } = useApp();
  const gastosMes = useGastosMes();
  const [editando, setEditando] = useState(null);
  const [tempVal, setTempVal] = useState("");

  const presupuestos = state.presupuestos;

  const savePresupuesto = (id) => {
    const v = parseFloat(tempVal);
    if (!isNaN(v) && v >= 0) dispatch({ type:"SET_PRESUPUESTO", categoriaId:id, monto:v });
    setEditando(null);
  };

  // Calcular gastado real por categoria
  const categorias = state.categorias.length ? state.categorias : CATEGORIAS_FALLBACK;
  const data = categorias.map(c => {
    const gastado = gastosMes.filter(g=>g.categoriaId===c.id).reduce((s,g)=>s+g.monto,0);
    const ppto    = presupuestos[c.id] || 0;
    const pct     = ppto > 0 ? (gastado / ppto) * 100 : 0;
    const estado  = pct >= 100 ? "excedido" : pct >= 80 ? "alerta" : "ok";
    return { ...c, gastado, ppto, pct, estado };
  });

  const totalPpto   = data.reduce((s,c) => s + c.ppto, 0);
  const totalGast   = data.reduce((s,c) => s + c.gastado, 0);
  const totalDisp   = totalPpto - totalGast;
  const excedidas   = data.filter(c => c.estado === "excedido").length;
  const enAlerta    = data.filter(c => c.estado === "alerta").length;

  const colorEstado = (e) => e==="excedido"?"var(--red)":e==="alerta"?"var(--yellow)":"var(--green)";

  const mesLabel = new Date().toLocaleString("es-PE", { month:"long", year:"numeric" });

  return (
    <div>
      <PageHeader title="Presupuesto vs Real" accentColor="var(--yellow)">
        <div style={{ fontFamily:"var(--font-sans)", fontSize:10, color:"var(--text-muted)", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"6px 12px", textTransform:"capitalize" }}>
          {mesLabel}
        </div>
      </PageHeader>

      <div className="page-container">
        {/* KPIs */}
        <div className="grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <KPICard label="Presupuesto total" value={`S/. ${fmt(totalPpto)}`}  valueColor="var(--text-primary)" delay={0}/>
          <KPICard label="Gastado este mes"  value={`S/. ${fmt(totalGast)}`}  valueColor="var(--blue)"  delay={0.06}/>
          <KPICard label="Disponible"        value={`S/. ${fmt(Math.abs(totalDisp))}`} valueColor={totalDisp>=0?"var(--green)":"var(--red)"} bg={totalDisp>=0?"var(--green-bg)":"var(--red-bg)"} border={totalDisp>=0?"var(--green-border)":"var(--red-border)"} delay={0.12}/>
          <KPICard label="Categorias alerta" value={`${excedidas} excedidas / ${enAlerta} en alerta`} valueColor={excedidas>0?"var(--red)":enAlerta>0?"var(--yellow)":"var(--green)"} delay={0.18}/>
        </div>

        {/* Banner de orientacion cuando todo esta en 0 */}
        {totalPpto === 0 && (
          <div style={{ background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:"var(--radius-lg)", padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:22, opacity:.5 }}>💡</div>
            <div>
              <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:"var(--blue)", marginBottom:3 }}>Define tu presupuesto mensual</div>
              <div style={{ fontSize:10, color:"var(--text-dim)", lineHeight:1.6 }}>
                Haz clic en el monto subrayado de cada categoria para editarlo. El presupuesto se usa para comparar contra tus gastos reales del Modulo Registro.
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:18 }}>
          {/* Tabla categorias */}
          <Card>
            <SectionTitle>Por categoria — click para editar presupuesto</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {data.map((c,i) => (
                <div key={c.id} className="fade-up" style={{ animationDelay:`${i*0.04}s` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:14 }}>{c.emoji}</span>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:11, fontWeight:700, color:"var(--text-primary)" }}>{c.label}</span>
                      {c.estado !== "ok" && (
                        <span style={{ fontSize:8, fontWeight:700, color:colorEstado(c.estado), background:colorEstado(c.estado)+"22", padding:"1px 6px", borderRadius:3, fontFamily:"var(--font-sans)", letterSpacing:"0.1em" }}>
                          {c.estado.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:colorEstado(c.estado) }}>S/. {fmt(c.gastado)}</span>
                      <span style={{ fontSize:9, color:"var(--text-ghost)" }}>/</span>
                      {editando === c.id ? (
                        <div style={{ display:"flex", gap:4 }}>
                          <input type="number" min="0" step="10" value={tempVal} autoFocus
                            onChange={e=>setTempVal(e.target.value)}
                            onKeyDown={e=>{ if(e.key==="Enter")savePresupuesto(c.id); if(e.key==="Escape")setEditando(null); }}
                            style={{ width:80, fontSize:12, padding:"4px 8px", border:"1px solid var(--blue)", borderRadius:"var(--radius-sm)" }}/>
                          <button onClick={()=>savePresupuesto(c.id)} style={{ background:"var(--green)", border:"none", borderRadius:"var(--radius-sm)", color:"#0A0C10", fontSize:10, fontWeight:700, padding:"4px 8px", cursor:"pointer" }}>✓</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setEditando(c.id); setTempVal(c.ppto.toString()); }} style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-muted)", background:"none", border:"none", cursor:"pointer", padding:"2px 4px", borderRadius:3, textDecoration:"underline dotted" }}>
                          S/. {fmt(c.ppto)}
                        </button>
                      )}
                    </div>
                  </div>
                  <ProgressBar pct={c.pct} color={colorEstado(c.estado)}/>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-ghost)", marginTop:3 }}>
                    <span>{c.pct.toFixed(0)}% usado</span>
                    <span style={{ color:c.ppto-c.gastado>=0?"var(--text-ghost)":"var(--red)" }}>
                      {c.ppto-c.gastado>=0?`S/. ${fmt(c.ppto-c.gastado)} disponible`:`S/. ${fmt(c.gastado-c.ppto)} excedido`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Grafico */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card>
              <SectionTitle>Presupuesto vs Gastado</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.map(c=>({name:c.label.slice(0,6),ppto:c.ppto,gastado:c.gastado,color:c.color,estado:c.estado}))} barSize={10} barGap={2} layout="vertical">
                  <XAxis type="number" hide/>
                  <YAxis type="category" dataKey="name" tick={{fill:"var(--text-dim)",fontSize:9,fontFamily:"var(--font-mono)"}} axisLine={false} tickLine={false} width={46}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="ppto"    name="Presupuesto" fill="var(--border-light)" radius={[0,3,3,0]}/>
                  <Bar dataKey="gastado" name="Gastado"     radius={[0,3,3,0]}>
                    {data.map((c,i)=><Cell key={i} fill={colorEstado(c.estado)}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SectionTitle>Resumen</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { l:"Categorias en orden",  v:data.filter(c=>c.pct<80).length,   c:"var(--green)"  },
                  { l:"En alerta (>80%)",      v:enAlerta,                           c:"var(--yellow)" },
                  { l:"Excedidas (>100%)",     v:excedidas,                          c:"var(--red)"    },
                  { l:"% del presupuesto usado", v:`${totalPpto>0?((totalGast/totalPpto)*100).toFixed(1):0}%`, c: totalGast/totalPpto>.9?"var(--red)":totalGast/totalPpto>.7?"var(--yellow)":"var(--green)" },
                ].map((r,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)" }}>
                    <span style={{ fontSize:10, color:"var(--text-secondary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{r.l}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:r.c }}>{r.v}</span>
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
