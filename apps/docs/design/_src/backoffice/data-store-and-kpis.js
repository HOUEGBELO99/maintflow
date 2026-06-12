// data.js — mock data + persistence layer for MaintFlow

(function () {
  const STORE_KEY = "maintflow_v4";

  const CONFIG = {
    company: "Industries Nord — Site de Lyon",
  };

  const SEED = {
    config: CONFIG,
    machines: [
      { id: "MCH-001", code: "MCH-001", name: "Compresseur Atlas A7", type: "compresseur", workshop: "Atelier A", installedAt: "2021-04-18", state: "ok", runtime: 14328, criticality: "high", hourlyCost: 1200, lifespanYears: 12, pos: { x: 0, y: 0 } },
      { id: "MCH-002", code: "MCH-002", name: "Convoyeur Ligne 2", type: "convoyeur", workshop: "Atelier A", installedAt: "2019-11-02", state: "fault", runtime: 22510, criticality: "high", hourlyCost: 1800, lifespanYears: 15, pos: { x: 1, y: 0 } },
      { id: "MCH-003", code: "MCH-003", name: "Tour CNC Mazak QT", type: "machine-outil", workshop: "Atelier B", installedAt: "2022-08-15", state: "ok", runtime: 9120, criticality: "high", hourlyCost: 1500, lifespanYears: 14, pos: { x: 0, y: 1 } },
      { id: "MCH-004", code: "MCH-004", name: "Presse hydraulique 250T", type: "presse", workshop: "Atelier B", installedAt: "2018-03-01", state: "maintenance", runtime: 31204, criticality: "high", hourlyCost: 1100, lifespanYears: 20, pos: { x: 1, y: 1 } },
      { id: "MCH-005", code: "MCH-005", name: "Pompe doseuse P12", type: "pompe", workshop: "Atelier C", installedAt: "2020-06-22", state: "ok", runtime: 18790, criticality: "medium", hourlyCost: 420, lifespanYears: 10, pos: { x: 0, y: 2 } },
      { id: "MCH-006", code: "MCH-006", name: "Moteur ventilation V3", type: "moteur", workshop: "Atelier C", installedAt: "2017-09-10", state: "ok", runtime: 41280, criticality: "low", hourlyCost: 180, lifespanYears: 18, pos: { x: 1, y: 2 } },
      { id: "MCH-007", code: "MCH-007", name: "Robot soudure FANUC", type: "robot", workshop: "Atelier B", installedAt: "2023-01-30", state: "ok", runtime: 5340, criticality: "high", hourlyCost: 1600, lifespanYears: 12, pos: { x: 2, y: 1 } },
      { id: "MCH-008", code: "MCH-008", name: "Chaudière vapeur CV2", type: "chaudiere", workshop: "Utilités", installedAt: "2016-05-12", state: "fault", runtime: 52310, criticality: "high", hourlyCost: 2200, lifespanYears: 25, pos: { x: 0, y: 0 } },
      { id: "MCH-009", code: "MCH-009", name: "Pont roulant 5T", type: "manutention", workshop: "Atelier A", installedAt: "2015-11-08", state: "ok", runtime: 26890, criticality: "medium", hourlyCost: 600, lifespanYears: 22, pos: { x: 2, y: 0 } },
      { id: "MCH-010", code: "MCH-010", name: "Extrudeuse E4", type: "extrudeuse", workshop: "Atelier D", installedAt: "2021-12-04", state: "ok", runtime: 11240, criticality: "high", hourlyCost: 1400, lifespanYears: 14, pos: { x: 0, y: 0 } },
      { id: "MCH-011", code: "MCH-011", name: "Refroidisseur RC-3", type: "refrigeration", workshop: "Utilités", installedAt: "2019-07-19", state: "maintenance", runtime: 28100, criticality: "medium", hourlyCost: 520, lifespanYears: 16, pos: { x: 1, y: 0 } },
      { id: "MCH-012", code: "MCH-012", name: "Découpe laser TruLaser", type: "machine-outil", workshop: "Atelier B", installedAt: "2022-03-25", state: "ok", runtime: 7920, criticality: "high", hourlyCost: 1700, lifespanYears: 13, pos: { x: 2, y: 2 } },
    ],

    faults: [
      { id: "F-2041", machineId: "MCH-002", type: "mécanique", description: "Roulement palier moteur en surchauffe, vibrations anormales détectées", reportedAt: "2026-05-21T08:14:00", reportedBy: "L. Moreau", severity: "critical", status: "in-progress", rootCause: "usure", hasPhoto: true, takenAt: "2026-05-21T08:31:00" },
      { id: "F-2040", machineId: "MCH-008", type: "hydraulique", description: "Fuite vapeur niveau soupape de sécurité — pression instable", reportedAt: "2026-05-21T06:42:00", reportedBy: "S. Diallo", severity: "critical", status: "pending", rootCause: null, hasPhoto: true, takenAt: null },
      { id: "F-2039", machineId: "MCH-004", type: "électrique", description: "Disjoncteur principal saute en charge — à investiguer câblage", reportedAt: "2026-05-20T15:20:00", reportedBy: "J. Petit", severity: "medium", status: "in-progress", rootCause: "défaut matériau", hasPhoto: false, takenAt: "2026-05-20T16:05:00" },
      { id: "F-2038", machineId: "MCH-011", type: "mécanique", description: "Bruit anormal compresseur frigorifique", reportedAt: "2026-05-20T10:05:00", reportedBy: "T. Khan", severity: "medium", status: "in-progress", rootCause: "usure", hasPhoto: false, takenAt: "2026-05-20T11:00:00" },
      { id: "F-2037", machineId: "MCH-005", type: "hydraulique", description: "Pression de refoulement en baisse continue", reportedAt: "2026-05-17T11:30:00", reportedBy: "L. Moreau", severity: "low", status: "resolved", rootCause: "usure", hasPhoto: false, takenAt: "2026-05-17T13:00:00" },
      { id: "F-2036", machineId: "MCH-001", type: "électrique", description: "Capteur de pression défaillant remplacé", reportedAt: "2026-05-16T09:00:00", reportedBy: "S. Diallo", severity: "low", status: "resolved", rootCause: "défaut matériau", hasPhoto: false, takenAt: "2026-05-16T09:30:00" },
      { id: "F-2035", machineId: "MCH-007", type: "logiciel", description: "Erreur axe Z — recalibration nécessaire", reportedAt: "2026-05-15T14:45:00", reportedBy: "J. Petit", severity: "medium", status: "resolved", rootCause: "erreur opérateur", hasPhoto: false, takenAt: "2026-05-15T15:10:00" },
      { id: "F-2034", machineId: "MCH-002", type: "électrique", description: "Variateur de fréquence — défaut alimentation intermittent", reportedAt: "2026-05-14T08:00:00", reportedBy: "L. Moreau", severity: "medium", status: "resolved", rootCause: "usure", hasPhoto: false, takenAt: "2026-05-14T08:40:00" },
      { id: "F-2033", machineId: "MCH-008", type: "mécanique", description: "Vibration ventilateur tirage — équilibrage requis", reportedAt: "2026-05-10T13:10:00", reportedBy: "T. Khan", severity: "medium", status: "resolved", rootCause: "usure", hasPhoto: false, takenAt: "2026-05-10T14:00:00" },
      { id: "F-2032", machineId: "MCH-002", type: "mécanique", description: "Glissement bande convoyeur — tension à régler", reportedAt: "2026-05-06T09:25:00", reportedBy: "S. Diallo", severity: "low", status: "resolved", rootCause: "usure", hasPhoto: false, takenAt: "2026-05-06T10:00:00" },
    ],

    interventions: [
      { id: "I-1082", machineId: "MCH-002", technician: "S. Diallo", kind: "corrective", description: "Remplacement roulement palier moteur, alignement convoyeur", scheduledFor: "2026-05-21", duration: 4, status: "in-progress", linkedFault: "F-2041",
        checklist: [
          { label: "Consignation électrique (LOTO)", done: true },
          { label: "Dépose carter de protection", done: true },
          { label: "Extraction roulement défectueux", done: false },
          { label: "Montage roulement neuf + graissage", done: false },
          { label: "Réalignement et test à vide", done: false },
        ], partsUsed: ["P-101"] },
      { id: "I-1081", machineId: "MCH-008", technician: "J. Petit", kind: "corrective", description: "Diagnostic fuite vapeur + remplacement soupape", scheduledFor: "2026-05-21", duration: 6, status: "planned", linkedFault: "F-2040" },
      { id: "I-1080", machineId: "MCH-004", technician: "T. Khan", kind: "corrective", description: "Test isolement câblage moteur presse hydraulique", scheduledFor: "2026-05-22", duration: 3, status: "planned", linkedFault: "F-2039" },
      { id: "I-1079", machineId: "MCH-001", technician: "L. Moreau", kind: "préventive", description: "Visite trimestrielle compresseur — filtration, huile, courroies", scheduledFor: "2026-05-23", duration: 2, status: "planned", planRule: "PM-01" },
      { id: "I-1078", machineId: "MCH-011", technician: "S. Diallo", kind: "corrective", description: "Recharge fluide frigorigène + contrôle compresseur", scheduledFor: "2026-05-24", duration: 3, status: "planned", linkedFault: "F-2038" },
      { id: "I-1077", machineId: "MCH-003", technician: "J. Petit", kind: "préventive", description: "Maintenance préventive tour CNC — graissage broche", scheduledFor: "2026-05-25", duration: 2, status: "planned", planRule: "PM-02" },
      { id: "I-1076", machineId: "MCH-007", technician: "T. Khan", kind: "préventive", description: "Calibration robot soudure + mise à jour firmware", scheduledFor: "2026-05-26", duration: 4, status: "planned", planRule: "PM-03" },
      { id: "I-1075", machineId: "MCH-005", technician: "L. Moreau", kind: "corrective", description: "Remplacement membrane pompe doseuse", scheduledFor: "2026-05-17", duration: 1.5, status: "completed", linkedFault: "F-2037", actualDuration: 2.25, rating: 5, signedBy: "L. Moreau", partsUsed: ["P-104"] },
      { id: "I-1074", machineId: "MCH-001", technician: "S. Diallo", kind: "corrective", description: "Remplacement capteur de pression", scheduledFor: "2026-05-16", duration: 1, status: "completed", linkedFault: "F-2036", actualDuration: 1, rating: 4, signedBy: "S. Diallo", partsUsed: ["P-106"] },
      { id: "I-1073", machineId: "MCH-007", technician: "J. Petit", kind: "corrective", description: "Recalibration axe Z robot soudure", scheduledFor: "2026-05-15", duration: 2, status: "completed", linkedFault: "F-2035", actualDuration: 1.5, rating: 5, signedBy: "J. Petit", partsUsed: [] },
      { id: "I-1072", machineId: "MCH-002", technician: "T. Khan", kind: "corrective", description: "Réparation variateur convoyeur", scheduledFor: "2026-05-14", duration: 2.5, status: "completed", linkedFault: "F-2034", actualDuration: 3.75, rating: 3, signedBy: "T. Khan", partsUsed: ["P-103"] },
      { id: "I-1071", machineId: "MCH-006", technician: "L. Moreau", kind: "préventive", description: "Contrôle annuel moteur ventilation", scheduledFor: "2026-05-12", duration: 1, status: "completed", planRule: "PM-04", actualDuration: 1, rating: 5, signedBy: "L. Moreau", partsUsed: [] },
    ],

    technicians: [
      { id: "T1", name: "L. Moreau", role: "Technicien sénior", color: "#00C24A", specialties: ["mécanique", "hydraulique"], available: true, perf: { onTime: 94, rating: 4.8, doneThisMonth: 14 } },
      { id: "T2", name: "S. Diallo", role: "Technicien", color: "#2563EB", specialties: ["électrique", "mécanique"], available: true, perf: { onTime: 88, rating: 4.5, doneThisMonth: 11 } },
      { id: "T3", name: "J. Petit", role: "Technicien", color: "#F59E0B", specialties: ["électrique", "logiciel"], available: false, perf: { onTime: 91, rating: 4.6, doneThisMonth: 9 } },
      { id: "T4", name: "T. Khan", role: "Technicien junior", color: "#7C3AED", specialties: ["hydraulique", "mécanique"], available: true, perf: { onTime: 79, rating: 4.2, doneThisMonth: 7 } },
    ],

    // Pièces de rechange retirées de l'application.

    // Règles de maintenance préventive — Interface 5
    planRules: [
      { id: "PM-01", title: "Visite trimestrielle compresseur", machineId: "MCH-001", everyWeeks: 12, technician: "L. Moreau", duration: 2, nextDue: "2026-05-23", reminderLead: 2, active: true },
      { id: "PM-02", title: "Graissage broche tour CNC", machineId: "MCH-003", everyWeeks: 4, technician: "J. Petit", duration: 2, nextDue: "2026-05-25", reminderLead: 2, active: true },
      { id: "PM-03", title: "Calibration robot soudure", machineId: "MCH-007", everyWeeks: 8, technician: "T. Khan", duration: 4, nextDue: "2026-05-26", reminderLead: 3, active: true },
      { id: "PM-04", title: "Contrôle annuel moteur ventilation", machineId: "MCH-006", everyWeeks: 52, technician: "L. Moreau", duration: 1, nextDue: "2026-06-12", reminderLead: 7, active: true },
      { id: "PM-05", title: "Lubrification pont roulant", machineId: "MCH-009", everyWeeks: 4, technician: "S. Diallo", duration: 1, nextDue: "2026-05-28", reminderLead: 2, active: true },
    ],

    // Historique des rappels automatiques déclenchés — Interface 5
    reminders: [
      { id: "RM-014", ruleId: "PM-02", title: "Graissage broche tour CNC", machineId: "MCH-003", technician: "J. Petit", dueDate: "2026-05-25", firedAt: "2026-05-23T08:00:00", lead: 2, channel: "Notification + e-mail", status: "sent" },
      { id: "RM-013", ruleId: "PM-01", title: "Visite trimestrielle compresseur", machineId: "MCH-001", technician: "L. Moreau", dueDate: "2026-05-23", firedAt: "2026-05-21T08:00:00", lead: 2, channel: "Notification + e-mail", status: "sent" },
      { id: "RM-012", ruleId: "PM-04", title: "Contrôle annuel moteur ventilation", machineId: "MCH-006", technician: "L. Moreau", dueDate: "2026-05-12", firedAt: "2026-05-05T08:00:00", lead: 7, channel: "Notification", status: "done" },
    ],

    users: [
      { id: "U1", name: "Laurent Moreau", email: "l.moreau@usine.fr", role: "admin", workshop: "Tous", status: "active", lastLogin: "2026-05-21T08:14:00", color: "#00C24A", initials: "LM" },
      { id: "U2", name: "Sophie Diallo", email: "s.diallo@usine.fr", role: "technicien", workshop: "Atelier A", status: "active", lastLogin: "2026-05-21T07:32:00", color: "#2563EB", initials: "SD" },
      { id: "U3", name: "Julien Petit", email: "j.petit@usine.fr", role: "technicien", workshop: "Atelier B", status: "active", lastLogin: "2026-05-20T16:55:00", color: "#F59E0B", initials: "JP" },
      { id: "U4", name: "Tarek Khan", email: "t.khan@usine.fr", role: "operateur", workshop: "Atelier B", status: "active", lastLogin: "2026-05-21T06:10:00", color: "#7C3AED", initials: "TK" },
      { id: "U5", name: "Marie Roux", email: "m.roux@usine.fr", role: "chef_maintenance", workshop: "Direction", status: "active", lastLogin: "2026-05-19T14:20:00", color: "#0E1410", initials: "MR" },
      { id: "U6", name: "Hervé Akkari", email: "h.akkari@usine.fr", role: "chef_atelier", workshop: "Direction", status: "active", lastLogin: "2026-05-18T11:05:00", color: "#0EA5A0", initials: "HA" },
    ],

    invitations: [
      { id: "INV-001", email: "p.kone@usine.fr", role: "technicien", workshop: "Atelier C", invitedBy: "L. Moreau", sentAt: "2026-05-20T10:00:00", status: "pending" },
      { id: "INV-002", email: "n.bernard@usine.fr", role: "operateur", workshop: "Atelier D", invitedBy: "L. Moreau", sentAt: "2026-05-18T15:30:00", status: "pending" },
      { id: "INV-003", email: "c.lopez@usine.fr", role: "chef_atelier", workshop: "Direction", invitedBy: "M. Roux", sentAt: "2026-05-15T09:00:00", status: "accepted" },
    ],

    notifications: [
      { id: "N1", level: "critical", text: "<b>MCH-008</b> — Fuite vapeur critique signalée", time: "il y a 12 min", read: false },
      { id: "N2", level: "critical", text: "<b>MCH-002</b> — Convoyeur ligne 2 arrêté", time: "il y a 1 h", read: false },
      { id: "N4", level: "warning", text: "<b>I-1080</b> — Intervention planifiée demain", time: "il y a 2 h", read: false },
      { id: "N5", level: "info", text: "<b>F-2037</b> — Panne pompe doseuse résolue", time: "hier", read: true },
      { id: "N6", level: "info", text: "Rapport hebdomadaire généré", time: "hier", read: true },
    ],
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return structuredClone(SEED);
      const parsed = JSON.parse(raw);
      // forward-compat: ensure new collections exist
      if (!parsed.planRules) parsed.planRules = structuredClone(SEED.planRules);
      if (!parsed.reminders) parsed.reminders = structuredClone(SEED.reminders);
      if (!parsed.config) parsed.config = structuredClone(SEED.config);
      return parsed;
    } catch (e) {
      return structuredClone(SEED);
    }
  }
  function save(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    return structuredClone(SEED);
  }

  // ─── Derived helpers ───────────────────────────────────────────────────────
  function machineById(state, id) { return state.machines.find(m => m.id === id); }

  const NOW = new Date("2026-05-21T09:30:00"); // reference "now" for the seeded scenario
  function now() { return NOW; }

  // KPIs
  function computeKPIs(state) {
    const total = state.machines.length;
    const ok = state.machines.filter(m => m.state === "ok").length;
    const fault = state.machines.filter(m => m.state === "fault").length;
    const maint = state.machines.filter(m => m.state === "maintenance").length;
    const activeFaults = state.faults.filter(f => f.status !== "resolved").length;
    const criticalFaults = state.faults.filter(f => f.status !== "resolved" && f.severity === "critical").length;
    const inProgressInt = state.interventions.filter(i => i.status === "in-progress").length;
    const plannedInt = state.interventions.filter(i => i.status === "planned").length;
    return { total, ok, fault, maint, activeFaults, criticalFaults, inProgressInt, plannedInt };
  }

  // Score de santé global (0-100), pondéré par criticité
  function healthScore(state) {
    const stateScore = { ok: 100, maintenance: 58, fault: 8 };
    const weight = { high: 3, medium: 2, low: 1 };
    let num = 0, den = 0;
    state.machines.forEach(m => {
      const w = weight[m.criticality] || 1;
      num += w * (stateScore[m.state] ?? 60);
      den += w;
    });
    return den ? Math.round(num / den) : 100;
  }

  // MTBF par machine (jours) — heures de fonctionnement / nb de pannes
  function machineMTBF(state, machineId) {
    const m = machineById(state, machineId);
    if (!m) return null;
    const failures = state.faults.filter(f => f.machineId === machineId).length;
    if (failures === 0) return null;
    return Math.round((m.runtime / failures) / 24); // jours
  }

  // Disponibilité estimée d'une machine (%)
  function availability(state, machineId) {
    const m = machineById(state, machineId);
    if (!m) return 100;
    const failures = state.faults.filter(f => f.machineId === machineId).length;
    let a = 100 - failures * 1.6 - (m.state === "fault" ? 11 : m.state === "maintenance" ? 5 : 0);
    return Math.max(72, Math.min(100, Math.round(a * 10) / 10));
  }

  // MTTR global (heures) — moyenne des durées réelles d'interventions correctives terminées
  function computeMTTR(state) {
    const done = state.interventions.filter(i => i.status === "completed" && i.kind === "corrective");
    if (!done.length) return null;
    const sum = done.reduce((s, i) => s + (i.actualDuration ?? i.duration), 0);
    return Math.round((sum / done.length) * 10) / 10;
  }

  // Heures écoulées depuis le signalement (pour le chronomètre)
  function downtimeHours(fault, ref) {
    const r = ref || NOW;
    return Math.max(0, (r - new Date(fault.reportedAt)) / 3600000);
  }

  // Escalade : panne critique non prise en charge depuis > 2h
  function isEscalated(state, fault) {
    if (fault.severity !== "critical" || fault.status === "resolved") return false;
    if (fault.status === "in-progress" || fault.takenAt) return false;
    return downtimeHours(fault) > 2;
  }

  // Prédiction de pannes : machines à risque selon fréquence & MTBF
  function predictions(state) {
    return state.machines
      .filter(m => m.state === "ok")
      .map(m => {
        const fs = state.faults.filter(f => f.machineId === m.id);
        if (fs.length < 2) return null;
        const mtbf = machineMTBF(state, m.id) || 60;
        const last = fs.map(f => new Date(f.reportedAt)).sort((a, b) => b - a)[0];
        const daysSince = Math.floor((NOW - last) / 86400000);
        const eta = Math.max(2, mtbf - daysSince);
        const risk = fs.length >= 4 ? "high" : fs.length >= 3 ? "medium" : "low";
        return { machine: m, eta, faults: fs.length, risk };
      })
      .filter(Boolean)
      .sort((a, b) => a.eta - b.eta)
      .slice(0, 4);
  }

  // Top machines les plus en panne
  function topFaultMachines(state, n = 5) {
    return state.machines
      .map(m => ({ machine: m, count: state.faults.filter(f => f.machineId === m.id).length }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  // Charge de travail d'un technicien (interventions actives)
  function technicianWorkload(state, name) {
    const active = state.interventions.filter(i => i.technician === name && i.status !== "completed");
    const hours = active.reduce((s, i) => s + i.duration, 0);
    return { count: active.length, hours };
  }

  // 14-day intervention trend
  function trend14(state) {
    const days = [];
    const today = new Date("2026-05-21");
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const interventions = state.interventions.filter(x => x.scheduledFor === iso).length;
      const faults = state.faults.filter(x => x.reportedAt.slice(0, 10) === iso).length;
      days.push({ date: iso, label: d.getDate(), interventions, faults });
    }
    return days;
  }

  // Faults by type breakdown
  function faultsByType(state) {
    const counts = {};
    state.faults.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }

  // History combined
  function history(state) {
    const items = [];
    state.faults.forEach(f => {
      items.push({
        kind: "fault",
        timestamp: f.reportedAt,
        machineId: f.machineId,
        title: `Panne ${f.severity === "critical" ? "critique" : f.severity === "medium" ? "moyenne" : "mineure"} — ${f.type}`,
        description: f.description,
        meta: `${f.id} · ${f.reportedBy}`,
        severity: f.severity,
        status: f.status,
      });
    });
    state.interventions.forEach(i => {
      items.push({
        kind: "intervention",
        timestamp: i.scheduledFor + "T08:00:00",
        machineId: i.machineId,
        title: `Intervention ${i.kind} — ${i.technician}`,
        description: i.description,
        meta: `${i.id} · ${i.duration}h`,
        severity: "info",
        status: i.status,
      });
    });
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return items;
  }

  // ─── Planification / rappels helpers ───────────────────────────────────────
  function addWeeksISO(iso, weeks) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
  }
  function minusDaysISO(iso, days) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
  function daysUntil(iso) {
    return Math.round((new Date(iso + "T00:00:00") - new Date(NOW.toISOString().slice(0, 10) + "T00:00:00")) / 86400000);
  }
  // Rappels à venir : règles actives dont la fenêtre de rappel est ouverte ou proche
  function upcomingReminders(state) {
    return (state.planRules || [])
      .filter(r => r.active !== false)
      .map(r => {
        const remindOn = minusDaysISO(r.nextDue, r.reminderLead || 2);
        return { rule: r, remindOn, dueIn: daysUntil(r.nextDue), remindIn: daysUntil(remindOn) };
      })
      .sort((a, b) => a.dueIn - b.dueIn);
  }
  function nextReminderId(state) {
    const nums = (state.reminders || []).map(x => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
    return "RM-" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  }
  function nextRuleId(state) {
    const nums = (state.planRules || []).map(x => parseInt(x.id.replace(/\D/g, ""), 10) || 0);
    return "PM-" + String(Math.max(0, ...nums) + 1).padStart(2, "0");
  }

  window.MFData = {
    SEED, load, save, reset, now,
    machineById,
    computeKPIs, healthScore, machineMTBF, availability, computeMTTR,
    downtimeHours, isEscalated, predictions, topFaultMachines, technicianWorkload,
    trend14, faultsByType, history,
    addWeeksISO, minusDaysISO, daysUntil, upcomingReminders, nextReminderId, nextRuleId,
  };
})();
