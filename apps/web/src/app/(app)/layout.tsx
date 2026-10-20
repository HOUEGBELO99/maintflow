'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { api } from '@/lib/api-client';
import { signOut } from '@/lib/auth';
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
  // Mobile/tablet: the sidebar is a drawer, closed on every navigation.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [pathname]);

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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[232px_1fr]">
      {navOpen && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(10,20,12,0.45)] lg:hidden"
        />
      )}
      <Sidebar
        open={navOpen}
        user={user}
        counts={{
          machines: kpis?.totalMachines,
          activeFaults: kpis?.activeFaults,
          interventions: kpis ? kpis.inProgressInterventions + kpis.plannedInterventions : undefined,
        }}
        onLogout={() => {
          void signOut();
          logout();
          router.replace('/login');
        }}
      />
      <div className="flex min-w-0 flex-col">
        <Topbar title={title} onMenu={() => setNavOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-[1480px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
