// mobile-screens.jsx — Brand-aligned screens (matches MaintFlow desktop DNA)
const { C, FONT, PhoneScreen, Dot, Pill, MonoId, Spark, MiniBars, KpiTile, BottomTabs, Mark, BrandEmblem, Wordmark } = window.MFMobile;

// ── Local helpers ─────────────────────────────────────────────────────────
const H1 = ({ children, style = {} }) => <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.1, ...style }}>{children}</h1>;
const Eyebrow = ({ children, style = {} }) => <div style={{ fontSize: 10.5, fontWeight: 600, color: C.mute, letterSpacing: "0.08em", textTransform: "uppercase", ...style }}>{children}</div>;
const Label = ({ children, style = {} }) => <div style={{ fontSize: 11, fontWeight: 600, color: C.mute, marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase", ...style }}>{children}</div>;
const IconBtn = ({ children, style = {}, badge = false, onClick }) => (
  <button onClick={onClick} style={{
    width: 40, height: 40, borderRadius: 10,
    background: "transparent", border: "none", color: C.ink,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: 0, position: "relative", cursor: "pointer", ...style,
  }}>
    {children}
    {badge && (
      <span style={{
        position: "absolute", top: 7, right: 7,
        width: 8, height: 8, borderRadius: "50%",
        background: C.brandBright, border: "2px solid #fff",
        boxShadow: `0 0 6px ${C.brandBright}`,
      }}/>
    )}
  </button>
);

const Stroke = ({ children, size = 18, w = 1.5, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const SVG = {
  arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  chevronLeft: <polyline points="15 18 9 12 15 6"/>,
  chevronRight: <polyline points="9 18 15 12 9 6"/>,
  search: <><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  qr: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  check: <polyline points="20 6 9 17 4 12"/>,
  more: <><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/></>,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9 1.6 1.6 0 0 0 4.3 7.3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6 1.6 1.6 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L21 12a8 8 0 0 1-11 11l-7-7a8 8 0 0 1 11-11z"/>,
  factory: <><path d="M2 20h20"/><path d="M4 20V8l6 4V8l6 4V8l4 4v8"/></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  pen: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  package: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
};

// WhatsApp glyph (filled)
function WhatsAppGlyph({ size = 18, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.6 6.32A8 8 0 0 0 4.3 16.6L3 21l4.5-1.18a8 8 0 0 0 3.83.97h.01A8 8 0 0 0 17.6 6.32zM11.34 18.5a6.6 6.6 0 0 1-3.38-.92l-.24-.15-2.5.66.67-2.44-.16-.25a6.65 6.65 0 1 1 5.61 3.1zm3.65-4.98c-.2-.1-1.18-.58-1.36-.65-.18-.07-.32-.1-.45.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05a5.43 5.43 0 0 1-2.7-2.36c-.2-.35.2-.32.58-1.08.06-.13.03-.24-.02-.34-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.34l-.39-.01c-.13 0-.34.05-.52.25-.18.2-.68.67-.68 1.62 0 .96.7 1.88.8 2.01.1.13 1.38 2.1 3.34 2.95.47.2.83.32 1.11.41.47.15.9.13 1.23.08.38-.06 1.18-.48 1.34-.95.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23z"/>
    </svg>
  );
}

// ── Live downtime chronometer (ticks every second) ────────────────────────
function LiveChrono({ baseMin = 0, color = C.crit, size = 13 }) {
  const [s, setS] = React.useState(0);
  React.useEffect(() => { const t0 = Date.now(); const id = setInterval(() => setS(Math.floor((Date.now() - t0) / 1000)), 1000); return () => clearInterval(id); }, []);
  const total = baseMin * 60 + s;
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
  return <span style={{ fontFamily: FONT.mono, fontWeight: 700, color, fontSize: size, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{h}h {String(m).padStart(2, "0")}m {String(sec).padStart(2, "0")}s</span>;
}
function fmtDur(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60), mm = m % 60;
  return h > 0 ? `${h} h${mm ? " " + String(mm).padStart(2, "0") : ""}` : `${mm} min`;
}
function useElapsedMin(startedAt) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  return startedAt ? Math.max(0, (now - startedAt) / 60000) : 0;
}
function LiveTimer({ startedAt, color = C.brand, size = 16 }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return <span style={{ fontFamily: FONT.mono, fontWeight: 700, color, fontSize: size, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{h}h {String(m).padStart(2, "0")}m {String(sec).padStart(2, "0")}s</span>;
}

// Primary CTA — black pill with optional bright-green arrow chip (matches desktop btn-primary)
const CtaPrimary = ({ children, icon = true, style = {}, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", padding: "15px 18px",
    background: C.brandDeep, color: "#fff", border: 0, borderRadius: 100,
    fontSize: 14, fontWeight: 600, fontFamily: FONT.sans, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    ...style,
  }}>
    {children}
    {icon && (
      <span style={{
        background: C.brandBright, color: C.brandDeep,
        borderRadius: 6, padding: "3px 6px",
        display: "inline-flex", alignItems: "center",
      }}>
        <Stroke size={12} w={2}>{SVG.arrowRight}</Stroke>
      </span>
    )}
  </button>
);

const CtaGhost = ({ children, style = {}, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", padding: "15px 0",
    background: "transparent", color: C.ink, border: `1px solid ${C.line}`,
    borderRadius: 100, fontSize: 14, fontWeight: 500, fontFamily: FONT.sans, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    ...style,
  }}>{children}</button>
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. LOGIN — dark hero strip on top (matches desktop login-aside DNA)
// ═══════════════════════════════════════════════════════════════════════════
function LoginScreen({ nav = {} }) {
  return (
    <PhoneScreen bg={C.bg}>
      {/* Dark hero strip — compressed version of desktop login-aside */}
      <div style={{
        margin: "0 16px 24px",
        background: C.brandDeep,
        borderRadius: 18,
        padding: "20px 22px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(0,255,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.06) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(circle at 70% 40%, rgba(0,0,0,1) 0%, transparent 80%)",
        }}/>
        {/* green glow */}
        <div style={{
          position: "absolute", width: 220, height: 220,
          background: `radial-gradient(circle, rgba(0,255,0,0.18) 0%, transparent 70%)`,
          top: -60, right: -60, pointerEvents: "none",
        }}/>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <Mark size={28}/>
          <Wordmark size={16} color="#fff"/>
        </div>
        <div style={{ position: "relative", marginTop: 28, fontFamily: FONT.mono, fontSize: 10.5, color: C.brandBright, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          GMAO · v2.4
        </div>
        <div style={{ position: "relative", marginTop: 8, fontFamily: FONT.sans, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, maxWidth: 260 }}>
          Le terrain<br/>en temps réel.
        </div>
        <div style={{ position: "relative", marginTop: 18, display: "flex", gap: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.brandBright, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>12</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 1 }}>Machines</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.brandBright, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>3</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 1 }}>Pannes</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.brandBright, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>92%</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 1 }}>Dispo.</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column" }}>
        <H1 style={{ fontSize: 24 }}>Bonjour.</H1>
        <p style={{ fontSize: 14, color: C.mute, margin: "8px 0 0", lineHeight: 1.5 }}>
          Connectez-vous pour accéder à votre parc.
        </p>

        <div style={{ marginTop: 28 }}>
          <Label>E-mail</Label>
          <div style={{ paddingBottom: 11, borderBottom: `1.5px solid ${C.ink}`, fontSize: 15, fontWeight: 500 }}>
            s.diallo@usine.fr
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Label>Mot de passe</Label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 11, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 15, letterSpacing: "0.25em" }}>•••••••••</span>
            <Stroke size={16} color={C.mute}>{SVG.eye}</Stroke>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12.5, color: C.mute, textAlign: "right", fontWeight: 500 }}>
          Mot de passe oublié ?
        </div>

        <div style={{ marginTop: "auto", paddingBottom: 4 }}>
          <CtaPrimary onClick={() => nav.go && nav.go("home")}>Se connecter</CtaPrimary>
          <div style={{ height: 10 }}/>
          <CtaGhost onClick={() => nav.go && nav.go("scan")}>
            <Stroke size={14}>{SVG.qr}</Stroke>
            Scanner mon invitation
          </CtaGhost>
        </div>
      </div>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. HOME — Mon parc (KPI featured + machines list)
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ nav = {} }) {
  const all = window.MFData.SEED.machines.slice(0, 8);
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const machines = all.filter(m => {
    if (filter !== "all" && m.state !== filter) return false;
    if (q && !(`${m.name} ${m.id} ${m.workshop}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  const counts = {
    all: all.length,
    fault: all.filter(m => m.state === "fault").length,
    maintenance: all.filter(m => m.state === "maintenance").length,
    ok: all.filter(m => m.state === "ok").length,
  };
  const trendData = [4, 6, 3, 8, 5, 7, 9, 6, 4, 7, 8, 11, 9, 12];
  return (
    <PhoneScreen>
      {/* Header */}
      <div style={{ padding: "0 20px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Eyebrow>Jeudi 22 mai · S21</Eyebrow>
          <H1 style={{ marginTop: 6 }}>Mon parc</H1>
        </div>
        <IconBtn badge onClick={() => nav.go && nav.go("alerts")}><Stroke size={20}>{SVG.bell}</Stroke></IconBtn>
      </div>

      {/* KPI strip — featured deep-green card + companions */}
      <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 8 }}>
        <KpiTile label="Opérationnel" value="9 / 12" sub="92% du parc" featured>
          <MiniBars data={trendData.slice(-7)} color={C.brandBright} width={56} height={32}/>
        </KpiTile>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 8 }}>
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.critBg, color: C.crit, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stroke size={16}>{SVG.alert}</Stroke>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>3</div>
              <div style={{ fontSize: 10.5, color: C.mute, marginTop: 2 }}>Pannes</div>
            </div>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.warnBg, color: C.warn, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stroke size={16}>{SVG.wrench}</Stroke>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>4</div>
              <div style={{ fontSize: 10.5, color: C.mute, marginTop: 2 }}>Interventions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: C.soft, borderRadius: 10, color: C.mute, fontSize: 13.5, border: `1px solid ${q ? C.brand : C.line}` }}>
          <Stroke size={15} w={1.5} color={q ? C.brand : C.mute}>{SVG.search}</Stroke>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une machine"
            style={{ flex: 1, border: 0, outline: "none", background: "transparent", fontFamily: FONT.sans, fontSize: 13.5, color: C.text, minWidth: 0 }}
          />
          {q
            ? <button onClick={() => setQ("")} style={{ border: 0, background: "transparent", padding: 0, color: C.mute, display: "inline-flex", cursor: "pointer" }}><Stroke size={15}>{SVG.close}</Stroke></button>
            : <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.faint, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 4, padding: "1px 5px" }}>QR</span>}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, overflowX: "hidden" }}>
        {[
          { l: "Tout", k: "all" },
          { l: "En panne", k: "fault" },
          { l: "Maintenance", k: "maintenance" },
          { l: "OK", k: "ok" },
        ].map((f) => {
          const on = filter === f.k;
          return (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: "6px 11px",
              background: on ? C.brandDeep : C.bg,
              color: on ? "#fff" : C.text,
              border: `1px solid ${on ? C.brandDeep : C.line}`,
              borderRadius: 100, fontWeight: 600, fontSize: 11.5,
              fontFamily: "inherit", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
            }}>
              {f.l}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: on ? "rgba(255,255,255,0.18)" : C.soft,
                color: on ? "#fff" : C.mute,
                padding: "1px 5px", borderRadius: 100,
                fontVariantNumeric: "tabular-nums",
              }}>{counts[f.k]}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 110px" }}>
        {machines.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.mute, fontSize: 13 }}>Aucune machine ne correspond.</div>
        )}
        {machines.map((m, i) => {
          const tone = m.state === "ok" ? "ok" : m.state === "fault" ? "crit" : "warn";
          const stateLabel = m.state === "ok" ? "Opérationnel" : m.state === "fault" ? "En panne" : "Maintenance";
          return (
            <div key={m.id} onClick={() => nav.go && nav.go("detail")} style={{ padding: "14px 0", borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <Dot tone={tone} size={8} glow={tone === "crit"}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <MonoId size={10.5}>{m.id}</MonoId>
                  <Pill tone={tone} dot={false}>{stateLabel}</Pill>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>{m.workshop}</div>
              </div>
              <Stroke size={16} color={C.faint}>{SVG.chevronRight}</Stroke>
            </div>
          );
        })}
      </div>

      <BottomTabs active="home" onNav={nav.go}/>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. MISSIONS — Today (date capsule + progress)
// ═══════════════════════════════════════════════════════════════════════════
function MissionsScreen({ nav = {} }) {
  const missions = [
    { h: "08:00", t: "Diagnostic convoyeur", m: "MCH-002 · Atelier A", id: "I-1077", k: "done", kind: "Corrective", dur: "1 h" },
    { h: "10:30", t: "Remplacement roulement", m: "MCH-002 · Atelier A", id: "I-1078", k: "now", kind: "Corrective", dur: "3 h" },
    { h: "14:00", t: "Visite trimestrielle", m: "MCH-001 · Atelier A", id: "I-1080", k: "next", kind: "Préventive", dur: "2 h" },
    { h: "16:00", t: "Test fuite vapeur", m: "MCH-008 · Utilités", id: "I-1081", k: "next", kind: "Corrective", dur: "1 h 30" },
  ];
  return (
    <PhoneScreen>
      <div style={{ padding: "0 20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Eyebrow>Aujourd'hui · S21</Eyebrow>
            <H1 style={{ marginTop: 6 }}>4 missions</H1>
          </div>
          <IconBtn onClick={() => nav.toast && nav.toast("Filtres — toutes les missions")}><Stroke size={20}>{SVG.filter}</Stroke></IconBtn>
        </div>

        {/* Progress block */}
        <div style={{ marginTop: 16, padding: "14px 16px", background: C.bgSoft, borderRadius: 12, border: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: C.mute }}>
              <span style={{ color: C.ink, fontWeight: 700, fontSize: 14 }}>1/4</span> terminée
            </div>
            <div style={{ fontSize: 11.5, color: C.mute, fontFamily: FONT.mono }}>7 h 30 restantes</div>
          </div>
          <div style={{ height: 4, background: C.line, borderRadius: 2, overflow: "hidden", position: "relative" }}>
            <div style={{ width: "25%", height: "100%", background: `linear-gradient(90deg, ${C.brand}, ${C.brandBright})` }}/>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "hidden", padding: "0 20px 110px" }}>
        {missions.map((m, i) => {
          const isNow = m.k === "now";
          const isDone = m.k === "done";
          return (
            <div key={i} onClick={() => { if (isNow) { nav.startWork && nav.startWork(); nav.go && nav.go("checklist"); } else { nav.go && nav.go("detail"); } }} style={{
              padding: "14px 0",
              borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
              display: "flex", gap: 14, alignItems: "flex-start",
              opacity: isDone ? 0.55 : 1,
              position: "relative", cursor: "pointer",
            }}>
              {/* date / time capsule */}
              <div style={{
                minWidth: 50, padding: "8px 0",
                background: isNow ? C.brandDeep : C.bg,
                border: `1px solid ${isNow ? C.brandDeep : C.line}`,
                borderRadius: 10,
                textAlign: "center",
                color: isNow ? "#fff" : C.ink,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.h}</div>
                <div style={{ fontSize: 10, color: isNow ? C.brandBright : C.mute, marginTop: 3, fontFamily: FONT.mono }}>{m.dur}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  {isNow ? <Pill tone="bright" dot>En cours</Pill>
                    : isDone ? <Pill tone="ok" dot>Terminée</Pill>
                    : <Pill tone={m.kind === "Préventive" ? "info" : "warn"}>{m.kind}</Pill>}
                  <MonoId size={10}>{m.id}</MonoId>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text, lineHeight: 1.3, textDecoration: isDone ? "line-through" : "none" }}>{m.t}</div>
                <div style={{ fontSize: 12, color: C.mute, marginTop: 3 }}>{m.m}</div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomTabs active="missions" onNav={nav.go}/>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. MACHINE DETAIL
// ═══════════════════════════════════════════════════════════════════════════
function DetailScreen({ nav = {} }) {
  const m = window.MFData.SEED.machines.find(x => x.id === "MCH-002");
  const trend = [88, 91, 89, 93, 90, 87, 85, 88, 92, 90, 89, 84, 78, 75];
  return (
    <PhoneScreen>
      {/* Top nav */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IconBtn onClick={() => nav.back && nav.back()}><Stroke size={20}>{SVG.chevronLeft}</Stroke></IconBtn>
        <MonoId size={11} muted={false}>{m.id}</MonoId>
        <IconBtn onClick={() => nav.toast && nav.toast("Options machine")}><Stroke size={20}>{SVG.more}</Stroke></IconBtn>
      </div>

      {/* Hero */}
      <div style={{ padding: "16px 22px 22px" }}>
        <Eyebrow>{m.workshop} · {m.type || "Convoyeur"}</Eyebrow>
        <H1 style={{ marginTop: 10, fontSize: 24 }}>{m.name}</H1>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <Pill tone="crit" dot>En panne</Pill>
          <span style={{ fontSize: 12, color: C.mute }}>·</span>
          <span style={{ fontSize: 12.5, color: C.mute, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Stroke size={12} color={C.mute}>{SVG.clock}</Stroke>
            depuis <LiveChrono baseMin={76} size={12} color={C.crit}/>
          </span>
        </div>
      </div>

      {/* Stats grid — bordered KPI tiles */}
      <div style={{ padding: "0 22px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          { v: "92%", l: "Dispo.", spark: trend, color: C.brand },
          { v: "22.5k", l: "Heures" },
          { v: "86 j", l: "MTBF" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "12px 12px 10px",
            background: C.bg,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: C.mute, marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.l}</div>
            {s.spark && (
              <div style={{ marginTop: 6, marginLeft: -4 }}>
                <Spark data={s.spark} color={s.color} height={20} width={70}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active fault card — chronomètre d'immobilisation */}
      <div style={{ margin: "20px 22px 0" }}>
        <Eyebrow style={{ marginBottom: 10 }}>Panne en cours</Eyebrow>
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.critBorder}` }}>
          {/* Chrono banner (dark, signature green numbers) */}
          <div style={{ background: C.brandDeep, padding: "13px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", width: 160, height: 160, background: "radial-gradient(circle, rgba(0,255,0,0.16) 0%, transparent 70%)", top: -80, right: -50, pointerEvents: "none" }}/>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Immobilisée depuis</div>
              <div style={{ marginTop: 4 }}><LiveChrono baseMin={76} size={20} color={C.brandBright}/></div>
            </div>
            <div style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: C.brandBright, flexShrink: 0 }}>
              <Stroke size={18} color={C.brandBright}>{SVG.clock}</Stroke>
            </div>
          </div>
          {/* body */}
          <div style={{ background: C.critBg, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <MonoId size={10.5} muted={false}><span style={{ color: C.critFg }}>F-2041</span></MonoId>
              <Pill tone="crit">Mécanique · Critique</Pill>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: C.text, fontWeight: 500 }}>
              Roulement palier moteur — surchauffe & vibrations anormales
            </div>
            <div style={{ marginTop: 6, fontSize: 11.5, color: C.mute }}>
              Signalé par L. Moreau · cause : usure
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ marginTop: "auto", padding: "0 22px 110px", display: "flex", gap: 8 }}>
        <CtaPrimary onClick={() => { nav.startWork && nav.startWork(); nav.go && nav.go("checklist"); }}>Intervenir</CtaPrimary>
        <button onClick={() => nav.toast && nav.toast("Historique — 8 pannes, 14 interventions")} style={{
          padding: "15px 18px",
          background: C.bg, color: C.ink, border: `1px solid ${C.line}`,
          borderRadius: 100, fontSize: 13.5, fontWeight: 600, fontFamily: FONT.sans,
          whiteSpace: "nowrap", cursor: "pointer",
        }}>
          Historique
        </button>
      </div>

      <BottomTabs active="home" onNav={nav.go}/>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SCAN QR — dark, green corner accents
