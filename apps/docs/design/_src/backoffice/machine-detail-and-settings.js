// detail-settings.jsx — MachineDetail + Settings + Mobile preview screens

const { useState: useDS, useMemo: useDM } = React;
const { Icon: XIcon, Logo: XLogo } = window.MFIcons;
const { Pill: XPill, StatePill: XStatePill, SeverityPill: XSev, StatusPill: XStatus } = window.MFShell;
const { fmtDate: xFmtDate, fmtDateTime: xFmtDT } = window.MFScreens;

// ═══════════════════════════════════════════════════════════════════════════
// MACHINE DETAIL
// ═══════════════════════════════════════════════════════════════════════════
function MachineDetail({ machineId, state, setState, t, toast, goBack }) {
  const m = state.machines.find(x => x.id === machineId);
  const [tab, setTab] = useDS("infos");
  if (!m) return <div className="empty">Machine introuvable</div>;

  const faults = state.faults.filter(f => f.machineId === machineId).sort((a,b)=>b.reportedAt.localeCompare(a.reportedAt));
  const interventions = state.interventions.filter(i => i.machineId === machineId).sort((a,b)=>b.scheduledFor.localeCompare(a.scheduledFor));
  const history = window.MFData.history(state).filter(h => h.machineId === machineId);
  const activeFaults = faults.filter(f => f.status !== "resolved").length;
  const mtbf = window.MFData.machineMTBF(state, machineId);
  const avail = window.MFData.availability(state, machineId);
  const installed = new Date(m.installedAt);
  const ageYears = (window.MFData.now() - installed) / (365.25 * 86400000);
  const lifeSpan = m.lifespanYears || 15;
  const lifePct = Math.min(1, ageYears / lifeSpan);
  const remaining = Math.max(0, lifeSpan - ageYears);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={goBack}>
          <XIcon name="chevronLeft" size={14}/> {t.common.back}
        </button>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.id}</span>
      </div>

      <div className="detail-grid">
        {/* LEFT — machine card */}
        <div>
          <div className="card">
            <div className="card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>{m.name}</h2>
                  <div style={{ marginTop: 4 }}><XStatePill state={m.state} t={t}/></div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                <DetailRow label={t.detail.meta.type} value={<span style={{ textTransform: "capitalize" }}>{m.type}</span>}/>
                <DetailRow label={t.detail.meta.workshop} value={m.workshop}/>
                <DetailRow label={t.detail.meta.installed} value={xFmtDate(m.installedAt)}/>
                <DetailRow label={t.detail.meta.runtime} value={<span className="tabular">{m.runtime.toLocaleString()} h</span>}/>
                <DetailRow label={t.detail.meta.criticality} value={
                  <XPill tone={m.criticality === "high" ? "crit" : m.criticality === "medium" ? "warn" : "ok"}>
                    {m.criticality === "high" ? "Élevée" : m.criticality === "medium" ? "Moyenne" : "Faible"}
                  </XPill>
                }/>
              </div>

              {/* Compteur de durée de vie */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Durée de vie</span>
                  <span className="tabular" style={{ fontWeight: 600 }}>{Math.floor(ageYears * 10) / 10} / {lifeSpan} ans</span>
                </div>
                <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${lifePct * 100}%`, height: "100%", borderRadius: 4, background: lifePct > 0.85 ? "var(--critical)" : lifePct > 0.6 ? "var(--warning)" : "var(--brand)" }}/>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>~{Math.round(remaining)} ans restants estimés · en service depuis {Math.floor(ageYears)} ans</div>
              </div>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div className="qr-block">
                    <QRPlaceholder code={m.id}/>
                    <div className="code">{m.id}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>{t.detail.qr}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {t.detail.scan}. Permet à un technicien d'ouvrir la fiche, déclarer une panne ou enregistrer une intervention depuis l'atelier.
                    </div>
                    <button className="btn btn-sm" style={{ marginTop: 10 }}>
                      <XIcon name="download" size={12}/> Imprimer étiquette
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-pad">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <MiniStat label="Pannes" value={faults.length} accent={faults.length > 0 ? "var(--critical)" : "var(--text)"}/>
                <MiniStat label="Actives" value={activeFaults} accent={activeFaults > 0 ? "var(--warning)" : "var(--ok)"}/>
                <MiniStat label="Interventions" value={interventions.length}/>
                <MiniStat label="MTBF" value={mtbf ? mtbf + " j" : "—"} sub="entre pannes"/>
                <MiniStat label="Dispo." value={avail + "%"} accent="var(--brand)"/>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — tabs */}
        <div>
          <div className="section-tabs">
            {[
              { k: "infos", label: t.detail.infos, icon: "info" },
              { k: "faults", label: `${t.detail.faults} (${faults.length})`, icon: "fault" },
              { k: "interventions", label: `${t.detail.interventions} (${interventions.length})`, icon: "wrench" },
              { k: "history", label: t.detail.history, icon: "history" },
            ].map(it => (
              <button key={it.k} className={"section-tab " + (tab === it.k ? "on" : "")} onClick={() => setTab(it.k)}>
                {it.label}
              </button>
            ))}
          </div>

          {tab === "infos" && <InfoTab m={m}/>}
          {tab === "faults" && <FaultsTab faults={faults} t={t}/>}
          {tab === "interventions" && <InterventionsTab interventions={interventions} t={t}/>}
          {tab === "history" && <HistoryTab history={history} t={t}/>}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px dashed var(--border)" }}>
      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, sub, accent }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: accent || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</div>}
    </div>
  );
}

function InfoTab({ m }) {
  return (
    <div className="card">
      <div className="card-pad">
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 15 }}>Informations techniques</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <InfoField label="Code constructeur" value={m.id}/>
          <InfoField label="Numéro de série" value={`SN-${m.id.replace("MCH-", "")}-${m.installedAt?.slice(0,4)}A`} mono/>
          <InfoField label="Fournisseur" value={m.type === "compresseur" ? "Atlas Copco" : m.type === "robot" ? "FANUC France" : m.type === "machine-outil" ? "Mazak Europe" : "—"}/>
          <InfoField label="Contrat de maintenance" value="Actif — Niveau 2"/>
          <InfoField label="Dernière révision" value={xFmtDate("2026-04-12")}/>
          <InfoField label="Prochaine révision" value={xFmtDate("2026-07-12")}/>
        </div>
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Disponibilité (30 derniers jours)</div>
          <Sparkline/>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value}</div>
    </div>
  );
}

function Sparkline() {
  // Random-ish reproducible series for availability %
  const pts = [98, 97, 99, 100, 100, 96, 92, 94, 98, 100, 100, 99, 95, 90, 88, 92, 96, 98, 100, 100, 99, 97, 100, 100, 95, 86, 90, 94, 98, 100];
  const W = 700, H = 60;
  const max = 100, min = 80;
  const step = W / (pts.length - 1);
  const ys = pts.map(p => H - ((p - min) / (max - min)) * H);
  const path = ys.map((y, i) => `${i === 0 ? "M" : "L"}${i * step},${y}`).join(" ");
  const fill = path + ` L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" preserveAspectRatio="none" style={{ height: 70 }}>
      <defs>
        <linearGradient id="sparkgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-bright)" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="var(--brand-bright)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sparkgrad)"/>
      <path d={path} stroke="var(--brand)" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function FaultsTab({ faults, t }) {
  if (faults.length === 0) return <div className="card card-pad empty">Aucune panne enregistrée</div>;
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr><th>Réf.</th><th>Type</th><th>Description</th><th>Gravité</th><th>Date</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {faults.map(f => (
            <tr key={f.id}>
              <td className="cell-id">{f.id}</td>
              <td style={{ textTransform: "capitalize" }}>{f.type}</td>
              <td style={{ maxWidth: 320 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.description}</div></td>
              <td><XSev severity={f.severity} t={t}/></td>
              <td className="cell-sub">{xFmtDT(f.reportedAt)}</td>
              <td><XStatus status={f.status} t={t}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterventionsTab({ interventions, t }) {
  if (interventions.length === 0) return <div className="card card-pad empty">Aucune intervention</div>;
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr><th>Réf.</th><th>Technicien</th><th>Type</th><th>Description</th><th>Date</th><th>Durée</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {interventions.map(i => (
            <tr key={i.id}>
              <td className="cell-id">{i.id}</td>
              <td>{i.technician}</td>
              <td><XPill tone={i.kind === "préventive" ? "info" : "warn"}>{t.interventions.kinds[i.kind]}</XPill></td>
              <td style={{ maxWidth: 280 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.description}</div></td>
              <td className="cell-sub">{xFmtDate(i.scheduledFor)}</td>
              <td className="cell-sub tabular">{i.duration} h</td>
              <td><XStatus status={i.status} t={t}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ history, t }) {
  if (history.length === 0) return <div className="card card-pad empty">Aucun événement</div>;
  return (
    <div className="card card-pad">
      <div className="timeline">
        {history.map((it, idx) => {
          const cls = it.severity === "critical" ? "crit" : it.severity === "medium" ? "warn" : "ok";
          return (
            <div key={idx} className={"tl-item " + cls}>
              <div className="tl-time">{xFmtDT(it.timestamp)} · {it.meta}</div>
              <div className="tl-title">{it.title}</div>
              <div className="tl-meta">{it.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QRPlaceholder({ code }) {
  // Generate a pseudo-QR look from a hash of the code
  const grid = 12;
  const cells = [];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) | 0;
  const rng = (i) => {
    hash = (hash * 1103515245 + i * 12345 + 31) | 0;
    return Math.abs(hash) % 100;
  };
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const inFinder = (x < 3 && y < 3) || (x >= grid - 3 && y < 3) || (x < 3 && y >= grid - 3);
      if (inFinder) continue;
      const fill = rng(y * grid + x) > 50;
      if (fill) cells.push({ x, y });
    }
  }
  const cellSize = 116 / grid;
  return (
    <svg viewBox="0 0 116 116" width="116" height="116">
      {/* Finders */}
      {[[0,0],[grid-3,0],[0,grid-3]].map(([fx, fy], i) => (
        <g key={i} transform={`translate(${fx*cellSize}, ${fy*cellSize})`}>
          <rect width={cellSize*3} height={cellSize*3} fill="#0E1410"/>
          <rect x={cellSize*0.5} y={cellSize*0.5} width={cellSize*2} height={cellSize*2} fill="#fff"/>
          <rect x={cellSize} y={cellSize} width={cellSize} height={cellSize} fill="#0E1410"/>
        </g>
      ))}
      {cells.map((c, i) => <rect key={i} x={c.x*cellSize} y={c.y*cellSize} width={cellSize} height={cellSize} fill="#0E1410"/>)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function SettingsScreen({ state, setState, t, toast, logoVariant, setLogoVariant }) {
  const [confirmReset, setConfirmReset] = useDS(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `maintflow-data-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export JSON téléchargé");
  };
  const exportCsv = () => {
    const rows = [["ID","Nom","Type","Atelier","Installation","État","Heures"]];
    state.machines.forEach(m => rows.push([m.id, m.name, m.type, m.workshop, m.installedAt, m.state, m.runtime]));
    const csv = rows.map(r => r.map(c => `"${(String(c) || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `maintflow-machines.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export CSV téléchargé");
  };
  const resetData = () => {
    setState(window.MFData.reset());
    toast("Données réinitialisées");
  };

  return (
    <div>
      {/* Data + Export */}
      <div className="card">
        <div className="card-h"><div><h3>{t.settings.sections.data} & {t.settings.sections.export}</h3><div className="sub">Sauvegarde et export des données de maintenance</div></div></div>
        <div className="card-pad">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <button className="btn" onClick={exportJson} style={{ justifyContent: "flex-start", padding: 14 }}>
              <XIcon name="file" size={16}/>
              <div style={{ textAlign: "left" }}>
                <div>{t.settings.exportJson}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Backup complet</div>
              </div>
            </button>
            <button className="btn" onClick={exportCsv} style={{ justifyContent: "flex-start", padding: 14 }}>
              <XIcon name="file" size={16}/>
              <div style={{ textAlign: "left" }}>
                <div>{t.settings.exportCsv}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Compatible Excel</div>
              </div>
            </button>
            <button className="btn" onClick={() => window.print()} style={{ justifyContent: "flex-start", padding: 14 }}>
              <XIcon name="download" size={16}/>
              <div style={{ textAlign: "left" }}>
                <div>{t.settings.exportPdf}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Aperçu navigateur</div>
              </div>
            </button>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "var(--bg-soft)", border: "1px dashed var(--border-strong)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.settings.resetData}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Revenir aux 12 machines d'exemple, 8 pannes et 12 interventions.</div>
            </div>
            <button className="btn" style={{ color: "var(--critical)" }} onClick={() => setConfirmReset(true)}>
              <XIcon name="refresh" size={14}/> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <window.MFScreens.ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)}
        onConfirm={resetData} danger title="Réinitialiser les données ?" body={t.settings.resetConfirm}/>
    </div>
  );
}

function Swatch({ color, name, code, textColor, border }) {
  return (
    <div style={{ background: color, color: textColor, padding: "14px 16px", borderRadius: 10, minWidth: 132, border: border ? "1px solid var(--border)" : "none" }}>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.8 }}>{code}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE FIELD MODE PREVIEW
// ═══════════════════════════════════════════════════════════════════════════
function MobileScreen({ state, t, goDetail }) {
  const [view, setView] = useDS("home");
  const criticalFaults = state.faults.filter(f => f.severity === "critical" && f.status !== "resolved");
  const myInterventions = state.interventions.filter(i => i.technician === "L. Moreau" && i.status !== "completed").slice(0, 4);

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 18, background: "linear-gradient(135deg, var(--brand-deep), #1a2a1f)", color: "#fff", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <XIcon name="mobile" size={32}/>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 16 }}>Mode terrain — Application technicien</h3>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Interface mobile dédiée aux techniciens sur site : scan QR, consultation, déclaration de panne, suivi des interventions.
            </div>
          </div>
          <a className="btn btn-bright">
            <XIcon name="qr" size={14}/> Scanner QR
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
        <div className="mobile-preview">
          <div className="mobile-screen">
            <MobileHome criticalFaults={criticalFaults} myInterventions={myInterventions} state={state} t={t} goDetail={goDetail}/>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Accueil terrain</div>
        </div>
        <div className="mobile-preview">
          <div className="mobile-screen">
            <MobileScan/>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Scan QR machine</div>
        </div>
        <div className="mobile-preview">
          <div className="mobile-screen">
            <MobileDeclare state={state} t={t}/>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Déclarer une panne</div>
        </div>
      </div>
    </div>
  );
}

function MobileHome({ criticalFaults, myInterventions, state, t, goDetail }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontSize: 13 }}>
      <div style={{ padding: "14px 16px", background: "var(--brand-deep)", color: "#fff" }}>
        <div style={{ fontSize: 11, opacity: 0.75 }}>21 mai 2026 · Jeudi</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>Bonjour Laurent</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{myInterventions.length} interventions vous attendent</div>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
        <button style={{ flex: 1, background: "#00FF00", color: "#0A3D1F", border: 0, borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <XIcon name="qr" size={18}/>
          Scanner
        </button>
        <button style={{ flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <XIcon name="fault" size={18}/>
          Panne
        </button>
        <button style={{ flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 0", fontWeight: 600, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <XIcon name="wrench" size={18}/>
          Intervenir
        </button>
      </div>
      <div style={{ padding: "0 14px", flex: 1, overflowY: "auto" }}>
        {criticalFaults.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--critical)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8, marginBottom: 6 }}>⚠ Alertes critiques</div>
            {criticalFaults.slice(0,2).map(f => {
              const m = window.MFData.machineById(state, f.machineId);
              return (
                <div key={f.id} style={{ background: "var(--surface)", border: "1px solid var(--critical)", borderLeft: "3px solid var(--critical)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono">{f.id}</div>
                  <div style={{ fontWeight: 600, fontSize: 12.5, margin: "2px 0" }}>{m?.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {f.description}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 12, marginBottom: 6 }}>Vos interventions</div>
        {myInterventions.map(i => {
          const m = window.MFData.machineById(state, i.machineId);
          return (
            <div key={i.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 4, alignSelf: "stretch", background: i.kind === "préventive" ? "var(--info)" : "var(--warning)", borderRadius: 2 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m?.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{xFmtDate(i.scheduledFor)} · {i.duration}h · {t.interventions.kinds[i.kind]}</div>
              </div>
              <XIcon name="chevronRight" size={14} style={{ color: "var(--text-muted)" }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid var(--border)", padding: "8px 0", background: "var(--surface)" }}>
        {["dashboard", "machine", "wrench", "user"].map((ic, i) => (
          <div key={ic} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: i === 0 ? "var(--brand)" : "var(--text-muted)", fontSize: 9, fontWeight: 600 }}>
            <XIcon name={ic} size={18}/>
            {["Accueil", "Machines", "Interventions", "Profil"][i]}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileScan() {
  return (
    <div style={{ height: "100%", background: "#0E1410", color: "#fff", display: "flex", flexDirection: "column", fontSize: 13 }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={{ background: "transparent", border: 0, color: "#fff" }}>
          <XIcon name="chevronLeft" size={20}/>
        </button>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Scanner QR</div>
        <div style={{ width: 20 }}/>
      </div>
      <div style={{ flex: 1, position: "relative", margin: "0 16px", background: "#000", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* faux camera grid */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, #1a2a1f 0%, #000 70%)" }}/>
        {/* Scanner frame */}
        <div style={{ position: "relative", width: 200, height: 200 }}>
          {["top-left","top-right","bottom-left","bottom-right"].map((pos, i) => (
            <span key={pos} style={{
              position: "absolute",
              width: 28, height: 28,
              borderColor: "#00FF00",
              borderStyle: "solid",
              borderWidth: pos.includes("top") ? "3px 0 0" : "0 0 3px",
              borderLeftWidth: pos.includes("left") ? "3px" : 0,
              borderRightWidth: pos.includes("right") ? "3px" : 0,
              top: pos.includes("top") ? 0 : "auto",
              bottom: pos.includes("bottom") ? 0 : "auto",
              left: pos.includes("left") ? 0 : "auto",
              right: pos.includes("right") ? 0 : "auto",
            }}/>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#00FF00", boxShadow: "0 0 12px #00FF00", top: "50%" }}/>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontSize: 11, opacity: 0.7 }}>
          Placez le QR de la machine dans le cadre
        </div>
      </div>
      <div style={{ padding: "16px", fontSize: 12 }}>
        <button style={{ width: "100%", background: "#00FF00", color: "#0A3D1F", border: 0, borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 13 }}>
          Saisir manuellement
        </button>
      </div>
    </div>
  );
}

function MobileDeclare({ state, t }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontSize: 13 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <button style={{ background: "transparent", border: 0 }}><XIcon name="chevronLeft" size={18}/></button>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Déclarer une panne</div>
      </div>
      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        <div style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)", borderRadius: 8, padding: 10, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--brand-deep)" }}>MCH-002 — Convoyeur Ligne 2</div>
            <div style={{ fontSize: 11, color: "var(--brand-deep)", opacity: 0.7 }}>Atelier A · Scanné via QR</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Type de panne</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["mécanique","électrique","hydraulique","autre"].map((x, i) => (
              <div key={x} style={{ padding: "10px", borderRadius: 8, fontWeight: 600, fontSize: 11.5, textAlign: "center",
                background: i === 0 ? "var(--brand-deep)" : "var(--surface)",
                color: i === 0 ? "#fff" : "var(--text)",
                border: i === 0 ? "1px solid var(--brand-deep)" : "1px solid var(--border)"
              }}>
                {x}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Gravité</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ flex: 1, textAlign: "center", padding: 9, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11.5, fontWeight: 600 }}>Faible</span>
            <span style={{ flex: 1, textAlign: "center", padding: 9, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11.5, fontWeight: 600 }}>Moyen</span>
            <span style={{ flex: 1, textAlign: "center", padding: 9, borderRadius: 8, background: "#FEE2E2", border: "1px solid var(--critical)", color: "var(--critical)", fontSize: 11.5, fontWeight: 700 }}>Critique</span>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Description</div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontSize: 11.5, color: "var(--text-muted)", minHeight: 60, lineHeight: 1.5 }}>
            Roulement palier moteur en surchauffe, vibrations anormales...
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button style={{ flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 9, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <XIcon name="file" size={12}/> Photo
          </button>
          <button style={{ flex: 1, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 9, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <XIcon name="bolt" size={12}/> Voix
          </button>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
        <button style={{ width: "100%", background: "#00FF00", color: "#0A3D1F", border: 0, borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 13 }}>
          Envoyer la panne
        </button>
      </div>
    </div>
  );
}

window.MFDetail = { MachineDetail, SettingsScreen, MobileScreen };
