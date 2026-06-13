'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icon';
import { ConfirmDialog, Field, inputClass, Modal } from '@/components/ui/modal';
import { api, type MachineInput } from '@/lib/api-client';
import type { Machine } from '@maintflow/shared';

const MACHINE_TYPES = [
  'compresseur', 'convoyeur', 'machine-outil', 'presse', 'pompe', 'moteur',
  'robot', 'chaudiere', 'manutention', 'extrudeuse', 'refrigeration',
];
const STATE_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'ok', label: 'Opérationnel' },
  { key: 'maintenance', label: 'En maintenance' },
  { key: 'fault', label: 'En panne' },
];
const STATE_PILL: Record<string, string> = {
  ok: 'text-okFg bg-brand-50 border-brand-100',
  maintenance: 'text-warnFg bg-warnBg border-[#FDE68A]',
  fault: 'text-critFg bg-critBg border-[#FECACA]',
};
const STATE_LABEL: Record<string, string> = { ok: 'Opérationnel', maintenance: 'En maintenance', fault: 'En panne' };

function StatePill({ state }: { state: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${STATE_PILL[state]}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {STATE_LABEL[state]}
    </span>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function nextCode(machines: Machine[]): string {
  const max = machines.reduce((m, x) => {
    const n = Number(x.code.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `MCH-${String(max + 1).padStart(3, '0')}`;
}

type FormState = Omit<MachineInput, 'code'>;
const EMPTY: FormState = {
  name: '', type: 'moteur', workshop: 'Atelier A',
  installedAt: new Date().toISOString().slice(0, 10), state: 'ok', criticality: 'medium',
};

export default function MachinesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });

  const [filter, setFilter] = useState('all');
  const [workshop, setWorkshop] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Machine | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Machine | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['machines'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createM = useMutation({ mutationFn: api.machines.create, onSuccess: invalidate });
  const updateM = useMutation({
    mutationFn: (v: { id: string; body: Partial<MachineInput> }) => api.machines.update(v.id, v.body),
    onSuccess: invalidate,
  });
  const deleteM = useMutation({ mutationFn: (id: string) => api.machines.remove(id), onSuccess: invalidate });

  const list = machines ?? [];
  const workshops = [...new Set(list.map((m) => m.workshop))];
  const counts = {
    all: list.length,
    ok: list.filter((m) => m.state === 'ok').length,
    maintenance: list.filter((m) => m.state === 'maintenance').length,
    fault: list.filter((m) => m.state === 'fault').length,
  } as Record<string, number>;
  const filtered = list.filter((m) => {
    if (filter !== 'all' && m.state !== filter) return false;
    if (workshop !== 'all' && m.workshop !== workshop) return false;
    if (query && !`${m.name} ${m.code} ${m.type}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Parc machines</h1>
        <p className="mt-1 text-[13.5px] text-mute">
          Gérez l’ensemble des équipements industriels de votre atelier.
        </p>
      </header>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        {STATE_FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-[11px] py-1.5 text-[12.5px] font-medium ${
                on ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
              }`}
            >
              {f.label}
              <span
                className={`rounded-pill px-1.5 py-px text-[10.5px] ${on ? 'bg-white/20 text-white/90' : 'bg-surface-muted text-mute'}`}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <select
          value={workshop}
          onChange={(e) => setWorkshop(e.target.value)}
          className="rounded-pill border border-line bg-surface px-3 py-1.5 text-[12.5px] text-mute"
        >
          <option value="all">Tous les ateliers</option>
          {workshops.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <div className="relative flex-[0_1_240px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">
            <Icon name="search" size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer le parc…"
            className="w-full rounded-md border border-transparent bg-surface-muted py-2 pl-9 pr-3 text-[13px] outline-none focus:border-line-strong"
          />
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
        >
          <Icon name="plus" size={14} /> Ajouter une machine
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-soft text-[11px] uppercase tracking-[0.06em] text-mute">
              {['ID', 'Machine', 'Type', 'Atelier', 'Installé', 'Heures', 'État', ''].map((h, i) => (
                <th key={i} className="border-b border-line px-4 py-2.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                onClick={() => router.push(`/machines/${m.id}`)}
                className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface-soft"
              >
                <td className="px-4 py-3 font-mono text-mute">{m.code}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{m.name}</div>
                  {m.criticality === 'high' && (
                    <div className="mt-0.5 text-[11.5px] text-warnFg">⚡ Criticité élevée</div>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{m.type}</td>
                <td className="px-4 py-3">{m.workshop}</td>
                <td className="px-4 py-3 text-mute">{fmtDate(m.installedAt)}</td>
                <td className="px-4 py-3 text-mute">{m.runtime.toLocaleString('fr-FR')} h</td>
                <td className="px-4 py-3">
                  <StatePill state={m.state} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(m); }}
                      title="Modifier"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-surface-muted hover:text-ink"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDel(m); }}
                      title="Supprimer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-critBg hover:text-critFg"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-[60px] text-center text-mute">
                  Aucune machine
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MachineForm
        open={adding || !!editing}
        editing={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSave={(form) => {
          if (editing) updateM.mutate({ id: editing.id, body: form });
          else createM.mutate({ ...form, code: nextCode(list) });
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && deleteM.mutate(confirmDel.id)}
        title={`Supprimer ${confirmDel?.name} ?`}
        body="La machine et son historique associé seront définitivement supprimés."
      />
    </div>
  );
}

function MachineForm({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Machine | null;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        workshop: editing.workshop,
        installedAt: editing.installedAt.slice(0, 10),
        state: editing.state,
        criticality: editing.criticality,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier la machine' : 'Ajouter une machine'}
      subtitle={editing ? editing.code : 'Identifiant attribué automatiquement'}
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Icon name="check" size={14} /> Enregistrer
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Nom de la machine">
          <input className={inputClass} value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="ex : Compresseur Atlas A7" />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => upd('type', e.target.value)}>
              {MACHINE_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Atelier / Localisation">
            <input className={inputClass} value={form.workshop} onChange={(e) => upd('workshop', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Date d’installation">
            <input type="date" className={inputClass} value={form.installedAt} onChange={(e) => upd('installedAt', e.target.value)} />
          </Field>
          <Field label="État initial">
            <select className={inputClass} value={form.state} onChange={(e) => upd('state', e.target.value as FormState['state'])}>
              <option value="ok">Opérationnel</option>
              <option value="maintenance">En maintenance</option>
              <option value="fault">En panne</option>
            </select>
          </Field>
        </div>
        <Field label="Criticité">
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => upd('criticality', c)}
                className={`rounded-pill border px-3 py-1.5 text-[12.5px] font-medium ${
                  form.criticality === c ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
                }`}
              >
                {c === 'low' ? 'Faible' : c === 'medium' ? 'Moyenne' : 'Élevée'}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