// ═══════════════════════════════════════════════════════════════════════════
function ScanScreen({ nav = {} }) {
  return (
    <div style={{ height: "100%", background: "#0A100C", color: "#fff", fontFamily: FONT.sans, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", paddingTop: 56, paddingBottom: 34 }}>
      {/* subtle green grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.04) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, transparent 75%)",
        pointerEvents: "none",
      }}/>

      {/* Top bar */}
      <div style={{ position: "relative", padding: "0 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => nav.back && nav.back()} style={{ width: 40, height: 40, borderRadius: 10, background: "transparent", border: 0, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Stroke size={18}>{SVG.close}</Stroke>
        </button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Dot tone="bright" size={6} glow/>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT.mono, letterSpacing: "0.06em", textTransform: "uppercase", color: C.brandBright }}>Scanner</span>
        </div>
        <div style={{ width: 40 }}/>
      </div>

      {/* Scan frame */}
      <div onClick={() => nav.go && nav.go("report")} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, padding: 24, cursor: "pointer" }}>
        <div style={{ position: "relative", width: 240, height: 240 }}>
          {/* scan line */}
          <div style={{
            position: "absolute", left: 12, right: 12, height: 2, top: "50%",
            background: `linear-gradient(90deg, transparent, ${C.brandBright}, transparent)`,
            boxShadow: `0 0 12px ${C.brandBright}`,
            opacity: 0.85,
          }}/>
          {/* 4 corners — bright green */}
          {[
            { p: "tl", t: 1, l: 1 },
            { p: "tr", t: 1, r: 1 },
            { p: "bl", b: 1, l: 1 },
            { p: "br", b: 1, r: 1 },
          ].map(c => (
            <span key={c.p} style={{
              position: "absolute",
              width: 32, height: 32,
              borderColor: C.brandBright,
              borderStyle: "solid",
              borderTopWidth: c.t ? 2 : 0,
              borderBottomWidth: c.b ? 2 : 0,
              borderLeftWidth: c.l ? 2 : 0,
              borderRightWidth: c.r ? 2 : 0,
              top: c.t ? 0 : "auto", bottom: c.b ? 0 : "auto",
              left: c.l ? 0 : "auto", right: c.r ? 0 : "auto",
              borderTopLeftRadius: c.t && c.l ? 8 : 0,
              borderTopRightRadius: c.t && c.r ? 8 : 0,
              borderBottomLeftRadius: c.b && c.l ? 8 : 0,
              borderBottomRightRadius: c.b && c.r ? 8 : 0,
              boxShadow: `0 0 12px rgba(0,255,0,0.4)`,
            }}/>
          ))}
        </div>
        <div style={{ textAlign: "center", maxWidth: 240 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Placez le QR dans le cadre</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
            L'identification de la machine est automatique.
          </div>
        </div>
      </div>

      <div style={{ position: "relative", padding: "0 24px" }}>
        <button onClick={() => nav.go && nav.go("report")} style={{ width: "100%", padding: "14px 0", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, fontWeight: 600, fontSize: 13.5, fontFamily: FONT.sans, cursor: "pointer" }}>
          Saisir l'ID manuellement
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. REPORT FAULT — stepped (3 steps, segment progress in brand green)
// ═══════════════════════════════════════════════════════════════════════════
function ReportScreen({ nav = {} }) {
  const types = [
    { k: "Mécanique", sub: "Roulement, joint, transmission" },
    { k: "Électrique", sub: "Disjoncteur, capteur, câblage" },
    { k: "Hydraulique", sub: "Fuite, pression, vérin" },
    { k: "Logiciel", sub: "Automate, IHM, programme" },
  ];
  const [selected, setSelected] = React.useState("Électrique");
  const [photo, setPhoto] = React.useState(false);
  return (
    <PhoneScreen>
      {/* Top nav */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IconBtn onClick={() => nav.back && nav.back()}><Stroke size={20}>{SVG.chevronLeft}</Stroke></IconBtn>
        <span style={{ fontSize: 12, color: C.mute, fontFamily: FONT.mono }}>Étape 2 / 3</span>
        <IconBtn onClick={() => nav.go && nav.go("home")}><Stroke size={20}>{SVG.close}</Stroke></IconBtn>
      </div>

      {/* Stepped progress in brand green */}
      <div style={{ padding: "0 22px 24px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[100, 50, 0].map((p, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: C.line, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: `${p}%`, height: "100%",
                background: p === 100 ? C.brand : C.brandBright,
              }}/>
            </div>
          ))}
        </div>
      </div>

      {/* Heading */}
      <div style={{ padding: "0 22px 20px" }}>
        <Eyebrow style={{ color: C.crit }}>Nouvelle panne</Eyebrow>
        <H1 style={{ marginTop: 8 }}>Quel type ?</H1>
      </div>

      {/* Machine context — confirmed-scanned chip */}
      <div style={{
        margin: "0 22px 24px",
        padding: "12px 14px",
        background: C.brand50,
        border: `1px solid ${C.brand100}`,
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <MonoId size={10.5} muted={false}><span style={{ color: C.brandDeep }}>MCH-002</span></MonoId>
            <span style={{ fontSize: 10, color: C.mute }}>·</span>
            <span style={{ fontSize: 11.5, color: C.mute }}>Atelier A</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.brandDeep }}>Convoyeur Ligne 2</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", background: C.brand, color: "#fff", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
          <Stroke size={11} w={2.5} color="#fff">{SVG.check}</Stroke>
          Scanné
        </div>
      </div>

      {/* Type options */}
      <div style={{ padding: "0 22px", flex: 1 }}>
        {types.map((tp) => {
          const on = selected === tp.k;
          return (
            <button key={tp.k} onClick={() => setSelected(tp.k)} style={{
              width: "100%", textAlign: "left",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 14px", marginBottom: 8,
              background: on ? C.bg : "transparent",
              border: `1px solid ${on ? C.ink : C.lineSoft}`,
              borderRadius: 12, fontFamily: FONT.sans, cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: on ? 700 : 500, color: C.text }}>{tp.k}</div>
                <div style={{ fontSize: 11.5, color: C.mute, marginTop: 2 }}>{tp.sub}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                border: `1.5px solid ${on ? C.brandDeep : C.line}`,
                background: on ? C.brandDeep : "transparent",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {on && <Stroke size={12} w={2.5} color={C.brandBright}>{SVG.check}</Stroke>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Photo capture */}
      <div style={{ padding: "8px 22px 0" }}>
        <button onClick={() => { setPhoto(true); nav.toast && nav.toast("Photo ajoutée à la déclaration"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: photo ? C.brand50 : C.soft, border: `1px ${photo ? "solid" : "dashed"} ${photo ? C.brand : C.faint}`, borderRadius: 12, fontFamily: FONT.sans, cursor: "pointer" }}>
          <span style={{ width: 38, height: 38, borderRadius: 9, background: photo ? C.brand : C.bg, border: `1px solid ${photo ? C.brand : C.line}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: photo ? "#fff" : C.ink, flexShrink: 0 }}>
            <Stroke size={18}>{photo ? SVG.check : SVG.camera}</Stroke>
          </span>
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: photo ? C.brandDeep : C.text }}>{photo ? "Photo ajoutée" : "Ajouter une photo"}</span>
            <span style={{ display: "block", fontSize: 11.5, color: C.mute }}>{photo ? "IMG_2041.jpg · appuyez pour remplacer" : "Prenez le problème en photo depuis l'atelier"}</span>
          </span>
        </button>
      </div>

      {/* CTA */}
      <div style={{ padding: "16px 22px 24px" }}>
        <CtaPrimary onClick={() => { nav.toast && nav.toast("Panne déclarée — F-2042 créée"); nav.go && nav.go("checklist"); }}>Continuer</CtaPrimary>
      </div>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. ALERTES — colored pills, red bar for criticals
// ═══════════════════════════════════════════════════════════════════════════
function AlertsScreen({ nav = {} }) {
  const initial = [
    { tone: "crit", title: "Fuite vapeur — Chaudière CV2", id: "F-2040", meta: "il y a 8 min", read: false, sev: "Critique" },
    { tone: "crit", title: "Convoyeur Ligne 2 — arrêt", id: "F-2041", meta: "il y a 12 min", read: false, sev: "Critique" },
    { tone: "warn", title: "Disjoncteur principal — saute", id: "F-2039", meta: "il y a 1 h", read: false, sev: "Moyenne" },
    { tone: "info", title: "Intervention planifiée demain", id: "I-1080", meta: "il y a 2 h", read: false, sev: "Info" },
    { tone: "ok", title: "Panne F-2037 résolue", id: "MCH-005", meta: "hier · 17:42", read: true, sev: "Résolue" },
    { tone: "mute", title: "Rapport hebdomadaire prêt", id: "RPT-018", meta: "hier · 09:00", read: true, sev: "Système" },
  ];
  const [alerts, setAlerts] = React.useState(initial);
  const [tab, setTab] = React.useState("all");
  const unread = alerts.filter(a => !a.read).length;
  const critCount = alerts.filter(a => a.tone === "crit").length;
  const markAll = () => { setAlerts(as => as.map(a => ({ ...a, read: true }))); nav.toast && nav.toast("Toutes les alertes marquées lues"); };
  const shown = alerts.filter(a => tab === "crit" ? a.tone === "crit" : tab === "unread" ? !a.read : true);
  const tabs = [
    { l: "Tout", k: "all", c: alerts.length },
    { l: "Critique", k: "crit", c: critCount },
    { l: "Non lu", k: "unread", c: unread },
  ];
  return (
    <PhoneScreen>
      <div style={{ padding: "0 20px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Eyebrow>{unread} nouvelle{unread > 1 ? "s" : ""}</Eyebrow>
          <H1 style={{ marginTop: 6 }}>Alertes</H1>
        </div>
        <button onClick={markAll} disabled={unread === 0} style={{
          background: "transparent", border: `1px solid ${C.line}`, borderRadius: 100,
          fontSize: 11.5, fontWeight: 600, color: unread === 0 ? C.faint : C.text, fontFamily: FONT.sans,
          padding: "6px 12px", cursor: unread === 0 ? "default" : "pointer",
        }}>Tout lire</button>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 6 }}>
        {tabs.map((f) => {
          const on = tab === f.k;
          return (
            <button key={f.k} onClick={() => setTab(f.k)} style={{
              padding: "5px 11px",
              background: on ? C.brandDeep : "transparent",
              color: on ? "#fff" : C.text,
              border: `1px solid ${on ? C.brandDeep : C.line}`,
              borderRadius: 100, fontWeight: 600, fontSize: 11.5,
              fontFamily: "inherit", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {f.l}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: on ? "rgba(255,255,255,0.18)" : C.soft,
                color: on ? "#fff" : C.mute,
                padding: "1px 5px", borderRadius: 100,
                fontVariantNumeric: "tabular-nums",
              }}>{f.c}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 110px" }}>
        {shown.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.mute, fontSize: 13 }}>Rien à afficher ici.</div>
        )}
        {shown.map((a, i) => {
          const isCrit = a.tone === "crit" && !a.read;
          return (
            <div key={a.id} onClick={() => nav.go && nav.go("detail")} style={{ cursor: "pointer",
              padding: isCrit ? "14px 12px 14px 0" : "14px 0",
              borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
              display: "flex", gap: 12, alignItems: "flex-start",
              opacity: a.read ? 0.55 : 1,
              position: "relative",
              background: isCrit ? C.critBg : "transparent",
              marginLeft: isCrit ? -8 : 0, marginRight: isCrit ? -8 : 0,
              paddingLeft: isCrit ? 16 : 0, paddingRight: isCrit ? 12 : 0,
              borderRadius: isCrit ? 10 : 0,
              border: isCrit ? `1px solid ${C.critBorder}` : "none",
              borderTop: i === 0 ? "none" : (isCrit ? `1px solid ${C.critBorder}` : `1px solid ${C.lineSoft}`),
              marginTop: isCrit && i > 0 ? 6 : 0, marginBottom: isCrit ? 6 : 0,
            }}>
              {isCrit && <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, background: C.crit, borderRadius: 2 }}/>}
              <div style={{ paddingTop: 5 }}>
                <Dot tone={a.tone === "mute" ? "mute" : a.tone} size={7} glow={isCrit}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <MonoId size={10}>{a.id}</MonoId>
                  <Pill tone={a.tone === "mute" ? "mute" : a.tone}>{a.sev}</Pill>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: C.text }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: C.mute, marginTop: 4 }}>{a.meta}</div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomTabs active="missions" onNav={nav.go}/>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. PROFIL — featured KPI + sparkline + menu
// ═══════════════════════════════════════════════════════════════════════════
function ProfileScreen({ nav = {} }) {
  const monthSpark = [4, 6, 5, 8, 7, 9, 6, 11, 9, 12, 10, 14];
  return (
    <PhoneScreen>
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark size={15}/>
        <IconBtn onClick={() => nav.toast && nav.toast("Réglages du compte")}><Stroke size={20}>{SVG.settings}</Stroke></IconBtn>
      </div>

      <div style={{ padding: "12px 22px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brandDeep} 100%)`,
          color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em",
          flexShrink: 0,
        }}>SD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <H1 style={{ fontSize: 20 }}>Sophie Diallo</H1>
          <div style={{ fontSize: 12.5, color: C.mute, marginTop: 3 }}>Technicien · Atelier A</div>
          <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Dot tone="bright" size={6} glow/>
            <span style={{ fontSize: 11, color: C.brandDeep, fontWeight: 600 }}>En service</span>
          </div>
        </div>
      </div>

      {/* Featured KPI */}
      <div style={{ padding: "0 22px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 8 }}>
        <KpiTile label="Ce mois" value="147 h" sub="+18% vs avril" featured>
          <Spark data={monthSpark} color={C.brandBright} fill height={32} width={70}/>
        </KpiTile>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 8 }}>
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>12</div>
            <div style={{ fontSize: 10.5, color: C.mute, marginTop: 3 }}>Interventions</div>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>8</div>
            <div style={{ fontSize: 10.5, color: C.mute, marginTop: 3 }}>Pannes</div>
          </div>
        </div>
      </div>

      {/* Menu list */}
      <div style={{ padding: "20px 22px 110px", flex: 1, overflowY: "auto" }}>
        <Eyebrow style={{ marginBottom: 8 }}>Mon espace</Eyebrow>
        {[
          { l: "Mon historique", k: "Voir 28 interventions", act: () => nav.toast && nav.toast("Historique — 28 interventions") },
          { l: "Mon planning", k: "S21 · 4 missions", act: () => nav.go && nav.go("missions") },
          { l: "Mon équipe", k: "5 techniciens · Atelier A", act: () => nav.toast && nav.toast("Équipe — 5 techniciens (Atelier A)") },
        ].map((it, i, arr) => (
          <button key={it.l} onClick={it.act} style={{
            width: "100%", textAlign: "left", background: "transparent", cursor: "pointer",
            padding: "14px 0",
            borderTop: 0, borderLeft: 0, borderRight: 0,
            borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : `1px solid ${C.line}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT.sans,
          }}>
            <div>
              <div style={{ fontSize: 14.5, color: C.text, fontWeight: 500 }}>{it.l}</div>
              <div style={{ fontSize: 11.5, color: C.mute, marginTop: 2 }}>{it.k}</div>
            </div>
            <Stroke size={16} color={C.faint}>{SVG.chevronRight}</Stroke>
          </button>
        ))}

        <Eyebrow style={{ marginTop: 22, marginBottom: 8 }}>Réglages</Eyebrow>
        {[
          { l: "Notifications", act: () => nav.go && nav.go("alerts") },
          { l: "Préférences", act: () => nav.toast && nav.toast("Préférences ouvertes") },
          { l: "Aide & support", act: () => nav.toast && nav.toast("Support — nous contacter") },
        ].map((it, i, arr) => (
          <button key={it.l} onClick={it.act} style={{
            width: "100%", textAlign: "left", background: "transparent", cursor: "pointer",
            padding: "14px 0",
            borderTop: 0, borderLeft: 0, borderRight: 0,
            borderBottom: i < arr.length - 1 ? `1px solid ${C.lineSoft}` : "none",
            display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT.sans,
          }}>
            <span style={{ fontSize: 14.5, color: C.text, fontWeight: 500 }}>{it.l}</span>
            <Stroke size={16} color={C.faint}>{SVG.chevronRight}</Stroke>
          </button>
        ))}

        <div onClick={() => nav.reset && nav.reset("login")} style={{ marginTop: 18, fontSize: 13, color: C.crit, textAlign: "center", fontWeight: 500, cursor: "pointer" }}>
          Se déconnecter
        </div>
      </div>

      <BottomTabs active="profile" onNav={nav.go}/>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. CHECKLIST D'INTERVENTION — Interface 4 (technicien)
// ═══════════════════════════════════════════════════════════════════════════
function ChecklistScreen({ nav = {} }) {
  const work = nav.work || {};
  const tasks = work.tasks || [];
  const [draft, setDraft] = React.useState("");

  const setTasks = (fn) => nav.setWork && nav.setWork(w => ({ ...w, tasks: fn(w.tasks || []) }));
  const addTask = (label) => { const l = (label || "").trim(); if (!l) return; setTasks(ts => [...ts, { l, done: false }]); setDraft(""); };
  const removeTask = (i) => setTasks(ts => ts.filter((_, idx) => idx !== i));
  const toggle = (i) => setTasks(ts => ts.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));

  const elapsed = useElapsedMin(work.startedAt);
  const planMin = work.planMin || 180;
  const ratio = planMin ? elapsed / planMin : 0;
  const over = elapsed > planMin;

  const done = tasks.filter(t => t.done).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  const suggestions = ["Consignation (LOTO)", "Diagnostic / inspection", "Remplacement pièce", "Test fonctionnel", "Nettoyage & remise en service"];
  const remainingSug = suggestions.filter(s => !tasks.some(t => t.l === s));

  const finish = () => {
    if (!allDone) { nav.toast && nav.toast(tasks.length === 0 ? "Ajoutez au moins une tâche" : `Encore ${tasks.length - done} tâche(s) à valider`); return; }
    nav.setWork && nav.setWork(w => ({ ...w, endedAt: Date.now() }));
    nav.go && nav.go("close");
  };

  return (
    <PhoneScreen>
      {/* Top nav */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IconBtn onClick={() => nav.back && nav.back()}><Stroke size={20}>{SVG.chevronLeft}</Stroke></IconBtn>
        <MonoId size={11} muted={false}>{work.intId || "I-1078"}</MonoId>
        <div style={{ width: 40 }}/>
      </div>

      {/* Heading */}
      <div style={{ padding: "12px 22px 14px" }}>
        <Eyebrow>Intervention · en cours</Eyebrow>
        <H1 style={{ marginTop: 6, fontSize: 23 }}>Ma checklist</H1>

        {/* Running timer vs planned */}
        <div style={{ marginTop: 14, padding: "13px 15px", background: C.brandDeep, borderRadius: 14, color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 150, height: 150, background: "radial-gradient(circle, rgba(0,255,0,0.16) 0%, transparent 70%)", top: -70, right: -40, pointerEvents: "none" }}/>
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.brandBright, boxShadow: `0 0 6px ${C.brandBright}` }}/>
                En cours · temps écoulé
              </div>
              <div style={{ marginTop: 5 }}><LiveTimer startedAt={work.startedAt} color={C.brandBright} size={21}/></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>Prévu</div>
              <div style={{ marginTop: 5, fontFamily: FONT.mono, fontWeight: 700, fontSize: 17, color: "#fff" }}>{fmtDur(planMin)}</div>
            </div>
          </div>
          <div style={{ position: "relative", marginTop: 11, height: 5, background: "rgba(255,255,255,0.16)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, ratio * 100)}%`, height: "100%", background: over ? "#FF6B6B" : C.brandBright, transition: "width 0.4s" }}/>
          </div>
          <div style={{ position: "relative", marginTop: 6, fontSize: 11, fontWeight: 500, color: over ? "#FFB4B4" : "rgba(255,255,255,0.75)" }}>
            {over ? `Dépassement +${fmtDur(elapsed - planMin)} sur le temps prévu` : `${Math.round(ratio * 100)} % du temps prévu utilisé`}
          </div>
        </div>

        {/* Machine context */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: C.brand50, border: `1px solid ${C.brand100}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <MonoId size={10.5} muted={false}><span style={{ color: C.brandDeep }}>{work.machineId || "MCH-002"}</span></MonoId>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.brandDeep }}>{work.machineName || "Convoyeur Ligne 2"}</span>
          <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.mute }}>{work.workshop || "Atelier A"}</span>
        </div>
      </div>

      {/* Build checklist */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>Tâches · {done}/{tasks.length}</Label>
          <span style={{ fontSize: 11, color: C.mute }}>vous composez la liste</span>
        </div>

        {/* Add task */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTask(draft); }}
            placeholder="Ajouter une tâche…"
            style={{ flex: 1, minWidth: 0, padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 10, fontFamily: FONT.sans, fontSize: 13.5, color: C.text, outline: "none", background: C.bg }}
          />
          <button onClick={() => addTask(draft)} style={{ width: 44, flexShrink: 0, borderRadius: 10, border: 0, background: C.brandDeep, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Stroke size={18} w={2.2} color="#fff">{SVG.plus}</Stroke>
          </button>
        </div>

        {/* Quick suggestions */}
        {remainingSug.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {remainingSug.map(s => (
              <button key={s} onClick={() => addTask(s)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", background: C.soft, border: `1px solid ${C.line}`, borderRadius: 100, fontSize: 11.5, fontWeight: 500, color: C.mute, fontFamily: FONT.sans, cursor: "pointer" }}>
                <Stroke size={11} w={2.4} color={C.mute}>{SVG.plus}</Stroke> {s}
              </button>
            ))}
          </div>
        )}

        {/* Task rows */}
        {tasks.length === 0 && (
          <div style={{ textAlign: "center", padding: "26px 16px", color: C.mute, fontSize: 12.5, border: `1px dashed ${C.faint}`, borderRadius: 12 }}>
            Construisez votre checklist : tapez une tâche ou choisissez une suggestion.
          </div>
        )}
        {tasks.map((tk, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 12px", marginBottom: 8,
            background: tk.done ? C.bgSoft : C.bg,
            border: `1px solid ${tk.done ? C.line : C.lineSoft}`,
            borderRadius: 12,
          }}>
            <button onClick={() => toggle(i)} style={{ padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", flexShrink: 0 }}>
              <span style={{
                width: 24, height: 24, borderRadius: 7,
                background: tk.done ? C.brand : "transparent",
                border: `1.5px solid ${tk.done ? C.brand : C.faint}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                {tk.done && <Stroke size={14} w={2.5} color="#fff">{SVG.check}</Stroke>}
              </span>
            </button>
            <button onClick={() => toggle(i)} style={{ flex: 1, minWidth: 0, textAlign: "left", border: 0, background: "transparent", cursor: "pointer", fontFamily: FONT.sans, fontSize: 13.5, fontWeight: 500, color: tk.done ? C.mute : C.text, textDecoration: tk.done ? "line-through" : "none" }}>{tk.l}</button>
            <button onClick={() => removeTask(i)} style={{ padding: 6, border: 0, background: "transparent", cursor: "pointer", color: C.faint, display: "inline-flex", flexShrink: 0 }} title="Retirer">
              <Stroke size={16}>{SVG.trash}</Stroke>
            </button>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "14px 22px 24px" }}>
        {tasks.length > 0 && !allDone && (
          <div style={{ fontSize: 11.5, color: C.warn, textAlign: "center", marginBottom: 10, fontWeight: 500 }}>
            ⚠ Validez ou retirez les tâches restantes pour continuer
          </div>
        )}
        <CtaPrimary
          onClick={finish}
          style={allDone ? {} : { background: C.faint, cursor: "not-allowed" }}
          icon={allDone}
        >
          {tasks.length === 0 ? "Ajoutez une tâche" : allDone ? "Terminer & rédiger le rapport" : `${done}/${tasks.length} validées`}
        </CtaPrimary>
      </div>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. RAPPORT D'INTERVENTION — document : signer & clôturer
// ═══════════════════════════════════════════════════════════════════════════
function DocRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
      <span style={{ fontSize: 12, color: C.mute }}>{k}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function CloseWorkScreen({ nav = {} }) {
  const work = nav.work || {};
  const tasks = (work.tasks || []).filter(t => t.done);
  const realMin = (work.endedAt && work.startedAt) ? (work.endedAt - work.startedAt) / 60000 : 0;
  const planMin = work.planMin || 180;
  const over = realMin > planMin;
  const signed = !!work.signed;
  const setSigned = (v) => nav.setWork && nav.setWork(w => ({ ...w, signed: v, signedAt: v ? Date.now() : null }));

  const close = () => {
    if (!signed) { nav.toast && nav.toast("Signature requise pour clôturer"); return; }
    nav.go && nav.go("pdf");
  };

  return (
    <PhoneScreen bg={C.bgSoft}>
      {/* Top nav */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <IconBtn onClick={() => nav.back && nav.back()}><Stroke size={20}>{SVG.chevronLeft}</Stroke></IconBtn>
        <MonoId size={11} muted={false}>{work.intId || "I-1078"}</MonoId>
        <IconBtn onClick={() => nav.reset && nav.reset("home")}><Stroke size={20}>{SVG.close}</Stroke></IconBtn>
      </div>

      <div style={{ padding: "12px 22px 14px" }}>
        <Eyebrow style={{ color: C.brand }}>Intervention terminée</Eyebrow>
        <H1 style={{ marginTop: 6, fontSize: 23 }}>Rapport d'intervention</H1>
      </div>

      {/* Document */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 8px" }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: "0 6px 20px rgba(14,20,16,0.06)", overflow: "hidden" }}>
          {/* Doc header */}
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10 }}>
            <BrandEmblem size={24}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Rapport d'intervention</div>
              <div style={{ fontSize: 10.5, color: C.mute, fontFamily: FONT.mono }}>{work.intId || "I-1078"} · MaintFlow</div>
            </div>
            <Pill tone="bright">À clôturer</Pill>
          </div>

          <div style={{ padding: "12px 16px" }}>
            <DocRow k="Machine" v={`${work.machineName || "Convoyeur L2"} · ${work.machineId || "MCH-002"}`}/>
            <DocRow k="Atelier" v={work.workshop || "Atelier A"}/>
            <DocRow k="Technicien" v={work.tech || "S. Diallo"}/>
            <DocRow k="Date" v="21 mai 2026"/>

            {/* Tasks */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.mute, margin: "16px 0 8px" }}>Tâches réalisées · {tasks.length}</div>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: C.brand, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Stroke size={12} w={2.5} color="#fff">{SVG.check}</Stroke>
                </span>
                <span style={{ fontSize: 12.5, color: C.text }}>{t.l}</span>
              </div>
            ))}

            {/* Duration */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.mute, margin: "16px 0 8px" }}>Durée</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtDur(planMin)}</div>
                <div style={{ fontSize: 10, color: C.mute, marginTop: 3 }}>Prévu</div>
              </div>
              <Stroke size={15} color={C.faint}>{SVG.arrowRight}</Stroke>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: over ? C.crit : C.brand, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtDur(realMin)}</div>
                <div style={{ fontSize: 10, color: C.mute, marginTop: 3 }}>Réel</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Pill tone={over ? "crit" : "ok"}>{over ? `+${fmtDur(realMin - planMin)}` : `−${fmtDur(planMin - realMin)}`}</Pill>
              </div>
            </div>

            {/* Signature technicien */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.mute, margin: "16px 0 8px" }}>Signature technicien</div>
            {signed ? (
              <div>
                <div style={{ height: 76, border: `1.5px solid ${C.brand100}`, borderRadius: 10, background: C.brand50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive', fontSize: 30, color: C.brandDeep, transform: "rotate(-3deg)" }}>{work.tech || "S. Diallo"}</span>
                </div>
                <button onClick={() => setSigned(false)} style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.brand, fontWeight: 600, background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT.sans }}>
                  <Stroke size={12} color={C.brand}>{SVG.check}</Stroke> Signé · appuyez pour refaire
                </button>
              </div>
            ) : (
              <button onClick={() => { setSigned(true); nav.toast && nav.toast("Rapport signé électroniquement"); }} style={{ width: "100%", height: 76, border: `1.5px dashed ${C.faint}`, borderRadius: 10, background: C.soft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", fontFamily: FONT.sans }}>
                <Stroke size={19} color={C.mute}>{SVG.pen}</Stroke>
                <span style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>Appuyez pour signer</span>
              </button>
            )}

            {/* Évaluation — réservée au responsable */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.mute, margin: "16px 0 8px" }}>Évaluation qualité</div>
            <div style={{ padding: "11px 13px", background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "inline-flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Stroke key={i} size={18} w={1.5} color={C.faint}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </Stroke>
                ))}
              </div>
              <div style={{ flex: 1, fontSize: 11, color: C.mute, lineHeight: 1.4 }}>
                En attente — réservé au <b style={{ color: C.text }}>responsable</b> (M. Roux)
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10.5, color: C.faint, margin: "10px 0 4px" }}>
          La note qualité est attribuée par le responsable, pas par le technicien.
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 22px 24px" }}>
        <CtaPrimary onClick={close} style={signed ? {} : { background: C.faint }} icon={signed}>
          {signed ? "Clôturer & générer le PDF" : "Signez pour clôturer"}
        </CtaPrimary>
      </div>
    </PhoneScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. PDF GÉNÉRÉ — aperçu document + partage WhatsApp
// ═══════════════════════════════════════════════════════════════════════════
function PdfReportScreen({ nav = {} }) {
  const work = nav.work || {};
  const tasks = (work.tasks || []).filter(t => t.done);
  const realMin = (work.endedAt && work.startedAt) ? (work.endedAt - work.startedAt) / 60000 : 0;
  const planMin = work.planMin || 180;
  const over = realMin > planMin;

  const shareWhatsApp = () => {
    const text = [
      "🔧 *Rapport d'intervention — MaintFlow*",
      `Réf : ${work.intId || "I-1078"}`,
      `Machine : ${work.machineName || "Convoyeur L2"} (${work.machineId || "MCH-002"})`,
      `Technicien : ${work.tech || "S. Diallo"}`,
      `Tâches réalisées : ${tasks.length}`,
      `Durée : ${fmtDur(realMin)} (prévu ${fmtDur(planMin)})`,
      "Statut : Clôturé ✓",
    ].join("\n");
    try { if (navigator.share) { navigator.share({ title: "Rapport " + (work.intId || "I-1078"), text }); nav.toast && nav.toast("Partage ouvert"); return; } } catch (e) {}
    try { window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank"); } catch (e) {}
    nav.toast && nav.toast("WhatsApp ouvert");
  };
  const download = () => { try { window.print(); } catch (e) {} nav.toast && nav.toast("Export PDF lancé"); };

  return (
    <div style={{ height: "100%", background: "#1A1F1B", color: "#fff", fontFamily: FONT.sans, display: "flex", flexDirection: "column", paddingTop: 56, paddingBottom: 34, position: "relative" }}>
      {/* Top bar */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => nav.reset && nav.reset("home")} style={{ width: 40, height: 40, borderRadius: 10, background: "transparent", border: 0, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Stroke size={20}>{SVG.close}</Stroke>
        </button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Dot tone="bright" size={6} glow/>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Rapport PDF</span>
        </div>
        <button onClick={download} style={{ width: 40, height: 40, borderRadius: 10, background: "transparent", border: 0, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Stroke size={19}>{SVG.download}</Stroke>
        </button>
      </div>

      {/* PDF page preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 4px" }}>
        <div style={{ background: "#fff", color: "#1A1F1B", borderRadius: 6, boxShadow: "0 12px 34px rgba(0,0,0,0.45)", padding: "22px 20px", fontFamily: FONT.sans }}>
          {/* Letterhead */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: `2px solid ${C.brandDeep}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <BrandEmblem size={30}/>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>Maint<span style={{ color: C.brand }}>Flow</span></div>
                <div style={{ fontSize: 9.5, color: C.mute, fontFamily: FONT.mono, textTransform: "uppercase", letterSpacing: "0.08em" }}>GMAO · Rapport</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: C.mute, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Réf.</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, color: C.brandDeep }}>{work.intId || "I-1078"}</div>
              <div style={{ fontSize: 10, color: C.mute, marginTop: 2 }}>21 mai 2026</div>
            </div>
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 12px" }}>Rapport d'intervention</div>

          {/* Info table */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
            {[
              ["Machine", `${work.machineName || "Convoyeur Ligne 2"} (${work.machineId || "MCH-002"})`],
              ["Atelier", work.workshop || "Atelier A"],
              ["Technicien", work.tech || "S. Diallo"],
              ["Type", "Corrective"],
              ["Statut", "Clôturé ✓"],
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", borderBottom: i < 4 ? `1px solid ${C.lineSoft}` : "none" }}>
                <div style={{ width: 96, flexShrink: 0, padding: "7px 10px", background: C.bgSoft, fontSize: 11, color: C.mute, fontWeight: 600 }}>{r[0]}</div>
                <div style={{ flex: 1, padding: "7px 10px", fontSize: 12, fontWeight: 600, color: r[1].includes("Clôturé") ? C.brand : C.text }}>{r[1]}</div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.mute, marginBottom: 7 }}>Tâches réalisées</div>
          <div style={{ marginBottom: 14 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ fontFamily: FONT.mono, color: C.brand, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ color: C.text }}>{t.l}</span>
              </div>
            ))}
            {tasks.length === 0 && <div style={{ fontSize: 12, color: C.mute }}>—</div>}
          </div>

          {/* Duration table */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["Prévu", fmtDur(planMin), C.text], ["Réel", fmtDur(realMin), over ? C.crit : C.brand], ["Écart", (over ? "+" : "−") + fmtDur(Math.abs(realMin - planMin)), over ? C.crit : C.brand]].map((c, i) => (
              <div key={i} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c[2], fontVariantNumeric: "tabular-nums" }}>{c[1]}</div>
                <div style={{ fontSize: 9.5, color: C.mute, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c[0]}</div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, color: C.mute, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>Technicien</div>
              <div style={{ height: 50, borderBottom: `1px solid ${C.border || C.line}`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
                <span style={{ fontFamily: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive', fontSize: 22, color: C.brandDeep, transform: "rotate(-3deg)" }}>{work.tech || "S. Diallo"}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, color: C.mute, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>Responsable</div>
              <div style={{ height: 50, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
                <span style={{ fontSize: 10, color: C.faint }}>En attente</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${C.lineSoft}`, fontSize: 9, color: C.faint, textAlign: "center" }}>
            Document généré automatiquement par MaintFlow GMAO · {work.intId || "I-1078"} · Page 1/1
          </div>
        </div>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "8px 0 2px" }}>Aperçu PDF · 1 page</div>
      </div>

      {/* Action bar */}
      <div style={{ padding: "12px 16px", display: "flex", gap: 10, background: "#11150F", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={shareWhatsApp} style={{ flex: 1, padding: "13px 0", background: "#25D366", color: "#06351C", border: 0, borderRadius: 100, fontSize: 14, fontWeight: 700, fontFamily: FONT.sans, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: "pointer" }}>
          <WhatsAppGlyph size={19} color="#06351C"/> Partager sur WhatsApp
        </button>
        <button onClick={download} title="Télécharger" style={{ width: 50, flexShrink: 0, borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Stroke size={19}>{SVG.download}</Stroke>
        </button>
      </div>
    </div>
  );
}

window.MFMobileScreens = { LoginScreen, HomeScreen, MissionsScreen, DetailScreen, ScanScreen, ReportScreen, ChecklistScreen, CloseWorkScreen, PdfReportScreen, AlertsScreen, ProfileScreen };
