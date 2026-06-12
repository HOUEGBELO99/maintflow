'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { ConfirmDialog, Field, inputClass, Modal } from '@/components/ui/modal';
import { api, type FaultInput } from '@/lib/api-client';
import type { Fault, FaultSeverity, FaultStatus, FaultType, Machine } from '@maintflow/shared';

const TYPE_LABEL: Record<string, string> = {
  mecanique: 'Mécanique',
  electrique: 'Électrique',
  hydraulique: 'Hydraulique',
  logiciel: 'Logiciel',
};
const SEV_LABEL: Record<string, string> = { critical: 'Critique', medium: 'Moyen', low: 'Faible' };
const SEV_PILL: Record<string, string> = {
  critical: 'text-critFg bg-critBg border-[#FECACA]',
  medium: 'text-warnFg bg-warnBg border-[#FDE68A]',
  low: 'text-okFg bg-brand-50 border-brand-100',
};
const STATUS_LABEL: Record<string, string> = { pending: 'En attente', in_progress: 'En cours', resolved: 'Résolue' };

const pad = (n: number) => String(n).padStart(2, '0');
const isEscalated = (f: Fault) =>
  f.severity === 'critical' &&
  f.status !== 'resolved' &&
  !f.takenAt &&
  (Date.now() - new Date(f.reportedAt).getTime()) / 3600000 > 2;

function FaultChrono({ from }: { from: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, Date.now() - new Date(from).getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <span className="font-mono text-[13px] font-semibold text-critical">
      {h}h {pad(m)}m {pad(s)}s
    </span>
  );
}

