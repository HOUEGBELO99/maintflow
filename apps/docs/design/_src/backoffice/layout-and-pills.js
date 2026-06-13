// shell.jsx — App shell: Sidebar, Topbar, Modal, NotificationsDrawer, Toast

const { useState, useEffect, useRef, useMemo } = React;
const { Icon, Logo, Wordmark } = window.MFIcons;

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ route, setRoute, t, kpis, logoVariant, collapsed, onLogout }) {
  const items = [
    { key: "dashboard", icon: "dashboard", label: t.nav.dashboard, group: "main" },
    { key: "machines", icon: "machine", label: t.nav.machines, group: "manage", count: kpis.total },
    { key: "faults", icon: "fault", label: t.nav.faults, group: "manage", count: kpis.activeFaults },
    { key: "interventions", icon: "wrench", label: t.nav.interventions, group: "manage", count: kpis.inProgressInt + kpis.plannedInt },
    { key: "planning", icon: "calendar", label: t.nav.planning, group: "manage" },
    { key: "technicians", icon: "user", label: t.nav.technicians, group: "other" },
    { key: "history", icon: "history", label: t.nav.history, group: "other" },
    { key: "users", icon: "shield", label: t.nav.users, group: "other" },
    { key: "settings", icon: "settings", label: t.nav.settings, group: "other" },
  ];
  const groups = [
    { key: "main", label: t.nav.main },
    { key: "manage", label: t.nav.manage },
    { key: "other", label: t.nav.other },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo variant={logoVariant} size={32}/>
        {!collapsed && (
          <span className="wordmark">Maint<em>Flow</em></span>
        )}
      </div>
      <nav className="nav">
        {groups.map(g => (
          <React.Fragment key={g.key}>
            {!collapsed && <div className="nav-section">{g.label}</div>}
            {items.filter(it => it.group === g.key).map(it => (
              <a key={it.key} className={"nav-item" + (route === it.key ? " active" : "")} onClick={() => setRoute(it.key)} title={it.label}>
                <span className="nav-icon"><Icon name={it.icon} size={18}/></span>
                {!collapsed && <span className="nav-label">{it.label}</span>}
                {!collapsed && it.count != null && it.count > 0 && <span className="nav-count">{it.count}</span>}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">LM</div>
        {!collapsed && (
          <div className="sidebar-foot-text" style={{ flex: 1 }}>
            <b>Laurent Moreau</b><br/>
            <span>Admin général</span>
          </div>
        )}
        {onLogout && (
          <button className="icon-btn" onClick={onLogout} title="Se déconnecter" style={{ color: "var(--nav-text-muted)" }}>
            <Icon name="arrowRight" size={16}/>
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({ route, t, lang, setLang, openNotifs, openSearch, unread, onAdd, addLabel }) {
  const labels = {
    dashboard: t.nav.dashboard,
    machines: t.nav.machines,
    faults: t.nav.faults,
    interventions: t.nav.interventions,
    planning: t.nav.planning,
    technicians: t.nav.technicians,
    history: t.nav.history,
    users: t.nav.users,
    settings: t.nav.settings,
    detail: `${t.nav.machines} / ${t.common.details}`,
  };
  return (
    <header className="topbar">
      <div className="topbar-label">
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-bright)", boxShadow: "0 0 6px var(--brand-bright)" }}/>
        {labels[route]}
      </div>
      <div className="topbar-spacer"/>
      <div className="search">
        <Icon name="search" size={15}/>
        <input placeholder={t.common.search} onFocus={openSearch} />
        <kbd>⌘K</kbd>
      </div>
      <div className="lang-toggle">
        <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      </div>
      <button className="icon-btn" title={t.common.notifications} onClick={openNotifs}>
        <Icon name="bell" size={18}/>
        {unread > 0 && <span className="dot"/>}
      </button>
      {addLabel && (
        <button className="btn btn-bright" onClick={onAdd}>
          <Icon name="plus" size={14}/>
          {addLabel}
        </button>
      )}
    </header>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, wide, footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={"modal" + (wide ? " wide" : "")} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Notifications drawer ──────────────────────────────────────────────────
function NotificationsDrawer({ open, onClose, items, onMarkAll, t }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest("[data-notif-trigger]")) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);
  if (!open) return null;
  const dotColor = (lvl) => lvl === "critical" ? "var(--critical)" : lvl === "warning" ? "var(--warning)" : "var(--brand-bright)";
  return (
    <div className="drawer" ref={ref}>
      <div className="drawer-h">
        <h3>{t.common.notifications}</h3>
        <button className="btn btn-sm btn-ghost" onClick={onMarkAll}>{t.common.markAllRead}</button>
      </div>
      <div className="drawer-list">
        {items.map(n => (
          <div className="notif" key={n.id} style={{ opacity: n.read ? 0.55 : 1 }}>
            <span className="ndot" style={{ background: dotColor(n.level), boxShadow: n.level === "critical" ? "0 0 8px var(--critical)" : "none" }}/>
            <div className="ntext">
              <span dangerouslySetInnerHTML={{__html: n.text}}/>
              <div className="ntime">{n.time}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="empty">{t.common.none}</div>}
      </div>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ messages }) {
  return (
    <div className="toast-stack">
      {messages.map(m => (
        <div className="toast" key={m.id}>
          <span className="ok-dot"/>
          <span>{m.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pill helpers ───────────────────────────────────────────────────────────
function Pill({ tone, dot, children }) {
  const cls = "pill " + (tone ? "pill-" + tone : "");
  return <span className={cls}>{dot && <span className="pill-dot"/>}{children}</span>;
}
function StatePill({ state, t }) {
  const map = { ok: "ok", maintenance: "warn", fault: "crit" };
  return <Pill tone={map[state]} dot>{t.state[state]}</Pill>;
}
function SeverityPill({ severity, t }) {
  const map = { critical: "crit", medium: "warn", low: "ok" };
  return <Pill tone={map[severity]}>{t.severity[severity]}</Pill>;
}
function StatusPill({ status, t }) {
  const map = { pending: "warn", "in-progress": "info", resolved: "ok", planned: "info", completed: "ok" };
  return <Pill tone={map[status]}>{t.status[status]}</Pill>;
}

window.MFShell = { Sidebar, Topbar, Modal, NotificationsDrawer, Toast, Pill, StatePill, SeverityPill, StatusPill };
