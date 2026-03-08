// Cronograma navegable con deudas por mes
const CRONOGRAMA = {
  bcp: [
    { mes:"Enero",      mesIdx:0,  anio:2026, desde:"10 Dic", hasta:"09 Ene", pago:"05 Feb" },
    { mes:"Febrero",    mesIdx:1,  anio:2026, desde:"10 Ene", hasta:"09 Feb", pago:"05 Mar" },
    { mes:"Marzo",      mesIdx:2,  anio:2026, desde:"10 Feb", hasta:"09 Mar", pago:"02 Abr" },
    { mes:"Abril",      mesIdx:3,  anio:2026, desde:"10 Mar", hasta:"09 Abr", pago:"04 May" },
    { mes:"Mayo",       mesIdx:4,  anio:2026, desde:"10 Abr", hasta:"09 May", pago:"05 Jun" },
    { mes:"Junio",      mesIdx:5,  anio:2026, desde:"10 May", hasta:"09 Jun", pago:"03 Jul" },
    { mes:"Julio",      mesIdx:6,  anio:2026, desde:"10 Jun", hasta:"09 Jul", pago:"07 Ago" },
    { mes:"Agosto",     mesIdx:7,  anio:2026, desde:"10 Jul", hasta:"09 Ago", pago:"04 Sep" },
    { mes:"Septiembre", mesIdx:8,  anio:2026, desde:"10 Ago", hasta:"09 Sep", pago:"04 Oct" },
    { mes:"Octubre",    mesIdx:9,  anio:2026, desde:"10 Sep", hasta:"09 Oct", pago:"05 Nov" },
    { mes:"Noviembre",  mesIdx:10, anio:2026, desde:"10 Oct", hasta:"09 Nov", pago:"04 Dic" },
    { mes:"Diciembre",  mesIdx:11, anio:2026, desde:"10 Nov", hasta:"09 Dic", pago:"08 Ene" },
  ],
  amex: [
    { mes:"Enero",      mesIdx:0,  anio:2026, desde:"06 Dic", hasta:"05 Ene", pago:"02 Feb" },
    { mes:"Febrero",    mesIdx:1,  anio:2026, desde:"06 Ene", hasta:"05 Feb", pago:"02 Mar" },
    { mes:"Marzo",      mesIdx:2,  anio:2026, desde:"06 Feb", hasta:"05 Mar", pago:"02 Abr" },
    { mes:"Abril",      mesIdx:3,  anio:2026, desde:"06 Mar", hasta:"05 Abr", pago:"04 May" },
    { mes:"Mayo",       mesIdx:4,  anio:2026, desde:"06 Abr", hasta:"05 May", pago:"02 Jun" },
    { mes:"Junio",      mesIdx:5,  anio:2026, desde:"06 May", hasta:"05 Jun", pago:"02 Jul" },
    { mes:"Julio",      mesIdx:6,  anio:2026, desde:"06 Jun", hasta:"05 Jul", pago:"03 Ago" },
    { mes:"Agosto",     mesIdx:7,  anio:2026, desde:"06 Jul", hasta:"05 Ago", pago:"02 Sep" },
    { mes:"Septiembre", mesIdx:8,  anio:2026, desde:"06 Ago", hasta:"05 Sep", pago:"02 Oct" },
    { mes:"Octubre",    mesIdx:9,  anio:2026, desde:"06 Sep", hasta:"05 Oct", pago:"03 Nov" },
    { mes:"Noviembre",  mesIdx:10, anio:2026, desde:"06 Oct", hasta:"05 Nov", pago:"02 Dic" },
    { mes:"Diciembre",  mesIdx:11, anio:2026, desde:"06 Nov", hasta:"05 Dic", pago:"05 Ene" },
  ],
};