function StatCard({ label, value, sub, color, featured }: { label: string; value: number; sub: string; color?: string; featured?: boolean }) {
  return (
    <div className={`rounded-lg border px-5 py-[18px] ${featured ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface'}`}>
      <div className={`text-xs font-medium ${featured ? 'text-white/70' : 'text-mute'}`}>{label}</div>
      <div className="mt-1.5 text-[30px] font-bold leading-none tracking-tight" style={{ color }}>
        {value}
      </div>
      <div className={`mt-2 text-xs ${featured ? 'text-white/70' : 'text-mute'}`}>{sub}</div>
    </div>
  );
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function FaultsPage() {
  const qc = useQueryClient();
  const { data: faults } = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });

  const [filterStat, setFilterStat] = useState<'active' | 'resolved' | 'all'>('active');
  const [filterSev, setFilterSev] = useState<'all' | FaultSeverity>('all');
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Fault | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['faults'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createF = useMutation({ mutationFn: api.faults.create, onSuccess: invalidate });
  const updateF = useMutation({
    mutationFn: (v: { id: string; status: FaultStatus }) => api.faults.update(v.id, { status: v.status }),
    onSuccess: invalidate,
  });
  const deleteF = useMutation({ mutationFn: (id: string) => api.faults.remove(id), onSuccess: invalidate });

  const list = faults ?? [];
  const machine = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const counts = {
    active: list.filter((f) => f.status !== 'resolved').length,
    resolved: list.filter((f) => f.status === 'resolved').length,
    critical: list.filter((f) => f.severity === 'critical' && f.status !== 'resolved').length,
  };
  const escalated = list.filter(isEscalated).length;
  const filtered = list
    .filter((f) => {
      if (filterSev !== 'all' && f.severity !== filterSev) return false;
      if (filterStat === 'active' && f.status === 'resolved') return false;
      if (filterStat === 'resolved' && f.status !== 'resolved') return false;
      return true;
    })
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Registre des pannes</h1>
        <p className="mt-1 text-[13.5px] text-mute">Suivi des dysfonctionnements et incidents en cours.</p>
      </header>

      <div className="mb-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard label="Pannes actives" value={counts.active} sub={`${counts.critical} critiques`} />
        <StatCard label="Escalades" value={escalated} sub="non prises en charge > 2 h" color={escalated > 0 ? '#DC2626' : undefined} />
        <StatCard featured label="Pannes résolues" value={counts.resolved} sub="historique cumulé" />
      </div>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        {(['active', 'resolved', 'all'] as const).map((k) => (
          <Chip key={k} on={filterStat === k} onClick={() => setFilterStat(k)}>
            {k === 'active' ? 'Actives' : k === 'resolved' ? 'Résolues' : 'Tous'}
            {k !== 'all' && <Count on={filterStat === k}>{counts[k]}</Count>}
          </Chip>
        ))}
        <span className="w-2" />
        {(['all', 'critical', 'medium', 'low'] as const).map((s) => (
          <Chip key={s} on={filterSev === s} onClick={() => setFilterSev(s)}>
            {s === 'all' ? 'Toutes gravités' : SEV_LABEL[s]}
          </Chip>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
        >
          <Icon name="plus" size={14} /> Déclarer une panne
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-soft text-[11px] uppercase tracking-[0.06em] text-mute">
              {['Réf.', 'Machine', 'Type', 'Description', 'Gravité', 'Immobilisation', 'Signalée', 'Statut', ''].map((h, i) => (
                <th key={i} className="border-b border-line px-4 py-2.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const m = machine(f.machineId);
              return (
                <tr key={f.id} className="border-b border-line last:border-0 hover:bg-surface-soft">
                  <td className="px-4 py-3 font-mono text-mute">F-{f.id.slice(-4).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{m?.name ?? f.machineId}</div>
                    <div className="text-[11.5px] text-mute">{m?.workshop}</div>
                  </td>
                  <td className="px-4 py-3">{TYPE_LABEL[f.type] ?? f.type}</td>
                  <td className="max-w-[300px] px-4 py-3">
                    <div className="truncate">{f.description}</div>
                    {f.rootCause && (
                      <span className="mt-1 inline-flex rounded-pill border border-line bg-surface-muted px-2 py-px text-[10.5px] text-mute">
                        Cause : {f.rootCause}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${SEV_PILL[f.severity]}`}>
                        {SEV_LABEL[f.severity]}
                      </span>
                      {isEscalated(f) && (
                        <span className="rounded-pill bg-critical px-1.5 py-px text-[10px] font-bold uppercase text-white">
                          Escalade
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {f.status !== 'resolved' ? <FaultChrono from={f.reportedAt} /> : <span className="text-mute">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-mute">{fmtDateTime(f.reportedAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={f.status}
                      onChange={(e) => updateF.mutate({ id: f.id, status: e.target.value as FaultStatus })}
                      className="cursor-pointer rounded-pill border border-line bg-surface-muted px-2.5 py-1 text-[11.5px] font-semibold text-body"
                    >
                      {(['pending', 'in_progress', 'resolved'] as const).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmDel(f)}
                      title="Supprimer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-critBg hover:text-critFg"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-[60px] text-center text-mute">
                  Aucune panne
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FaultForm
        open={adding}
        machines={machines ?? []}
        onClose={() => setAdding(false)}
        onSave={(body) => {
          createF.mutate(body);
          setAdding(false);
        }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && deleteF.mutate(confirmDel.id)}
        title="Supprimer cette panne ?"
        body="L’historique de cette panne sera définitivement perdu."
      />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-[11px] py-1.5 text-[12.5px] font-medium ${
        on ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
      }`}
    >
      {children}
    </button>
  );
}
function Count({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-pill px-1.5 py-px text-[10.5px] ${on ? 'bg-white/20 text-white/90' : 'bg-surface-muted text-mute'}`}>
      {children}
    </span>
  );
}

function FaultForm({
  open,
  machines,
  onClose,
  onSave,
}: {
  open: boolean;
  machines: Machine[];
  onClose: () => void;
  onSave: (body: FaultInput) => void;
}) {
  const [form, setForm] = useState<FaultInput>({ machineId: '', type: 'mecanique', description: '', severity: 'medium' });
  useEffect(() => {
    if (open) setForm({ machineId: machines[0]?.id ?? '', type: 'mecanique', description: '', severity: 'medium' });
  }, [open, machines]);
  const upd = <K extends keyof FaultInput>(k: K, v: FaultInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Déclarer une panne"
      subtitle="Identifiant attribué automatiquement"
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.machineId || form.description.length < 4}
            className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Icon name="check" size={14} /> Enregistrer
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Machine concernée">
          <select className={inputClass} value={form.machineId} onChange={(e) => upd('machineId', e.target.value)}>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Type de panne">
            <select className={inputClass} value={form.type} onChange={(e) => upd('type', e.target.value as FaultType)}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gravité">
            <select className={inputClass} value={form.severity} onChange={(e) => upd('severity', e.target.value as FaultSeverity)}>
              <option value="critical">Critique</option>
              <option value="medium">Moyen</option>
              <option value="low">Faible</option>
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            value={form.description}
            onChange={(e) => upd('description', e.target.value)}
            placeholder="Décrivez le dysfonctionnement observé…"
          />
        </Field>
      </div>
    </Modal>
  );
}
