'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { Icon } from '@/components/icon';
import { ConfirmDialog, Field, inputClass, Modal } from '@/components/ui/modal';
import { api, type InvitationInput, type SiteUser } from '@/lib/api-client';
import type { UserRole } from '@maintflow/shared';

const ROLES: UserRole[] = ['admin', 'chef_maintenance', 'chef_atelier', 'technicien', 'operateur'];
const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur',
  chef_maintenance: 'Chef maintenance',
  chef_atelier: "Chef d'atelier",
  technicien: 'Technicien',
  operateur: 'Opérateur',
};
const WEB_ROLES = ['admin', 'chef_maintenance', 'chef_atelier'];
const WORKSHOPS = ['Tous', 'Atelier A', 'Atelier B', 'Atelier C', 'Atelier D', 'Utilités', 'Direction'];

/** Static documentation of the role model (mirrors the prototype's matrix). */
const PERMISSIONS: { label: string; roles: Record<string, number> }[] = [
  { label: 'Tableau de bord web (desktop)', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { label: 'Application mobile terrain', roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 1, operateur: 1 } },
  { label: 'Consulter les machines', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 1, operateur: 1 } },
  { label: 'Ajouter / modifier des machines', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { label: 'Déclarer une panne', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 1, operateur: 1 } },
  { label: 'Clôturer panne / intervention', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 1, operateur: 0 } },
  { label: 'Planifier les interventions', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { label: 'Gérer les pièces de rechange', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { label: 'Voir KPI & rapports', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { label: 'Exporter les données', roles: { admin: 1, chef_maintenance: 1, chef_atelier: 1, technicien: 0, operateur: 0 } },
  { label: 'Gérer utilisateurs & rôles', roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 0, operateur: 0 } },
  { label: 'Modifier les paramètres', roles: { admin: 1, chef_maintenance: 0, chef_atelier: 0, technicien: 0, operateur: 0 } },
];
const ROLE_TONE: Record<string, PillTone> = {
  admin: 'info',
  chef_maintenance: 'ok',
  chef_atelier: 'mute',
  technicien: 'warn',
  operateur: 'crit',
};

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

type PillTone = 'ok' | 'info' | 'warn' | 'crit' | 'mute';
const PILL_CLASS: Record<PillTone, string> = {
  ok: 'text-okFg bg-brand-50 border-brand-100',
  info: 'text-infoFg bg-infoBg border-[#BFDBFE]',
  warn: 'text-warnFg bg-warnBg border-[#FDE68A]',
  crit: 'text-critFg bg-critBg border-[#FECACA]',
  mute: 'text-mute bg-surface-muted border-line',
};
function Pill({ tone, dot, children }: { tone: PillTone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-[9px] py-[3px] text-[11.5px] font-semibold leading-[1.4] ${PILL_CLASS[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

type Tab = 'team' | 'invites' | 'perms';

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.users.list() });
  const { data: invitations } = useQuery({ queryKey: ['invitations'], queryFn: () => api.users.invitations.list() });

  const [tab, setTab] = useState<Tab>('team');
  const [inviting, setInviting] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<SiteUser | null>(null);

  const updateUser = useMutation({
    mutationFn: (v: { id: string; role?: UserRole; status?: 'active' | 'inactive' }) =>
      api.users.update(v.id, { role: v.role, status: v.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
  const createInvite = useMutation({
    mutationFn: api.users.invitations.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invitations'] });
      setInviting(false);
    },
  });

  const list = users ?? [];
  const invList = invitations ?? [];
  const webAccess = list.filter((u) => WEB_ROLES.includes(u.role)).length;
  const mobileAccess = list.filter((u) => !WEB_ROLES.includes(u.role)).length;
  const pending = invList.filter((i) => i.status === 'pending').length;

  return (
    <div>
      <header className="mb-[22px]">
        <h1 className="text-[26px] font-bold tracking-tight">Utilisateurs &amp; Rôles</h1>
        <p className="mt-1 text-[13.5px] text-mute">Gérez les accès, rôles et permissions de votre équipe.</p>
      </header>

      <div className="mb-[22px] grid grid-cols-4 gap-3.5">
        <StatCard icon="user" label="Utilisateurs totaux" value={list.length} sub={`${list.filter((u) => u.status === 'active').length} actifs`} />
        <StatCard icon="shield" label="Accès web" value={webAccess} sub="Dashboard desktop" />
        <StatCard icon="mobile" label="Accès mobile" value={mobileAccess} sub="App terrain" />
        <StatCard icon="bell" label="Invitations en attente" value={pending} sub="À accepter" accent="#F59E0B" />
      </div>

      <div className="mb-4 flex items-end gap-1 border-b border-line">
        <TabButton active={tab === 'team'} onClick={() => setTab('team')}>
          Membres de l’équipe <span className="ml-1.5 font-medium text-faint">{list.length}</span>
        </TabButton>
        <TabButton active={tab === 'invites'} onClick={() => setTab('invites')}>
          Invitations envoyées <span className="ml-1.5 font-medium text-faint">{invList.length}</span>
        </TabButton>
        <TabButton active={tab === 'perms'} onClick={() => setTab('perms')}>
          Matrice des permissions
        </TabButton>
        <div className="flex-1" />
        <button
          onClick={() => setInviting(true)}
          className="mb-1.5 inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-[13px] font-bold text-brand-deep transition hover:bg-brand"
        >
          <Icon name="plus" size={14} /> Inviter un utilisateur
        </button>
      </div>

      {tab === 'team' && (
        <Table head={['Utilisateur', 'E-mail', 'Rôle', 'Atelier', 'Dernière connexion', 'Statut', '']}>
          {list.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface-soft">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${u.color ?? '#00C24A'}, #0A3D1F)` }}
                  >
                    {u.initials ?? u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold">{u.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[12px] text-mute">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  onChange={(e) => updateUser.mutate({ id: u.id, role: e.target.value as UserRole })}
                  className="cursor-pointer rounded-pill bg-surface-muted px-2.5 py-1 text-[12px] font-semibold text-body"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">{u.workshop}</td>
              <td className="px-4 py-3 text-[12px] text-mute">{fmtDateTime(u.lastLogin)}</td>
              <td className="px-4 py-3">
                {u.status === 'active' ? (
                  <Pill tone="ok" dot>
                    Actif
                  </Pill>
                ) : (
                  <Pill tone="crit">Suspendu</Pill>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => setConfirmRevoke(u)}
                  title="Révoquer l’accès"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-critBg hover:text-critFg"
                >
                  <Icon name="plus" size={14} className="rotate-45" />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {tab === 'invites' && (
        <Table head={['Réf.', 'E-mail', 'Rôle', 'Atelier', 'Envoyée', 'Par', 'Statut', '']}>
          {invList.map((inv) => (
            <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-surface-soft">
              <td className="px-4 py-3 font-mono text-[11.5px] text-mute">INV-{inv.id.slice(-4).toUpperCase()}</td>
              <td className="px-4 py-3 font-semibold">{inv.email}</td>
              <td className="px-4 py-3">
                <Pill tone={inv.role === 'admin' ? 'info' : 'warn'}>{ROLE_LABEL[inv.role]}</Pill>
              </td>
              <td className="px-4 py-3 text-[12px] text-mute">{inv.workshop}</td>
              <td className="px-4 py-3 text-[12px] text-mute">{fmtDateTime(inv.sentAt)}</td>
              <td className="px-4 py-3 text-[12px] text-mute">{inv.invitedBy}</td>
              <td className="px-4 py-3">
                {inv.status === 'pending' ? (
                  <Pill tone="warn" dot>
                    En attente
                  </Pill>
                ) : (
                  <Pill tone="ok">Acceptée</Pill>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {inv.status === 'pending' && (
                  <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-[5px] text-xs font-semibold text-mute transition hover:bg-surface-muted">
                    <Icon name="refresh" size={12} /> Renvoyer
                  </button>
                )}
              </td>
            </tr>
          ))}
          {invList.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-[60px] text-center text-mute">
                Aucune invitation
              </td>
            </tr>
          )}
        </Table>
      )}

      {tab === 'perms' && <PermissionsMatrix />}

      <InviteForm
        open={inviting}
        onClose={() => setInviting(false)}
        onSave={(body) => createInvite.mutate(body)}
      />
      <ConfirmDialog
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => confirmRevoke && updateUser.mutate({ id: confirmRevoke.id, status: 'inactive' })}
        title={`Révoquer l’accès de ${confirmRevoke?.name} ?`}
        body="L’utilisateur ne pourra plus se connecter, mais son historique est conservé."
      />
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: number; sub: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-[18px]">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-deep">
          <Icon name={icon} size={14} />
        </span>
        <div className="text-[12px] font-medium text-mute">{label}</div>
      </div>
      <div className="mt-1.5 text-[30px] font-bold leading-none tracking-tight tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-1 text-[12px] text-mute">{sub}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold ${
        active ? 'border-brand text-body' : 'border-transparent text-mute'
      }`}
    >
      {children}
    </button>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-soft text-[11px] uppercase tracking-[0.06em] text-mute">
            {head.map((h, i) => (
              <th key={i} className="border-b border-line px-4 py-2.5 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function PermissionsMatrix() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold">Matrice des permissions</h3>
        <div className="mt-0.5 text-xs text-mute">
          Aperçu de ce que chaque rôle peut faire dans MaintFlow — 5 profils
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-soft">
              <th className="min-w-[220px] border-b border-line px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
                Permission
              </th>
              {ROLES.map((r) => (
                <th key={r} className="whitespace-nowrap border-b border-line px-4 py-2.5 text-center">
                  <Pill tone={ROLE_TONE[r] ?? 'mute'}>{ROLE_LABEL[r]}</Pill>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.label} className="border-b border-line last:border-0 hover:bg-surface-soft">
                <td className="px-4 py-3">{p.label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-4 py-3 text-center">
                    {p.roles[r] ? (
                      <Icon name="check" size={16} className="mx-auto text-ok" />
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InviteForm({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (body: InvitationInput) => void }) {
  const [form, setForm] = useState<InvitationInput & { message: string }>({
    email: '', role: 'technicien', workshop: 'Atelier A', message: '',
  });
  useEffect(() => {
    if (open) setForm({ email: '', role: 'technicien', workshop: 'Atelier A', message: '' });
  }, [open]);
  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle invitation"
      subtitle="L’utilisateur recevra un e-mail avec un lien d’accès."
      wide
      footer={
        <>
          <button onClick={onClose} className="rounded-md bg-surface-muted px-3.5 py-2 text-sm font-semibold text-body">
            Annuler
          </button>
          <button
            onClick={() => onSave({ email: form.email, role: form.role, workshop: form.workshop })}
            disabled={!form.email}
            className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand-bright px-3.5 py-2 text-sm font-bold text-brand-deep transition hover:bg-brand disabled:opacity-50"
          >
            <Icon name="arrowRight" size={14} /> Envoyer l’invitation
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="E-mail">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
            placeholder="prenom.nom@entreprise.fr"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Rôle">
            <select className={inputClass} value={form.role} onChange={(e) => upd('role', e.target.value as UserRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Atelier">
            <select className={inputClass} value={form.workshop} onChange={(e) => upd('workshop', e.target.value)}>
              {WORKSHOPS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Message personnalisé (optionnel)">
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={form.message}
            onChange={(e) => upd('message', e.target.value)}
            placeholder="Bienvenue dans l’équipe ! Voici ton accès MaintFlow…"
          />
        </Field>
        <div className="flex items-start gap-2.5 rounded-md border border-dashed border-line-strong bg-surface-soft px-3 py-3 text-[12.5px] text-mute">
          <Icon name="info" size={16} className="mt-px flex-none text-brand" />
          <div>
            L’utilisateur recevra un e-mail avec un lien valable <b>72 heures</b> pour activer son compte et choisir
            son mot de passe. Pour les techniciens, l’invitation inclut le lien de téléchargement de l’
            <b>app mobile MaintFlow</b>.
          </div>
        </div>
      </div>
    </Modal>
  );
}
