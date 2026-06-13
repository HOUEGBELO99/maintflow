'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import type { Fault, Intervention } from '@maintflow/shared';

const STATE_PILL: Record<string, string> = {
  ok: 'text-okFg bg-brand-50 border-brand-100',
  maintenance: 'text-warnFg bg-warnBg border-[#FDE68A]',
  fault: 'text-critFg bg-critBg border-[#FECACA]',
};
const STATE_LABEL: Record<string, string> = { ok: 'Opérationnel', maintenance: 'En maintenance', fault: 'En panne' };
const CRIT_LABEL: Record<string, string> = { low: 'Faible', medium: 'Moyenne', high: 'Élevée' };
const FAULT_TYPE_LABEL: Record<string, string> = {
  mecanique: 'Mécanique', electrique: 'Électrique', hydraulique: 'Hydraulique', logiciel: 'Logiciel',
};
const SEV_PILL: Record<string, string> = {
  critical: 'text-critFg bg-critBg border-[#FECACA]',
  medium: 'text-warnFg bg-warnBg border-[#FDE68A]',
  low: 'text-okFg bg-brand-50 border-brand-100',
};
const SEV_LABEL: Record<string, string> = { critical: 'Critique', medium: 'Moyen', low: 'Faible' };
const FAULT_STATUS_LABEL: Record<string, string> = { pending: 'En attente', in_progress: 'En cours', resolved: 'Résolue' };
const KIND_LABEL: Record<string, string> = { corrective: 'Corrective', preventive: 'Préventive' };
const IV_STATUS_LABEL: Record<string, string> = {
  planned: 'Planifiée', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Mean time between failures, in days, from this machine's fault history. */
function computeMtbfDays(faults: Fault[]): number | null {
  if (faults.length < 2) return null;
  const ts = faults.map((f) => new Date(f.reportedAt).getTime()).sort((a, b) => a - b);
  let sum = 0;
  for (let i = 1; i < ts.length; i++) sum += ts[i]! - ts[i - 1]!;
  return Math.round(sum / (ts.length - 1) / 864e5);
}

type Tab = 'info' | 'faults' | 'interventions' | 'history';

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('info');

  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => api.machines.list() });
  const { data: faults } = useQuery({ queryKey: ['faults'], queryFn: () => api.faults.list() });
  const { data: interventions } = useQuery({ queryKey: ['interventions'], queryFn: () => api.interventions.list() });

  const machine = machines?.find((m) => m.id === id);
  const machineFaults = (faults ?? []).filter((f) => f.machineId === id);
  const machineIvs = (interventions ?? []).filter((i) => i.machineId === id);

  if (machines && !machine) {
    return (
      <div className="py-20 text-center">
        <p className="text-mute">Machine introuvable.</p>
        <Link href="/machines" className="mt-3 inline-block text-sm font-semibold text-brand-deep">
          ← Retour au parc
        </Link>
      </div>
    );
  }
  if (!machine) return <div className="py-20 text-center text-mute">Chargement…</div>;

  const yearsInService = Math.max(
    0,
    Math.round((Date.now() - new Date(machine.installedAt).getTime()) / (365.25 * 864e5)),
  );
  const lifePct = machine.lifespanYears
    ? Math.min(100, Math.round((yearsInService / machine.lifespanYears) * 100))
    : 0;
  const activeFaults = machineFaults.filter((f) => f.status !== 'resolved').length;
  const mtbf = computeMtbfDays(machineFaults);

  const qrValue = typeof window !== 'undefined' ? `${window.location.origin}/machines/${machine.id}` : machine.code;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'info', label: 'Informations' },
    { key: 'faults', label: 'Pannes', count: machineFaults.length },
    { key: 'interventions', label: 'Interventions', count: machineIvs.length },
    { key: 'history', label: 'Historique' },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-[13px] text-mute">
        <button onClick={() => router.push('/machines')} className="font-semibold text-ink hover:text-brand-deep">
          ‹ Retour
        </button>
        <span>/</span>
        <span className="font-mono">{machine.code}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <aside className="rounded-lg border border-line bg-surface p-5">
            <h1 className="text-[20px] font-bold tracking-tight">{machine.name}</h1>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold ${STATE_PILL[machine.state]}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
              {STATE_LABEL[machine.state]}
            </span>

            <dl className="mt-4 flex flex-col">
              <Row label="Type"><span className="capitalize">{machine.type}</span></Row>
              <Row label="Atelier">{machine.workshop}</Row>
              <Row label="Date d’installation">{fmtDate(machine.installedAt)}</Row>
              <Row label="Heures de fonctionnement">{machine.runtime.toLocaleString('fr-FR')} h</Row>
              <Row label="Criticité">
                <span className={machine.criticality === 'high' ? 'font-semibold text-critFg' : ''}>
                  {CRIT_LABEL[machine.criticality]}
                </span>
              </Row>
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-mute">Durée de vie</span>
                <span className="font-semibold">{yearsInService} / {machine.lifespanYears} ans</span>
              </div>
              <div className="h-2 overflow-hidden rounded-pill bg-surface-muted">
                <div className="h-full rounded-pill bg-brand" style={{ width: `${lifePct}%` }} />
              </div>
              <div className="mt-1.5 text-[11.5px] text-mute">
                ~{Math.max(0, machine.lifespanYears - yearsInService)} ans restants estimés · en service depuis {yearsInService} ans
              </div>
            </div>

            {/* Equipment QR — encodes the machine URL, resolvable by the mobile scanner. */}
            <div className="mt-5 flex gap-4">
              <div className="flex flex-col items-center rounded-lg border border-line p-3">
                <QRCodeSVG value={qrValue} size={108} bgColor="transparent" fgColor="#0E1410" />
                <div className="mt-2 font-mono text-[11px] text-mute">{machine.code}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-mute">QR de l’équipement</div>
                <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
                  Scannez pour ouvrir sur mobile. Permet à un technicien d’ouvrir la fiche, déclarer une panne ou enregistrer une intervention depuis l’atelier.
                </p>
                <button
                  onClick={() => window.print()}
                  className="mt-2.5 inline-flex items-center gap-2 rounded-md bg-surface-muted px-3 py-1.5 text-[12px] font-semibold text-body hover:bg-surface-soft"
                >
                  <Icon name="download" size={13} /> Imprimer étiquette
                </button>
              </div>
            </div>
          </aside>

          {/* Stats card — real counts + computed MTBF */}
          <aside className="rounded-lg border border-line bg-surface p-5">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Pannes" value={String(machineFaults.length)} color={machineFaults.length ? '#DC2626' : undefined} />
              <Stat label="Actives" value={String(activeFaults)} color={activeFaults ? '#F59E0B' : '#00C24A'} />
              <Stat label="Interventions" value={String(machineIvs.length)} />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <Stat label="MTBF (entre pannes)" value={mtbf != null ? `${mtbf} j` : '—'} />
            </div>
          </aside>
        </div>

        {/* Right tabbed panel */}
        <section className="min-w-0">
          <div className="mb-3 flex gap-1 border-b border-line">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative -mb-px px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                  tab === t.key ? 'border-b-2 border-brand-deep text-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {t.label}
                {t.count !== undefined && <span className="ml-1.5 text-mute">({t.count})</span>}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="mb-4 text-[15px] font-bold">Informations techniques</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Info label="Code constructeur" value={machine.code} />
                <Info label="Type d’équipement" value={<span className="capitalize">{machine.type}</span>} />
                <Info label="Atelier / Localisation" value={machine.workshop} />
                <Info label="Mise en service" value={fmtDate(machine.installedAt)} />
                <Info label="Coût horaire d’arrêt" value={`${machine.hourlyCost.toLocaleString('fr-FR')} €/h`} />
                <Info label="Durée de vie estimée" value={`${machine.lifespanYears} ans`} />
              </div>

              <div className="mt-6">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-mute">
                  Activité (30 derniers jours)
                </div>
                <ActivitySpark faults={machineFaults} interventions={machineIvs} />
              </div>
            </div>
          )}

          {tab === 'faults' && (
            <Panel empty={machineFaults.length === 0} emptyLabel="Aucune panne pour cette machine">
              {machineFaults
                .slice()
                .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
                .map((f) => (
                  <FaultRow key={f.id} f={f} />
                ))}
            </Panel>
          )}

          {tab === 'interventions' && (
            <Panel empty={machineIvs.length === 0} emptyLabel="Aucune intervention pour cette machine">
              {machineIvs
                .slice()
                .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
                .map((i) => (
                  <IvRow key={i.id} i={i} />
                ))}
            </Panel>
          )}

          {tab === 'history' && (
            <Panel
              empty={machineFaults.length === 0 && machineIvs.length === 0}
              emptyLabel="Aucun historique"
            >
              {[
                ...machineFaults.map((f) => ({ at: f.reportedAt, node: <FaultRow key={`f${f.id}`} f={f} /> })),
                ...machineIvs.map((i) => ({ at: i.scheduledFor, node: <IvRow key={`i${i.id}`} i={i} /> })),
              ]
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((e) => e.node)}
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0">
      <span className="text-mute">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-mute">{label}</div>
      <div className="mt-1 text-[22px] font-bold leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] text-mute">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold">{value}</div>
    </div>
  );
}

