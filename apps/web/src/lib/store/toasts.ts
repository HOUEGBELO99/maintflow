'use client';

import { create } from 'zustand';

import { ApiError } from '@/lib/api-client';

export interface Toast {
  id: number;
  tone: 'error' | 'success';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (tone: Toast['tone'], message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, tone, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** A failed action, explained in the user's terms. */
export function describeActionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Action non autorisée pour votre rôle.';
    if (error.status === 401) return 'Session expirée — reconnectez-vous.';
    if (error.status === 409) return error.message || 'Cette valeur est déjà utilisée.';
    if (error.status === 400) return `Données invalides : ${error.message}`;
    if (error.status >= 500) return 'Le serveur a rencontré une erreur — réessayez.';
    return error.message;
  }
  if (error instanceof TypeError) return 'Serveur injoignable — vérifiez la connexion.';
  return "L'action n'a pas abouti — réessayez.";
}
