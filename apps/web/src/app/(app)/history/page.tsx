'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import type { Fault, Intervention, Machine } from '@maintflow/shared';

const TYPE_FR: Record<string, string> = {
  mecanique: 'mécanique',
  electrique: 'électrique',
  hydraulique: 'hydraulique',
  logiciel: 'logiciel',
};
const SEV_FR: Record<string, string> = { critical: 'critique', medium: 'moyenne', low: 'mineure' };
const KIND_FR: Record<string, string> = { preventive: 'préventive', corrective: 'corrective' };

type ItemKind = 'fault' | 'intervention';
interface HistoryItem {
  id: string;
  kind: ItemKind;
  timestamp: string;
  machineId: string;
  title: string;
  description: string;
  meta: string;
  /** Drives the timeline marker colour. */
  severity: 'critical' | 'medium' | 'low' | 'info';
  status: string;
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

/** "Laurent Moreau" → "L. Moreau". */
const shortName = (full: string) => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  return first && last && parts.length >= 2 ? `${first[0]}. ${last}` : full;
};

const ref = (id: string, prefix: string) => `${prefix}-${id.slice(-4).toUpperCase()}`;

type FilterKey = 'all' | 'fault' | 'intervention';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'fault', label: 'Pannes' },
  { key: 'intervention', label: 'Interventions' },
];

export default function HistoryPage() {
  const { data: faults } = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });
  const { data: interventions } = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: () => api.technicians.list() });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.users.list() });

  const [kindFilter, setKindFilter] = useState<FilterKey>('all');
  const [machineFilter, setMachineFilter] = useState('all');

  const machineById = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const userName = (id: string) => {
    const tech = technicians?.find((t) => t.userId === id);
    if (tech) return tech.name;
    const u = users?.find((x) => x.id === id);
    return u ? shortName(u.name) : '—';
  };

  const all = useMemo<HistoryItem[]>(() => {
    const items: HistoryItem[] = [];
    (faults ?? []).forEach((f: Fault) =>
      items.push({
        id: f.id,
        kind: 'fault',
        timestamp: f.reportedAt,
        machineId: f.machineId,
        title: `Panne ${SEV_FR[f.severity] ?? f.severity} — ${TYPE_FR[f.type] ?? f.type}`,
        description: f.description,
        meta: `${ref(f.id, 'F')} · ${userName(f.reportedBy)}`,
        severity: f.severity,
        status: f.status,
      }),
    );
    (interventions ?? []).forEach((i: Intervention) =>
      items.push({
        id: i.id,
        kind: 'intervention',
        timestamp: `${i.scheduledFor.slice(0, 10)}T08:00:00`,
        machineId: i.machineId,
        title: `Intervention ${KIND_FR[i.kind] ?? i.kind} — ${userName(i.technicianId)}`,
        description: i.description,
        meta: `${ref(i.id, 'I')} · ${i.duration}h`,
        severity: 'info',
        status: i.status,
      }),
    );
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faults, interventions, technicians, users]);

  const filtered = all.filter((it) => {
    if (machineFilter !== 'all' && it.machineId !== machineFilter) return false;
    if (kindFilter !== 'all' && it.kind !== kindFilter) return false;
    return true;
  });

  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Machine', 'Action', 'Détails', 'Statut']];
    filtered.forEach((it) => {
      rows.push([
        fmtDateTime(it.timestamp),
        it.kind === 'fault' ? 'Panne' : 'Intervention',
        machineById(it.machineId)?.name ?? it.machineId,
        it.title,
        it.description,
        it.status,
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintflow-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Historique de maintenance</h1>
        <p className="mt-1 text-[13.5px] text-mute">Journal chronologique des actions sur les équipements.</p>
      </header>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKindFilter(f.key)}
            className={`rounded-pill border px-[11px] py-1.5 text-[12.5px] font-medium ${
              kindFilter === f.key ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={machineFilter}
          onChange={(e) => setMachineFilter(e.target.value)}
          className="rounded-pill border border-line bg-surface px-[11px] py-1.5 text-[12.5px] font-medium text-mute"
        >
          <option value="all">Toutes machines</option>
          {(machines ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-md border border-transparent bg-surface-muted px-3.5 py-2 text-[13px] font-semibold text-body transition hover:bg-line"
        >
          <Icon name="download" size={14} /> CSV
        </button>
      </div>

      <div className="rounded-lg border border-line bg-surface px-5 py-[18px]">
        <div className="relative pl-[22px]">
          <div className="absolute bottom-1.5 left-[7px] top-1.5 w-0.5 bg-line" />
          {filtered.map((it) => {
            const marker =
              it.severity === 'critical'
                ? 'border-critical bg-surface'
                : it.severity === 'medium'
                  ? 'border-warning bg-surface'
                  : 'border-brand bg-brand-bright';
            return (
              <div key={`${it.kind}-${it.id}`} className="relative pb-[18px] pt-1">
                <div className={`absolute -left-[19px] top-2 h-3 w-3 rounded-full border-2 ${marker}`} />
                <div className="font-mono text-[11.5px] text-mute">
                  {fmtDateTime(it.timestamp)} ·{' '}
                  <span
                    className={`inline-flex rounded-pill border px-[9px] py-[2px] text-[11px] font-semibold ${
                      it.kind === 'fault'
                        ? 'border-[#FECACA] bg-critBg text-critFg'
                        : 'border-[#BFDBFE] bg-infoBg text-infoFg'
                    }`}
                  >
                    {it.kind === 'fault' ? 'Panne' : 'Intervention'}
                  </span>{' '}
                  · {it.meta}
                </div>
                <div className="my-1 text-[13.5px] font-semibold">{it.title}</div>
                <div className="text-[12.5px] text-mute">
                  <span className="font-semibold text-brand-deep">{machineById(it.machineId)?.name ?? it.machineId}</span>{' '}
                  — {it.description}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-[13px] text-mute">Aucun élément</div>
          )}
        </div>
      </div>
    </div>
  );
}
