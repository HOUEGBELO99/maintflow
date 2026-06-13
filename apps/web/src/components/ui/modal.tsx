'use client';

import { useEffect, type ReactNode } from 'react';

import { Icon } from '@/components/icon';

/** Shared input styling (matches the prototype .field input/select). */
export const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-mute">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,20,12,0.45)] p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[90vh] w-full ${wide ? 'max-w-[680px]' : 'max-w-[560px]'} flex-col overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-md)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-[22px] pb-3.5 pt-[18px]">
          <div>
            <h2 className="text-[17px] font-semibold">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[12.5px] text-mute">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-surface-muted"
          >
            <Icon name="plus" size={16} className="rotate-45" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line bg-surface-soft px-[22px] py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md border border-critical bg-critical px-3.5 py-2 text-sm font-semibold text-white"
          >
            Supprimer
          </button>
        </>
      }
    >
      <p className="text-sm text-mute">{body ?? 'Cette action est irréversible.'}</p>
    </Modal>
  );
}
