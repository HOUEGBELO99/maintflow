'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/store/auth';

const TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/machines': 'Machines',
  '/faults': 'Pannes',
  '/interventions': 'Interventions',
  '/planning': 'Planning',
  '/technicians': 'Techniciens',
  '/history': 'Historique',
  '/users': 'Utilisateurs',
  '/settings': 'Paramètres',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !token) router.replace('/login');
  }, [mounted, token, router]);

  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.dashboard.kpis(),
    enabled: mounted && !!token,
  });

  if (!mounted || !token) return null;

  const title = TITLES[pathname] ?? 'MaintFlow';

  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr]">
      <Sidebar
        user={user}
        counts={{
          machines: kpis?.totalMachines,
          activeFaults: kpis?.activeFaults,
          interventions: kpis ? kpis.inProgressInterventions + kpis.plannedInterventions : undefined,
        }}
        onLogout={() => {
          logout();
          router.replace('/login');
        }}
      />
      <div className="flex min-w-0 flex-col">
        <Topbar title={title} />
        <main className="mx-auto w-full max-w-[1480px] px-8 pb-20 pt-6">{children}</main>
      </div>
    </div>
  );
}
