'use client';

import { useQuery } from '@tanstack/react-query';

import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/store/auth';
import type { DashboardKpis, Fault, Intervention, Machine } from '@maintflow/shared';

const STATE_FILL: Record<string, string> = { ok: '#00C24A', maintenance: '#F59E0B', fault: '#DC2626' };
const STATE_LABEL: Record<string, string> = { ok: 'Opérationnel', maintenance: 'Maintenance', fault: 'En panne' };
const TYPE_LABEL: Record<string, string> = {
  mecanique: 'Mécanique',
  electrique: 'Électrique',
  hydraulique: 'Hydraulique',
  logiciel: 'Logiciel',
};
const SEVERITY_LABEL: Record<string, string> = { critical: 'Critique', medium: 'Moyenne', low: 'Mineure' };
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  resolved: 'Résolue',
  planned: 'Planifiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
const KIND_LABEL: Record<string, string> = { corrective: 'Corrective', preventive: 'Préventive' };

type Tone = 'ok' | 'warn' | 'crit' | 'info';
const PILL: Record<Tone, string> = {
  ok: 'text-okFg bg-brand-50 border-brand-100',
  warn: 'text-warnFg bg-warnBg border-[#FDE68A]',
  crit: 'text-critFg bg-critBg border-[#FECACA]',
  info: 'text-infoFg bg-infoBg border-[#BFDBFE]',
};
function Pill({ tone, children }: { tone?: Tone; children: React.ReactNode }) {
  const cls = tone ? PILL[tone] : 'text-mute bg-surface-muted border-line';
  return (
    <span className={`inline-flex items-center rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
const SEV_TONE: Record<string, Tone> = { critical: 'crit', medium: 'warn', low: 'ok' };
const STATUS_TONE: Record<string, Tone> = {
  pending: 'warn',
  in_progress: 'info',
  resolved: 'ok',
  planned: 'info',
  completed: 'ok',
  cancelled: 'crit',
};

// ── Health gauge ─────────────────────────────────────────────────────────────
function HealthBand({ k }: { k: DashboardKpis }) {
  const color = k.healthScore >= 80 ? '#00C24A' : k.healthScore >= 55 ? '#F59E0B' : '#DC2626';
  const label = k.healthScore >= 80 ? 'Atelier sain' : k.healthScore >= 55 ? 'Vigilance requise' : 'État critique';
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC * (1 - k.healthScore / 100);
  return (
    <div className="flex items-center gap-6 rounded-lg border border-line bg-surface p-[22px] shadow-[var(--shadow-sm)]">
      <div className="relative h-36 w-36 flex-shrink-0">
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
          <circle
            cx="72"
            cy="72"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={off}
            transform="rotate(-90 72 72)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[40px] font-bold leading-none tracking-tight" style={{ color }}>
            {k.healthScore}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-[0.06em] text-faint">/ 100</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color }}>
          Score de santé global
        </div>
        <div className="mt-1 text-[23px] font-bold tracking-tight">{label}</div>
        <div className="mt-1 text-[12.5px] leading-snug text-mute">
          Calculé en temps réel sur {k.totalMachines} machines, pondéré par leur criticité.
        </div>
        <div className="mt-[18px] flex flex-wrap gap-[22px]">
          <MiniMetric v={`${k.ok}`} l="En service" c="#00C24A" />
          <MiniMetric v={`${k.maintenance}`} l="Maintenance" c="#F59E0B" />
          <MiniMetric v={`${k.fault}`} l="En panne" c="#DC2626" />
          <MiniMetric v={k.mttr != null ? `${k.mttr} h` : '—'} l="MTTR moyen" />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ v, l, c }: { v: string; l: string; c?: string }) {
  return (
    <div>
      <div className="text-[22px] font-bold leading-none" style={{ color: c ?? 'var(--text)' }}>
        {v}
      </div>
      <div className="mt-[3px] text-[11px] font-medium text-mute">{l}</div>
    </div>
  );
}

// ── Maintenance weather ──────────────────────────────────────────────────────
function MaintenanceWeather({ k }: { k: DashboardKpis }) {
  const cond =
    k.criticalFaults > 0
      ? { kk: 'Orageux', icon: 'fault', desc: 'Pannes critiques en cours' }
      : k.activeFaults > 2
        ? { kk: 'Nuageux', icon: 'wrench', desc: 'Activité soutenue' }
        : { kk: 'Dégagé', icon: 'dashboard', desc: 'Parc stable' };
  const now = new Date();
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg bg-brand-deep px-[22px] py-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.06em] text-brand-bright">
            Météo de maintenance
          </div>
          <div className="mt-[3px] text-[12.5px] capitalize text-white/70">
            {date} · Sem. {week}
          </div>
        </div>
        <div className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white/10 text-brand-bright">
          <Icon name={cond.icon} size={24} />
        </div>
      </div>
      <div className="mt-3.5">
        <div className="text-[26px] font-bold tracking-tight">{cond.kk}</div>
        <div className="mt-0.5 text-[12.5px] text-white/70">{cond.desc}</div>
      </div>
      <div className="mt-[18px] grid grid-cols-3 gap-2">
        <WeatherStat v={`${k.plannedInterventions}`} l={['Interventions', 'prévues']} />
        <WeatherStat v={`${k.activeFaults}`} l={['Pannes non', 'résolues']} c={k.activeFaults > 0 ? '#FF7A7A' : undefined} />
        <WeatherStat v={`${k.availableTechnicians}`} l={['Techniciens', 'disponibles']} c="#00FF00" />
      </div>
    </div>
  );
}

function WeatherStat({ v, l, c }: { v: string; l: [string, string]; c?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.07] px-2.5 py-3">
      <div className="text-[22px] font-bold leading-none" style={{ color: c ?? '#fff' }}>
        {v}
      </div>
      <div className="mt-1.5 text-[11px] leading-tight text-white/70">
        {l[0]}
        <br />
        {l[1]}
      </div>
    </div>
  );
}

// ── Workshop heatmap ─────────────────────────────────────────────────────────
function WorkshopHeatmap({ machines }: { machines: Machine[] }) {
  const workshops = [...new Set(machines.map((m) => m.workshop))];
  return (
    <Card
      title="Carte thermique de l'atelier"
      sub="Vue d'ensemble en un coup d'œil"
      headerRight={
        <div className="flex gap-3 text-[11.5px] text-mute">
          {(['ok', 'maintenance', 'fault'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: STATE_FILL[s] }} />
              {STATE_LABEL[s]}
            </span>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
        {workshops.map((w) => {
          const ms = machines.filter((m) => m.workshop === w);
          return (
            <div key={w} className="rounded-md border border-line bg-surface-soft p-3">
              <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-mute">
                <span>{w}</span>
                <span className="rounded-pill bg-surface-muted px-[7px] py-px text-[10.5px]">{ms.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ms.map((m) => (
                  <div
                    key={m.id}
                    title={`${m.code} — ${m.name} · ${STATE_LABEL[m.state]}`}
                    className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg"
                    style={{
                      background: STATE_FILL[m.state],
                      boxShadow: m.state === 'fault' ? '0 0 0 2px rgba(220,38,38,0.25)' : 'none',
                    }}
                  >
                    <span className="font-mono text-[11px] font-semibold text-white">
                      {m.code.replace('MCH-', '')}
                    </span>
                    {m.criticality === 'high' && (
                      <span className="absolute right-[3px] top-[3px] h-[5px] w-[5px] rounded-full bg-white/90" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Predictions + top machines ───────────────────────────────────────────────
function PredictionsCard({ top }: { top: { code: string; name: string; count: number }[] }) {
  const max = top[0]?.count || 1;
  return (
    <section className="flex flex-col rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="border-b border-line px-5 py-4">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-warning shadow-[0_0_8px_var(--warning)]" />
          Prédiction de pannes
        </h3>
        <div className="mt-0.5 text-xs text-mute">Analyse de fréquence &amp; MTBF</div>
      </div>
      <div className="px-5 py-[60px] text-center text-mute">Aucun risque détecté à court terme 🎉</div>
      <div className="mt-auto border-t border-line px-5 py-3">
        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-mute">
          Top machines les plus en panne
        </div>
        {top.slice(0, 4).map((x) => (
          <div key={x.code} className="mb-[7px] flex items-center gap-2.5">
            <span className="w-14 flex-shrink-0 font-mono text-[11px] text-mute">{x.code}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-surface-muted">
              <div
                className="h-full rounded"
                style={{ width: `${(x.count / max) * 100}%`, background: 'linear-gradient(90deg, #DC2626, #F59E0B)' }}
              />
            </div>
            <span className="w-4 text-right text-xs font-bold">{x.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── KPI tiles ────────────────────────────────────────────────────────────────
function KpiTile({
  label,
  value,
  delta,
  color,
  bar,
  featured,
}: {
  label: string;
  value: string;
  delta?: string;
  color?: string;
  bar?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border px-5 py-[18px] ${
        featured ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface'
      }`}
    >
      <div className={`text-xs font-medium ${featured ? 'text-white/70' : 'text-mute'}`}>{label}</div>
      <div className="mt-1.5 text-[34px] font-bold leading-none tracking-tight" style={{ color }}>
        {value}
      </div>
      {delta && <div className={`mt-2 text-xs ${featured ? 'text-white/70' : 'text-mute'}`}>{delta}</div>}
      {bar && <div className="absolute inset-x-0 bottom-0 h-[3px] opacity-50" style={{ background: bar }} />}
    </div>
  );
}

