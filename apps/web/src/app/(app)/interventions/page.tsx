'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Spinner, useBusy } from '@/components/ui/busy';
import { Icon } from '@/components/icon';
import { ConfirmDialog, Field, inputClass, Modal } from '@/components/ui/modal';
import { calendarCells, calendarTitle, todayISO, toISO } from '@/lib/dates';
import { api, type InterventionInput, type InterventionUpdate, type SiteUser } from '@/lib/api-client';
import type {
  ChecklistItem,
  Fault,
  Intervention,
  InterventionKind,
  InterventionStatus,
  Machine,
} from '@maintflow/shared';
import { Permission } from '@maintflow/shared';
import { useCan } from '@/lib/permissions';

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
const SEV_PILL: Record<string, string> = {
  critical: 'text-critFg bg-critBg border-[#FECACA]',
  medium: 'text-warnFg bg-warnBg border-[#FDE68A]',
  low: 'text-okFg bg-brand-50 border-brand-100',
};
const SEV_LABEL: Record<string, string> = { critical: 'Critique', medium: 'Moyen', low: 'Faible' };

/** Standard work-order checklist seeded when an intervention has none yet. */
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { label: 'Consignation / sécurité (LOTO)', done: false },
  { label: 'Diagnostic et inspection', done: false },
  { label: 'Réparation / remplacement', done: false },
  { label: 'Test de fonctionnement', done: false },
  { label: 'Nettoyage et rangement', done: false },
];

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
  const can = useCan();
  const qc = useQueryClient();
  const { data: items } = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.users.list() });
  const { data: faults } = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });

  const [filter, setFilter] = useState<FilterKey>('active');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [adding, setAdding] = useState(false);
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Intervention | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['interventions'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createI = useMutation({ mutationFn: api.interventions.create, onSuccess: invalidate });
  const patchI = useMutation({
    mutationFn: (v: { id: string; body: InterventionUpdate }) => api.interventions.update(v.id, v.body),
    onSuccess: invalidate,
  });
  const deleteI = useMutation({ mutationFn: (id: string) => api.interventions.remove(id), onSuccess: invalidate });

  const list = items ?? [];
  const machine = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const techName = (id: string) => users?.find((u) => u.id === id)?.name ?? '—';
  const openFaults = (faults ?? []).filter((f) => f.status !== 'resolved');
  const sheetItem = list.find((i) => i.id === sheetFor) ?? null;

  const filtered = list
    .filter((i) => {
      if (filter === 'active') return i.status !== 'completed' && i.status !== 'cancelled';
      if (filter === 'completed') return i.status === 'completed';
      if (filter === 'preventive') return i.kind === 'preventive';
      if (filter === 'corrective') return i.kind === 'corrective';
      return true;
    })
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));

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
        {/* View toggle */}
        <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[12.5px] font-semibold ${
                view === v ? 'bg-surface-muted text-ink' : 'text-mute'
              }`}
            >
              <Icon name={v === 'list' ? 'list' : 'calendar'} size={13} />
              {v === 'list' ? 'Liste' : 'Calendrier'}
            </button>
          ))}
        </div>
        {can(Permission.PLAN_INTERVENTIONS) && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
          >
            <Icon name="plus" size={14} /> Planifier une intervention
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-soft text-[11px] uppercase tracking-[0.06em] text-mute">
                {['Réf.', 'Machine', 'Technicien', 'Type', 'Description', 'Date', 'Durée', 'Statut', ''].map((h, i) => (
                  <th key={i} className="whitespace-nowrap border-b border-line px-4 py-2.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const m = machine(it.machineId);
                return (
                  <tr
                    key={it.id}
                    onClick={() => setSheetFor(it.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-soft"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-mute">I-{it.id.slice(-4).toUpperCase()}</td>
                    <td className="min-w-[170px] px-4 py-3">
                      <div className="font-semibold">{m?.name ?? it.machineId}</div>
                      <div className="text-[11.5px] text-mute">{m?.workshop}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{techName(it.technicianId)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${KIND_PILL[it.kind]}`}>
                        {KIND_LABEL[it.kind]}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="truncate">{it.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">
                      {fmtDate(it.scheduledFor)}
                      {it.status === 'planned' && it.scheduledFor.slice(0, 10) < todayISO() && (
                        <span className="ml-1.5 rounded-pill bg-critBg px-1.5 py-px text-[10px] font-bold uppercase text-critFg">
                          En retard
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">Prévu {it.duration} h</td>
                    <td className="px-4 py-3">
                      <select
                        value={it.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => patchI.mutate({ id: it.id, body: { status: e.target.value as InterventionStatus } })}
                        disabled={!can(Permission.MANAGE_INTERVENTIONS)}
                        aria-label="Statut de l'intervention"
                        className="cursor-pointer rounded-pill disabled:cursor-default disabled:opacity-80 border border-line bg-surface-muted px-2.5 py-1 text-[11.5px] font-semibold text-body"
                      >
                        {(['planned', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSheetFor(it.id); }}
                        title="Bon de travail"
                        className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-surface-muted hover:text-ink"
                      >
                        <Icon name="file" size={14} />
                      </button>
                      {can(Permission.PLAN_INTERVENTIONS) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDel(it); }}
                          title="Supprimer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-critBg hover:text-critFg"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      )}
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
      ) : (
        <InterventionsCalendar
          interventions={filtered}
          machine={machine}
          techName={techName}
          criticalFaultIds={new Set(openFaults.filter((f) => f.severity === 'critical').map((f) => f.id))}
          onPick={(id) => setSheetFor(id)}
        />
      )}

      <InterventionForm
        open={adding}
        machines={machines ?? []}
        users={users ?? []}
        openFaults={openFaults}
        machineName={(id) => machine(id)?.name ?? id}
        onClose={() => setAdding(false)}
        onSave={(body) => {
          createI.mutate(body);
          setAdding(false);
        }}
      />
      <InterventionSheet
        item={sheetItem}
        machine={sheetItem ? machine(sheetItem.machineId) : undefined}
        users={users ?? []}
        saving={patchI.isPending}
        readOnly={!can(Permission.PLAN_INTERVENTIONS)}
        onClose={() => setSheetFor(null)}
        onSave={(body) =>
          sheetItem && patchI.mutate({ id: sheetItem.id, body }, { onSuccess: () => setSheetFor(null) })
        }
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

