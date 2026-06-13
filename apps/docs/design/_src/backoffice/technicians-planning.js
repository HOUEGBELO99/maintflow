// modules.jsx — Techniciens (Int.7) + Planification intelligente (Int.5)
const { useState: useMS, useMemo: useMM } = React;
const { Icon: MIcon } = window.MFIcons;
const { Pill: MPill, Modal: MModal } = window.MFShell;
const { CalendarView: MCalendar, fmtDate: mFmtDate, fmtDateTime: mFmtDT } = window.MFScreens;

const SPEC_COLOR = { mécanique: "warn", électrique: "info", hydraulique: "ok", logiciel: "crit" };

function Stars({ value, size = 13 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(value) ? "var(--warning)" : "none"} stroke="var(--warning)" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICIENS — Interface 7
// ═══════════════════════════════════════════════════════════════════════════
function TechniciansScreen({ state, t, toast, goDetail }) {
  const [open, setOpen] = useMS(null);
  const totalAvail = state.technicians.filter(tt => tt.available).length;

  return (
    <div>
      {/* Affectation intelligente banner */}
      <div className="assign-banner">
        <span className="assign-icon"><MIcon name="bolt" size={16}/></span>
        <div style={{ flex: 1 }}>
          <b>Affectation intelligente active</b>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            À chaque déclaration de panne, MaintFlow suggère le technicien disponible ayant la spécialité requise et la charge la plus faible.
          </div>
        </div>
        <span className="pill pill-ok"><span className="pill-dot"/>{totalAvail} disponibles</span>
      </div>

      <div className="tech-grid">
        {state.technicians.map(tt => {
          const wl = window.MFData.technicianWorkload(state, tt.name);
          const load = Math.min(1, wl.hours / 12);
          return (
            <button key={tt.id} className="card tech-card" onClick={() => setOpen(tt)} style={{ textAlign: "left", cursor: "pointer", width: "100%", border: "1px solid var(--border)", background: "var(--surface)", font: "inherit", color: "inherit" }}>
              <div className="card-pad">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div className="avatar" style={{ background: `linear-gradient(135deg, ${tt.color}, var(--brand-deep))`, width: 44, height: 44, fontSize: 15, flex: "0 0 44px" }}>
                    {tt.name.split(" ").map(p => p[0]).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{tt.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{tt.role}</div>
                  </div>
                  {tt.available
                    ? <span className="pill pill-ok"><span className="pill-dot"/>Disponible</span>
                    : <span className="pill pill-warn"><span className="pill-dot"/>En intervention</span>}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                  {tt.specialties.map(sp => (
                    <MPill key={sp} tone={SPEC_COLOR[sp] || "mute"}><span style={{ textTransform: "capitalize" }}>{sp}</span></MPill>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Charge de travail</span>
                    <span className="tabular" style={{ fontWeight: 600 }}>{wl.count} actives · {wl.hours} h</span>
                  </div>
                  <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${load * 100}%`, height: "100%", borderRadius: 4, background: load > 0.85 ? "var(--critical)" : load > 0.6 ? "var(--warning)" : "var(--brand)" }}/>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div className="tabular" style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{tt.perf.onTime}%</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>Dans les délais</div>
                  </div>
                  <div>
                    <div style={{ marginTop: 2 }}><Stars value={tt.perf.rating}/></div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>Note moy. {tt.perf.rating}</div>
                  </div>
                  <div>
                    <div className="tabular" style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{tt.perf.doneThisMonth}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>Ce mois</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--brand-deep)", display: "flex", alignItems: "center", gap: 5 }}>
                  Voir la fiche <MIcon name="arrowRight" size={12}/>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <TechnicianDetail tech={open} state={state} t={t} onClose={() => setOpen(null)} goDetail={goDetail}/>
    </div>
  );
}

function TechnicianDetail({ tech, state, t, onClose, goDetail }) {
  if (!tech) return null;
  const wl = window.MFData.technicianWorkload(state, tech.name);
  const mine = state.interventions.filter(i => i.technician === tech.name);
  const active = mine.filter(i => i.status !== "completed").sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const doneList = mine.filter(i => i.status === "completed").sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  const load = Math.min(1, wl.hours / 12);

  return (
    <MModal open={!!tech} onClose={onClose} title={tech.name} subtitle={tech.role} wide
      footer={<button className="btn btn-ghost" onClick={onClose}>{t.common.close}</button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="avatar" style={{ background: `linear-gradient(135deg, ${tech.color}, var(--brand-deep))`, width: 60, height: 60, fontSize: 21, flex: "0 0 60px" }}>
            {tech.name.split(" ").map(p => p[0]).join("")}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {tech.specialties.map(sp => <MPill key={sp} tone={SPEC_COLOR[sp] || "mute"}><span style={{ textTransform: "capitalize" }}>{sp}</span></MPill>)}
            </div>
            {tech.available
              ? <span className="pill pill-ok"><span className="pill-dot"/>Disponible</span>
              : <span className="pill pill-warn"><span className="pill-dot"/>En intervention</span>}
          </div>
        </div>

        {/* Performance grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div className="td-stat">
            <div className="td-stat-v tabular">{tech.perf.onTime}%</div>
            <div className="td-stat-l">Résolu dans les délais</div>
          </div>
          <div className="td-stat">
            <div style={{ marginBottom: 2 }}><Stars value={tech.perf.rating} size={16}/></div>
            <div className="td-stat-l">Note moyenne · {tech.perf.rating}</div>
          </div>
          <div className="td-stat">
            <div className="td-stat-v tabular">{tech.perf.doneThisMonth}</div>
            <div className="td-stat-l">Interventions ce mois</div>
          </div>
          <div className="td-stat">
            <div className="td-stat-v tabular">{wl.count}</div>
            <div className="td-stat-l">En cours · {wl.hours} h</div>
          </div>
        </div>

        {/* Workload bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Charge de travail actuelle</span>
            <span className="tabular" style={{ fontWeight: 600, color: load > 0.85 ? "var(--critical)" : "var(--text)" }}>{Math.round(load * 100)}%</span>
          </div>
          <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${load * 100}%`, height: "100%", borderRadius: 5, background: load > 0.85 ? "var(--critical)" : load > 0.6 ? "var(--warning)" : "var(--brand)" }}/>
          </div>
        </div>

        {/* Assigned interventions */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 10 }}>Interventions assignées ({active.length})</div>
          {active.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune intervention en cours.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {active.map(i => {
              const m = window.MFData.machineById(state, i.machineId);
              return (
                <div key={i.id} className="td-int" onClick={() => { onClose(); goDetail && goDetail(i.machineId); }}>
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: i.kind === "préventive" ? "var(--info)" : "var(--warning)" }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{i.id}</span>
                      <MPill tone={i.kind === "préventive" ? "info" : "warn"}>{t.interventions.kinds[i.kind]}</MPill>
                      <window.MFShell.StatusPill status={i.status} t={t}/>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{m?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.description}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, flexShrink: 0 }}>
                    <div style={{ fontWeight: 600 }}>{mFmtDate(i.scheduledFor)}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{i.duration} h</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent completed */}
        {doneList.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 10 }}>Historique récent</div>
            <div className="timeline">
              {doneList.slice(0, 4).map(i => {
                const m = window.MFData.machineById(state, i.machineId);
                return (
                  <div key={i.id} className="tl-item ok">
                    <div className="tl-time">{mFmtDate(i.scheduledFor)} · <span className="mono">{i.id}</span>{i.rating ? ` · ${i.rating}★` : ""}</div>
                    <div className="tl-title">{m?.name}</div>
                    <div className="tl-meta">{i.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANIFICATION INTELLIGENTE — Interface 5
// ═══════════════════════════════════════════════════════════════════════════
function PlanningScreen({ state, setState, t, toast, goDetail }) {
  const [adding, setAdding] = useMS(false);
  const rules = state.planRules || [];
  const reminders = state.reminders || [];

  // Détection de conflits : technicien avec ≥2 interventions actives le même jour
  const conflicts = useMM(() => {
    const map = {};
    state.interventions.filter(i => i.status !== "completed").forEach(i => {
      const key = i.technician + "|" + i.scheduledFor;
      (map[key] = map[key] || []).push(i);
    });
    return Object.entries(map).filter(([, arr]) => arr.length > 1).map(([key, arr]) => {
      const [tech, date] = key.split("|");
      return { tech, date, items: arr };
    });
  }, [state.interventions]);

  const upcoming = useMM(() => window.MFData.upcomingReminders(state), [state.planRules]);

  // Planifier maintenant : crée le bon de travail à l'échéance, log un rappel, avance la date
  const scheduleNow = (rule) => {
    setState(s => {
      const ids = s.interventions.map(x => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
      const intId = "I-" + String(Math.max(0, ...ids) + 1);
      const newInt = {
        id: intId, machineId: rule.machineId, technician: rule.technician, kind: "préventive",
        description: rule.title, scheduledFor: rule.nextDue, duration: rule.duration, status: "planned", planRule: rule.id,
      };
      const remId = window.MFData.nextReminderId(s);
      const remOn = window.MFData.minusDaysISO(rule.nextDue, rule.reminderLead || 2);
      const newRem = {
        id: remId, ruleId: rule.id, title: rule.title, machineId: rule.machineId, technician: rule.technician,
        dueDate: rule.nextDue, firedAt: remOn + "T08:00:00", lead: rule.reminderLead || 2, channel: "Notification + e-mail", status: "sent",
      };
      const nextDue = window.MFData.addWeeksISO(rule.nextDue, rule.everyWeeks);
      return {
        ...s,
        interventions: [...s.interventions, newInt],
        reminders: [newRem, ...s.reminders],
        planRules: s.planRules.map(r => r.id === rule.id ? { ...r, nextDue } : r),
      };
    });
    toast(`Bon de travail créé — rappel programmé J-${rule.reminderLead || 2}`);
  };

  const toggleActive = (rule) => {
    setState(s => ({ ...s, planRules: s.planRules.map(r => r.id === rule.id ? { ...r, active: !(r.active !== false) } : r) }));
  };

  const addRule = (form) => {
    setState(s => {
      const id = window.MFData.nextRuleId(s);
      const rule = { id, ...form, active: true };
      // créer immédiatement le premier bon de travail + rappel (ajout intelligent au calendrier)
      const ids = s.interventions.map(x => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
      const intId = "I-" + String(Math.max(0, ...ids) + 1);
      const newInt = { id: intId, machineId: form.machineId, technician: form.technician, kind: "préventive", description: form.title, scheduledFor: form.nextDue, duration: form.duration, status: "planned", planRule: id };
      const remId = window.MFData.nextReminderId(s);
      const remOn = window.MFData.minusDaysISO(form.nextDue, form.reminderLead || 2);
      const newRem = { id: remId, ruleId: id, title: form.title, machineId: form.machineId, technician: form.technician, dueDate: form.nextDue, firedAt: remOn + "T08:00:00", lead: form.reminderLead || 2, channel: "Notification + e-mail", status: "scheduled" };
      return { ...s, planRules: [...s.planRules, rule], interventions: [...s.interventions, newInt], reminders: [newRem, ...s.reminders] };
    });
    toast(`Planification ${form.title} créée + ajoutée au calendrier`);
    setAdding(false);
  };

  return (
    <div>
      {/* Top actions */}
      <div className="toolbar">
        <div style={{ display: "flex", gap: 10 }}>
          <PlanStat label="Règles actives" value={rules.filter(r => r.active !== false).length}/>
          <PlanStat label="Rappels programmés" value={upcoming.length}/>
          <PlanStat label="Préventives planifiées" value={state.interventions.filter(i => i.kind === "préventive" && i.status === "planned").length}/>
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-bright" onClick={() => setAdding(true)}>
          <MIcon name="plus" size={14}/> Ajouter une planification
        </button>
      </div>

      {/* Conflict detection */}
      {conflicts.length > 0 && (
        <div className="stock-alert" style={{ borderColor: "var(--warning)", background: "#FEF3C7" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="stock-alert-icon" style={{ background: "#FDE68A", color: "#B45309" }}><MIcon name="fault" size={16}/></span>
            <div>
              <b>{conflicts.length} conflit{conflicts.length > 1 ? "s" : ""} de planning détecté{conflicts.length > 1 ? "s" : ""}</b>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {conflicts.map(c => `${c.tech} — ${mFmtDate(c.date)} (${c.items.length} interventions)`).join(" · ")}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14, marginBottom: 22 }}>
        {/* Preventive rules */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Règles de maintenance préventive</h3>
              <div className="sub">Récurrence + rappel automatique avant échéance</div>
            </div>
          </div>
          <div>
            {rules.length === 0 && <div className="empty">Aucune règle. Cliquez « Ajouter une planification ».</div>}
            {rules.map(r => {
              const m = window.MFData.machineById(state, r.machineId);
              const dueIn = window.MFData.daysUntil(r.nextDue);
              const inactive = r.active === false;
              return (
                <div key={r.id} className="plan-row" style={{ opacity: inactive ? 0.5 : 1 }}>
                  <div style={{ width: 4, alignSelf: "stretch", background: "var(--info)", borderRadius: 2 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.id}</span>
                      <MPill tone="info">Toutes les {r.everyWeeks} sem.</MPill>
                      <span className="pill" style={{ fontSize: 10.5 }}><MIcon name="bell" size={11}/> Rappel J-{r.reminderLead || 2}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {m?.name} · {r.technician} · prochaine : <b style={{ color: dueIn <= 2 ? "var(--warning)" : "var(--text)" }}>{mFmtDate(r.nextDue)}</b> {dueIn >= 0 ? `(J-${dueIn})` : "(échue)"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <button className="btn btn-sm btn-bright" onClick={() => scheduleNow(r)} disabled={inactive} title="Créer le bon de travail et avancer la date">
                      <MIcon name="calendar" size={12}/> Planifier
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(r)}>{inactive ? "Activer" : "Suspendre"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminders: upcoming + history */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-h">
            <div>
              <h3>Rappels automatiques</h3>
              <div className="sub">À venir & historique des envois</div>
            </div>
          </div>
          <div className="card-pad" style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>À venir</div>
            {upcoming.slice(0, 4).map(u => (
              <div key={u.rule.id} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-50)", color: "var(--brand-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MIcon name="bell" size={14}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.rule.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.rule.technician} · échéance {mFmtDate(u.rule.nextDue)}</div>
                </div>
                <span className="pill" style={{ fontSize: 10.5 }}>{u.remindIn <= 0 ? "à envoyer" : `dans ${u.remindIn} j`}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px", flex: 1, overflowY: "auto", maxHeight: 240 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Historique des rappels</div>
            {reminders.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Aucun rappel envoyé.</div>}
            {reminders.map(rm => (
              <div key={rm.id} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: rm.status === "done" ? "var(--ok)" : rm.status === "scheduled" ? "var(--info)" : "var(--brand)" }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rm.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    <span className="mono">{rm.id}</span> · {rm.channel} · {rm.status === "scheduled" ? "programmé" : "envoyé"} {mFmtDate(rm.firedAt.slice(0,10))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Calendrier des interventions planifiées</div>
      <MCalendar interventions={state.interventions.filter(i => i.status !== "completed")} state={state} t={t} onPick={(i) => goDetail(i.machineId)}/>

      <PlanRuleForm open={adding} state={state} onClose={() => setAdding(false)} onSave={addRule}/>
    </div>
  );
}

function PlanStat({ label, value }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 14px", minWidth: 96 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, lineHeight: 1 }} className="tabular">{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function PlanRuleForm({ open, state, onClose, onSave }) {
  const [form, setForm] = useMS({});
  React.useEffect(() => {
    if (open) setForm({ title: "", machineId: state.machines[0]?.id, technician: state.technicians[0]?.name, everyWeeks: 4, duration: 2, reminderLead: 2, nextDue: "2026-05-28" });
  }, [open]);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.title && form.machineId && form.technician && form.nextDue;

  return (
    <MModal open={open} onClose={onClose} title="Ajouter une planification" subtitle="Maintenance préventive récurrente + rappel automatique" wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!valid}>
            <MIcon name="check" size={14}/> Créer & ajouter au calendrier
          </button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Intitulé de la maintenance</label>
          <input value={form.title || ""} onChange={e => upd("title", e.target.value)} placeholder="ex. Lubrification mensuelle convoyeur"/>
        </div>
        <div className="field-row cols-2">
          <div className="field">
            <label>Machine</label>
            <select value={form.machineId || ""} onChange={e => upd("machineId", e.target.value)}>
              {state.machines.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Technicien assigné</label>
            <select value={form.technician || ""} onChange={e => upd("technician", e.target.value)}>
              {state.technicians.map(tt => <option key={tt.id} value={tt.name}>{tt.name} — {tt.role}</option>)}
            </select>
          </div>
        </div>
        <div className="field-row cols-3">
          <div className="field">
            <label>Fréquence (semaines)</label>
            <input type="number" min="1" step="1" value={form.everyWeeks || ""} onChange={e => upd("everyWeeks", parseInt(e.target.value, 10) || 1)}/>
          </div>
          <div className="field">
            <label>Durée (heures)</label>
            <input type="number" min="0.5" step="0.5" value={form.duration || ""} onChange={e => upd("duration", parseFloat(e.target.value))}/>
          </div>
          <div className="field">
            <label>Rappel avant (jours)</label>
            <input type="number" min="0" step="1" value={form.reminderLead ?? ""} onChange={e => upd("reminderLead", parseInt(e.target.value, 10) || 0)}/>
          </div>
        </div>
        <div className="field">
          <label>Première échéance</label>
          <input type="date" value={form.nextDue || ""} onChange={e => upd("nextDue", e.target.value)}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)", background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
          <MIcon name="bell" size={15}/>
          Un rappel automatique sera envoyé {form.reminderLead || 0} jour(s) avant chaque échéance, et le premier bon de travail sera ajouté au calendrier.
        </div>
      </div>
    </MModal>
  );
}

window.MFModules = { TechniciansScreen, PlanningScreen };
