// dashboard.jsx — Dashboard screen
const { useMemo: useMemoDash } = React;
const { Icon: DIcon } = window.MFIcons;
const { Pill: DPill, StatePill: DStatePill, SeverityPill: DSeverityPill, StatusPill: DStatusPill } = window.MFShell;

function Dashboard({ state, t, goMachine, goRoute }) {
  const kpis = useMemoDash(() => window.MFData.computeKPIs(state), [state]);
  const trend = useMemoDash(() => window.MFData.trend14(state), [state]);
  const breakdown = useMemoDash(() => window.MFData.faultsByType(state), [state]);
  const criticalAlerts = state.faults.filter(f => f.status !== "resolved" && f.severity === "critical");
  const upcoming = state.interventions
    .filter(i => i.status !== "completed")
    .sort((a,b) => a.scheduledFor.localeCompare(b.scheduledFor))
    .slice(0, 5);
  const recent = window.MFData.history(state).slice(0, 6);
  const health = useMemoDash(() => window.MFData.healthScore(state), [state]);
  const preds = useMemoDash(() => window.MFData.predictions(state), [state]);
  const topMach = useMemoDash(() => window.MFData.topFaultMachines(state), [state]);
  const mttr = useMemoDash(() => window.MFData.computeMTTR(state), [state]);

  return (
    <div>
      {/* ── Intelligence row : score de santé + météo de maintenance ── */}
      <div className="intel-row">
        <HealthBand score={health} kpis={kpis} mttr={mttr}/>
        <MaintenanceWeather state={state} kpis={kpis} goRoute={goRoute}/>
      </div>

      {/* ── Carte thermique + prédiction de pannes ── */}
      <div className="intel-row-2">
        <WorkshopHeatmap state={state} goMachine={goMachine}/>
        <PredictionsCard preds={preds} goMachine={goMachine} topMach={topMach}/>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">{t.dashboard.kpiTotal}</div>
          <div className="kpi-value tabular">{kpis.total}</div>
          <div className="kpi-delta"><DIcon name="factory" size={14}/> {state.machines.length} unités</div>
          <div className="kpi-bar"/>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t.dashboard.kpiOk}</div>
          <div className="kpi-value tabular" style={{ color: "var(--ok)" }}>{kpis.ok}</div>
          <div className="kpi-delta up"><DIcon name="check" size={14}/> {Math.round(kpis.ok / kpis.total * 100)}% du parc</div>
          <div className="kpi-bar" style={{ background: "linear-gradient(90deg, var(--ok), var(--brand-bright))" }}/>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t.dashboard.kpiFault}</div>
          <div className="kpi-value tabular" style={{ color: "var(--critical)" }}>{kpis.fault}</div>
          <div className="kpi-delta down"><DIcon name="fault" size={14}/> {kpis.criticalFaults} critiques</div>
          <div className="kpi-bar" style={{ background: "linear-gradient(90deg, var(--critical), var(--warning))" }}/>
        </div>
        <div className="kpi featured">
          <div className="kpi-label">{t.dashboard.kpiActive}</div>
          <div className="kpi-value tabular">{kpis.inProgressInt}</div>
          <div className="kpi-delta"><DIcon name="wrench" size={14}/> {kpis.plannedInt} planifiées</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>{t.dashboard.activity}</h3>
              <div className="sub">{t.dashboard.activitySub}</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--brand-bright)" }}/> Interventions
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--critical)" }}/> Pannes
              </span>
            </div>
          </div>
          <div className="card-pad">
            <BarChart data={trend}/>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>{t.dashboard.faultBreakdown}</h3>
              <div className="sub">Total {state.faults.length} pannes</div>
            </div>
          </div>
          <div className="card-pad">
            <Donut data={breakdown}/>
          </div>
        </div>
      </div>

      {/* Critical alerts + upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3 style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--critical)", boxShadow: "0 0 10px var(--critical)" }}/>
                {t.dashboard.criticalAlerts}
              </h3>
              <div className="sub">{criticalAlerts.length} en cours</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => goRoute("faults")}>
              {t.common.view} <DIcon name="arrowRight" size={12}/>
            </button>
          </div>
          {criticalAlerts.length === 0 ? <div className="empty">Aucune alerte critique 🎉</div> :
            criticalAlerts.slice(0,4).map(f => {
              const m = window.MFData.machineById(state, f.machineId);
              return (
                <div key={f.id} style={{ display: "flex", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ width: 4, alignSelf: "stretch", background: "var(--critical)", borderRadius: 2 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.id}</span>
                      <a onClick={() => goMachine(f.machineId)} style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{m?.name || f.machineId}</a>
                      <DSeverityPill severity={f.severity} t={t}/>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.description}
                    </div>
                  </div>
                  <DStatusPill status={f.status} t={t}/>
                </div>
              );
            })
          }
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>{t.dashboard.upcoming}</h3>
              <div className="sub">{upcoming.length} à venir</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => goRoute("interventions")}>
              {t.common.view} <DIcon name="arrowRight" size={12}/>
            </button>
          </div>
          {upcoming.map(i => {
            const m = window.MFData.machineById(state, i.machineId);
            const date = new Date(i.scheduledFor);
            return (
              <div key={i.id} style={{ display: "flex", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 38 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{date.toLocaleString("default", { month: "short" })}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <a onClick={() => goMachine(i.machineId)} style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{m?.name || i.machineId}</a>
                    <DPill tone={i.kind === "préventive" ? "info" : "warn"}>{t.interventions.kinds[i.kind]}</DPill>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {i.technician} · {i.duration}h · <span className="mono">{i.id}</span>
                  </div>
                </div>
                <DStatusPill status={i.status} t={t}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div className="card">
        <div className="card-h">
          <div>
            <h3>{t.dashboard.recent}</h3>
            <div className="sub">6 derniers événements</div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => goRoute("history")}>
            {t.common.view} <DIcon name="arrowRight" size={12}/>
          </button>
        </div>
        <div className="card-pad">
          <div className="timeline">
            {recent.map((it, idx) => {
              const m = window.MFData.machineById(state, it.machineId);
              const cls = it.severity === "critical" ? "crit" : it.severity === "medium" ? "warn" : "ok";
              return (
                <div key={idx} className={"tl-item " + cls}>
                  <div className="tl-time">{new Date(it.timestamp).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {it.meta}</div>
                  <div className="tl-title">{it.title}</div>
                  <div className="tl-meta">
                    <a onClick={() => goMachine(it.machineId)} style={{ color: "var(--brand-deep)", fontWeight: 600, cursor: "pointer" }}>{m?.name}</a> — {it.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bar chart (SVG) ────────────────────────────────────────────────────────
function BarChart({ data }) {
  const W = 700, H = 200, P = { top: 20, right: 10, bottom: 28, left: 30 };
  const cw = W - P.left - P.right;
  const ch = H - P.top - P.bottom;
  const max = Math.max(4, ...data.map(d => Math.max(d.interventions, d.faults)));
  const barW = cw / data.length * 0.4;
  const groupW = cw / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="xMidYMid meet">
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1={P.left} y1={P.top + ch * p} x2={W - P.right} y2={P.top + ch * p} stroke="var(--border)" strokeWidth="1" strokeDasharray={p === 1 ? "0" : "2 3"}/>
      ))}
      {/* y-labels */}
      {[0, 0.5, 1].map((p, i) => (
        <text key={i} x={P.left - 6} y={P.top + ch * (1-p) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{Math.round(max * p)}</text>
      ))}
      {data.map((d, i) => {
        const x = P.left + groupW * i + groupW / 2;
        const hI = (d.interventions / max) * ch;
        const hF = (d.faults / max) * ch;
        return (
          <g key={i}>
            <rect x={x - barW - 1} y={P.top + ch - hI} width={barW} height={hI} fill="var(--brand-bright)" rx="2"/>
            <rect x={x + 1} y={P.top + ch - hF} width={barW} height={hF} fill="var(--critical)" rx="2" opacity="0.85"/>
            <text x={x} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut / Pie ────────────────────────────────────────────────────────────
function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ["var(--brand)", "var(--info)", "var(--warning)", "var(--critical)", "#7C3AED", "#0E1410"];
  let angle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const a0 = angle;
    const a1 = angle + (d.count / total) * Math.PI * 2;
    angle = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const cx = 80, cy = 80, ro = 70, ri = 44;
    const x0o = cx + Math.cos(a0) * ro, y0o = cy + Math.sin(a0) * ro;
    const x1o = cx + Math.cos(a1) * ro, y1o = cy + Math.sin(a1) * ro;
    const x0i = cx + Math.cos(a0) * ri, y0i = cy + Math.sin(a0) * ri;
    const x1i = cx + Math.cos(a1) * ri, y1i = cy + Math.sin(a1) * ri;
    const path = `M${x0o},${y0o} A${ro},${ro} 0 ${large} 1 ${x1o},${y1o} L${x1i},${y1i} A${ri},${ri} 0 ${large} 0 ${x0i},${y0i} Z`;
    return { path, color: colors[i % colors.length], ...d };
  });
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <svg viewBox="0 0 160 160" width="160" height="160" style={{ flex: "0 0 160px" }}>
        {segments.map((s, i) => <path key={i} d={s.path} fill={s.color}/>)}
        <circle cx="80" cy="80" r="40" fill="var(--surface)"/>
        <text x="80" y="78" textAnchor="middle" fontSize="11" fill="var(--text-muted)">Total</text>
        <text x="80" y="96" textAnchor="middle" fontFamily="var(--font-display)" fontSize="22" fontWeight="700" fill="var(--text)">{total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }}/>
            <span style={{ flex: 1, textTransform: "capitalize" }}>{s.type}</span>
            <b className="tabular">{s.count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score de santé global — jauge circulaire animée ────────────────────────
function MiniMetric({ v, l, c }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: c || "var(--text)", lineHeight: 1 }} className="tabular">{v}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>{l}</div>
    </div>
  );
}

