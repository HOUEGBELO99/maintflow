'use client';

import { Icon } from '@/components/icon';

export function Topbar({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line bg-surface px-6">
      <div className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-bright shadow-[0_0_6px_var(--brand-bright)]" />
        {title}
      </div>
      <div className="flex-1" />
      <div className="relative hidden min-w-0 flex-[0_1_360px] sm:block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">
          <Icon name="search" size={15} />
        </span>
        <input
          placeholder="Rechercher…"
          className="w-full rounded-md border border-transparent bg-surface-muted py-2 pl-9 pr-3 text-[13px] outline-none focus:border-line-strong"
        />
      </div>
      <button
        title="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-mute transition-colors hover:bg-surface-muted"
      >
        <Icon name="bell" size={18} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-critical" />
      </button>
      {action}
    </header>
  );
}
