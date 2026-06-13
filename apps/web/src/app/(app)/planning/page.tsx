'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/icon';
import { Field, inputClass, Modal } from '@/components/ui/modal';
import { api, type PlanRuleInput } from '@/lib/api-client';
import type { Intervention, Machine, PlanRule, Technician } from '@maintflow/shared';

/** Reference "today" of the seeded scenario — mirrors the API scenario clock. */
const SCENARIO_TODAY = '2026-05-21';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const daysUntil = (iso: string) =>
  Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${SCENARIO_TODAY}T00:00:00Z`)) / 86_400_000);

export default function PlanningPage() {
  const qc = useQueryClient();
  const { data: rules } = useQuery({ queryKey: ['planning', 'rules'], queryFn: () => api.planning.rules() });
  const { data: upcoming } = useQuery({ queryKey: ['planning', 'upcoming'], queryFn: () => api.planning.upcoming() });
  const { data: reminders } = useQuery({ queryKey: ['planning', 'reminders'], queryFn: () => api.planning.reminders() });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: () => api.technicians.list() });
  const { data: interventions } = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });
  const { data: faults } = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });

  const [adding, setAdding] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['planning'] });
    void qc.invalidateQueries({ queryKey: ['interventions'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const createRule = useMutation({ mutationFn: api.planning.createRule, onSuccess: () => { invalidate(); setAdding(false); } });
  const schedule = useMutation({ mutationFn: (id: string) => api.planning.schedule(id), onSuccess: invalidate });
  const toggle = useMutation({
    mutationFn: (r: PlanRule) => api.planning.updateRule(r.id, { active: !r.active }),
    onSuccess: invalidate,
  });

  const machineById = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const techName = (id: string | null) =>
    (id && technicians?.find((t) => t.userId === id)?.name) || '—';

  const ruleList = rules ?? [];
  const activeRules = ruleList.filter((r) => r.active).length;
  const plannedPreventive = (interventions ?? []).filter((i) => i.kind === 'preventive' && i.status === 'planned').length;

  // Conflict detection: a technician with ≥2 active interventions on the same day.
  const conflicts = useMemo(() => {
    const map = new Map<string, { tech: string; date: string; count: number }>();
    (interventions ?? [])
      .filter((i) => i.status !== 'completed' && i.status !== 'cancelled')
      .forEach((i) => {
        const date = i.scheduledFor.slice(0, 10);
        const key = `${i.technicianId}|${date}`;
        const prev = map.get(key);
        map.set(key, { tech: i.technicianId, date, count: (prev?.count ?? 0) + 1 });
      });
    return [...map.values()].filter((c) => c.count > 1);
  }, [interventions]);

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Planification intelligente</h1>
        <p className="mt-1 text-[13.5px] text-mute">
          Maintenances préventives, génération automatique et détection de conflits.
        </p>
      </header>

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <StatBox label="Règles actives" value={activeRules} />
        <StatBox label="Rappels programmés" value={upcoming?.length ?? 0} />
        <StatBox label="Préventives planifiées" value={plannedPreventive} />
        <div className="flex-1" />
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
        >
          <Icon name="plus" size={14} /> Ajouter une planification
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-[18px] flex items-center gap-2.5 rounded-md border border-warning bg-warnBg px-4 py-3">
          <span className="inline-flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-[#FDE68A] text-warnFg">
            <Icon name="fault" size={16} />
          </span>
          <div>
            <b className="text-[13.5px]">
              {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} de planning détecté
              {conflicts.length > 1 ? 's' : ''}
            </b>
            <div className="text-[12.5px] text-mute">
              {conflicts
                .map((c) => `${techName(c.tech)} — ${fmtDate(c.date)} (${c.count} interventions)`)
                .join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="mb-[22px] grid grid-cols-[1.1fr_0.9fr] gap-3.5">
        {/* Preventive rules */}
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-semibold">Règles de maintenance préventive</h3>
            <div className="mt-0.5 text-xs text-mute">Récurrence + rappel automatique avant échéance</div>
          </div>
          {ruleList.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-mute">
              Aucune règle. Cliquez « Ajouter une planification ».
            </div>
          )}
          {ruleList.map((r) => {
            const dueIn = daysUntil(r.nextDue);
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 border-t border-line px-5 py-[13px] ${r.active ? '' : 'opacity-50'}`}
              >
                <div className="w-1 flex-none self-stretch rounded-[2px] bg-info" />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-mute">{r.code}</span>
                    <span className="inline-flex rounded-pill border border-[#BFDBFE] bg-infoBg px-[9px] py-[3px] text-[11px] font-semibold text-infoFg">
                      Toutes les {r.everyWeeks} sem.
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface-muted px-[9px] py-[3px] text-[10.5px] font-semibold text-mute">
                      <Icon name="bell" size={11} /> Rappel J-{r.reminderLead}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-semibold">{r.title}</div>
                  <div className="text-[12px] text-mute">
                    {machineById(r.machineId)?.name ?? r.machineId} · {techName(r.technicianId)} · prochaine :{' '}
                    <b className={dueIn <= 2 ? 'text-warning' : 'text-body'}>{fmtDate(r.nextDue)}</b>{' '}
                    {dueIn >= 0 ? `(J-${dueIn})` : '(échue)'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={() => schedule.mutate(r.id)}
                    disabled={!r.active}
                    title="Créer le bon de travail et avancer la date"
                    className="inline-flex items-center gap-1.5 rounded-md border border-brand bg-brand-bright px-2.5 py-[5px] text-xs font-bold text-brand-deep transition hover:bg-brand disabled:opacity-50"
                  >
                    <Icon name="calendar" size={12} /> Planifier
                  </button>
                  <button
                    onClick={() => toggle.mutate(r)}
                    className="rounded-md px-2.5 py-[5px] text-xs font-semibold text-mute transition hover:bg-surface-muted"
                  >
                    {r.active ? 'Suspendre' : 'Activer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reminders */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-semibold">Rappels automatiques</h3>
            <div className="mt-0.5 text-xs text-mute">À venir &amp; historique des envois</div>
          </div>
          <div className="px-5 pb-2 pt-3.5">
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-mute">À venir</div>
            {(upcoming ?? []).slice(0, 4).map((u) => (
              <div key={u.rule.id} className="flex items-center gap-2.5 py-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-deep">
                  <Icon name="bell" size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">{u.rule.title}</div>
                  <div className="text-[11px] text-mute">
                    {techName(u.rule.technicianId)} · échéance {fmtDate(u.rule.nextDue)}
                  </div>
                </div>
                <span className="whitespace-nowrap rounded-pill border border-line bg-surface-muted px-[9px] py-[3px] text-[10.5px] font-semibold text-mute">
                  {u.remindIn <= 0 ? 'à envoyer' : `dans ${u.remindIn} j`}
                </span>
              </div>
            ))}
          </div>
          <div className="max-h-[240px] flex-1 overflow-y-auto border-t border-line px-5 py-3">
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-mute">
              Historique des rappels
            </div>
            {(reminders ?? []).length === 0 && <div className="text-xs text-mute">Aucun rappel envoyé.</div>}
            {(reminders ?? []).map((rm) => (
              <div key={rm.id} className="flex items-start gap-2.5 py-2">
                <span
                  className="mt-1.5 h-[7px] w-[7px] flex-shrink-0 rounded-full"
                  style={{ background: rm.status === 'scheduled' ? '#2563EB' : '#00C24A' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">{rm.title}</div>
                  <div className="text-[11px] text-mute">
                    <span className="font-mono">RM-{rm.id.slice(-4).toUpperCase()}</span> · {rm.channel} ·{' '}
                    {rm.status === 'scheduled' ? 'programmé' : 'envoyé'} {fmtDate(rm.firedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-2.5 text-[13px] font-semibold text-mute">Calendrier des interventions planifiées</div>
      <PlanningCalendar
        interventions={(interventions ?? []).filter((i) => i.status !== 'completed')}
        machineById={machineById}
        techName={techName}
        criticalFaultIds={
          new Set((faults ?? []).filter((f) => f.severity === 'critical').map((f) => f.id))
        }
      />

      <PlanRuleForm
        open={adding}
        machines={machines ?? []}
        technicians={technicians ?? []}
        onClose={() => setAdding(false)}
        onSave={(body) => createRule.mutate(body)}
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[96px] rounded-md border border-line bg-surface px-3.5 py-2">
      <div className="text-[22px] font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-[3px] text-[11px] text-mute">{label}</div>
    </div>
  );
}

function PlanningCalendar({
  interventions,
  machineById,
  techName,
  criticalFaultIds,
}: {
  interventions: Intervention[];
  machineById: (id: string) => Machine | undefined;
  techName: (id: string | null) => string;
  criticalFaultIds: Set<string>;
}) {
  const today = new Date(`${SCENARIO_TODAY}T00:00:00Z`);
  const monOffset = (today.getUTCDay() + 6) % 7;
  const monStart = new Date(today);
  monStart.setUTCDate(today.getUTCDate() - monOffset - 7);
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(monStart);
    d.setUTCDate(monStart.getUTCDate() + i);
    return d;
  });
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const eventsOn = (d: Date) => interventions.filter((i) => i.scheduledFor.slice(0, 10) === toISO(d));

  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-[18px]">
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {weekdays.map((w) => (
          <div key={w} className="px-1.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const isToday = toISO(d) === SCENARIO_TODAY;
          const dim = d.getUTCMonth() !== today.getUTCMonth();
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
                const tone = e.linkedFaultId && criticalFaultIds.has(e.linkedFaultId)
                  ? 'border-l-critical bg-critBg text-critFg'
                  : e.kind === 'preventive'
                    ? 'border-l-brand bg-brand-50 text-brand-deep'
                    : 'border-l-warning bg-warnBg text-warnFg';
                const tech = techName(e.technicianId).split(' ')[0];
                const num = machineById(e.machineId)?.code.replace('MCH-', '') ?? '';
                return (
                  <div
                    key={e.id}
                    title={e.description}
                    className={`truncate rounded-[4px] border-l-2 px-1.5 py-0.5 text-[10.5px] font-semibold ${tone}`}
                  >
                    {tech} · {num}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanRuleForm({
  open,
  machines,
  technicians,
  onClose,
  onSave,
}: {
  open: boolean;
  machines: Machine[];
  technicians: Technician[];
  onClose: () => void;
  onSave: (body: PlanRuleInput) => void;
}) {
  const [form, setForm] = useState<PlanRuleInput>({
    title: '', machineId: '', technicianId: '', everyWeeks: 4, duration: 2, reminderLead: 2, nextDue: '2026-05-28',
  });
  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        machineId: machines[0]?.id ?? '',
        technicianId: technicians[0]?.userId ?? '',
        everyWeeks: 4,
        duration: 2,
        reminderLead: 2,
        nextDue: '2026-05-28',
      });
    }
  }, [open, machines, technicians]);
  const upd = <K extends keyof PlanRuleInput>(k: K, v: PlanRuleInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.length >= 3 && form.machineId && form.technicianId && form.nextDue;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter une planification"
      subtitle="Maintenance préventive récurrente + rappel automatique"
      wide
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!valid}
            className="inline-flex items-center gap-2 rounded-md border border-brand-deep bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Icon name="check" size={14} /> Créer &amp; ajouter au calendrier
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Intitulé de la maintenance">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => upd('title', e.target.value)}
            placeholder="ex. Lubrification mensuelle convoyeur"
          />
        </Field>
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
          <Field label="Technicien assigné">
            <select className={inputClass} value={form.technicianId} onChange={(e) => upd('technicianId', e.target.value)}>
              {technicians.map((t) => (
                <option key={t.id} value={t.userId}>
                  {t.name} — {t.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <Field label="Fréquence (semaines)">
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={form.everyWeeks}
              onChange={(e) => upd('everyWeeks', Number(e.target.value))}
            />
          </Field>
          <Field label="Durée (heures)">
            <input
              type="number"
              min={0.5}
              step={0.5}
              className={inputClass}
              value={form.duration}
              onChange={(e) => upd('duration', Number(e.target.value))}
            />
          </Field>
          <Field label="Rappel avant (jours)">
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={form.reminderLead}
              onChange={(e) => upd('reminderLead', Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Première échéance">
          <input type="date" className={inputClass} value={form.nextDue} onChange={(e) => upd('nextDue', e.target.value)} />
        </Field>
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface-soft px-3 py-2.5 text-[12.5px] text-mute">
          <Icon name="bell" size={15} />
          Un rappel automatique sera envoyé {form.reminderLead} jour(s) avant chaque échéance, et le premier bon de
          travail sera ajouté au calendrier.
        </div>
      </div>
    </Modal>
  );
}
