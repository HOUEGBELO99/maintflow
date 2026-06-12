'use client';

import { useQuery } from '@tanstack/react-query';

import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/store/auth';
import type { DashboardKpis, Machine } from '@maintflow/shared';

const STATE_FILL: Record<string, string> = { ok: '#00C24A', maintenance: '#F59E0B', fault: '#DC2626' };
const STATE_LABEL: Record<string, string> = { ok: 'Opérationnel', maintenance: 'Maintenance', fault: 'En panne' };

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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const kpis = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: () => api.dashboard.kpis() });
  const machines = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const top = useQuery({
    queryKey: ['dashboard', 'top-fault-machines'],
    queryFn: () => api.dashboard.topFaultMachines(),
  });

  const k = kpis.data;
  const firstName = user?.name.split(' ')[0] ?? '';

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
    </div>
  );
}

function Block({ h }: { h: number }) {
  return <div className="animate-pulse rounded-lg bg-surface-muted" style={{ height: h }} />;
}
