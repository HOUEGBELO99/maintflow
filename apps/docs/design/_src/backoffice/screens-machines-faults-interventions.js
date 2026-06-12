// screens.jsx — Machines, Faults, Interventions, History, MachineDetail
const { useState: useS, useMemo: useM, useEffect: useE } = React;
const { Icon: SIcon } = window.MFIcons;
const { Modal: SModal, Pill: SPill, StatePill: SStatePill, SeverityPill: SSeverityPill, StatusPill: SStatusPill } = window.MFShell;

// ─── Helpers ────────────────────────────────────────────────────────────────
function nextId(prefix, items) {
  const nums = items.map(x => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
  return prefix + String(Math.max(0, ...nums) + 1).padStart(prefix === "MCH-" ? 3 : 4, "0");
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "2-digit" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

// ─── Live downtime chronometer ──────────────────────────────────────────────
function fmtDowntime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}
function FaultChrono({ fault, compact }) {
  const base = window.MFData.now() - new Date(fault.reportedAt);
  const [extra, setExtra] = useS(0);
  useE(() => {
    if (fault.status === "resolved") return;
    const t0 = Date.now();
    const id = setInterval(() => setExtra(Date.now() - t0), 1000);
    return () => clearInterval(id);
  }, [fault.status]);
  if (fault.status === "resolved") return <span className="cell-sub">—</span>;
  const ms = base + extra;
  return (
    <span className="mono" style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: "var(--critical)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
      {fmtDowntime(ms)}
    </span>
  );
}

// ─── Confirm dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, body, danger }) {
  return (
    <SModal open={open} onClose={onClose} title={title} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className={"btn " + (danger ? "btn-danger" : "btn-primary")} style={danger ? { background: "var(--critical)", color: "#fff", borderColor: "var(--critical)" } : {}} onClick={() => { onConfirm(); onClose(); }}>
          Confirmer
        </button>
      </>
    }>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>{body}</p>
    </SModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MACHINES
// ═══════════════════════════════════════════════════════════════════════════
function MachinesScreen({ state, setState, t, toast, goDetail }) {
  const [filter, setFilter] = useS("all");
  const [workshop, setWorkshop] = useS("all");
  const [query, setQuery] = useS("");
  const [editing, setEditing] = useS(null);
  const [adding, setAdding] = useS(false);
  const [confirmDel, setConfirmDel] = useS(null);

  const workshops = [...new Set(state.machines.map(m => m.workshop))];
  const filtered = state.machines.filter(m => {
    if (filter !== "all" && m.state !== filter) return false;
    if (workshop !== "all" && m.workshop !== workshop) return false;
    if (query && !(`${m.name} ${m.id} ${m.type}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const counts = {
    all: state.machines.length,
    ok: state.machines.filter(m => m.state === "ok").length,
    maintenance: state.machines.filter(m => m.state === "maintenance").length,
    fault: state.machines.filter(m => m.state === "fault").length,
  };

  const saveMachine = (m) => {
    if (editing) {
      setState(s => ({ ...s, machines: s.machines.map(x => x.id === editing.id ? { ...x, ...m } : x) }));
      toast("Machine mise à jour");
    } else {
      const id = nextId("MCH-", state.machines);
      setState(s => ({ ...s, machines: [...s.machines, { ...m, id, code: id, runtime: 0 }] }));
      toast("Machine ajoutée");
    }
    setEditing(null); setAdding(false);
  };
  const delMachine = (id) => {
    setState(s => ({ ...s, machines: s.machines.filter(m => m.id !== id) }));
    toast("Machine supprimée");
  };

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          {["all", "ok", "maintenance", "fault"].map(k => (
            <button key={k} className={"chip " + (filter === k ? "on" : "")} onClick={() => setFilter(k)}>
              {k === "all" ? t.common.all : t.state[k]}
              <span className="count">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <select className="chip" style={{ paddingRight: 26 }} value={workshop} onChange={e => setWorkshop(e.target.value)}>
          <option value="all">Tous les ateliers</option>
          {workshops.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <div className="search" style={{ flex: "0 1 240px" }}>
          <SIcon name="search" size={14}/>
          <input placeholder="Filtrer le parc…" value={query} onChange={e => setQuery(e.target.value)}/>
        </div>
        <button className="btn btn-bright" onClick={() => setAdding(true)}>
          <SIcon name="plus" size={14}/> {t.machines.addNew}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.machines.cols.id}</th>
              <th>{t.machines.cols.name}</th>
              <th>{t.machines.cols.type}</th>
              <th>{t.machines.cols.workshop}</th>
              <th>{t.machines.cols.installed}</th>
              <th>{t.machines.cols.runtime}</th>
              <th>{t.machines.cols.state}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="clickable" onClick={() => goDetail(m.id)}>
                <td className="cell-id">{m.id}</td>
                <td>
                  <div className="cell-main">{m.name}</div>
                  {m.criticality === "high" && <div className="cell-sub">⚡ Criticité élevée</div>}
                </td>
                <td style={{ textTransform: "capitalize" }}>{m.type}</td>
                <td>{m.workshop}</td>
                <td className="cell-sub">{fmtDate(m.installedAt)}</td>
                <td className="tabular cell-sub">{m.runtime.toLocaleString()} h</td>
                <td><SStatePill state={m.state} t={t}/></td>
                <td className="actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" title="Modifier" onClick={() => setEditing(m)}><SIcon name="edit" size={14}/></button>
                  <button className="icon-btn" title="Supprimer" onClick={() => setConfirmDel(m)}><SIcon name="trash" size={14}/></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="8" className="empty">{t.common.none}</td></tr>}
          </tbody>
        </table>
      </div>

      <MachineForm open={adding || !!editing} editing={editing}
        onClose={() => { setAdding(false); setEditing(null); }} onSave={saveMachine} t={t}/>
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => delMachine(confirmDel.id)} danger
        title={`Supprimer ${confirmDel?.name} ?`}
        body={t.machines.confirmDelete}/>
    </div>
  );
}

function MachineForm({ open, editing, onClose, onSave, t }) {
  const [form, setForm] = useS({});
  useE(() => {
    if (editing) setForm(editing);
    else setForm({ name: "", type: "moteur", workshop: "Atelier A", installedAt: new Date().toISOString().slice(0,10), state: "ok", criticality: "medium" });
  }, [editing, open]);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <SModal open={open} onClose={onClose} title={editing ? t.machines.editTitle : t.machines.addTitle}
      subtitle={editing ? editing.id : "Identifiant attribué automatiquement"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.name}>
            <SIcon name="check" size={14}/> {t.common.save}
          </button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Nom de la machine</label>
          <input value={form.name || ""} onChange={e => upd("name", e.target.value)} placeholder="ex: Compresseur Atlas A7"/>
        </div>
        <div className="field-row cols-2">
          <div className="field">
            <label>Type</label>
            <select value={form.type || ""} onChange={e => upd("type", e.target.value)}>
              {t.machines.types.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Atelier / Localisation</label>
            <input value={form.workshop || ""} onChange={e => upd("workshop", e.target.value)}/>
          </div>
        </div>
        <div className="field-row cols-2">
          <div className="field">
            <label>Date d'installation</label>
            <input type="date" value={form.installedAt || ""} onChange={e => upd("installedAt", e.target.value)}/>
          </div>
          <div className="field">
            <label>État initial</label>
            <select value={form.state || ""} onChange={e => upd("state", e.target.value)}>
              <option value="ok">{t.state.ok}</option>
              <option value="maintenance">{t.state.maintenance}</option>
              <option value="fault">{t.state.fault}</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Criticité</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["low", "medium", "high"].map(c => (
              <button key={c} className={"chip " + (form.criticality === c ? "on" : "")} onClick={() => upd("criticality", c)} type="button">
                {c === "low" ? "Faible" : c === "medium" ? "Moyenne" : "Élevée"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAULTS
// ═══════════════════════════════════════════════════════════════════════════
function FaultsScreen({ state, setState, t, toast, goDetail }) {
  const [filterSev, setFilterSev] = useS("all");
  const [filterStat, setFilterStat] = useS("active");
  const [editing, setEditing] = useS(null);
  const [adding, setAdding] = useS(false);
  const [confirmDel, setConfirmDel] = useS(null);

  const filtered = state.faults.filter(f => {
    if (filterSev !== "all" && f.severity !== filterSev) return false;
    if (filterStat === "active" && f.status === "resolved") return false;
    if (filterStat === "resolved" && f.status !== "resolved") return false;
    return true;
  }).sort((a,b) => b.reportedAt.localeCompare(a.reportedAt));

  const counts = {
    active: state.faults.filter(f => f.status !== "resolved").length,
    resolved: state.faults.filter(f => f.status === "resolved").length,
    critical: state.faults.filter(f => f.severity === "critical" && f.status !== "resolved").length,
  };

  const activeFaults = state.faults.filter(f => f.status !== "resolved");
  const escalatedN = state.faults.filter(f => window.MFData.isEscalated(state, f)).length;

  const save = (f) => {
    if (editing) {
      setState(s => ({ ...s, faults: s.faults.map(x => x.id === editing.id ? { ...x, ...f } : x) }));
      toast("Panne mise à jour");
    } else {
      const id = nextId("F-", state.faults);
      setState(s => {
        const newFault = { ...f, id, reportedAt: new Date().toISOString(), reportedBy: "L. Moreau", status: "pending" };
        const machines = s.machines.map(m => m.id === f.machineId && f.severity === "critical" ? { ...m, state: "fault" } : m);
        return { ...s, faults: [...s.faults, newFault], machines };
      });
      toast("Panne enregistrée");
    }
    setEditing(null); setAdding(false);
  };

  const changeStatus = (fault, status) => {
    setState(s => ({
      ...s,
      faults: s.faults.map(x => x.id === fault.id ? { ...x, status } : x),
      machines: status === "resolved" ? s.machines.map(m => m.id === fault.machineId ? { ...m, state: "ok" } : m) : s.machines,
    }));
    toast(`Statut : ${t.status[status]}`);
  };

  return (
    <div>
      {/* Chronomètre & escalades — strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi-label">Pannes actives</div>
          <div className="kpi-value tabular" style={{ fontSize: 30 }}>{counts.active}</div>
          <div className="kpi-delta"><SIcon name="fault" size={13}/> {counts.critical} critiques</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Escalades</div>
          <div className="kpi-value tabular" style={{ fontSize: 30, color: escalatedN > 0 ? "var(--critical)" : "var(--text)" }}>{escalatedN}</div>
          <div className="kpi-delta">non prises en charge &gt; 2 h</div>
        </div>
        <div className="kpi featured">
          <div className="kpi-label">Pannes résolues</div>
          <div className="kpi-value tabular">{counts.resolved}</div>
          <div className="kpi-delta">historique cumulé</div>
          <div className="kpi-bar"/>
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          <button className={"chip " + (filterStat === "active" ? "on" : "")} onClick={() => setFilterStat("active")}>
            Actives <span className="count">{counts.active}</span>
          </button>
          <button className={"chip " + (filterStat === "resolved" ? "on" : "")} onClick={() => setFilterStat("resolved")}>
            Résolues <span className="count">{counts.resolved}</span>
          </button>
          <button className={"chip " + (filterStat === "all" ? "on" : "")} onClick={() => setFilterStat("all")}>
            {t.common.all}
          </button>
          <div style={{ width: 12 }}/>
          {["all", "critical", "medium", "low"].map(s => (
            <button key={s} className={"chip " + (filterSev === s ? "on" : "")} onClick={() => setFilterSev(s)}>
              {s === "all" ? "Toutes gravités" : t.severity[s]}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-bright" onClick={() => setAdding(true)}>
          <SIcon name="plus" size={14}/> {t.faults.addNew}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.faults.cols.id}</th>
              <th>{t.faults.cols.machine}</th>
              <th>{t.faults.cols.type}</th>
              <th>Description</th>
              <th>{t.faults.cols.severity}</th>
              <th>Immobilisation</th>
              <th>{t.faults.cols.reported}</th>
              <th>{t.faults.cols.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const m = window.MFData.machineById(state, f.machineId);
              return (
                <tr key={f.id}>
                  <td className="cell-id">{f.id}</td>
                  <td>
                    <a className="cell-main" style={{ cursor: "pointer" }} onClick={() => goDetail(f.machineId)}>{m?.name || f.machineId}</a>
                    <div className="cell-sub">{m?.workshop}</div>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{f.type}</td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.description}</div>
                    {f.rootCause && <div style={{ marginTop: 3 }}><span className="pill" style={{ fontSize: 10.5 }}>Cause : {f.rootCause}</span></div>}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SSeverityPill severity={f.severity} t={t}/>
                      {window.MFData.isEscalated(state, f) && <span className="badge-escalate">Escalade</span>}
                    </div>
                  </td>
                  <td>
                    {f.status !== "resolved" ? (
                      <FaultChrono fault={f}/>
                    ) : <span className="cell-sub">—</span>}
                  </td>
                  <td className="cell-sub">{fmtDateTime(f.reportedAt)}<br/><span style={{ fontSize: 11 }}>{f.reportedBy}</span></td>
                  <td>
                    <select className="pill" style={{ cursor: "pointer", border: 0 }}
                      value={f.status} onChange={e => changeStatus(f, e.target.value)}>
                      <option value="pending">{t.status.pending}</option>
                      <option value="in-progress">{t.status["in-progress"]}</option>
                      <option value="resolved">{t.status.resolved}</option>
                    </select>
                  </td>
                  <td className="actions">
                    <button className="icon-btn" title="Modifier" onClick={() => setEditing(f)}><SIcon name="edit" size={14}/></button>
                    <button className="icon-btn" title="Supprimer" onClick={() => setConfirmDel(f)}><SIcon name="trash" size={14}/></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan="8" className="empty">{t.common.none}</td></tr>}
          </tbody>
        </table>
      </div>

      <FaultForm open={adding || !!editing} editing={editing} state={state}
        onClose={() => { setAdding(false); setEditing(null); }} onSave={save} t={t}/>
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { setState(s => ({ ...s, faults: s.faults.filter(f => f.id !== confirmDel.id) })); toast("Panne supprimée"); }}
        danger title={`Supprimer ${confirmDel?.id} ?`} body="L'historique de cette panne sera perdu."/>
    </div>
  );
}

function FaultForm({ open, editing, state, onClose, onSave, t }) {
  const [form, setForm] = useS({});
  useE(() => {
    if (editing) setForm(editing);
    else setForm({ machineId: state.machines[0]?.id, type: "mécanique", description: "", severity: "medium" });
  }, [editing, open]);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <SModal open={open} onClose={onClose} title={editing ? t.faults.editTitle : t.faults.addTitle}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.description || !form.machineId}>
            <SIcon name="check" size={14}/> {t.common.save}
          </button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>{t.faults.f.machine}</label>
          <select value={form.machineId || ""} onChange={e => upd("machineId", e.target.value)}>
            {state.machines.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
          </select>
        </div>
        <div className="field-row cols-2">
          <div className="field">
            <label>{t.faults.f.type}</label>
            <select value={form.type || ""} onChange={e => upd("type", e.target.value)}>
              {t.faults.types.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t.faults.f.severity}</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["low", "medium", "critical"].map(s => (
                <button key={s} type="button" className={"chip " + (form.severity === s ? "on" : "")} onClick={() => upd("severity", s)}>
                  {t.severity[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="field">
          <label>{t.faults.f.description}</label>
          <textarea rows="4" value={form.description || ""} onChange={e => upd("description", e.target.value)} placeholder="Décrivez le problème observé…"/>
        </div>
        <div className="field">
          <label>Cause racine (analyse)</label>
          <select value={form.rootCause || ""} onChange={e => upd("rootCause", e.target.value || null)}>
            <option value="">À déterminer</option>
            {["usure", "erreur opérateur", "défaut matériau", "réglage", "autre"].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>
    </SModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERVENTIONS
// ═══════════════════════════════════════════════════════════════════════════
function InterventionsScreen({ state, setState, t, toast, goDetail }) {
  const [view, setView] = useS("list");
  const [filter, setFilter] = useS("active");
  const [editing, setEditing] = useS(null);
  const [adding, setAdding] = useS(false);
  const [confirmDel, setConfirmDel] = useS(null);
  const [sheet, setSheet] = useS(null);

  const DEFAULT_CHECKLIST = [
    { label: "Consignation & sécurité (LOTO)", done: false },
    { label: "Diagnostic / inspection", done: false },
    { label: "Réparation / remplacement pièce", done: false },
    { label: "Test de fonctionnement", done: false },
    { label: "Nettoyage & remise en service", done: false },
  ];
  const openSheet = (i) => {
    if (!i.checklist) {
      const cl = i.status === "completed" ? DEFAULT_CHECKLIST.map(c => ({ ...c, done: true })) : DEFAULT_CHECKLIST.map(c => ({ ...c }));
      setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === i.id ? { ...x, checklist: cl } : x) }));
    }
    setSheet(i.id);
  };
  const sheetItem = sheet ? state.interventions.find(i => i.id === sheet) : null;

  const filtered = state.interventions.filter(i => {
    if (filter === "active" && i.status === "completed") return false;
    if (filter === "completed" && i.status !== "completed") return false;
    if (filter === "preventive" && i.kind !== "préventive") return false;
    if (filter === "corrective" && i.kind !== "corrective") return false;
    return true;
  }).sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));

  const save = (i) => {
    if (editing) {
      setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === editing.id ? { ...x, ...i } : x) }));
      toast("Intervention mise à jour");
    } else {
      const id = nextId("I-", state.interventions);
      setState(s => ({ ...s, interventions: [...s.interventions, { ...i, id, status: "planned" }] }));
      toast("Intervention planifiée");
    }
    setEditing(null); setAdding(false);
  };
  const changeStatus = (i, status) => {
    setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === i.id ? { ...x, status } : x) }));
    toast(`Statut : ${t.status[status]}`);
  };

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          {["active", "completed", "preventive", "corrective", "all"].map(k => (
            <button key={k} className={"chip " + (filter === k ? "on" : "")} onClick={() => setFilter(k)}>
              {k === "active" ? "Actives" : k === "completed" ? "Terminées" : k === "preventive" ? "Préventives" : k === "corrective" ? "Correctives" : "Toutes"}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div className="lang-toggle">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} title="Liste">
            <SIcon name="list" size={14}/>
          </button>
          <button className={view === "cal" ? "active" : ""} onClick={() => setView("cal")} title="Calendrier">
            <SIcon name="calendar" size={14}/>
          </button>
        </div>
        <button className="btn btn-bright" onClick={() => setAdding(true)}>
          <SIcon name="plus" size={14}/> {t.interventions.addNew}
        </button>
      </div>

      {view === "list" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t.interventions.cols.id}</th>
                <th>{t.interventions.cols.machine}</th>
                <th>{t.interventions.cols.tech}</th>
                <th>{t.interventions.cols.kind}</th>
                <th>Description</th>
                <th>{t.interventions.cols.date}</th>
                <th>{t.interventions.cols.duration}</th>
                <th>{t.interventions.cols.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const m = window.MFData.machineById(state, i.machineId);
                return (
                  <tr key={i.id}>
                    <td className="cell-id">{i.id}</td>
                    <td>
                      <a className="cell-main" style={{ cursor: "pointer" }} onClick={() => goDetail(i.machineId)}>{m?.name}</a>
                      <div className="cell-sub">{m?.workshop}</div>
                    </td>
                    <td>{i.technician}</td>
                    <td><SPill tone={i.kind === "préventive" ? "info" : "warn"}>{t.interventions.kinds[i.kind]}</SPill></td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.description}</div>
                    </td>
                    <td className="cell-sub">{fmtDate(i.scheduledFor)}</td>
                    <td className="cell-sub">
                      <span className="tabular">Prévu {i.duration} h</span>
                      {i.status === "completed" && i.actualDuration != null && (
                        <div className="tabular" style={{ fontSize: 11, marginTop: 1, color: i.actualDuration > i.duration ? "var(--critical)" : "var(--ok)" }}>
                          Réel {i.actualDuration} h{i.actualDuration > i.duration ? ` (+${Math.round((i.actualDuration - i.duration) * 60)} min)` : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <select className="pill" style={{ cursor: "pointer", border: 0 }}
                        value={i.status} onChange={e => changeStatus(i, e.target.value)}>
                        <option value="planned">{t.status.planned}</option>
                        <option value="in-progress">{t.status["in-progress"]}</option>
                        <option value="completed">{t.status.completed}</option>
                      </select>
                    </td>
                    <td className="actions">
                      <button className="icon-btn" title="Bon de travail" onClick={() => openSheet(i)}><SIcon name="file" size={14}/></button>
                      <button className="icon-btn" title="Modifier" onClick={() => setEditing(i)}><SIcon name="edit" size={14}/></button>
                      <button className="icon-btn" title="Supprimer" onClick={() => setConfirmDel(i)}><SIcon name="trash" size={14}/></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan="9" className="empty">{t.common.none}</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <CalendarView interventions={filtered} state={state} t={t} onPick={(i) => setEditing(i)}/>
      )}

      <InterventionForm open={adding || !!editing} editing={editing} state={state}
        onClose={() => { setAdding(false); setEditing(null); }} onSave={save} t={t}/>
      <InterventionSheet item={sheetItem} state={state} setState={setState} t={t} toast={toast} onClose={() => setSheet(null)}/>
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { setState(s => ({ ...s, interventions: s.interventions.filter(i => i.id !== confirmDel.id) })); toast("Intervention supprimée"); }}
        danger title={`Supprimer ${confirmDel?.id} ?`} body="L'intervention sera retirée du planning."/>
    </div>
  );
}

function InterventionForm({ open, editing, state, onClose, onSave, t }) {
  const [form, setForm] = useS({});
  const [step, setStep] = useS(1);
  useE(() => {
    if (editing) { setForm(editing); setStep(2); }
    else { setForm({ machineId: state.machines[0]?.id, technician: state.technicians[0]?.name, kind: "préventive", description: "", scheduledFor: new Date("2026-05-21").toISOString().slice(0,10), duration: 2, linkedFault: null }); setStep(1); }
  }, [editing, open]);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Open faults available to attach (corrective)
  const openFaults = state.faults.filter(f => f.status !== "resolved");

  const pickFault = (f) => {
    const m = window.MFData.machineById(state, f.machineId);
    // suggest technician whose specialty matches the fault type and who is available
    const match = state.technicians.find(tt => tt.available && tt.specialties.includes(f.type))
      || state.technicians.find(tt => tt.available) || state.technicians[0];
    setForm(prev => ({
      ...prev, kind: "corrective", linkedFault: f.id, machineId: f.machineId,
      technician: prev.technician || match?.name,
      description: prev.description || `Réparation ${f.type} — ${m?.name || f.machineId}`,
    }));
    setStep(2);
  };

  const setKind = (k) => {
    upd("kind", k);
    if (k === "corrective") { upd("linkedFault", null); setStep(1); }
    else { setStep(2); }
  };

  const linkedFault = form.linkedFault ? state.faults.find(f => f.id === form.linkedFault) : null;
  const canSave = form.description && form.technician && (form.kind !== "corrective" || form.linkedFault);

  return (
    <SModal open={open} onClose={onClose} title={editing ? t.interventions.editTitle : t.interventions.addTitle} wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
          {!editing && form.kind === "corrective" && step === 2 && (
            <button className="btn" onClick={() => setStep(1)} style={{ marginRight: "auto" }}>
              <SIcon name="chevronLeft" size={14}/> Changer de panne
            </button>
          )}
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!canSave}>
            <SIcon name="check" size={14}/> {form.kind === "corrective" ? "Planifier l'intervention" : t.common.save}
          </button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Type selector — always visible */}
        <div className="field">
          <label>{t.interventions.f.kind}</label>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className={"chip " + (form.kind === "préventive" ? "on" : "")} onClick={() => setKind("préventive")}>Préventive</button>
            <button type="button" className={"chip " + (form.kind === "corrective" ? "on" : "")} onClick={() => setKind("corrective")}>Corrective</button>
          </div>
        </div>

        {/* CORRECTIVE · step 1 — pick the fault */}
        {!editing && form.kind === "corrective" && step === 1 && (
          <div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}>
              Sélectionnez la panne à traiter — un technicien compatible sera suggéré automatiquement.
            </div>
            {openFaults.length === 0 && <div className="empty">Aucune panne en cours 🎉</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
              {openFaults.map(f => {
                const m = window.MFData.machineById(state, f.machineId);
                return (
                  <button key={f.id} type="button" className="fault-pick" onClick={() => pickFault(f)}>
                    <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: f.severity === "critical" ? "var(--critical)" : f.severity === "medium" ? "var(--warning)" : "var(--neutral)" }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.id}</span>
                        <SSeverityPill severity={f.severity} t={t}/>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{f.type}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m?.name || f.machineId}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.description}</div>
                    </div>
                    <SIcon name="chevronRight" size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }}/>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* step 2 — details (both kinds) */}
        {step === 2 && (
          <>
            {form.kind === "corrective" && linkedFault ? (
              <div className="linked-fault">
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: "var(--critical)" }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Panne associée</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{linkedFault.id}</span>
                    <b style={{ fontSize: 13.5 }}>{window.MFData.machineById(state, linkedFault.machineId)?.name}</b>
                    <SSeverityPill severity={linkedFault.severity} t={t}/>
                  </div>
                </div>
              </div>
            ) : (
              <div className="field">
                <label>{t.interventions.f.machine}</label>
                <select value={form.machineId || ""} onChange={e => upd("machineId", e.target.value)}>
                  {state.machines.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
                </select>
              </div>
            )}

            <div className="field">
              <label>{t.interventions.f.technician}</label>
              <select value={form.technician || ""} onChange={e => upd("technician", e.target.value)}>
                {state.technicians.map(tt => (
                  <option key={tt.id} value={tt.name}>
                    {tt.name} — {tt.role}{tt.available ? "" : " (occupé)"}{linkedFault && tt.specialties.includes(linkedFault.type) ? " · spécialité ✓" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row cols-2">
              <div className="field">
                <label>{t.interventions.f.date}</label>
                <input type="date" value={form.scheduledFor || ""} onChange={e => upd("scheduledFor", e.target.value)}/>
              </div>
              <div className="field">
                <label>{t.interventions.f.duration}</label>
                <input type="number" min="0.5" step="0.5" value={form.duration || ""} onChange={e => upd("duration", parseFloat(e.target.value))}/>
              </div>
            </div>
            <div className="field">
              <label>{t.interventions.f.description}</label>
              <textarea rows="3" value={form.description || ""} onChange={e => upd("description", e.target.value)} placeholder="Détails de l'opération à mener…"/>
            </div>
          </>
        )}
      </div>
    </SModal>
  );
}

function CalendarView({ interventions, state, t, onPick }) {
  // Show 5-week window around today (2026-05-21 in seed)
  const today = new Date("2026-05-21");
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - 7); // start from prev week's Sunday
  // Use Monday-start
  const monStart = new Date(today);
  const day = (today.getDay() + 6) % 7;
  monStart.setDate(today.getDate() - day - 7);
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(monStart);
    d.setDate(monStart.getDate() + i);
    cells.push(d);
  }
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const eventsOn = (d) => {
    const iso = d.toISOString().slice(0, 10);
    return interventions.filter(i => i.scheduledFor === iso);
  };
  return (
    <div className="card card-pad">
      <div className="calendar" style={{ marginBottom: 6 }}>
        {weekdays.map(w => <div key={w} className="cal-head">{w}</div>)}
      </div>
      <div className="calendar">
        {cells.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const dim = d.getMonth() !== today.getMonth();
          const events = eventsOn(d);
          return (
            <div key={i} className={"cal-cell" + (dim ? " dim" : "") + (isToday ? " today" : "")}>
              <div className="cal-num">{d.getDate()}{isToday && <span style={{ marginLeft: 4, color: "var(--brand)" }}>·</span>}</div>
              {events.map(e => {
                const isCrit = e.linkedFault && state.faults.find(f => f.id === e.linkedFault)?.severity === "critical";
                const cls = isCrit ? "crit" : e.kind === "préventive" ? "" : "warn";
                return (
                  <div key={e.id} className={"cal-event " + cls} title={`${e.id} — ${e.description}`} onClick={() => onPick(e)} style={{ cursor: "pointer" }}>
                    {e.technician.split(" ")[0]} · {e.machineId.replace("MCH-", "")}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════
function HistoryScreen({ state, t, goDetail }) {
  const [machineFilter, setMachineFilter] = useS("all");
  const [kindFilter, setKindFilter] = useS("all");
  const all = useM(() => window.MFData.history(state), [state]);
  const filtered = all.filter(it => {
    if (machineFilter !== "all" && it.machineId !== machineFilter) return false;
    if (kindFilter !== "all" && it.kind !== kindFilter) return false;
    return true;
  });

  const exportCsv = () => {
    const rows = [["Date", "Type", "Machine", "Action", "Détails", "Statut"]];
    filtered.forEach(it => {
      const m = window.MFData.machineById(state, it.machineId);
      rows.push([fmtDateTime(it.timestamp), it.kind, m?.name || it.machineId, it.title, it.description, it.status]);
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `maintflow-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          {["all", "fault", "intervention"].map(k => (
            <button key={k} className={"chip " + (kindFilter === k ? "on" : "")} onClick={() => setKindFilter(k)}>
              {k === "all" ? "Tout" : k === "fault" ? "Pannes" : "Interventions"}
            </button>
          ))}
        </div>
        <select className="chip" style={{ paddingRight: 26 }} value={machineFilter} onChange={e => setMachineFilter(e.target.value)}>
          <option value="all">Toutes machines</option>
          {state.machines.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
        </select>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={exportCsv}>
          <SIcon name="download" size={14}/> CSV
        </button>
      </div>

      <div className="card card-pad">
        <div className="timeline">
          {filtered.map((it, idx) => {
            const m = window.MFData.machineById(state, it.machineId);
            const cls = it.severity === "critical" ? "crit" : it.severity === "medium" ? "warn" : "ok";
            return (
              <div key={idx} className={"tl-item " + cls}>
                <div className="tl-time">
                  {fmtDateTime(it.timestamp)} ·{" "}
                  <SPill tone={it.kind === "fault" ? "crit" : "info"}>{it.kind === "fault" ? "Panne" : "Intervention"}</SPill>
                  {" "}·{" "}{it.meta}
                </div>
                <div className="tl-title">{it.title}</div>
                <div className="tl-meta">
                  <a onClick={() => goDetail(it.machineId)} style={{ color: "var(--brand-deep)", fontWeight: 600, cursor: "pointer" }}>{m?.name}</a> — {it.description}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty">{t.common.none}</div>}
        </div>
      </div>
    </div>
  );
}

function SStars({ value, onRate }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="22" height="22" viewBox="0 0 24 24"
          fill={i <= (value || 0) ? "var(--warning)" : "none"} stroke="var(--warning)" strokeWidth="1.5"
          style={{ cursor: onRate ? "pointer" : "default" }} onClick={() => onRate && onRate(i)}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function InterventionSheet({ item, state, setState, t, toast, onClose }) {
  if (!item) return null;
  const m = window.MFData.machineById(state, item.machineId);
  const checklist = item.checklist || [];
  const allDone = checklist.length > 0 && checklist.every(c => c.done);
  const signed = !!item.signedBy;
  const isClosed = item.status === "completed";

  const toggle = (idx) => setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === item.id ? { ...x, checklist: x.checklist.map((c, ci) => ci === idx ? { ...c, done: !c.done } : c) } : x) }));
  const sign = () => { setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === item.id ? { ...x, signedBy: x.technician } : x) })); toast("Rapport signé électroniquement"); };
  const rate = (n) => setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === item.id ? { ...x, rating: n } : x) }));
  const closeWork = () => {
    setState(s => ({ ...s, interventions: s.interventions.map(x => x.id === item.id ? { ...x, status: "completed", actualDuration: x.actualDuration ?? x.duration } : x) }));
    toast(`Bon de travail ${item.id} clôturé — rapport PDF généré`);
    onClose();
  };

  const overrun = isClosed && item.actualDuration != null && item.actualDuration > item.duration;

  return (
    <SModal open={!!item} onClose={onClose} title={`Bon de travail ${item.id}`} subtitle={`${m?.name} · ${item.technician}`} wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t.common.close}</button>
          {!isClosed && (
            <button className="btn btn-primary" disabled={!allDone || !signed} onClick={closeWork}
              title={!allDone ? "Validez toutes les tâches" : !signed ? "Signature requise" : ""}>
              <SIcon name="check" size={14}/> Clôturer le bon de travail
            </button>
          )}
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SPill tone={item.kind === "préventive" ? "info" : "warn"}>{t.interventions.kinds[item.kind]}</SPill>
          <SStatusPill status={item.status} t={t}/>
          {item.linkedFault && <span className="pill"><span className="mono">{item.linkedFault}</span></span>}
        </div>
        <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{item.description}</div>

        {/* Checklist */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Checklist d'intervention</div>
            <span className="tabular" style={{ fontSize: 12, color: allDone ? "var(--ok)" : "var(--text-muted)", fontWeight: 600 }}>
              {checklist.filter(c => c.done).length} / {checklist.length} validées
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {checklist.map((c, idx) => (
              <button key={idx} onClick={() => !isClosed && toggle(idx)} disabled={isClosed} className="checkrow" style={{ cursor: isClosed ? "default" : "pointer" }}>
                <span className={"checkbox " + (c.done ? "on" : "")}>{c.done && <SIcon name="check" size={12}/>}</span>
                <span style={{ flex: 1, textAlign: "left", textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--text-muted)" : "var(--text)" }}>{c.label}</span>
              </button>
            ))}
          </div>
          {!allDone && !isClosed && <div style={{ marginTop: 8, fontSize: 12, color: "var(--warning)" }}>⚠ Impossible de clôturer tant que toutes les tâches ne sont pas validées.</div>}
        </div>

        {/* Durée réelle vs prévue */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 10 }}>Durée réelle vs prévue</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div><div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }} className="tabular">{item.duration} h</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Prévu</div></div>
            <SIcon name="arrowRight" size={16} style={{ color: "var(--text-faint)" }}/>
            <div><div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: overrun ? "var(--critical)" : isClosed ? "var(--ok)" : "var(--text-faint)" }} className="tabular">{item.actualDuration != null ? item.actualDuration + " h" : "—"}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Réel</div></div>
            {overrun && <span className="pill pill-crit">Dépassement +{Math.round((item.actualDuration - item.duration) * 60)} min</span>}
          </div>
        </div>

        {/* Signature + évaluation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Signature numérique</div>
            <div className="sign-pad">
              {signed
                ? <span className="sign-name">{item.signedBy}</span>
                : <span style={{ color: "var(--text-faint)", fontSize: 12.5 }}>Non signé</span>}
            </div>
            {!signed && !isClosed && <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={sign}><SIcon name="edit" size={12}/> Signer le rapport</button>}
            {signed && <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ok)", display: "flex", alignItems: "center", gap: 5 }}><SIcon name="check" size={12}/> Signé électroniquement</div>}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Évaluation (responsable)</div>
            <SStars value={item.rating} onRate={rate}/>
            <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-muted)" }}>{item.rating ? `${item.rating} / 5 étoiles` : "Noter la qualité de l'intervention"}</div>
          </div>
        </div>
      </div>
    </SModal>
  );
}

window.MFScreens = { MachinesScreen, FaultsScreen, InterventionsScreen, HistoryScreen, CalendarView, ConfirmDialog, fmtDate, fmtDateTime, nextId };
