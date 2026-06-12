'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/modal';
import { api } from '@/lib/api-client';
import type { Machine } from '@maintflow/shared';

const today = () => new Date().toISOString().slice(0, 10);

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function SettingsPage() {
  const qc = useQueryClient();
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportJson = async () => {
    setBusy(true);
    try {
      const [machines, faults, interventions, technicians, rules, reminders, users] = await Promise.all([
        api.machines.list(),
        api.faults.list(),
        api.interventions.list(),
        api.technicians.list(),
        api.planning.rules(),
        api.planning.reminders(),
        api.users.list(),
      ]);
      const backup = {
        exportedAt: new Date().toISOString(),
        machines,
        faults,
        interventions,
        technicians,
        planRules: rules,
        reminders,
        users,
      };
      download(`maintflow-data-${today()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const machines = await api.machines.list();
      const rows = [['ID', 'Nom', 'Type', 'Atelier', 'Installation', 'État', 'Heures']];
      machines.forEach((m: Machine) =>
        rows.push([m.code, m.name, m.type, m.workshop, m.installedAt.slice(0, 10), m.state, String(m.runtime)]),
      );
      const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
      download('maintflow-machines.csv', csv, 'text/csv');
    } finally {
      setBusy(false);
    }
  };

  const reset = useMutation({
    mutationFn: () => api.admin.resetDemo(),
    onSuccess: () => qc.invalidateQueries(),
  });

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-[13.5px] text-mute">Configuration de l’application et de votre organisation.</p>
      </header>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold">Données &amp; Export</h3>
          <div className="mt-0.5 text-xs text-mute">Sauvegarde et export des données de maintenance</div>
        </div>
        <div className="px-5 py-[18px]">
          <div className="grid grid-cols-3 gap-3">
            <ExportTile icon="file" title="Exporter en JSON" sub="Backup complet" onClick={exportJson} disabled={busy} />
            <ExportTile icon="file" title="Exporter en CSV" sub="Compatible Excel" onClick={exportCsv} disabled={busy} />
            <ExportTile icon="download" title="Imprimer en PDF" sub="Aperçu navigateur" onClick={() => window.print()} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-line-strong bg-surface-soft px-3.5 py-3.5">
            <div>
              <div className="text-[13.5px] font-semibold">Réinitialiser les données d’exemple</div>
              <div className="text-[12px] text-mute">
                Revenir aux 12 machines d’exemple, 8 pannes et 12 interventions.
              </div>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              disabled={reset.isPending}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-surface-muted px-3.5 py-2 text-[13px] font-semibold text-critical transition hover:bg-critBg disabled:opacity-50"
            >
              <Icon name="refresh" size={14} /> {reset.isPending ? 'Réinitialisation…' : 'Réinitialiser'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => reset.mutate()}
        title="Réinitialiser les données ?"
        body="Toutes les modifications seront perdues et le jeu de données d’exemple sera restauré."
      />
    </div>
  );
}

function ExportTile({
  icon,
  title,
  sub,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2.5 rounded-md bg-surface-muted px-3.5 py-3.5 text-left transition hover:bg-line disabled:opacity-50"
    >
      <Icon name={icon} size={16} className="flex-none text-body" />
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] font-normal text-mute">{sub}</div>
      </div>
    </button>
  );
}