function Card({
  title,
  sub,
  headerRight,
  children,
}: {
  title: string;
  sub?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {sub && <div className="mt-0.5 text-xs text-mute">{sub}</div>}
        </div>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ── 14-day activity bar chart (SVG, ported from the prototype) ───────────────
interface TrendDay {
  iso: string;
  label: number;
  interventions: number;
  faults: number;
}
function buildTrend(faults: Fault[], interventions: Intervention[]): TrendDay[] {
  const dates = [
    ...faults.map((f) => f.reportedAt.slice(0, 10)),
    ...interventions.map((i) => i.scheduledFor.slice(0, 10)),
  ].sort();
  const endIso = dates.length ? dates[dates.length - 1]! : new Date().toISOString().slice(0, 10);
  const end = new Date(`${endIso}T00:00:00`);
  const days: TrendDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      label: d.getDate(),
      interventions: interventions.filter((x) => x.scheduledFor.slice(0, 10) === iso).length,
      faults: faults.filter((x) => x.reportedAt.slice(0, 10) === iso).length,
    });
  }
  return days;
}

interface TLItem {
  ts: string;
  machineId: string;
  title: string;
  description: string;
  tone: 'crit' | 'warn' | 'ok';
}
function buildTimeline(faults?: Fault[], interventions?: Intervention[]): TLItem[] | null {
  if (!faults || !interventions) return null;
  const items: TLItem[] = [];
  faults.forEach((f) =>
    items.push({
      ts: f.reportedAt,
      machineId: f.machineId,
      title: `Panne ${(SEVERITY_LABEL[f.severity] ?? '').toLowerCase()} — ${TYPE_LABEL[f.type] ?? f.type}`,
      description: f.description,
      tone: f.severity === 'critical' ? 'crit' : f.severity === 'medium' ? 'warn' : 'ok',
    }),
  );
  interventions.forEach((i) =>
    items.push({
      ts: i.scheduledFor,
      machineId: i.machineId,
      title: `Intervention ${(KIND_LABEL[i.kind] ?? '').toLowerCase()}`,
      description: i.description,
      tone: 'ok',
    }),
  );
  return items.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 6);
}