function HealthBand({ score, kpis, mttr }) {
  const [anim, setAnim] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setAnim(true)); return () => cancelAnimationFrame(id); }, []);
  const color = score >= 80 ? "var(--brand)" : score >= 55 ? "var(--warning)" : "var(--critical)";
  const label = score >= 80 ? "Atelier sain" : score >= 55 ? "Vigilance requise" : "État critique";
  const R = 54, CIRC = 2 * Math.PI * R;
  const off = anim ? CIRC * (1 - score / 100) : CIRC;
  return (
    <div className="card" style={{ padding: 22, display: "flex", gap: 24, alignItems: "center" }}>
      <div style={{ position: "relative", width: 144, height: 144, flexShrink: 0 }}>
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="13"/>
          <circle cx="72" cy="72" r={R} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={off} transform="rotate(-90 72 72)"
            style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)" }}/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color, lineHeight: 1 }} className="tabular">{score}</div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginTop: 2 }}>/ 100</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color }}>Score de santé global</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>Calculé en temps réel sur {kpis.total} machines, pondéré par leur criticité.</div>
        <div style={{ display: "flex", gap: 22, marginTop: 18, flexWrap: "wrap" }}>
          <MiniMetric v={kpis.ok} l="En service" c="var(--ok)"/>
          <MiniMetric v={kpis.maint} l="Maintenance" c="var(--warning)"/>
          <MiniMetric v={kpis.fault} l="En panne" c="var(--critical)"/>
          <MiniMetric v={mttr ? mttr + " h" : "—"} l="MTTR moyen"/>
        </div>
      </div>
    </div>
  );
}

