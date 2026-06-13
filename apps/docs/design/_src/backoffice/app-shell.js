// app.jsx — Main MaintFlow application
const { useState: useAS, useEffect: useAE, useMemo: useAM } = React;
const { Sidebar, Topbar, NotificationsDrawer, Toast } = window.MFShell;
const { Dashboard } = window.MFDashboard;
const { MachinesScreen, FaultsScreen, InterventionsScreen, HistoryScreen } = window.MFScreens;
const { MachineDetail, SettingsScreen } = window.MFDetail;
const { LoginScreen, UsersScreen } = window.MFAuth;
const { TechniciansScreen, PlanningScreen } = window.MFModules;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "logoVariant": "brand",
  "sidebarCollapsed": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setStateRaw] = useAS(() => window.MFData.load());
  const [lang, setLang] = useAS("fr");
  const [route, setRoute] = useAS("dashboard");
  const [detailId, setDetailId] = useAS(null);
  const [notifsOpen, setNotifsOpen] = useAS(false);
  const [notifs, setNotifs] = useAS(state.notifications || []);
  const [toasts, setToasts] = useAS([]);
  const [authed, setAuthed] = useAS(() => {
    try { return sessionStorage.getItem("mf_authed") === "1"; } catch (e) { return false; }
  });

  const setState = (updater) => {
    setStateRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      window.MFData.save(next);
      return next;
    });
  };

  const tr = window.MFI18n[lang];

  // Apply theme
  useAE(() => {
    document.documentElement.setAttribute("data-theme", t.dark ? "dark" : "light");
  }, [t.dark]);

  const toast = (text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, text }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 2200);
  };

  const goDetail = (id) => { setDetailId(id); setRoute("detail"); };
  const goRoute = (r) => { setRoute(r); setDetailId(null); };

  const kpis = useAM(() => window.MFData.computeKPIs(state), [state]);
  const unread = notifs.filter(n => !n.read).length;

  if (!authed) {
    return (
      <>
        <LoginScreen t={tr} logoVariant={t.logoVariant} lang={lang} setLang={setLang}
          onLogin={() => { try { sessionStorage.setItem("mf_authed", "1"); } catch(e){} setAuthed(true); }}/>
        <TweaksPanel title="Tweaks">
          <TweakSection label="Apparence"/>
          <TweakRadio label="Thème" value={t.dark ? "dark" : "light"}
            options={["light", "dark"]}
            onChange={(v) => setTweak("dark", v === "dark")}/>
          <TweakSection label="Logo"/>
          <TweakRadio label="Variante" value={t.logoVariant}
            options={["brand", "flow", "gear", "bracket"]}
            onChange={(v) => setTweak("logoVariant", v)}/>
        </TweaksPanel>
      </>
    );
  }

  return (
    <div className={"app" + (t.sidebarCollapsed ? " collapsed" : "")}>
      <Sidebar route={route === "detail" ? "machines" : route}
        setRoute={goRoute} t={tr} kpis={kpis} logoVariant={t.logoVariant} collapsed={t.sidebarCollapsed}
        onLogout={() => { try { sessionStorage.removeItem("mf_authed"); } catch(e){} setAuthed(false); setRoute("dashboard"); }}/>
      <div className="main">
        <Topbar route={route} t={tr} lang={lang} setLang={setLang}
          openNotifs={() => setNotifsOpen(o => !o)} openSearch={() => {}}
          unread={unread}/>

        <div className="content">
          {route === "dashboard" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.dashboard.title}</h1>
                  <p>{tr.dashboard.subtitle}</p>
                </div>
              </div>
              <Dashboard state={state} t={tr} goMachine={goDetail} goRoute={goRoute}/>
            </>
          )}
          {route === "machines" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.machines.title}</h1>
                  <p>{tr.machines.subtitle}</p>
                </div>
              </div>
              <MachinesScreen state={state} setState={setState} t={tr} toast={toast} goDetail={goDetail}/>
            </>
          )}
          {route === "faults" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.faults.title}</h1>
                  <p>{tr.faults.subtitle}</p>
                </div>
              </div>
              <FaultsScreen state={state} setState={setState} t={tr} toast={toast} goDetail={goDetail}/>
            </>
          )}
          {route === "interventions" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.interventions.title}</h1>
                  <p>{tr.interventions.subtitle}</p>
                </div>
              </div>
              <InterventionsScreen state={state} setState={setState} t={tr} toast={toast} goDetail={goDetail}/>
            </>
          )}
          {route === "history" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.history.title}</h1>
                  <p>{tr.history.subtitle}</p>
                </div>
              </div>
              <HistoryScreen state={state} t={tr} goDetail={goDetail}/>
            </>
          )}
          {route === "planning" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.planning.title}</h1>
                  <p>{tr.planning.subtitle}</p>
                </div>
              </div>
              <PlanningScreen state={state} setState={setState} t={tr} toast={toast} goDetail={goDetail}/>
            </>
          )}
          {route === "technicians" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.technicians.title}</h1>
                  <p>{tr.technicians.subtitle}</p>
                </div>
              </div>
              <TechniciansScreen state={state} t={tr} toast={toast} goDetail={goDetail}/>
            </>
          )}
          {route === "settings" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.settings.title}</h1>
                  <p>{tr.settings.subtitle}</p>
                </div>
              </div>
              <SettingsScreen state={state} setState={setState} t={tr} toast={toast}
                logoVariant={t.logoVariant} setLogoVariant={(v) => setTweak("logoVariant", v)}/>
            </>
          )}
          {route === "users" && (
            <>
              <div className="page-head">
                <div>
                  <h1>{tr.users.title}</h1>
                  <p>{tr.users.subtitle}</p>
                </div>
              </div>
              <UsersScreen state={state} setState={setState} t={tr} toast={toast}/>
            </>
          )}
          {route === "detail" && detailId && (
            <MachineDetail machineId={detailId} state={state} setState={setState} t={tr} toast={toast} goBack={() => goRoute("machines")}/>
          )}
        </div>
      </div>

      <NotificationsDrawer open={notifsOpen} onClose={() => setNotifsOpen(false)} items={notifs}
        onMarkAll={() => setNotifs(notifs.map(n => ({ ...n, read: true })))} t={tr}/>

      <Toast messages={toasts}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Apparence"/>
        <TweakRadio label="Thème" value={t.dark ? "dark" : "light"}
          options={["light", "dark"]}
          onChange={(v) => setTweak("dark", v === "dark")}/>
        <TweakToggle label="Sidebar réduite" value={t.sidebarCollapsed}
          onChange={(v) => setTweak("sidebarCollapsed", v)}/>
        <TweakSection label="Logo"/>
        <TweakRadio label="Variante" value={t.logoVariant}
          options={["brand", "flow", "gear", "bracket"]}
          onChange={(v) => setTweak("logoVariant", v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
