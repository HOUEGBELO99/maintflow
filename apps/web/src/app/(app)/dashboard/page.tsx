'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const FAULT_TYPE_LABEL: Record<string, string> = {
  mecanique: 'Mécanique',
  electrique: 'Électrique',
  hydraulique: 'Hydraulique',
  logiciel: 'Logiciel',
};

function KpiTile({
  label,
  value,
  sub,
  featured,
}: {
  label: string;
  value: string;
  sub?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border px-5 py-[18px] ${
        featured ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface'
      }`}
    >
      <div className={`text-xs font-medium ${featured ? 'text-white/70' : 'text-mute'}`}>{label}</div>
      <div className="mt-1.5 text-[34px] font-bold leading-none tracking-tight">{value}</div>
      {sub && <div className={`mt-1 text-xs ${featured ? 'text-white/70' : 'text-mute'}`}>{sub}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const kpis = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: () => api.dashboard.kpis() });
  const byType = useQuery({
    queryKey: ['dashboard', 'faults-by-type'],
    queryFn: () => api.dashboard.faultsByType(),
  });
  const topMachines = useQuery({
    queryKey: ['dashboard', 'top-fault-machines'],
    queryFn: () => api.dashboard.topFaultMachines(),
  });

  const k = kpis.data;
  const maxType = Math.max(1, ...(byType.data?.map((t) => t.count) ?? [1]));
  const maxTop = Math.max(1, ...(topMachines.data?.map((m) => m.count) ?? [1]));

  return (
    <div>
      {/* KPI row */}
      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          featured
          label="Score de santé du parc"
          value={k ? `${k.healthScore}` : '—'}
          sub="sur 100, pondéré par criticité"
        />
        <KpiTile
          label="Pannes actives"
          value={k ? `${k.activeFaults}` : '—'}
          sub={k ? `${k.criticalFaults} critique${k.criticalFaults > 1 ? 's' : ''}` : undefined}
        />
        <KpiTile
          label="Interventions en cours"
          value={k ? `${k.inProgressInterventions}` : '—'}
          sub={k ? `${k.plannedInterventions} planifiées` : undefined}
        />
        <KpiTile label="MTTR moyen" value={k?.mttr != null ? `${k.mttr} h` : '—'} sub="correctif terminé" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* Machine state */}
        <Card title="État du parc">
          {k ? (
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Opérationnelles', value: k.ok, color: 'bg-ok' },
                { label: 'En panne', value: k.fault, color: 'bg-critical' },
                { label: 'En maintenance', value: k.maintenance, color: 'bg-warning' },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                  <span className="flex-1 text-sm text-body">{row.label}</span>
                  <span className="font-mono text-sm font-semibold">{row.value}</span>
                </li>
              ))}
              <li className="mt-1 flex items-center gap-3 border-t border-line pt-3">
                <span className="flex-1 text-sm font-medium">Total machines</span>
                <span className="font-mono text-sm font-bold">{k.totalMachines}</span>
              </li>
            </ul>
          ) : (
            <Skeleton />
          )}
        </Card>

        {/* Faults by type */}
        <Card title="Pannes par type">
          {byType.data ? (
            <ul className="flex flex-col gap-3">
              {byType.data.map((t) => (
                <li key={t.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-body">{FAULT_TYPE_LABEL[t.type] ?? t.type}</span>
                    <span className="font-mono font-semibold">{t.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-surface-muted">
                    <div className="h-full rounded-pill bg-brand" style={{ width: `${(t.count / maxType) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton />
          )}
        </Card>

        {/* Top fault machines */}
        <Card title="Machines les plus en panne">
          {topMachines.data ? (
            <ul className="flex flex-col gap-3">
              {topMachines.data.map((m) => (
                <li key={m.machineId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate text-body">{m.name}</span>
                    <span className="font-mono font-semibold">{m.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-surface-muted">
                    <div
                      className="h-full rounded-pill bg-critical"
                      style={{ width: `${(m.count / maxTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton />
          )}
        </Card>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-24 animate-pulse rounded-md bg-surface-muted" />;
}
