// icons.jsx — inline SVG icon set + 3 MaintFlow logo concepts

const Icon = ({ name, size = 18, stroke = 1.7, className = "", style = {} }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    machine: <><rect x="3" y="8" width="11" height="11" rx="1.5"/><circle cx="8.5" cy="13.5" r="2.5"/><path d="M14 11h4l3 3v5h-7"/><path d="M5 8V5h4v3"/></>,
    fault: <><path d="M12 3l9 16H3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></>,
    wrench: <><path d="M14.5 3.5a4 4 0 0 0-4.95 5.42L3.5 15a2 2 0 0 0 2.83 2.83l6.08-6.08A4 4 0 1 0 14.5 3.5z"/></>,
    history: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12a9 9 0 0 1 4-7.5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
    chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><polygon points="18.5 2.5 21.5 5.5 12 15 9 15 9 12 18.5 2.5"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    qr: <><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/><rect x="14" y="19" width="3" height="2"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    gauge: <><path d="M12 14l4-4"/><path d="M3.4 14A8 8 0 1 1 20.6 14"/></>,
    bolt: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    drop: <><path d="M12 2l5.5 8a7 7 0 1 1-11 0L12 2z"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 2"/></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    flame: <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1.4-1-2.4-1.5-3.5C9.9 7 11 4 11 4s-3 1.5-5 4-3 5-3 7a7 7 0 0 0 14 0c0-2.5-1-4.5-3-6.5"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></>,
    mobile: <><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    info: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    chip: <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
    factory: <><path d="M3 21h18V8l-7 5V8l-7 5V3H3v18z"/><line x1="9" y1="21" x2="9" y2="17"/><line x1="13" y1="21" x2="13" y2="17"/><line x1="17" y1="21" x2="17" y2="17"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    package: <><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {paths[name] || null}
    </svg>
  );
};

// ─── Logo concepts ──────────────────────────────────────────────────────────
// All return an SVG sized via the `size` prop; second color = brand-bright accent.

const LogoFlow = ({ size = 32, accent = "#00FF00", dark = "#0E1410", bg = null }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    {bg && <rect width="40" height="40" rx="9" fill={bg}/>}
    <rect x="2" y="2" width="36" height="36" rx="9" fill={dark}/>
    {/* Flow lines forming an M */}
    <path d="M9 28 L9 14 L14 14 L20 22 L26 14 L31 14 L31 28" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="31" cy="28" r="2" fill={accent}/>
  </svg>
);

const LogoGear = ({ size = 32, accent = "#00FF00", dark = "#0E1410" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="9" fill={dark}/>
    {/* gear */}
    <g transform="translate(20 20)">
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <rect key={i} x="-2" y="-13" width="4" height="5" rx="1" fill={accent} transform={`rotate(${deg})`}/>
      ))}
      <circle r="8" fill={accent}/>
      <circle r="3.5" fill={dark}/>
      {/* arrow inside */}
      <path d="M-3 0 L3 0 M0 -3 L3 0 L0 3" stroke={dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </g>
  </svg>
);

const LogoBracket = ({ size = 32, accent = "#00FF00", dark = "#0E1410" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="9" fill={dark}/>
    {/* Brackets [ ] with flow line through */}
    <path d="M14 11 L11 11 L11 29 L14 29" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M26 11 L29 11 L29 29 L26 29" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M15 20 L25 20" stroke={accent} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="25" cy="20" r="2" fill={accent}/>
    {/* Small pulse blip */}
    <rect x="18" y="17" width="4" height="6" rx="1" fill={accent} opacity="0.7"/>
  </svg>
);

// Brand logo — gear + bold M + metallic wrench (matches MaintFlow brand artwork)
const LogoBrand = ({ size = 32, accent, dark }) => {
  const uid = "mf" + Math.round(size * 100);
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
      {/* Gear ring (left, behind M) */}
      <g transform="translate(20 31)">
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
          <rect key={i} x="-2.4" y="-16.5" width="4.8" height="5.4" rx="1.2" fill={`url(#${uid}g)`} transform={`rotate(${deg})`}/>
        ))}
        <circle r="12.5" fill="none" stroke={`url(#${uid}g)`} strokeWidth="5"/>
      </g>
      {/* Bold M */}
      <path d="M14 45 L14 19 L27 35 L40 19 L40 45" stroke={`url(#${uid}g)`} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Wrench — metallic diagonal handle + open jaw, over the M's right side */}
      <path d="M33 43 L45 21" stroke={`url(#${uid}w)`} strokeWidth="5.4" strokeLinecap="round"/>
      <path d="M41.5 14.5 A6.2 6.2 0 1 0 50.5 22" stroke={`url(#${uid}w)`} strokeWidth="4.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
};

const LOGOS = { brand: LogoBrand, flow: LogoFlow, gear: LogoGear, bracket: LogoBracket };
const Logo = ({ variant = "flow", ...rest }) => {
  const L = LOGOS[variant] || LogoFlow;
  return <L {...rest}/>;
};

// ─── Wordmark (logo + text) ─────────────────────────────────────────────────
const Wordmark = ({ variant = "flow", color = "#fff", accent = "#00FF00", size = 28 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
    <Logo variant={variant} size={size} accent={accent}/>
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.6, color, letterSpacing: "-0.01em" }}>
      Maint<em style={{ fontStyle: "normal", color: accent }}>Flow</em>
    </span>
  </span>
);

window.MFIcons = { Icon, Logo, Wordmark, LogoFlow, LogoGear, LogoBracket };