function BarChart({ data }: { data: TrendDay[] }) {
  const W = 700;
  const H = 200;
  const P = { top: 20, right: 10, bottom: 28, left: 30 };
  const cw = W - P.left - P.right;
  const ch = H - P.top - P.bottom;
  const max = Math.max(4, ...data.map((d) => Math.max(d.interventions, d.faults)));
  const barW = (cw / data.length) * 0.4;
  const groupW = cw / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[220px] w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line
          key={i}
          x1={P.left}
          y1={P.top + ch * p}
          x2={W - P.right}
          y2={P.top + ch * p}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray={p === 1 ? '0' : '2 3'}
        />
      ))}
      {[0, 0.5, 1].map((p, i) => (
        <text key={i} x={P.left - 6} y={P.top + ch * (1 - p) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
          {Math.round(max * p)}
        </text>
      ))}
      {data.map((d, i) => {
        const x = P.left + groupW * i + groupW / 2;
        const hI = (d.interventions / max) * ch;
        const hF = (d.faults / max) * ch;
        return (
          <g key={i}>
            <rect x={x - barW - 1} y={P.top + ch - hI} width={barW} height={hI} fill="var(--brand-bright)" rx="2" />
            <rect x={x + 1} y={P.top + ch - hF} width={barW} height={hF} fill="var(--critical)" rx="2" opacity="0.85" />
            <text x={x} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ['var(--brand)', 'var(--info)', 'var(--warning)', 'var(--critical)', '#7C3AED', '#0E1410'];
  let angle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const a0 = angle;
    const a1 = angle + (d.count / total) * Math.PI * 2;
    angle = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const cx = 80;
    const cy = 80;
    const ro = 70;
    const ri = 44;
    const path = `M${cx + Math.cos(a0) * ro},${cy + Math.sin(a0) * ro} A${ro},${ro} 0 ${large} 1 ${cx + Math.cos(a1) * ro},${cy + Math.sin(a1) * ro} L${cx + Math.cos(a1) * ri},${cy + Math.sin(a1) * ri} A${ri},${ri} 0 ${large} 0 ${cx + Math.cos(a0) * ri},${cy + Math.sin(a0) * ri} Z`;
    return { path, color: colors[i % colors.length], type: d.type, count: d.count };
  });
  return (
    <div className="flex items-center gap-[18px]">
      <svg viewBox="0 0 160 160" width="160" height="160" className="flex-[0_0_160px]">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}
        <circle cx="80" cy="80" r="40" fill="var(--surface)" />
        <text x="80" y="78" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          Total
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)">
          {total}
        </text>
      </svg>
      <div className="flex flex-1 flex-col gap-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} />
            <span className="flex-1">{TYPE_LABEL[s.type] ?? s.type}</span>
            <b>{s.count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderLink({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-sm px-2.5 py-[5px] text-xs font-semibold text-mute transition hover:bg-surface-muted hover:text-ink">
      {children} <Icon name="logout" size={12} />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const kpis = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: () => api.dashboard.kpis() });
  const machines = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const top = useQuery({
    queryKey: ['dashboard', 'top-fault-machines'],
    queryFn: () => api.dashboard.topFaultMachines(),
  });
  const faults = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });
  const interventions = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });
  const byType = useQuery({
    queryKey: ['dashboard', 'faults-by-type'],
    queryFn: () => api.dashboard.faultsByType(),
  });

  const k = kpis.data;
  const firstName = user?.name.split(' ')[0] ?? '';
  const nameOf = (id: string) => machines.data?.find((m) => m.id === id)?.name ?? id;

  const trend = faults.data && interventions.data ? buildTrend(faults.data, interventions.data) : null;
  const criticalAlerts =
    faults.data?.filter((f) => f.status !== 'resolved' && f.severity === 'critical').slice(0, 4) ?? [];
  const upcoming =
    interventions.data
      ?.filter((i) => i.status !== 'completed')
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
      .slice(0, 5) ?? [];
  const timeline = buildTimeline(faults.data, interventions.data);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Vue d’ensemble de l’atelier</h1>
        <p className="mt-0.5 text-sm text-mute">
          Bonjour {firstName} — voici l’état temps réel des équipements.
        </p>
      </header>

      {/* Intelligence row */}
      <div className="mb-[22px] grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        {k ? <HealthBand k={k} /> : <Block h={188} />}
        {k ? <MaintenanceWeather k={k} /> : <Block h={188} />}
      </div>

      {/* Heatmap + predictions */}
      <div className="mb-[22px] grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        {machines.data ? <WorkshopHeatmap machines={machines.data} /> : <Block h={260} />}
        {top.data ? <PredictionsCard top={top.data} /> : <Block h={260} />}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {k && (
          <>
            <KpiTile label="Machines totales" value={`${k.totalMachines}`} delta={`${k.totalMachines} unités`} bar="linear-gradient(90deg, var(--brand), var(--brand-bright))" />
            <KpiTile label="En service" value={`${k.ok}`} color="#00C24A" delta={`${Math.round((k.ok / Math.max(1, k.totalMachines)) * 100)}% du parc`} bar="linear-gradient(90deg, #00C24A, #00FF00)" />
            <KpiTile label="En panne" value={`${k.fault}`} color="#DC2626" delta={`${k.criticalFaults} critiques`} bar="linear-gradient(90deg, #DC2626, #F59E0B)" />
            <KpiTile featured label="Interventions actives" value={`${k.inProgressInterventions}`} delta={`${k.plannedInterventions} planifiées`} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="mt-[22px] grid gap-3.5 lg:grid-cols-[2fr_1fr]">
        <Card
          title="Activité de l'atelier"
          sub="Interventions et pannes sur 14 jours"
          headerRight={
            <div className="flex gap-3.5 text-xs text-mute">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-brand-bright" /> Interventions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-critical" /> Pannes
              </span>
            </div>
          }
        >
          {trend ? <BarChart data={trend} /> : <Block h={220} />}
        </Card>
        <Card title="Pannes par type" sub={`Total ${faults.data?.length ?? 0} pannes`}>
          {byType.data ? <Donut data={byType.data} /> : <Block h={160} />}
        </Card>
      </div>

      {/* Critical alerts + upcoming */}
      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-critical shadow-[0_0_10px_var(--critical)]" />
                Alertes critiques
              </h3>
              <div className="mt-0.5 text-xs text-mute">{criticalAlerts.length} en cours</div>
            </div>
            <HeaderLink>Voir</HeaderLink>
          </div>
          {criticalAlerts.length === 0 ? (
            <div className="px-5 py-[60px] text-center text-mute">Aucune alerte critique 🎉</div>
          ) : (
            criticalAlerts.map((f) => (
              <div key={f.id} className="flex items-center gap-3 border-t border-line px-5 py-3">
                <span className="w-1 self-stretch rounded-[2px] bg-critical" />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-semibold text-[13.5px]">{nameOf(f.machineId)}</span>
                    <Pill tone={SEV_TONE[f.severity]}>{SEVERITY_LABEL[f.severity]}</Pill>
                  </div>
                  <div className="truncate text-[12.5px] text-mute">{f.description}</div>
                </div>
                <Pill tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</Pill>
              </div>
            ))
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Interventions à venir</h3>
              <div className="mt-0.5 text-xs text-mute">{upcoming.length} à venir</div>
            </div>
            <HeaderLink>Voir</HeaderLink>
          </div>
          {upcoming.map((i) => {
            const d = new Date(i.scheduledFor);
            return (
              <div key={i.id} className="flex items-center gap-3 border-t border-line px-5 py-3">
                <div className="min-w-[38px] text-center">
                  <div className="text-[10px] font-semibold uppercase text-mute">
                    {d.toLocaleString('fr-FR', { month: 'short' })}
                  </div>
                  <div className="text-xl font-bold leading-none">{d.getDate()}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-semibold text-[13.5px]">{nameOf(i.machineId)}</span>
                    <Pill tone={i.kind === 'preventive' ? 'info' : 'warn'}>{KIND_LABEL[i.kind]}</Pill>
                  </div>
                  <div className="text-[12.5px] text-mute">{i.duration} h planifiées</div>
                </div>
                <Pill tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Pill>
              </div>
            );
          })}
        </section>
      </div>

      {/* Recent activity timeline */}
      <div className="mt-3.5">
        <Card title="Activité récente" sub="6 derniers événements">
          {timeline ? (
            <div className="relative pl-[22px]">
              <span className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
              {timeline.map((it, idx) => (
                <div key={idx} className="relative pb-[18px] pt-1">
                  <span
                    className="absolute -left-[19px] top-2 h-3 w-3 rounded-full border-2 bg-surface"
                    style={{
                      borderColor:
                        it.tone === 'crit' ? '#DC2626' : it.tone === 'warn' ? '#F59E0B' : '#00C24A',
                      background: it.tone === 'ok' ? '#00FF00' : 'var(--surface)',
                    }}
                  />
                  <div className="font-mono text-[11.5px] text-mute">
                    {new Date(it.ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="my-0.5 text-[13.5px] font-semibold">{it.title}</div>
                  <div className="text-[12.5px] text-mute">
                    <span className="font-semibold text-brand-deep">{nameOf(it.machineId)}</span> — {it.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Block h={200} />
          )}
        </Card>
      </div>
    </div>
  );
}

function Block({ h }: { h: number }) {
  return <div className="animate-pulse rounded-lg bg-surface-muted" style={{ height: h }} />;
}
