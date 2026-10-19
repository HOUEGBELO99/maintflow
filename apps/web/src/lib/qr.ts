import type { Machine } from '@maintflow/shared';

/**
 * What a machine QR tag encodes: the bare machine code (e.g. `MCH-002`).
 *
 * The mobile scanner resolves a payload by machine code (and, for tags printed
 * before June 2026, by the UUID at the end of a `/machines/<id>` URL), so the
 * plain code is the most robust choice: short (= large modules, easy to scan
 * from a distance or a worn sticker) and human-readable if typed by hand.
 */
export const machineQrPayload = (machine: Pick<Machine, 'code'>): string => machine.code.trim().toUpperCase();

/**
 * Rendering options that keep a tag scannable once printed: pure black on
 * white, a 4-module quiet zone, and medium error correction (survives
 * smudges and small tears on a shop-floor sticker).
 */
export const QR_PRINT_OPTIONS = {
  level: 'M',
  marginSize: 4,
  bgColor: '#FFFFFF',
  fgColor: '#000000',
} as const;