// ── Create form with corrective fault picker ────────────────────────────────
function InterventionForm({
  open,
  machines,
  users,
  openFaults,
  machineName,
  onClose,
  onSave,
}: {
  open: boolean;
  machines: Machine[];
  users: SiteUser[];
  openFaults: Fault[];
  machineName: (id: string) => string;
  onClose: () => void;
  onSave: (body: InterventionInput) => void;
}) {
  const busy = useBusy();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<InterventionInput>({
    machineId: '', technicianId: '', kind: 'corrective', description: '',
    scheduledFor: todayISO(), duration: 2,
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({
        machineId: machines[0]?.id ?? '',
        technicianId: users[0]?.id ?? '',
        kind: 'corrective',
        description: '',
        scheduledFor: todayISO(),
        duration: 2,
      });
    }
  }, [open, machines, users]);

  const upd = <K extends keyof InterventionInput>(k: K, v: InterventionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setKind = (kind: InterventionKind) => {
    setForm((f) => ({ ...f, kind, linkedFaultId: kind === 'corrective' ? f.linkedFaultId : undefined }));
    setStep(kind === 'corrective' ? 1 : 2);
  };

  const pickFault = (f: Fault) => {
    setForm((prev) => ({
      ...prev,
      kind: 'corrective',
      linkedFaultId: f.id,
      machineId: f.machineId,
      description: prev.description || `Réparation — ${f.description}`,
    }));
    setStep(2);
  };

  const linkedFault = form.linkedFaultId ? openFaults.find((f) => f.id === form.linkedFaultId) : null;
  const canSave =
    !!form.technicianId &&
    form.description.length >= 4 &&
    (form.kind !== 'corrective' || !!form.linkedFaultId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planifier une intervention"
      subtitle="Identifiant attribué automatiquement"
      wide
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          {form.kind === 'corrective' && step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="mr-auto inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-mute"
            >
              ‹ Changer de panne
            </button>
          )}
          <button
            onClick={() => onSave(form)}
            disabled={busy || !canSave}
            className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Spinner /> : <Icon name="check" size={14} />} {busy ? 'Enregistrement…' : 'Planifier'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Type selector */}
        <Field label="Type d’intervention">
          <div className="flex gap-1.5">
            {(['preventive', 'corrective'] as const).map((kk) => (
              <button
                key={kk}
                type="button"
                onClick={() => setKind(kk)}
                className={`rounded-pill border px-3 py-1.5 text-[12.5px] font-medium ${
                  form.kind === kk ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface text-mute'
                }`}
              >
                {KIND_LABEL[kk]}
              </button>
            ))}
          </div>
        </Field>

        {/* CORRECTIVE · step 1 — pick the fault */}
        {form.kind === 'corrective' && step === 1 && (
          <div>
            <div className="mb-2.5 text-[12.5px] text-mute">
              Sélectionnez la panne à traiter, puis affectez un technicien.
            </div>
            {openFaults.length === 0 && (
              <div className="rounded-md border border-line bg-surface-soft px-4 py-8 text-center text-[13px] text-mute">
                Aucune panne en cours 🎉
              </div>
            )}
            <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
              {openFaults.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFault(f)}
                  className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 text-left hover:border-brand hover:bg-surface-soft"
                >
                  <span
                    className="w-1 flex-none self-stretch rounded-[2px]"
                    style={{ background: f.severity === 'critical' ? 'var(--critical)' : f.severity === 'medium' ? 'var(--warning)' : 'var(--brand)' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-mute">F-{f.id.slice(-4).toUpperCase()}</span>
                      <span className={`inline-flex rounded-pill border px-[7px] py-px text-[10.5px] font-semibold ${SEV_PILL[f.severity]}`}>
                        {SEV_LABEL[f.severity]}
                      </span>
                      <span className="text-[11.5px] capitalize text-mute">{f.type}</span>
                    </div>
                    <div className="text-[13px] font-semibold">{machineName(f.machineId)}</div>
                    <div className="truncate text-[12px] text-mute">{f.description}</div>
                  </div>
                  <Icon name="arrowRight" size={15} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* step 2 — details */}
        {(form.kind === 'preventive' || step === 2) && (
          <>
            {form.kind === 'corrective' && linkedFault ? (
              <div className="flex items-center gap-3 rounded-md border border-line bg-surface-soft px-3 py-2.5">
                <span className="w-1 self-stretch rounded-[2px] bg-critical" />
                <div className="flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-mute">Panne associée</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-mute">F-{linkedFault.id.slice(-4).toUpperCase()}</span>
                    <b className="text-[13.5px]">{machineName(linkedFault.machineId)}</b>
                    <span className={`inline-flex rounded-pill border px-[7px] py-px text-[10.5px] font-semibold ${SEV_PILL[linkedFault.severity]}`}>
                      {SEV_LABEL[linkedFault.severity]}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Field label="Machine">
                <select className={inputClass} value={form.machineId} onChange={(e) => upd('machineId', e.target.value)}>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Technicien">
              <select className={inputClass} value={form.technicianId} onChange={(e) => upd('technicianId', e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.description}
                onChange={(e) => upd('description', e.target.value)}
                placeholder="Décrivez l’opération à réaliser…"
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Work order sheet (view + edit) ──────────────────────────────────────────
function InterventionSheet({
  item,
  machine,
  users,
  saving,
  readOnly = false,
  onClose,
  onSave,
}: {
  item: Intervention | null;
  machine: Machine | undefined;
  users: SiteUser[];
  saving: boolean;
  /** Supervisors (chef d'atelier) consult work orders without editing them. */
  readOnly?: boolean;
  onClose: () => void;
  onSave: (body: InterventionUpdate) => void;
}) {
  const [draft, setDraft] = useState<InterventionUpdate>({});
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (item) {
      setDraft({
        technicianId: item.technicianId,
        description: item.description,
        scheduledFor: item.scheduledFor.slice(0, 10),
        duration: item.duration,
        status: item.status,
        rating: item.rating ?? undefined,
        signedBy: item.signedBy ?? undefined,
        actualDuration: item.actualDuration ?? undefined,
      });
      setChecklist(item.checklist.length ? item.checklist : DEFAULT_CHECKLIST);
    }
  }, [item]);

  // The signature is drawn by the technician on the mobile app at closure.
  const { data: attachments } = useQuery({
    queryKey: ['files', 'intervention', item?.id],
    queryFn: () => api.files.forIntervention(item!.id),
    enabled: !!item,
  });

  if (!item) return null;
  const isClosed = item.status === 'completed';
  const locked = isClosed || readOnly;
  const doneCount = checklist.filter((c) => c.done).length;
  const allDone = checklist.length > 0 && doneCount === checklist.length;
  const signature = attachments?.find((a) => a.kind === 'signature');
  const techDisplay = users.find((u) => u.id === draft.technicianId)?.name ?? '—';

  const toggle = (idx: number) =>
    setChecklist((cl) => cl.map((c, i) => (i === idx ? { ...c, done: !c.done } : c)));
  const persist = (extra: InterventionUpdate = {}) => onSave({ ...draft, checklist, ...extra });
  // Closing from the back-office never fakes the technician's signature.
  const closeWork = () =>
    persist({
      status: 'completed',
      actualDuration: draft.actualDuration ?? item.duration,
    });

  const overrun = isClosed && item.actualDuration != null && item.actualDuration > item.duration;

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={`Bon de travail I-${item.id.slice(-4).toUpperCase()}`}
      subtitle={`${machine?.name ?? ''} · ${techDisplay}`}
      wide
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Fermer
          </button>
          {!readOnly && (
            <button
              onClick={() => persist()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-body disabled:opacity-50"
            >
                {saving ? <Spinner /> : <Icon name="check" size={14} />} {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
          {!locked && (
            <button
              onClick={closeWork}
              disabled={!allDone || saving}
              title={!allDone ? 'Validez toutes les tâches' : ''}
              className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Spinner /> : <Icon name="check" size={14} />} Clôturer le bon de travail
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-[18px]">
        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${KIND_PILL[item.kind]}`}>
            {KIND_LABEL[item.kind]}
          </span>
          <span className="inline-flex rounded-pill border border-line bg-surface-muted px-[9px] py-[3px] text-[11.5px] font-semibold text-body">
            {STATUS_LABEL[item.status]}
          </span>
          {item.linkedFaultId && (
            <span className="inline-flex rounded-pill border border-line bg-surface-muted px-[9px] py-[3px] font-mono text-[11px] text-mute">
              F-{item.linkedFaultId.slice(-4).toUpperCase()}
            </span>
          )}
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Technicien">
            <select
              className={inputClass}
              value={draft.technicianId ?? ''}
              disabled={locked}
              onChange={(e) => setDraft((d) => ({ ...d, technicianId: e.target.value }))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select
              className={inputClass}
              value={draft.status ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as InterventionStatus }))}
            >
              {(['planned', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date prévue">
            <input
              type="date"
              className={inputClass}
              value={draft.scheduledFor ?? ''}
              disabled={locked}
              onChange={(e) => setDraft((d) => ({ ...d, scheduledFor: e.target.value }))}
            />
          </Field>
          <Field label="Durée prévue (h)">
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              value={draft.duration ?? ''}
              disabled={locked}
              onChange={(e) => setDraft((d) => ({ ...d, duration: Number(e.target.value) }))}
            />
          </Field>
        </div>
        <Field label="Description de l’opération">
          <textarea
            className={`${inputClass} min-h-[70px] resize-y`}
            value={draft.description ?? ''}
            disabled={locked}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>

        {/* Checklist */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">Checklist d’intervention</div>
            <span className={`text-[12px] font-semibold tabular-nums ${allDone ? 'text-okFg' : 'text-mute'}`}>
              {doneCount} / {checklist.length} validées
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {checklist.map((c, idx) => (
              <button
                key={idx}
                onClick={() => !locked && toggle(idx)}
                disabled={locked}
                className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-left hover:bg-surface-soft disabled:cursor-default"
              >
                <span
                  className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border ${
                    c.done ? 'border-brand-deep bg-brand-deep text-white' : 'border-line bg-surface'
                  }`}
                >
                  {c.done && <Icon name="check" size={12} />}
                </span>
                <span className={`flex-1 text-[13px] ${c.done ? 'text-mute line-through' : ''}`}>{c.label}</span>
              </button>
            ))}
          </div>
          {!allDone && !isClosed && (
            <div className="mt-2 text-[12px] text-warnFg">
              ⚠ Impossible de clôturer tant que toutes les tâches ne sont pas validées.
            </div>
          )}
        </div>

        {/* Duration actual vs planned */}
        <div>
          <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">Durée réelle vs prévue</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[22px] font-bold tabular-nums">{item.duration} h</div>
              <div className="text-[11px] text-mute">Prévu</div>
            </div>
            <Icon name="arrowRight" size={16} />
            <Field label="">
              <input
                type="number"
                min={0}
                step={0.25}
                placeholder="—"
                className={`${inputClass} w-[100px]`}
                value={draft.actualDuration ?? ''}
                disabled={locked}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, actualDuration: e.target.value === '' ? undefined : Number(e.target.value) }))
                }
              />
            </Field>
            {overrun && (
              <span className="inline-flex rounded-pill border border-[#FECACA] bg-critBg px-[9px] py-[3px] text-[11px] font-semibold text-critFg">
                Dépassement +{Math.round((item.actualDuration! - item.duration) * 60)} min
              </span>
            )}
          </div>
        </div>

        {/* Signature + rating */}
        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">Signature du technicien</div>
            <div className="flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-line bg-white p-2">
              {signature?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                <img src={signature.url} alt={`Signature de ${item.signedBy ?? techDisplay}`} className="max-h-[96px] w-auto" />
              ) : (
                <span className="px-2 text-center text-[12.5px] text-faint">
                  {isClosed
                    ? 'Clôturé sans signature du technicien'
                    : 'Signée par le technicien dans l’app mobile, à la clôture'}
                </span>
              )}
            </div>
            {signature && item.signedBy && <div className="mt-1.5 text-[12px] text-mute">Signé par {item.signedBy}</div>}
          </div>
          <div>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">Évaluation (responsable)</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setDraft((d) => ({ ...d, rating: n }))}
                  className={`text-[22px] leading-none ${(draft.rating ?? 0) >= n ? 'text-warning' : 'text-faint'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[11.5px] text-mute">
              {draft.rating ? `${draft.rating} / 5 étoiles` : 'Noter la qualité de l’intervention'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Interventions calendar ──────────────────────────────────────────────────
function InterventionsCalendar({
  interventions,
  machine,
  techName,
  criticalFaultIds,
  onPick,
}: {
  interventions: Intervention[];
  machine: (id: string) => Machine | undefined;
  techName: (id: string) => string;
  criticalFaultIds: Set<string>;
  onPick: (id: string) => void;
}) {
  const today = todayISO();
  const [weekOffset, setWeekOffset] = useState(0);
  const cells = calendarCells(today, weekOffset);
  const focusMonth = (cells[17] ?? cells[0] ?? new Date()).getUTCMonth();
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const eventsOn = (d: Date) => interventions.filter((i) => i.scheduledFor.slice(0, 10) === toISO(d));

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-[18px] sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] font-semibold capitalize text-ink">{calendarTitle(cells)}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 4)}
            aria-label="Période précédente"
            className="rounded-md border border-line px-2 py-1 text-[12px] font-semibold text-body hover:bg-surface-soft"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="rounded-md border border-line px-2.5 py-1 text-[12px] font-semibold text-body hover:bg-surface-soft disabled:opacity-50"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 4)}
            aria-label="Période suivante"
            className="rounded-md border border-line px-2 py-1 text-[12px] font-semibold text-body hover:bg-surface-soft"
          >
            ›
          </button>
        </div>
      </div>
      {/* 7 columns stay readable on phones by scrolling sideways. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="min-w-[640px]">
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {weekdays.map((w) => (
          <div key={w} className="px-1.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const isToday = toISO(d) === today;
          const dim = d.getUTCMonth() !== focusMonth;
          return (
            <div
              key={i}
              className={`flex min-h-[96px] flex-col gap-[3px] rounded-[6px] border p-1.5 ${
                dim ? 'border-line bg-surface-soft opacity-60' : 'border-line bg-surface'
              } ${isToday ? 'border-brand shadow-[0_0_0_1px_var(--brand)]' : ''}`}
            >
              <div className="text-[11.5px] font-semibold text-mute">
                {d.getUTCDate()}
                {isToday && <span className="ml-1 text-brand">·</span>}
              </div>
              {eventsOn(d).map((e) => {
                const tone =
                  e.linkedFaultId && criticalFaultIds.has(e.linkedFaultId)
                    ? 'border-l-critical bg-critBg text-critFg'
                    : e.kind === 'preventive'
                      ? 'border-l-brand bg-brand-50 text-brand-deep'
                      : 'border-l-warning bg-warnBg text-warnFg';
                const tech = techName(e.technicianId).split(' ')[0];
                const num = machine(e.machineId)?.code.replace('MCH-', '') ?? '';
                return (
                  <button
                    key={e.id}
                    onClick={() => onPick(e.id)}
                    title={`${e.description} — ouvrir le bon de travail`}
                    className={`truncate rounded-[4px] border-l-2 px-1.5 py-0.5 text-left text-[10.5px] font-semibold hover:brightness-95 ${tone}`}
                  >
                    {tech} · {num}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}