/** Real 30-day activity area chart: faults + interventions per day for this machine. */
function ActivitySpark({ faults, interventions }: { faults: Fault[]; interventions: Intervention[] }) {
  const W = 640;
  const H = 90;
  const days = 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const n =
      faults.filter((f) => f.reportedAt.slice(0, 10) === iso).length +
      interventions.filter((x) => x.scheduledFor.slice(0, 10) === iso).length;
    series.push(n);
  }
  const max = Math.max(1, ...series);
  const step = W / (days - 1);
  const pts = series.map((v, i) => `${i * step},${H - (v / max) * (H - 8) - 2}`);
  const area = `0,${H} ${pts.join(' ')} ${W},${H}`;
  const hasActivity = series.some((v) => v > 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[90px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mspark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {hasActivity ? (
        <>
          <polygon points={area} fill="url(#mspark)" />
          <polyline points={pts.join(' ')} fill="none" stroke="var(--brand)" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="0" y1={H - 2} x2={W} y2={H - 2} stroke="var(--border)" strokeWidth="2" />
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
            Aucune activité sur 30 jours
          </text>
        </>
      )}
    </svg>
  );
}

function Panel({ children, empty, emptyLabel }: { children: React.ReactNode; empty: boolean; emptyLabel: string }) {
  if (empty) {
    return (
      <div className="rounded-lg border border-line bg-surface px-4 py-[60px] text-center text-mute">{emptyLabel}</div>
    );
  }
  return <div className="flex flex-col gap-2.5">{children}</div>;
}

