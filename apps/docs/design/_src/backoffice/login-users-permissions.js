// auth-users.jsx — Login screen + Users & Roles management

const { useState: useAU, useEffect: useAUE, useMemo: useAUM } = React;
const { Icon: UIcon, Logo: ULogo, Wordmark: UWordmark } = window.MFIcons;
const { Modal: UModal, Pill: UPill } = window.MFShell;
const { fmtDateTime: uFmtDT } = window.MFScreens;

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN (Desktop)
// ═══════════════════════════════════════════════════════════════════════════
function LoginScreen({ t, onLogin, logoVariant, lang, setLang }) {
  const [email, setEmail] = useAU("l.moreau@usine.fr");
  const [password, setPassword] = useAU("••••••••");
  const [loading, setLoading] = useAU(false);

  const submit = (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ email }); }, 700);
  };

  return (
    <div className="login-shell">
      <div className="login-aside">
        <div className="login-aside-grid"/>
        <div className="login-aside-content">
          <UWordmark variant={logoVariant} color="#fff" accent="#00FF00" size={36}/>
          <div className="login-aside-quote">
            <div className="login-aside-eyebrow">— Industrie 4.0</div>
            <h2>Toutes vos machines. Tous vos techniciens. Un seul flux.</h2>
            <p>{t.app.tagline}. Centralisez pannes, interventions et historique de votre atelier en temps réel.</p>
          </div>
          <div className="login-aside-stats">
            <div><div className="login-stat-v">128</div><div className="login-stat-l">Machines</div></div>
            <div><div className="login-stat-v">99.4%</div><div className="login-stat-l">Disponibilité</div></div>
            <div><div className="login-stat-v">12 min</div><div className="login-stat-l">MTTR moyen</div></div>
          </div>
        </div>
      </div>

      <div className="login-main">
        <div className="login-top">
          <div className="lang-toggle">
            <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="login-form-brand">
            <ULogo variant={logoVariant} size={48}/>
          </div>
          <h1>{t.login.welcome}</h1>
          <p className="login-sub">{t.login.sub}</p>

          <div className="field">
            <label>{t.login.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.fr" autoFocus/>
          </div>
          <div className="field">
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              {t.login.password}
              <a style={{ color: "var(--brand-deep)", fontWeight: 500, cursor: "pointer" }}>{t.login.forgot}</a>
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
          </div>

          <button type="submit" className="btn btn-bright" style={{ width: "100%", justifyContent: "center", padding: "12px 18px", fontSize: 14 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: "var(--brand-deep)" }}/> : <UIcon name="arrowRight" size={14}/>}
            {t.login.signin}
          </button>

          <div className="login-sep"><span>ou</span></div>

          <button type="button" className="btn" style={{ width: "100%", justifyContent: "center", padding: "11px 18px" }}>
            <UIcon name="bolt" size={14}/> {t.login.sso}
          </button>

          <div className="login-foot">
            <UIcon name="check" size={12} style={{ color: "var(--brand)" }}/>
            <span>{t.login.secure}</span>
          </div>

          <div className="login-invite">
            {t.login.invited} <a style={{ color: "var(--brand-deep)", fontWeight: 600, cursor: "pointer" }}>{t.login.useInvite}</a>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS & ROLES MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
const ROLES = ["admin", "chef_maintenance", "chef_atelier", "technicien", "operateur"];
const PERMISSIONS = [
  { key: "web", label: "Tableau de bord web (desktop)", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { key: "mobile", label: "Application mobile terrain", roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 1, operateur: 1 } },
  { key: "view_machines", label: "Consulter les machines", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 1, operateur: 1 } },
  { key: "edit_machines", label: "Ajouter / modifier des machines", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { key: "report_faults", label: "Déclarer une panne", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 1, operateur: 1 } },
  { key: "close_work", label: "Clôturer panne / intervention", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 1, operateur: 0 } },
  { key: "planning", label: "Planifier les interventions", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { key: "parts", label: "Gérer les pièces de rechange", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { key: "kpi", label: "Voir KPI & rapports", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { key: "export", label: "Exporter les données", roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { key: "manage_users", label: "Gérer utilisateurs & rôles", roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { key: "settings", label: "Modifier les paramètres", roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 0, operateur: 0 } },
];

function UsersScreen({ state, setState, t, toast }) {
  const [tab, setTab] = useAU("team");
  const [inviting, setInviting] = useAU(false);
  const [confirmRevoke, setConfirmRevoke] = useAU(null);

  const sendInvite = (data) => {
    const id = "INV-" + String(state.invitations.length + 1).padStart(3, "0");
    setState(s => ({
      ...s,
      invitations: [...s.invitations, { id, ...data, invitedBy: "L. Moreau", sentAt: new Date().toISOString(), status: "pending" }],
    }));
    toast(t.users.invSent + " — " + data.email);
    setInviting(false);
  };

  const changeRole = (user, role) => {
    setState(s => ({ ...s, users: s.users.map(u => u.id === user.id ? { ...u, role } : u) }));
    toast(`Rôle de ${user.name} → ${t.users.roles[role]}`);
  };

  const revoke = (user) => {
    setState(s => ({ ...s, users: s.users.map(u => u.id === user.id ? { ...u, status: "suspended" } : u) }));
    toast(`Accès révoqué pour ${user.name}`);
  };

  const resend = (inv) => toast("Invitation renvoyée à " + inv.email);

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard icon="user" label="Utilisateurs totaux" value={state.users.length} sub={`${state.users.filter(u=>u.status==="active").length} actifs`}/>
        <StatCard icon="shield" label="Accès web" value={state.users.filter(u=>["admin","chef_maintenance","chef_atelier"].includes(u.role)).length} sub="Dashboard desktop"/>
        <StatCard icon="mobile" label="Accès mobile" value={state.users.filter(u=>["technicien","operateur"].includes(u.role)).length} sub="App terrain"/>
        <StatCard icon="bell" label="Invitations en attente" value={state.invitations.filter(i=>i.status==="pending").length} sub="À accepter" accent="var(--warning)"/>
      </div>

      {/* Tabs */}
      <div className="section-tabs">
        <button className={"section-tab " + (tab === "team" ? "on" : "")} onClick={() => setTab("team")}>
          {t.users.team} <span style={{ marginLeft: 6, color: "var(--text-faint)", fontWeight: 500 }}>{state.users.length}</span>
        </button>
        <button className={"section-tab " + (tab === "invites" ? "on" : "")} onClick={() => setTab("invites")}>
          {t.users.invitedTab} <span style={{ marginLeft: 6, color: "var(--text-faint)", fontWeight: 500 }}>{state.invitations.length}</span>
        </button>
        <button className={"section-tab " + (tab === "perms" ? "on" : "")} onClick={() => setTab("perms")}>
          {t.users.permTitle}
        </button>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-bright" style={{ alignSelf: "center", marginBottom: 6 }} onClick={() => setInviting(true)}>
          <UIcon name="plus" size={14}/> {t.users.invite}
        </button>
      </div>

      {tab === "team" && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t.users.cols.name}</th>
                <th>{t.users.cols.email}</th>
                <th>{t.users.cols.role}</th>
                <th>{t.users.cols.workshop}</th>
                <th>{t.users.cols.lastLogin}</th>
                <th>{t.users.cols.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ background: `linear-gradient(135deg, ${u.color}, var(--brand-deep))`, width: 30, height: 30, fontSize: 11 }}>{u.initials}</div>
                      <div className="cell-main">{u.name}</div>
                    </div>
                  </td>
                  <td className="cell-sub">{u.email}</td>
                  <td>
                    <select className="pill" style={{ cursor: "pointer", border: 0, fontWeight: 600 }} value={u.role} onChange={e => changeRole(u, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{t.users.roles[r]}</option>)}
                    </select>
                  </td>
                  <td>{u.workshop}</td>
                  <td className="cell-sub">{uFmtDT(u.lastLogin)}</td>
                  <td>
                    {u.status === "active" && <UPill tone="ok" dot>{t.users.active}</UPill>}
                    {u.status === "suspended" && <UPill tone="crit">{t.users.suspended}</UPill>}
                    {u.status === "pending" && <UPill tone="warn">{t.users.pending}</UPill>}
                  </td>
                  <td className="actions">
                    <button className="icon-btn" title={t.users.revoke} onClick={() => setConfirmRevoke(u)}><UIcon name="close" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "invites" && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>{t.users.cols.email}</th>
                <th>{t.users.cols.role}</th>
                <th>{t.users.cols.workshop}</th>
                <th>Envoyée</th>
                <th>Par</th>
                <th>{t.users.cols.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.invitations.map(inv => (
                <tr key={inv.id}>
                  <td className="cell-id">{inv.id}</td>
                  <td className="cell-main">{inv.email}</td>
                  <td><UPill tone={inv.role === "admin" ? "info" : "warn"}>{t.users.roles[inv.role]}</UPill></td>
                  <td className="cell-sub">{inv.workshop}</td>
                  <td className="cell-sub">{uFmtDT(inv.sentAt)}</td>
                  <td className="cell-sub">{inv.invitedBy}</td>
                  <td>
                    {inv.status === "pending" && <UPill tone="warn" dot>{t.users.pending}</UPill>}
                    {inv.status === "accepted" && <UPill tone="ok">Acceptée</UPill>}
                  </td>
                  <td className="actions">
                    {inv.status === "pending" && (
                      <button className="btn btn-sm btn-ghost" onClick={() => resend(inv)}>
                        <UIcon name="refresh" size={12}/> Renvoyer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {state.invitations.length === 0 && <tr><td colSpan="8" className="empty">{t.common.none}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "perms" && <PermissionsMatrix t={t}/>}

      <InviteForm open={inviting} onClose={() => setInviting(false)} onSave={sendInvite} t={t} state={state}/>

      <window.MFScreens.ConfirmDialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)}
        onConfirm={() => revoke(confirmRevoke)} danger title={`Révoquer l'accès de ${confirmRevoke?.name} ?`}
        body="L'utilisateur ne pourra plus se connecter, mais son historique est conservé."/>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="kpi">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-50)", color: "var(--brand-deep)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <UIcon name={icon} size={14}/>
        </div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value tabular" style={{ color: accent || "var(--text)", fontSize: 30 }}>{value}</div>
      <div className="kpi-delta">{sub}</div>
    </div>
  );
}

function InviteForm({ open, onClose, onSave, t, state }) {
  const [form, setForm] = useAU({ email: "", role: "technicien", workshop: "Atelier A", message: "" });
  useAUE(() => { if (open) setForm({ email: "", role: "technicien", workshop: "Atelier A", message: "" }); }, [open]);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <UModal open={open} onClose={onClose} title={t.users.inviteTitle} subtitle={t.users.inviteSub} wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-bright" onClick={() => onSave(form)} disabled={!form.email}>
            <UIcon name="arrowRight" size={14}/> {t.users.send}
          </button>
        </>
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>{t.users.cols.email}</label>
          <input type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="prenom.nom@entreprise.fr" autoFocus/>
        </div>
        <div className="field-row cols-2">
          <div className="field">
            <label>{t.users.cols.role}</label>
            <select value={form.role} onChange={e => upd("role", e.target.value)}>
              <option value="admin">{t.users.roles.admin} — accès total</option>
              <option value="chef_maintenance">{t.users.roles.chef_maintenance} — dashboard + planification</option>
              <option value="chef_atelier">{t.users.roles.chef_atelier} — consultation</option>
              <option value="technicien">{t.users.roles.technicien} — app mobile</option>
              <option value="operateur">{t.users.roles.operateur} — signalement mobile</option>
            </select>
          </div>
          <div className="field">
            <label>{t.users.cols.workshop}</label>
            <select value={form.workshop} onChange={e => upd("workshop", e.target.value)}>
              <option>Tous</option>
              <option>Atelier A</option>
              <option>Atelier B</option>
              <option>Atelier C</option>
              <option>Atelier D</option>
              <option>Utilités</option>
              <option>Direction</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>{t.users.message}</label>
          <textarea rows="3" value={form.message} onChange={e => upd("message", e.target.value)} placeholder="Bienvenue dans l'équipe ! Voici ton accès MaintFlow…"/>
        </div>
        <div style={{ background: "var(--bg-soft)", border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 12, fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <UIcon name="info" size={16} style={{ flex: "0 0 16px", color: "var(--brand)" }}/>
          <div>
            L'utilisateur recevra un e-mail avec un lien valable <b>72 heures</b> pour activer son compte et choisir son mot de passe. Pour les techniciens, l'invitation inclut le lien de téléchargement de l'<b>app mobile MaintFlow</b>.
          </div>
        </div>
      </div>
    </UModal>
  );
}

function PermissionsMatrix({ t }) {
  const toneFor = { admin: "info", chef_maintenance: "ok", chef_atelier: "mute", technicien: "warn", operateur: "crit" };
  return (
    <div className="card">
      <div className="card-h"><div><h3>{t.users.permTitle}</h3><div className="sub">{t.users.permSub} — 5 profils</div></div></div>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Permission</th>
              {ROLES.map(r => (
                <th key={r} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                  <UPill tone={toneFor[r]}>{t.users.roles[r]}</UPill>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(p => (
              <tr key={p.key}>
                <td>{p.label}</td>
                {ROLES.map(r => (
                  <td key={r} style={{ textAlign: "center" }}>
                    {p.roles[r] ? <UIcon name="check" size={16} style={{ color: "var(--ok)" }}/> : <span style={{ color: "var(--text-faint)" }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.MFAuth = { LoginScreen, UsersScreen };
