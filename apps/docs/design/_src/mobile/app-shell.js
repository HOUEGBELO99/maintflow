// mobile-app.jsx — MaintFlow mobile, interactive single-phone prototype
const { LoginScreen, HomeScreen, MissionsScreen, DetailScreen, ScanScreen, ReportScreen, ChecklistScreen, CloseWorkScreen, PdfReportScreen, AlertsScreen, ProfileScreen } = window.MFMobileScreens;
const { IOSDevice } = window;
const { useState: useMA, useRef: useMR } = React;

// Shared work-order state for the intervention flow (checklist → rapport → PDF)
const WORK_PLAN_MIN = 180; // durée prévue : 3 h
function freshWork() {
  return {
    intId: "I-1078", machineId: "MCH-002", machineName: "Convoyeur Ligne 2",
    workshop: "Atelier A", tech: "S. Diallo", planMin: WORK_PLAN_MIN,
    startedAt: Date.now() - 168 * 60000, // simule ~2h48 déjà écoulées (chrono en cours)
    endedAt: null, tasks: [], signed: false, signedAt: null,
  };
}

const SCREENS = {
  login: LoginScreen,
  home: HomeScreen,
  missions: MissionsScreen,
  detail: DetailScreen,
  scan: ScanScreen,
  report: ReportScreen,
  checklist: ChecklistScreen,
  close: CloseWorkScreen,
  pdf: PdfReportScreen,
  alerts: AlertsScreen,
  profile: ProfileScreen,
};

const STORE = "mf_mobile_screen";
const DEVICE_W = 402, DEVICE_H = 874;

function MobileApp() {
  const [stack, setStack] = useMA(() => {
    try { const s = localStorage.getItem(STORE); return s && SCREENS[s] ? [s] : ["login"]; }
    catch (e) { return ["login"]; }
  });
  const screen = stack[stack.length - 1];
  const persist = (sc) => { try { localStorage.setItem(STORE, sc); } catch (e) {} };

  // Responsive: scale the fixed-size phone so it always fits — and grows to fill big screens
  const [scale, setScale] = useMA(1);
  React.useEffect(() => {
    const compute = () => {
      const isNarrow = window.innerWidth < 560;
      const marginX = isNarrow ? 0 : 40;     // edge-to-edge on real phones
      const marginY = isNarrow ? 0 : 40;
      const footer = isNarrow ? 0 : 46;       // caption row only on larger screens
      const sw = (window.innerWidth - marginX) / DEVICE_W;
      const sh = (window.innerHeight - marginY - footer) / DEVICE_H;
      const maxUp = isNarrow ? 1 : 1.8;       // allow the simulator to grow on desktop
      setScale(Math.max(0.4, Math.min(maxUp, sw, sh)));
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => { window.removeEventListener("resize", compute); window.removeEventListener("orientationchange", compute); };
  }, []);

  const nav = {
    go: (to) => setStack(s => { persist(to); return [...s, to]; }),
    back: () => setStack(s => { const n = s.length > 1 ? s.slice(0, -1) : s; persist(n[n.length - 1]); return n; }),
    reset: (to) => setStack(() => { persist(to); return [to]; }),
    toast: (msg) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2000);
    },
  };

  const Screen = SCREENS[screen] || HomeScreen;
  const showCaption = scale > 0.7 && typeof window !== "undefined" && window.innerWidth >= 560;
  const [toast, setToast] = useMA(null);
  const toastTimer = useMR(null);
  const [work, setWork] = useMA(freshWork);
  nav.work = work;
  nav.setWork = setWork;
  nav.startWork = () => setWork(freshWork());

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 0, boxSizing: "border-box" }}>
      {/* Stage: occupies the scaled footprint so the caption flows beneath */}
      <div style={{ width: DEVICE_W * scale, height: DEVICE_H * scale, position: "relative", flexShrink: 0 }}>
        <div style={{ width: DEVICE_W, height: DEVICE_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
          <IOSDevice width={DEVICE_W} height={DEVICE_H} dark={false}>
            <div key={screen} className="mf-fade" style={{ height: "100%" }}>
              <Screen nav={nav}/>
            </div>
            {/* Toast — inside device, above tab bar */}
            {toast && (
              <div style={{
                position: "absolute", left: 16, right: 16, bottom: 104, zIndex: 200,
                display: "flex", justifyContent: "center", pointerEvents: "none",
              }}>
                <div style={{
                  background: "#0E1410", color: "#fff",
                  fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500,
                  padding: "11px 16px", borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                  display: "flex", alignItems: "center", gap: 9, maxWidth: "100%",
                  animation: "mfToast 0.22s cubic-bezier(.2,.8,.2,1)",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00FF00", boxShadow: "0 0 8px #00FF00", flexShrink: 0 }}/>
                  {toast}
                </div>
              </div>
            )}
          </IOSDevice>
        </div>
      </div>

      {showCaption && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: '"DM Sans", sans-serif' }}>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>Prototype interactif — naviguez en cliquant</span>
          <button onClick={() => nav.reset("login")} style={{
            fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            color: "#0E1410", background: "#00FF00", border: 0,
            borderRadius: 100, padding: "5px 12px", cursor: "pointer",
          }}>Recommencer</button>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MobileApp/>);
