// mobile-shared.jsx — Brand-aligned primitives (matches desktop MaintFlow DNA)
const C = {
  // Foundations
  ink: "#0E1410",          // matches --text on desktop
  text: "#1A1F1B",
  mute: "#5C6A60",         // matches --text-muted
  faint: "#8A968F",
  line: "#E4E9E4",         // matches --border
  lineSoft: "#EEF2EE",
  bg: "#FFFFFF",
  soft: "#F2F5F2",         // matches --surface-2
  bgSoft: "#F7F9F7",

  // Brand greens (industrial maintenance signature)
  brand: "#00C24A",
  brandHover: "#00A93D",
  brandDeep: "#0A3D1F",    // dark surfaces / featured KPI
  brandBright: "#00FF00",  // signature "live" pop
  brand50: "#ECFDF1",
  brand100: "#D2FADD",

  // Status
  ok: "#00C24A",
  warn: "#F59E0B",
  crit: "#DC2626",
  info: "#2563EB",

  // Status soft bg + fg pairs (for pills)
  okBg: "#ECFDF1", okFg: "#047b32", okBorder: "#D2FADD",
  warnBg: "#FEF3C7", warnFg: "#B45309", warnBorder: "#FDE68A",
  critBg: "#FEE2E2", critFg: "#B91C1C", critBorder: "#FECACA",
  infoBg: "#DBEAFE", infoFg: "#1D4ED8", infoBorder: "#BFDBFE",
};

const FONT = {
  sans: '"DM Sans", -apple-system, system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// ── PhoneScreen shell — content inside iOS frame ──────────────────────────
function PhoneScreen({ children, bg = C.bg, dark = false }) {
  return (
    <div style={{
      height: "100%",
      background: bg,
      color: dark ? "#fff" : C.text,
      fontFamily: FONT.sans,
      fontSize: 14,
      WebkitFontSmoothing: "antialiased",
      display: "flex", flexDirection: "column",
      position: "relative",
      paddingTop: 56,
      paddingBottom: 34,
    }}>
      {children}
    </div>
  );
}

// ── Status dot — semantic ─────────────────────────────────────────────────
function Dot({ tone = "ok", size = 6, glow = false }) {
  const colors = { ok: C.ok, warn: C.warn, crit: C.crit, info: C.info, mute: C.faint, bright: C.brandBright };
  const c = colors[tone] || tone;
  return <span style={{
    width: size, height: size, borderRadius: "50%",
    background: c, display: "inline-block", flexShrink: 0,
    boxShadow: glow ? `0 0 8px ${c}` : "none",
  }}/>;
}

// ── Status pill — colored bg/fg pairs (matches desktop .pill-*) ───────────
function Pill({ tone = "mute", children, dot = false, mono = false }) {
  const tones = {
    ok:   { bg: C.okBg,   fg: C.okFg,   bd: C.okBorder },
    warn: { bg: C.warnBg, fg: C.warnFg, bd: C.warnBorder },
    crit: { bg: C.critBg, fg: C.critFg, bd: C.critBorder },
    info: { bg: C.infoBg, fg: C.infoFg, bd: C.infoBorder },
    mute: { bg: C.soft,   fg: C.mute,   bd: C.line },
    bright: { bg: C.brandBright, fg: C.brandDeep, bd: C.brand },
    dark: { bg: C.brandDeep, fg: "#fff", bd: C.brandDeep },
  };
  const s = tones[tone] || tones.mute;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 999,
      background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
      fontSize: 10.5, fontWeight: 600, lineHeight: 1.5,
      fontFamily: mono ? FONT.mono : FONT.sans,
      letterSpacing: mono ? 0 : 0.01,
      whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }}/>}
      {children}
    </span>
  );
}

// ── Monospace ID badge (F-2041 / MCH-002 / I-1080) ────────────────────────
function MonoId({ children, muted = true, size = 11 }) {
  return <span style={{
    fontFamily: FONT.mono, fontSize: size, fontWeight: 500,
    color: muted ? C.mute : C.ink, letterSpacing: 0,
  }}>{children}</span>;
}

// ── Mini sparkline ────────────────────────────────────────────────────────
function Spark({ data, color = C.brand, height = 28, width = 80, fill = true }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} opacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Tiny vertical bar chart (for KPIs) ────────────────────────────────────
function MiniBars({ data, color = C.brand, height = 28, width = 64, gap = 2 }) {
  const max = Math.max(...data, 1);
  const bw = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {data.map((v, i) => {
        const h = (v / max) * height;
        return <rect key={i} x={i * (bw + gap)} y={height - h} width={bw} height={h} fill={color} rx="1"/>;
      })}
    </svg>
  );
}