function FaultRow({ f }: { f: Fault }) {
  return (
    <Link
      href="/faults"
      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 hover:bg-surface-soft"
    >
      <span className="font-mono text-[12px] text-mute">F-{f.id.slice(-4).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{f.description}</div>
        <div className="text-[11.5px] text-mute">{FAULT_TYPE_LABEL[f.type] ?? f.type} · {fmtDate(f.reportedAt)}</div>
      </div>
      <span className={`inline-flex rounded-pill border px-[9px] py-[3px] text-[11px] font-semibold ${SEV_PILL[f.severity]}`}>
        {SEV_LABEL[f.severity]}
      </span>
      <span className="w-[72px] text-right text-[11.5px] text-mute">{FAULT_STATUS_LABEL[f.status]}</span>
    </Link>
  );
}

function IvRow({ i }: { i: Intervention }) {
  return (
    <Link
      href="/interventions"
      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 hover:bg-surface-soft"
    >
      <span className="font-mono text-[12px] text-mute">I-{i.id.slice(-4).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{i.description}</div>
        <div className="text-[11.5px] text-mute">{KIND_LABEL[i.kind]} · {fmtDate(i.scheduledFor)} · {i.duration} h</div>
      </div>
      <span className="w-[72px] text-right text-[11.5px] text-mute">{IV_STATUS_LABEL[i.status]}</span>
    </Link>
  );
}