function CronogramaCard({ tarjetaId, tarjeta, cuotas, gastos }) {
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();
  const [mesSel, setMesSel] = useState(mesActual);
  const cronograma = CRONOGRAMA[tarjetaId] || [];
  const entrada = cronograma.find(e => e.mesIdx === mesSel) || cronograma[mesActual];

  // Gastos directos cuya fecha de cargo cae en este mes de pago
  const gastosDelMes = (gastos || []).filter(g => {
    if (g.metodo !== tarjetaId || g.esCuota) return false;
    const d = new Date(g.fecha);
    return d.getMonth() === mesSel && d.getFullYear() === anioActual;
  });

  // Cuotas que se pagan en este mes
  const cuotasDelMes = (cuotas || []).filter(c => {
    const anioIni = c.anioPrimerPago || anioActual;
    const mesIni  = c.mesPrimerPago  || (mesActual + 1);
    const diff    = (anioActual - anioIni) * 12 + (mesSel - (mesIni - 1));
    const numCuota = diff + 1;
    return numCuota >= 1 && numCuota <= parseInt(c.totalCuotas || 0);
  });

  const totalMes = gastosDelMes.reduce((s,g) => s + (parseFloat(g.monto)||0), 0)
                 + cuotasDelMes.reduce((s,c) => s + (parseFloat(c.cuota)||0), 0);
  const esActual = mesSel === mesActual;

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <SectionTitle style={{ marginBottom:0 }}>Cronograma {tarjeta.nombre}</SectionTitle>
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          <button onClick={() => setMesSel(m => Math.max(0, m-1))} disabled={mesSel===0}
            style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-muted)", width:24, height:24, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color: esActual ? tarjeta.color : "var(--text-secondary)", minWidth:60, textAlign:"center" }}>
            {entrada?.mes}
            {esActual && <span style={{ display:"block", fontSize:8, color:tarjeta.color }}>MES ACTUAL</span>}
          </span>
          <button onClick={() => setMesSel(m => Math.min(11, m+1))} disabled={mesSel===11}
            style={{ background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text-muted)", width:24, height:24, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      {entrada && (
        <div style={{ fontSize:9, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", marginBottom:10, padding:"6px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)" }}>
          Ciclo: {entrada.desde} → {entrada.hasta} — Pago límite: <span style={{ color:tarjeta.color, fontWeight:700 }}>{entrada.pago}</span>
        </div>
      )}

      {/* Lista de deudas de ese mes */}
      {gastosDelMes.length === 0 && cuotasDelMes.length === 0 ? (
        <div style={{ fontSize:9, color:"var(--text-ghost)", textAlign:"center", padding:"14px 0", fontFamily:"var(--font-sans)" }}>Sin compras registradas en este ciclo</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {gastosDelMes.map((g,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"var(--bg-input)", borderRadius:"var(--radius-sm)", borderLeft:`2px solid ${tarjeta.color}` }}>
              <div>
                <div style={{ fontSize:10, color:"var(--text-primary)", fontFamily:"var(--font-sans)", fontWeight:600 }}>{g.descripcion}</div>
                <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)" }}>Compra directa</div>
              </div>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:tarjeta.color }}>S/. {fmt(g.monto)}</span>
            </div>
          ))}
          {cuotasDelMes.map((c,i) => {
            const anioIni  = c.anioPrimerPago || anioActual;
            const mesIni   = c.mesPrimerPago  || (mesActual + 1);
            const numCuota = (anioActual - anioIni) * 12 + (mesSel - (mesIni - 1)) + 1;
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

// Panel de Tarjetas — solo lectura.
// Las cuotas se crean desde Registro al registrar una compra a cuotas.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TARJETAS } from "../constants";
import { fmt, diasPara } from "../utils";
import { Card, SectionTitle, KPICard, PageHeader, Badge, ProgressBar } from "../components/UI";

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

function PanelTarjeta({ tarjetaId, tarjeta, cuotas, gastos }) {
  const hoyT2        = new Date();
  const mesActualT2  = hoyT2.getMonth() + 1;
  const anioActualT2 = hoyT2.getFullYear();
  const diaHoyT2     = hoyT2.getDate();

  // Pagadas automaticas segun mes actual
  const calcPagadasAuto = (cuota) => {
    const anioInicio = cuota.anioPrimerPago || anioActualT2;
    const mesInicio  = cuota.mesPrimerPago  || mesActualT2;
    const diff = (anioActualT2 - anioInicio) * 12 + (mesActualT2 - mesInicio) + 1;
    return Math.min(Math.max(diff, parseInt(cuota.pagadas)||0), parseInt(cuota.totalCuotas)||0);
  };
  const totalCuotasMes = cuotas.reduce((s,c) => {
    const pAuto  = calcPagadasAuto(c);
    const totalC = parseInt(c.totalCuotas)||0;
    return pAuto < totalC ? s + (parseFloat(c.cuota)||0) : s;
  }, 0);

  // Linea usada = todos los gastos directos aun no pagados + deuda cuotas pendientes
  // Un gasto "no pagado" es aquel cuya fecha de cargo aun no llego al dia de pago
  const calcLineaUsada = (tId, pagoDia, gastosAll) => {
    const hoy  = new Date();
    const dia  = hoy.getDate();
    const mes  = hoy.getMonth();
    const anio = hoy.getFullYear();

    // Ultimo dia de pago que ya paso (esa deuda ya fue pagada)
    let ultimoPagoYaRealizado;
    if (dia >= pagoDia) {
      ultimoPagoYaRealizado = new Date(anio, mes, pagoDia);
    } else {
      ultimoPagoYaRealizado = new Date(anio, mes - 1, pagoDia);
    }

    // Gastos directos con fecha de cargo DESPUES del ultimo pago realizado = pendientes
    const directos = (gastosAll || []).filter(g => g.metodo === tId && !g.esCuota);
    return directos
      .filter(g => new Date(g.fecha) > ultimoPagoYaRealizado)
      .reduce((s,g) => s + (parseFloat(g.monto)||0), 0);
  };

  const totalDeudaCuotas = cuotas.reduce((s,c) => {
    const pAuto = calcPagadasAuto(c);
    const rest  = Math.max(0, (parseInt(c.totalCuotas)||0) - pAuto);
    return s + rest * (parseFloat(c.cuota)||0);
  }, 0);

  const lineaUsada = calcLineaUsada(tarjetaId, tarjeta.pagoDia, gastos) + totalDeudaCuotas;
  const lineaLibre     = Math.max(0, tarjeta.lineaCredito - lineaUsada);
  const pctUsado       = tarjeta.lineaCredito > 0 ? (lineaUsada / tarjeta.lineaCredito) * 100 : 0;
  const diasPago       = diasPara(tarjeta.pagoDia);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        <KPICard label="Cuota total mes"  value={`S/. ${fmt(totalCuotasMes)}`} valueColor={tarjeta.color} delay={0}/>
        <KPICard label="Deuda pendiente"  value={`S/. ${fmt(totalDeudaCuotas)}`}     valueColor="var(--red)" bg="var(--red-bg)" border="var(--red-border)" delay={0.06}/>
        <KPICard label="Proximo pago"     value={`${diasPago} dias`}           valueColor={diasPago<=5?"var(--red)":diasPago<=10?"var(--yellow)":"var(--green)"} sub={`Dia ${tarjeta.pagoDia} de cada mes`} delay={0.12}/>
        <KPICard label="Cuotas activas"   value={`${cuotas.filter(c=>(parseInt(c.totalCuotas)||0)-(parseInt(c.pagadas)||0)>0).length}`} valueColor={tarjeta.color} sub={`${cuotas.reduce((s,c)=>s+Math.max(0,(parseInt(c.totalCuotas)||0)-(parseInt(c.pagadas)||0)),0)} pagos pendientes`} delay={0.18}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16 }}>
        {/* Cuotas activas */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontFamily:"var(--font-sans)", fontSize:12, fontWeight:700, color:tarjeta.color, marginBottom:2 }}>
            {tarjeta.nombre} — Cuotas activas
            <span style={{ fontSize:9, color:"var(--text-ghost)", fontWeight:400, marginLeft:10 }}>
              Para agregar cuotas ve a Registro → Compra a cuotas
            </span>
          </div>

          {/* Linea de credito */}
          <Card style={{ borderColor: tarjeta.color+"33" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"center" }}>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:10, fontWeight:700, color:"var(--text-secondary)" }}>Linea de credito</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-dim)" }}>S/. {fmt(lineaLibre)} libre de S/. {fmt(tarjeta.lineaCredito)}</span>
            </div>
            <ProgressBar pct={pctUsado} color={pctUsado>80?"var(--red)":pctUsado>50?"var(--yellow)":tarjeta.color} height={8}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:9, color:"var(--text-ghost)" }}>Usado: S/. {fmt(lineaUsada)} ({pctUsado.toFixed(0)}%)</span>
              <span style={{ fontSize:9, color:tarjeta.color }}>Disponible: S/. {fmt(lineaLibre)}</span>
            </div>
          </Card>

          {cuotas.length === 0 ? (
            <div style={{ padding:"36px 20px", textAlign:"center", background:"var(--bg-card)", border:"1px dashed var(--border)", borderRadius:"var(--radius-lg)", color:"var(--text-ghost)" }}>
              <div style={{ fontSize:20, marginBottom:8, opacity:.3 }}>[ ]</div>
              <div style={{ fontFamily:"var(--font-sans)", fontSize:12 }}>Sin cuotas en {tarjeta.nombre}</div>
              <div style={{ fontSize:10, color:"var(--text-ghost)", marginTop:6 }}>Ve a Registro y selecciona "Compra a cuotas"</div>
            </div>
          ) : (
            cuotas.map((c,i) => {
              const hoyT = new Date();
              const mesActualT = hoyT.getMonth() + 1;
              const anioActualT = hoyT.getFullYear();
              const anioInicio = c.anioPrimerPago || anioActualT;
              const mesInicio  = c.mesPrimerPago  || mesActualT;
              const pagadasAuto = Math.min(
                Math.max((anioActualT - anioInicio)*12 + (mesActualT - mesInicio) + 1, parseInt(c.pagadas)||0),
                parseInt(c.totalCuotas)||0
              );
              const restantes = Math.max(0, (parseInt(c.totalCuotas)||0) - pagadasAuto);
              const pct       = parseInt(c.totalCuotas)>0 ? (pagadasAuto/parseInt(c.totalCuotas))*100 : 0;
              const deudaRest = restantes * parseFloat(c.cuota||0);
              const liquidada = restantes <= 0;
              const totalPago = parseFloat(c.cuota||0) * parseInt(c.totalCuotas||0);
              const intTotal  = c.conInteres && c.montoTotal ? totalPago - c.montoTotal : 0;
              return (
                <Card key={c.id||i} className="fade-up" style={{ animationDelay:`${i*.05}s`, borderColor: liquidada?"var(--green-border)":tarjeta.color+"33", opacity:liquidada?.75:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{c.desc}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Badge color={tarjeta.color}>{tarjeta.nombre}</Badge>
                        {c.conInteres
                          ? <Badge color="var(--red)">Con intereses TEA {tarjeta.tea}%</Badge>
                          : <Badge color="var(--green)">Sin intereses</Badge>}
                        {liquidada
                          ? <Badge color="var(--green)">LIQUIDADA</Badge>
                          : <Badge color="var(--text-muted)">{restantes} cuotas restantes</Badge>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:16, color:liquidada?"var(--green)":tarjeta.color }}>S/. {fmt(c.cuota)}/mes</div>
                      <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:2 }}>Deuda: S/. {fmt(deudaRest)}</div>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={liquidada?"var(--green)":tarjeta.color} height={5} style={{marginBottom:8}}/>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                    <div style={{ background:"var(--bg-input)", borderRadius:"var(--radius-sm)", padding:"6px 10px" }}>
                      <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Progreso</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{pagadasAuto}/{c.totalCuotas} ({pct.toFixed(0)}%)</div>
                    </div>
                    {c.montoTotal>0 && (
                      <div style={{ background:"var(--bg-input)", borderRadius:"var(--radius-sm)", padding:"6px 10px" }}>
                        <div style={{ fontSize:8, color:"var(--text-ghost)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Compra original</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>S/. {fmt(c.montoTotal)}</div>
                      </div>
                    )}
                    {c.conInteres && intTotal>0 && (
                      <div style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:"var(--radius-sm)", padding:"6px 10px" }}>
                        <div style={{ fontSize:8, color:"var(--red)", fontFamily:"var(--font-sans)", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Interes total</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--red)" }}>S/. {fmt(intTotal)}</div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card style={{ borderColor:tarjeta.color+"33" }}>
            <SectionTitle color={tarjeta.color}>Datos de la tarjeta</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
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

          <CronogramaCard tarjetaId={tarjetaId} tarjeta={tarjeta} cuotas={cuotas} gastos={gastos}/>
        </div>
      </div>
    </div>
  );
}

export default function GestionTarjetas() {
  const { state } = useApp();
  const [tab, setTab] = useState("bcp");
  const tarjeta = tab === "bcp" ? TARJETAS.BCP : TARJETAS.AMEX;
  const cuotas  = state.tarjetas?.[tab]?.cuotasActivas || [];
  const gastos  = state.gastos || [];

  return (
    <div>
      <PageHeader title="Mis Tarjetas" accentColor={tarjeta.color}>
        <div style={{ display:"flex", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:3, gap:3 }}>
          {[{k:"bcp",t:"BCP Visa",c:TARJETAS.BCP.color},{k:"amex",t:"AMEX Interbank",c:TARJETAS.AMEX.color}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
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
        <PanelTarjeta tarjetaId={tab} tarjeta={tarjeta} cuotas={cuotas} gastos={gastos}/>
      </div>
    </div>
  );
}