// ── KPI tile (mobile) — has a featured deep-green variant ─────────────────
function KpiTile({ label, value, sub, featured = false, accent = false, children }) {
  const bg = featured ? C.brandDeep : C.bg;
  const valueColor = featured ? C.brandBright : (accent ? C.brand : C.ink);
  const labelColor = featured ? "rgba(255,255,255,0.65)" : C.mute;
  const subColor = featured ? "rgba(255,255,255,0.8)" : C.mute;
  return (
    <div style={{
      background: bg,
      border: `1px solid ${featured ? C.brandDeep : C.line}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
      position: "relative",
      overflow: "hidden",
      minHeight: 96,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 500, color: labelColor, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
        <div style={{
          fontSize: 28, fontWeight: 700, color: valueColor,
          letterSpacing: "-0.02em", lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        {children}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: subColor, marginTop: 2 }}>{sub}</div>}
      {featured && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${C.brand}, ${C.brandBright})`,
        }}/>
      )}
    </div>
  );
}

// ── Bottom nav — minimal, no glass, just thin line ────────────────────────
function BottomTabs({ active = "home", onNav }) {
  const go = (k) => { if (onNav) onNav(k); };
  const tabs = [
    { k: "home", l: "Machines", icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { k: "missions", l: "Missions", icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { k: "scan", l: "Scan", icon: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></> },
    { k: "profile", l: "Profil", icon: <><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></> },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingTop: 10, paddingBottom: 30,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderTop: `1px solid ${C.line}`,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      zIndex: 10,
    }}>
      {tabs.map(t => {
        const on = active === t.k;
        const isScan = t.k === "scan";
        // Center "Scan" gets a special pill treatment
        if (isScan) {
          return (
            <div key={t.k} onClick={() => go(t.k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 999,
                background: C.ink, color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginTop: -8,
                boxShadow: on ? `0 0 0 4px ${C.brand50}` : "0 4px 12px rgba(14,20,16,0.18)",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {t.icon}
                </svg>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.mute }}>{t.l}</span>
            </div>
          );
        }
        return (
          <div key={t.k} onClick={() => go(t.k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: on ? C.ink : C.mute, position: "relative", cursor: "pointer" }}>
            {on && <span style={{ position: "absolute", top: -10, width: 14, height: 2, background: C.brand, borderRadius: 1 }}/>}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {t.icon}
            </svg>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{t.l}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── MaintFlow brand emblem — gear + M + wrench ────────────────────────────
function BrandEmblem({ size = 28 }) {
  const uid = "mfm" + Math.round(size * 100);
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={uid + "g"} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#6FE03F"/>
          <stop offset="0.5" stopColor="#34B12A"/>
          <stop offset="1" stopColor="#1E7D1A"/>
        </linearGradient>
        <linearGradient id={uid + "w"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2F5F3"/>
          <stop offset="0.5" stopColor="#C2CCC6"/>
          <stop offset="1" stopColor="#8C9890"/>
        </linearGradient>
      </defs>
      <g transform="translate(20 31)">
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
          <rect key={i} x="-2.4" y="-16.5" width="4.8" height="5.4" rx="1.2" fill={`url(#${uid}g)`} transform={`rotate(${deg})`}/>
        ))}
        <circle r="12.5" fill="none" stroke={`url(#${uid}g)`} strokeWidth="5"/>
      </g>
      <path d="M14 45 L14 19 L27 35 L40 19 L40 45" stroke={`url(#${uid}g)`} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M33 43 L45 21" stroke={`url(#${uid}w)`} strokeWidth="5.4" strokeLinecap="round"/>
      <path d="M41.5 14.5 A6.2 6.2 0 1 0 50.5 22" stroke={`url(#${uid}w)`} strokeWidth="4.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ── MaintFlow logo mark — emblem in an app-icon chip (reads on any bg) ─────
function Mark({ size = 28, chip = true }) {
  if (!chip) return <BrandEmblem size={size}/>;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)", flexShrink: 0,
    }}>
      <BrandEmblem size={size * 0.82}/>
    </div>
  );
}

// ── Wordmark "MaintFlow" with green pop on "Flow" ─────────────────────────
function Wordmark({ size = 17, color }) {
  return (
    <span style={{
      fontFamily: FONT.sans, fontWeight: 700, fontSize: size,
      letterSpacing: "-0.01em", color: color || C.ink,
    }}>
      Maint<span style={{ color: C.brand }}>Flow</span>
    </span>
  );
}

window.MFMobile = { C, FONT, PhoneScreen, Dot, Pill, MonoId, Spark, MiniBars, KpiTile, BottomTabs, Mark, BrandEmblem, Wordmark };
