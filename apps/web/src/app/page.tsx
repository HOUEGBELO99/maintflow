export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <h1 className="text-4xl font-bold text-brand">MaintFlow</h1>
      <p className="text-lg text-ink/70">
        GMAO — interface d&apos;administration. Le scaffold est en place : authentification Supabase,
        client API typé vers NestJS, React Query, Tailwind.
      </p>
      <ul className="list-disc pl-6 text-ink/60">
        <li>Prochaine étape : page de connexion (Supabase Auth)</li>
        <li>Dashboard KPI (Recharts) branché sur /dashboard/kpis</li>
        <li>CRUD Machines / Pannes / Interventions</li>
      </ul>
    </main>
  );
}
