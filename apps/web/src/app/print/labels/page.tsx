'use client';

import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import type { Machine } from '@maintflow/shared';
import { Icon } from '@/components/icon';
import { Spinner } from '@/components/ui/busy';
import { api } from '@/lib/api-client';
import { downloadLabelsPdf } from '@/lib/labels-pdf';
import { machineQrPayload, QR_PRINT_OPTIONS } from '@/lib/qr';
import { useAuth } from '@/lib/store/auth';
import { useToasts } from '@/lib/store/toasts';

/**
 * Printable QR tags for machines — `/print/labels?ids=<id>,<id>` (or every
 * machine when `ids` is absent). Rendered outside the app shell so the printout
 * holds only the tags: 2 per row on A4, sized in millimetres, never split
 * across pages.
 */
export default function LabelsPage() {
  return (
    <Suspense fallback={null}>
      <Labels />
    </Suspense>
  );
}

function Labels() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useAuth((s) => s.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !token) router.replace('/login');
  }, [mounted, token, router]);

  const { data: machines, isLoading, isError } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
    enabled: mounted && !!token,
  });

  const ids = params.get('ids');
  const selected = useMemo(() => {
    const all = machines ?? [];
    if (!ids) return all;
    const wanted = new Set(ids.split(',').filter(Boolean));
    return all.filter((m) => wanted.has(m.id));
  }, [machines, ids]);

  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      await downloadLabelsPdf(selected);
    } catch {
      useToasts.getState().push('error', 'Le PDF n’a pas pu être généré — réessayez.');
    } finally {
      setExporting(false);
    }
  };

  if (!mounted || !token) return null;

  return (
    <div className="min-h-screen bg-surface-soft print:bg-white">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3 print:hidden">
        <div>
          <div className="text-[15px] font-semibold text-ink">Étiquettes QR</div>
          <div className="text-[12px] text-mute">
            {isLoading ? 'Chargement…' : `${selected.length} étiquette${selected.length > 1 ? 's' : ''} · format A4, 2 par ligne`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/machines'))}
            className="rounded-md border border-line px-3 py-2 text-[13px] font-semibold text-body hover:bg-surface-muted"
          >
            Retour
          </button>
          <button
            onClick={() => window.print()}
            disabled={selected.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-[13px] font-semibold text-body hover:bg-surface-muted disabled:opacity-50"
          >
            <Icon name="file" size={14} /> Imprimer
          </button>
          <button
            onClick={() => void exportPdf()}
            disabled={selected.length === 0 || exporting}
            className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand disabled:opacity-50"
          >
            {exporting ? <Spinner /> : <Icon name="download" size={14} />}
            {exporting ? 'Génération…' : 'Télécharger le PDF'}
          </button>
        </div>
      </header>

      {isError && (
        <p className="p-10 text-center text-critFg print:hidden">Impossible de charger les machines.</p>
      )}
      {!isLoading && !isError && selected.length === 0 && (
        <p className="p-10 text-center text-mute print:hidden">Aucune machine sélectionnée.</p>
      )}

      <main className="mx-auto grid max-w-[210mm] grid-cols-2 gap-[6mm] p-[10mm] print:max-w-none print:p-0">
        {selected.map((m) => (
          <Label key={m.id} machine={m} />
        ))}
      </main>
    </div>
  );
}

function Label({ machine }: { machine: Machine }) {
  return (
    <article className="flex h-[48mm] items-center gap-[4mm] overflow-hidden rounded-[3mm] border border-[#0E1410] bg-white p-[3mm] [break-inside:avoid]">
      <QRCodeSVG
        value={machineQrPayload(machine)}
        {...QR_PRINT_OPTIONS}
        size={256}
        style={{ width: '40mm', height: '40mm', flex: 'none' }}
        title={`QR ${machine.code}`}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-[1mm] text-[#0E1410]">
        <div className="text-[8pt] font-bold uppercase tracking-[0.08em] text-[#16A34A]">MaintFlow</div>
        <div>
          <div className="font-mono text-[17pt] font-bold leading-none">{machine.code}</div>
          <div className="mt-[1.5mm] line-clamp-2 text-[10pt] font-semibold leading-tight">{machine.name}</div>
          <div className="mt-[0.5mm] truncate text-[8.5pt] text-[#4B5563]">{machine.workshop}</div>
        </div>
        <div className="text-[7pt] leading-snug text-[#4B5563]">
          Scannez avec l’app MaintFlow pour déclarer une panne ou ouvrir l’intervention.
        </div>
      </div>
    </article>
  );
}
