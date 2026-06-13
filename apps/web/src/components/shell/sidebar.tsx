'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/icon';
import type { SessionUser } from '@/lib/store/auth';

interface NavItem {
  key: string;
  href: string;
  icon: string;
  label: string;
  group: 'main' | 'manage' | 'other';
  count?: number;
}

const GROUPS: { key: NavItem['group']; label: string }[] = [
  { key: 'main', label: 'Pilotage' },
  { key: 'manage', label: 'Gestion' },
  { key: 'other', label: 'Autres' },
];

export function Sidebar({
  user,
  counts,
  onLogout,
}: {
  user: SessionUser | null;
  counts: { machines?: number; activeFaults?: number; interventions?: number };
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', icon: 'dashboard', label: 'Tableau de bord', group: 'main' },
    { key: 'machines', href: '/machines', icon: 'machine', label: 'Machines', group: 'manage', count: counts.machines },
    { key: 'faults', href: '/faults', icon: 'fault', label: 'Pannes', group: 'manage', count: counts.activeFaults },
    { key: 'interventions', href: '/interventions', icon: 'wrench', label: 'Interventions', group: 'manage', count: counts.interventions },
    { key: 'planning', href: '/planning', icon: 'calendar', label: 'Planning', group: 'manage' },
    { key: 'technicians', href: '/technicians', icon: 'user', label: 'Techniciens', group: 'other' },
    { key: 'history', href: '/history', icon: 'history', label: 'Historique', group: 'other' },
    { key: 'users', href: '/users', icon: 'shield', label: 'Utilisateurs', group: 'other' },
    { key: 'settings', href: '/settings', icon: 'settings', label: 'Paramètres', group: 'other' },
  ];

  const initials = user?.name.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '··';

  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-nav-border bg-nav-bg text-nav-text">
      <div className="flex items-center gap-2.5 border-b border-nav-border px-[18px] pb-[22px] pt-[18px]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-deep text-sm font-bold text-brand-bright">
          M
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">
          Maint<span className="text-brand">Flow</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
        {GROUPS.map((g) => (
          <div key={g.key}>
            <div className="px-2.5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-nav-muted">
              {g.label}
            </div>
            {items
              .filter((it) => it.group === g.key)
              .map((it) => {
                const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
                return (
                  <Link
                    key={it.key}
                    href={it.href}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-[9px] text-[13.5px] font-medium transition-colors ${
                      active ? 'bg-[rgba(0,255,0,0.10)] text-white' : 'text-nav-text hover:bg-nav-soft'
                    }`}
                  >
                    <Icon name={it.icon} size={18} />
                    <span className="flex-1">{it.label}</span>
                    {it.count != null && it.count > 0 && (
                      <span className="rounded-pill bg-nav-soft px-2 py-0.5 text-[11px] font-semibold text-nav-text">
                        {it.count}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-nav-border p-3">
        <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-xs font-semibold text-white">
          {initials}
        </span>
        <div className="flex-1 leading-tight">
          <div className="text-[13px] font-semibold text-white">{user?.name ?? '—'}</div>
          <div className="text-[11px] text-nav-muted">{user?.email}</div>
        </div>
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-nav-muted transition-colors hover:bg-nav-soft hover:text-white"
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  );
}
