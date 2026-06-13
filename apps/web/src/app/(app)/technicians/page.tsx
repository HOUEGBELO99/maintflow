'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { Icon } from '@/components/icon';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api-client';
import type { Intervention, Machine, Technician } from '@maintflow/shared';

/** Specialty → pill tone (mirrors the prototype SPEC_COLOR map). */
const SPEC_PILL: Record<string, string> = {
  mécanique: 'text-warnFg bg-warnBg border-[#FDE68A]',
  électrique: 'text-infoFg bg-infoBg border-[#BFDBFE]',
  hydraulique: 'text-okFg bg-brand-50 border-brand-100',
  logiciel: 'text-critFg bg-critBg border-[#FECACA]',
};
const SPEC_PILL_DEFAULT = 'text-mute bg-surface-muted border-line';

const KIND_PILL: Record<string, string> = {
  preventive: 'text-infoFg bg-infoBg border-[#BFDBFE]',
  corrective: 'text-warnFg bg-warnBg border-[#FDE68A]',
};
const KIND_LABEL: Record<string, string> = { corrective: 'Corrective', preventive: 'Préventive' };
const STATUS_LABEL: Record<string, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('');

/** Workload bar fill colour, by saturation (≤0.6 brand, ≤0.85 warning, else critical). */
const loadColor = (load: number) => (load > 0.85 ? '#DC2626' : load > 0.6 ? '#F59E0B' : '#00C24A');

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? '#F59E0B' : 'none'}
          stroke="#F59E0B"
          strokeWidth={1.5}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function StatusPill({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-brand-100 bg-brand-50 px-[9px] py-[3px] text-[11.5px] font-semibold leading-[1.4] text-okFg">
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> Disponible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-[#FDE68A] bg-warnBg px-[9px] py-[3px] text-[11.5px] font-semibold leading-[1.4] text-warnFg">
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> En intervention
    </span>
  );
}

function SpecPill({ spec }: { spec: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold capitalize leading-[1.4] ${SPEC_PILL[spec] ?? SPEC_PILL_DEFAULT}`}
    >
      {spec}
    </span>
  );
}

export default function TechniciansPage() {
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: () => api.technicians.list() });
  const [open, setOpen] = useState<Technician | null>(null);

  const list = technicians ?? [];
  const available = list.filter((t) => t.available).length;

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Techniciens</h1>
        <p className="mt-1 text-[13.5px] text-mute">
          Spécialités, charge de travail et performance de l’équipe terrain.
        </p>
      </header>

      <div className="mb-5 flex items-center gap-3 rounded-md border border-brand-100 bg-brand-50 px-4 py-3.5">
        <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-bright text-brand-deep">
          <Icon name="bolt" size={16} />
        </span>
        <div className="flex-1">
          <b className="text-[13.5px]">Affectation intelligente active</b>
          <div className="text-[12.5px] text-mute">
            À chaque déclaration de panne, MaintFlow suggère le technicien disponible ayant la spécialité requise et
            la charge la plus faible.
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-brand-100 bg-brand-50 px-[9px] py-[3px] text-[11.5px] font-semibold leading-[1.4] text-okFg">
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> {available} disponibles
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {list.map((t) => {
          const load = Math.min(1, t.activeHours / 12);
          return (
            <button
              key={t.id}
              onClick={() => setOpen(t)}
              className="rounded-lg border border-line bg-surface p-5 text-left transition hover:shadow-[var(--shadow-md)]"
            >
              <div className="mb-3.5 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[15px] font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color ?? '#00C24A'}, #0A3D1F)` }}
                >
                  {initials(t.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="text-[12px] text-mute">{t.title}</div>
                </div>
                <StatusPill available={t.available} />
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {t.specialties.map((sp) => (
                  <SpecPill key={sp} spec={sp} />
                ))}
              </div>

              <div className="mb-3.5">
                <div className="mb-1.5 flex justify-between text-[12px]">
                  <span className="font-semibold text-mute">Charge de travail</span>
                  <span className="font-semibold tabular-nums">
                    {t.activeCount} active{t.activeCount > 1 ? 's' : ''} · {t.activeHours} h
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-[4px] bg-surface-muted">
                  <div
                    className="h-full rounded-[4px]"
                    style={{ width: `${load * 100}%`, background: loadColor(load) }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-line pt-3.5">
                <div>
                  <div className="text-[19px] font-bold leading-none tracking-tight tabular-nums">{t.onTime}%</div>
                  <div className="mt-px text-[10.5px] text-mute">Dans les délais</div>
                </div>
                <div>
                  <div className="mt-0.5">
                    <Stars value={t.rating} />
                  </div>
                  <div className="mt-1 text-[10.5px] text-mute">Note moy. {t.rating}</div>
                </div>
                <div>
                  <div className="text-[19px] font-bold leading-none tracking-tight tabular-nums">
                    {t.doneThisMonth}
                  </div>
                  <div className="mt-px text-[10.5px] text-mute">Ce mois</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-brand-deep">
                Voir la fiche <Icon name="arrowRight" size={12} />
              </div>
            </button>
          );
        })}
      </div>

      <TechnicianDetail tech={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function TechnicianDetail({ tech, onClose }: { tech: Technician | null; onClose: () => void }) {
  const { data: interventions } = useQuery({
    queryKey: ['interventions'],
    queryFn: () => api.interventions.list(),
    enabled: !!tech,
  });
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
    enabled: !!tech,
  });

  if (!tech) return null;

  const machine = (id: string): Machine | undefined => machines?.find((m) => m.id === id);
  const mine = (interventions ?? []).filter((i) => i.technicianId === tech.userId);
  const active = mine
    .filter((i) => i.status !== 'completed' && i.status !== 'cancelled')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const done = mine
    .filter((i) => i.status === 'completed')
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  const load = Math.min(1, tech.activeHours / 12);

  const stat = (v: ReactNode, l: string, big = true) => (
    <div className="rounded-md border border-line bg-surface-soft px-3.5 py-3">
      {big ? <div className="text-[22px] font-bold leading-none tabular-nums">{v}</div> : v}
      <div className="mt-1.5 text-[11px] leading-tight text-mute">{l}</div>
    </div>
  );

  return (
    <Modal
      open={!!tech}
      onClose={onClose}
      title={tech.name}
      subtitle={tech.title}
      wide
      footer={
        <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
          Fermer
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-full text-[21px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${tech.color ?? '#00C24A'}, #0A3D1F)` }}
          >
            {initials(tech.name)}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tech.specialties.map((sp) => (
                <SpecPill key={sp} spec={sp} />
              ))}
            </div>
            <StatusPill available={tech.available} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {stat(`${tech.onTime}%`, 'Résolu dans les délais')}
          {stat(
            <div className="mb-0.5">
              <Stars value={tech.rating} size={16} />
            </div>,
            `Note moyenne · ${tech.rating}`,
            false,
          )}
          {stat(tech.doneThisMonth, 'Interventions ce mois')}
          {stat(tech.activeCount, `En cours · ${tech.activeHours} h`)}
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="font-semibold text-mute">Charge de travail actuelle</span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: load > 0.85 ? '#DC2626' : undefined }}
            >
              {Math.round(load * 100)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-[5px] bg-surface-muted">
            <div className="h-full rounded-[5px]" style={{ width: `${load * 100}%`, background: loadColor(load) }} />
          </div>
        </div>

        <div>
          <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">
            Interventions assignées ({active.length})
          </div>
          {active.length === 0 && <div className="text-[13px] text-mute">Aucune intervention en cours.</div>}
          <div className="flex flex-col gap-2">
            {active.map((i) => (
              <InterventionRow key={i.id} it={i} machine={machine(i.machineId)} />
            ))}
          </div>
        </div>

        {done.length > 0 && (
          <div>
            <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">Historique récent</div>
            <div className="flex flex-col gap-2.5 border-l-2 border-line pl-3.5">
              {done.slice(0, 4).map((i) => (
                <div key={i.id}>
                  <div className="text-[11px] text-mute">
                    {fmtDate(i.scheduledFor)} · <span className="font-mono">I-{i.id.slice(-4).toUpperCase()}</span>
                    {i.rating ? ` · ${i.rating}★` : ''}
                  </div>
                  <div className="text-[13px] font-semibold">{machine(i.machineId)?.name ?? i.machineId}</div>
                  <div className="truncate text-[12px] text-mute">{i.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InterventionRow({ it, machine }: { it: Intervention; machine?: Machine }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line px-3 py-[11px]">
      <div
        className="w-1 self-stretch flex-none rounded-[2px]"
        style={{ background: it.kind === 'preventive' ? '#2563EB' : '#F59E0B' }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-mute">I-{it.id.slice(-4).toUpperCase()}</span>
          <span
            className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${KIND_PILL[it.kind]}`}
          >
            {KIND_LABEL[it.kind]}
          </span>
          <span className="text-[11.5px] text-mute">{STATUS_LABEL[it.status]}</span>
        </div>
        <div className="mt-0.5 text-[13px] font-semibold">{machine?.name ?? it.machineId}</div>
        <div className="truncate text-[12px] text-mute">{it.description}</div>
      </div>
      <div className="flex-shrink-0 text-right text-[12px]">
        <div className="font-semibold">{fmtDate(it.scheduledFor)}</div>
        <div className="text-[11px] text-mute">{it.duration} h</div>
      </div>
    </div>
  );
}