// ─── Widget météo de maintenance ────────────────────────────────────────────
function MaintenanceWeather({ state, kpis, goRoute }) {
  const today = "2026-05-21";
  const todays = state.interventions.filter(i => i.scheduledFor === today && i.status !== "completed").length;
  const unresolved = kpis.activeFaults;
  const techAvail = state.technicians.filter(tt => tt.available).length;
  // Condition météo dérivée de l'état du parc
  const cond = kpis.criticalFaults > 0 ? { k: "Orageux", icon: "bolt", desc: "Pannes critiques en cours" }
    : kpis.activeFaults > 2 ? { k: "Nuageux", icon: "drop", desc: "Activité soutenue" }
    : { k: "Dégagé", icon: "sun", desc: "Parc stable" };
  return (
    <div className="card weather-card">
      <div className="weather-head">
        <div>
          <div className="weather-eyebrow">Météo de maintenance</div>
          <div className="weather-date">Jeudi 21 mai · Sem. 21</div>
        </div>
        <div className="weather-glyph"><DIcon name={cond.icon} size={26}/></div>
      </div>
      <div className="weather-cond">
        <div className="weather-cond-k">{cond.k}</div>
        <div className="weather-cond-d">{cond.desc}</div>
      </div>
      <div className="weather-stats">
        <button className="weather-stat" onClick={() => goRoute("interventions")}>
          <div className="ws-v tabular">{todays}</div>
          <div className="ws-l">Interventions<br/>prévues</div>
        </button>
        <button className="weather-stat" onClick={() => goRoute("faults")}>
          <div className="ws-v tabular" style={{ color: unresolved > 0 ? "#FF7A7A" : undefined }}>{unresolved}</div>
          <div className="ws-l">Pannes non<br/>résolues</div>
        </button>
        <button className="weather-stat" onClick={() => goRoute("technicians")}>
          <div className="ws-v tabular" style={{ color: "var(--brand-bright)" }}>{techAvail}</div>
          <div className="ws-l">Techniciens<br/>disponibles</div>
        </button>
      </div>
    </div>
  );
}

