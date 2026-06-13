'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { ConfirmDialog, Field, inputClass, Modal } from '@/components/ui/modal';
import { api, type InterventionInput, type SiteUser } from '@/lib/api-client';
import type { Intervention, InterventionKind, InterventionStatus, Machine } from '@maintflow/shared';

const KIND_LABEL: Record<string, string> = { corrective: 'Corrective', preventive: 'Préventive' };
const KIND_PILL: Record<string, string> = {
  preventive: 'text-infoFg bg-infoBg border-[#BFDBFE]',
  corrective: 'text-warnFg bg-warnBg border-[#FDE68A]',
};
const STATUS_LABEL: Record<string, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
type FilterKey = 'active' | 'completed' | 'preventive' | 'corrective' | 'all';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'active', label: 'Actives' },
  { key: 'completed', label: 'Terminées' },
  { key: 'preventive', label: 'Préventives' },
  { key: 'corrective', label: 'Correctives' },
  { key: 'all', label: 'Toutes' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function InterventionsPage() {
  const qc = useQueryClient();
  const { data: items } = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.users.list() });

  const [filter, setFilter] = useState<FilterKey>('active');
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Intervention | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['interventions'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createI = useMutation({ mutationFn: api.interventions.create, onSuccess: invalidate });
  const updateI = useMutation({
    mutationFn: (v: { id: string; status: InterventionStatus }) => api.interventions.update(v.id, { status: v.status }),
    onSuccess: invalidate,
  });
  const deleteI = useMutation({ mutationFn: (id: string) => api.interventions.remove(id), onSuccess: invalidate });

  const list = items ?? [];
  const machine = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const techName = (id: string) => users?.find((u) => u.id === id)?.name ?? '—';

  const filtered = list
    .filter((i) => {
      if (filter === 'active') return i.status !== 'completed' && i.status !== 'cancelled';
      if (filter === 'completed') return i.status === 'completed';
      if (filter === 'preventive') return i.kind === 'preventive';
      if (filter === 'corrective') return i.kind === 'corrective';
      return true;
    })
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Interventions de maintenance</h1>
        <p className="mt-1 text-[13.5px] text-mute">Planification des opérations correctives et préventives.</p>
      </header>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-[11px] py-1.5 text-[12.5px] font-medium ${
              filter === f.key ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
        >
          <Icon name="plus" size={14} /> Planifier une intervention
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-soft text-[11px] uppercase tracking-[0.06em] text-mute">
              {['Réf.', 'Machine', 'Technicien', 'Type', 'Description', 'Date', 'Durée', 'Statut', ''].map((h, i) => (
                <th key={i} className="border-b border-line px-4 py-2.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const m = machine(it.machineId);
              return (
                <tr key={it.id} className="border-b border-line last:border-0 hover:bg-surface-soft">
                  <td className="px-4 py-3 font-mono text-mute">I-{it.id.slice(-4).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{m?.name ?? it.machineId}</div>
                    <div className="text-[11.5px] text-mute">{m?.workshop}</div>
                  </td>
                  <td className="px-4 py-3">{techName(it.technicianId)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${KIND_PILL[it.kind]}`}>
                      {KIND_LABEL[it.kind]}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="truncate">{it.description}</div>
                  </td>
                  <td className="px-4 py-3 text-mute">{fmtDate(it.scheduledFor)}</td>
                  <td className="px-4 py-3 text-mute">Prévu {it.duration} h</td>
                  <td className="px-4 py-3">
                    <select
                      value={it.status}
                      onChange={(e) => updateI.mutate({ id: it.id, status: e.target.value as InterventionStatus })}
                      className="cursor-pointer rounded-pill border border-line bg-surface-muted px-2.5 py-1 text-[11.5px] font-semibold text-body"
                    >
                      {(['planned', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmDel(it)}
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
                  Aucune intervention
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InterventionForm
        open={adding}
        machines={machines ?? []}
        users={users ?? []}
        onClose={() => setAdding(false)}
        onSave={(body) => {
          createI.mutate(body);
          setAdding(false);
        }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && deleteI.mutate(confirmDel.id)}
        title="Supprimer cette intervention ?"
        body="L’intervention planifiée sera définitivement supprimée."
      />
    </div>
  );
}

function InterventionForm({
  open,
  machines,
  users,
  onClose,
  onSave,
}: {
  open: boolean;
  machines: Machine[];
  users: SiteUser[];
  onClose: () => void;
  onSave: (body: InterventionInput) => void;
}) {
  const [form, setForm] = useState<InterventionInput>({
    machineId: '', technicianId: '', kind: 'corrective', description: '',
    scheduledFor: new Date().toISOString().slice(0, 10), duration: 2,
  });
  useEffect(() => {
    if (open) {
      setForm({
        machineId: machines[0]?.id ?? '',
        technicianId: users[0]?.id ?? '',
        kind: 'corrective',
        description: '',
        scheduledFor: new Date().toISOString().slice(0, 10),
        duration: 2,
      });
    }
  }, [open, machines, users]);
  const upd = <K extends keyof InterventionInput>(k: K, v: InterventionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planifier une intervention"
      subtitle="Identifiant attribué automatiquement"
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.machineId || !form.technicianId || form.description.length < 4}
            className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Icon name="check" size={14} /> Planifier
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Machine">
            <select className={inputClass} value={form.machineId} onChange={(e) => upd('machineId', e.target.value)}>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Technicien">
            <select className={inputClass} value={form.technicianId} onChange={(e) => upd('technicianId', e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <Field label="Type">
            <select className={inputClass} value={form.kind} onChange={(e) => upd('kind', e.target.value as InterventionKind)}>
              <option value="corrective">Corrective</option>
              <option value="preventive">Préventive</option>
            </select>
          </Field>
          <Field label="Date prévue">
            <input type="date" className={inputClass} value={form.scheduledFor} onChange={(e) => upd('scheduledFor', e.target.value)} />
          </Field>
          <Field label="Durée (h)">
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              value={form.duration}
              onChange={(e) => upd('duration', Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            value={form.description}
            onChange={(e) => upd('description', e.target.value)}
            placeholder="Décrivez l’opération à réaliser…"
          />
        </Field>
      </div>
    </Modal>
  );
}
