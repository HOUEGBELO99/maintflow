import type { Machine } from '@maintflow/shared';

import { machineQrPayload, QR_PRINT_OPTIONS } from '@/lib/qr';

// A4 sheet, same layout as the printable page: 2 tags per row, 48 mm high.
const PAGE = { w: 210, h: 297, margin: 10 };
const GAP = 6;
const LABEL = { w: (PAGE.w - 2 * PAGE.margin - GAP) / 2, h: 48 };
const QR_SIZE = 40;
const ROWS_PER_PAGE = Math.floor((PAGE.h - 2 * PAGE.margin + GAP) / (LABEL.h + GAP));

const INK: [number, number, number] = [14, 20, 16];
const MUTE: [number, number, number] = [75, 85, 99];
const BRAND: [number, number, number] = [22, 163, 74];

/**
 * Builds the QR tags as a vector PDF and downloads it. QR modules are drawn as
 * rectangles (not a bitmap), so the codes stay sharp at any print size.
 * jsPDF and qrcode are loaded on demand — they only matter on this page.
 */
export async function downloadLabelsPdf(machines: Machine[], filename = 'etiquettes-qr-maintflow.pdf'): Promise<void> {
  const [{ jsPDF }, QRCode] = await Promise.all([import('jspdf'), import('qrcode')]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const perPage = ROWS_PER_PAGE * 2;

  machines.forEach((machine, i) => {
    if (i > 0 && i % perPage === 0) doc.addPage();
    const slot = i % perPage;
    const x = PAGE.margin + (slot % 2) * (LABEL.w + GAP);
    const y = PAGE.margin + Math.floor(slot / 2) * (LABEL.h + GAP);

    // Frame
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, LABEL.w, LABEL.h, 3, 3, 'S');

    // QR code with its quiet zone
    const qr = QRCode.create(machineQrPayload(machine), { errorCorrectionLevel: QR_PRINT_OPTIONS.level });
    const n = qr.modules.size;
    const cell = QR_SIZE / (n + 2 * QR_PRINT_OPTIONS.marginSize);
    const qx = x + 3 + QR_PRINT_OPTIONS.marginSize * cell;
    const qy = y + (LABEL.h - QR_SIZE) / 2 + QR_PRINT_OPTIONS.marginSize * cell;
    doc.setFillColor(0, 0, 0);
    // The whole code is ONE filled path (a sub-path per horizontal run of dark
    // modules): separate shapes leave anti-aliased hairlines between modules,
    // which hurt scanning, and one rectangle per module bloats the file.
    const ops: { op: 'm' | 'l' | 'h'; c: number[] }[] = [];
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!qr.modules.get(r, c)) {
          c++;
          continue;
        }
        const start = c;
        while (c < n && qr.modules.get(r, c)) c++;
        const [x0, x1, y0, y1] = [qx + start * cell, qx + c * cell, qy + r * cell, qy + (r + 1) * cell];
        ops.push({ op: 'm', c: [x0, y0] }, { op: 'l', c: [x1, y0] }, { op: 'l', c: [x1, y1] }, { op: 'l', c: [x0, y1] }, { op: 'h', c: [] });
      }
    }
    doc.path(ops).fill();

    // Text column
    const tx = x + 3 + QR_SIZE + 4;
    const tw = LABEL.w - (tx - x) - 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND);
    doc.text('MAINTFLOW', tx, y + 7, { charSpace: 0.3 });

    doc.setFont('courier', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...INK);
    doc.text(machine.code, tx, y + 17);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const nameLines = (doc.splitTextToSize(machine.name, tw) as string[]).slice(0, 2);
    doc.text(nameLines, tx, y + 22.5, { lineHeightFactor: 1.15 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTE);
    doc.text(machine.workshop, tx, y + 22.5 + nameLines.length * 4.4, { maxWidth: tw });

    doc.setFontSize(7);
    const hint = doc.splitTextToSize(
      "Scannez avec l'app MaintFlow pour déclarer une panne ou ouvrir l'intervention.",
      tw,
    ) as string[];
    doc.text(hint, tx, y + LABEL.h - 3 - (hint.length - 1) * 2.9, { lineHeightFactor: 1.2 });
  });

  doc.save(filename);
}