// ─── Carte thermique de l'atelier ───────────────────────────────────────────
function WorkshopHeatmap({ state, goMachine }) {
  const workshops = [...new Set(state.machines.map(m => m.workshop))];
  const fill = { ok: "var(--brand)", maintenance: "var(--warning)", fault: "var(--critical)" };
  const labelFor = { ok: "Opérationnel", maintenance: "Maintenance", fault: "En panne" };
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Carte thermique de l'atelier</h3>
          <div className="sub">Vue d'ensemble en un coup d'œil — cliquez une machine</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "var(--text-muted)" }}>
          {["ok", "maintenance", "fault"].map(s => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: fill[s] }}/>{labelFor[s]}
            </span>
          ))}
        </div>
      </div>
      <div className="card-pad">
        <div className="heatmap">
          {workshops.map(w => {
            const ms = state.machines.filter(m => m.workshop === w);
            return (
              <div key={w} className="heat-zone">
                <div className="heat-zone-h">
                  <span>{w}</span>
                  <span className="heat-zone-n">{ms.length}</span>
                </div>
                <div className="heat-tiles">
                  {ms.map(m => (
                    <button key={m.id} className="heat-tile" onClick={() => goMachine(m.id)}
                      style={{ background: fill[m.state], boxShadow: m.state === "fault" ? "0 0 0 2px rgba(220,38,38,0.25)" : "none" }}
                      title={`${m.id} — ${m.name} · ${labelFor[m.state]}`}>
                      <span className="heat-tile-id">{m.id.replace("MCH-", "")}</span>
                      {m.criticality === "high" && <span className="heat-tile-crit"/>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Prédiction de pannes + Top 5 machines ──────────────────────────────────
function PredictionsCard({ preds, goMachine, topMach }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="card-h">
        <div>
          <h3 style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warning)", boxShadow: "0 0 8px var(--warning)" }}/>
            Prédiction de pannes
          </h3>
          <div className="sub">Analyse de fréquence & MTBF</div>
        </div>
      </div>
      <div>
        {preds.length === 0 && <div className="empty">Aucun risque détecté à court terme 🎉</div>}
        {preds.map(p => (
          <div key={p.machine.id} className="pred-row" onClick={() => goMachine(p.machine.id)}>
            <div className={"pred-eta pred-" + p.risk}>
              <div className="pred-eta-v tabular">~{p.eta}</div>
              <div className="pred-eta-u">jours</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.machine.id}</span>
                <DPill tone={p.risk === "high" ? "crit" : p.risk === "medium" ? "warn" : "info"}>{p.faults} pannes</DPill>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.machine.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Risque de défaillance estimé</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "12px 20px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Top machines les plus en panne</div>
        {topMach.slice(0, 4).map(x => {
          const max = topMach[0]?.count || 1;
          return (
            <div key={x.machine.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", width: 56, flexShrink: 0 }}>{x.machine.id}</span>
              <div style={{ flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(x.count / max) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--critical), var(--warning))", borderRadius: 4 }}/>
              </div>
              <span className="tabular" style={{ fontSize: 12, fontWeight: 700, width: 16, textAlign: "right" }}>{x.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.MFDashboard = { Dashboard };
