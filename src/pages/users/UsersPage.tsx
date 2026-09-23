import { Check, Minus, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Avatar, Tabs } from '@/components/ui/misc';
import { Dialog, Sheet } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ROLE_LABEL, ROLES } from '@/data/users';
import { useQuery } from '@/hooks/useQuery';
import { db, storesService, usersService } from '@/services';
import { UserRole, UserStatus, type Permission, type User } from '@/types';
import { formatRelative, normalize } from '@/utils/format';
import { USER_STATUS } from '@/utils/labels';

const MODULES: { label: string; view: Permission; edit?: Permission; approve?: Permission }[] = [
  { label: 'Visão geral', view: 'dashboard.view' },
  { label: 'Lojas', view: 'stores.view', edit: 'stores.manage' },
  { label: 'Gôndolas e réguas', view: 'gondolas.view', edit: 'shelves.edit', approve: 'shelves.publish' },
  { label: 'Produtos', view: 'products.view', edit: 'products.manage' },
  { label: 'Preços', view: 'prices.view', edit: 'prices.edit', approve: 'prices.approve' },
  { label: 'Campanhas', view: 'campaigns.view', edit: 'campaigns.edit', approve: 'campaigns.approve' },
  { label: 'Monitoramento e dispositivos', view: 'monitoring.view', edit: 'devices.manage' },
  { label: 'Câmeras', view: 'cameras.view' },
  { label: 'Alertas', view: 'alerts.view', edit: 'alerts.manage' },
  { label: 'Operações e chamados', view: 'operations.view', edit: 'operations.manage' },
  { label: 'Auditoria', view: 'audit.view' },
  { label: 'Usuários', view: 'users.view', edit: 'users.manage' },
  { label: 'Configurações', view: 'settings.manage', edit: 'settings.manage' },
];

function Mark({ on }: { on: boolean }) {
  return on ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-slate-200" />;
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Operador);
  const [allStores, setAllStores] = useState(false);
  const [stores, setStores] = useState<string[]>(['lj001']);
  const valid = name.trim() && /.+@.+\..+/.test(email);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Convidar usuário"
      description="O convite é enviado por e-mail e expira em 7 dias."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={async () => {
              await usersService.invite({ name, email, role, storeIds: allStores ? 'all' : stores });
              toast.success('Convite enviado', email);
              onClose();
            }}
          >
            Enviar convite
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Perfil" className="sm:col-span-2" hint={ROLES.find((r) => r.role === role)?.description}>
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Checkbox checked={allStores} onChange={setAllStores} label="Acesso a todas as lojas" />
          {!allStores && (
            <div className="mt-2 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-2">
              {storesService.listSync().map((s) => (
                <Checkbox key={s.id} checked={stores.includes(s.id)} onChange={(c) => setStores(c ? [...stores, s.id] : stores.filter((x) => x !== s.id))} label={<span className="text-[13px]">{s.name}</span>} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function UserSheet({ user, onClose }: { user: User; onClose: () => void }) {
  const toast = useToast();
  const { can } = useAuth();
  const role = ROLES.find((r) => r.role === user.role)!;
  const manage = can('users.manage');
  return (
    <Sheet open onClose={onClose} title={user.name} description={user.email}>
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div>
          <StatusBadge map={USER_STATUS} value={user.status} />
          <p className="mt-1 text-xs text-slate-500">{user.organization} · último acesso {formatRelative(user.lastAccessAt)}</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Field label="Perfil de acesso" hint={role.description}>
          <Select
            disabled={!manage}
            value={user.role}
            onChange={async (e) => {
              await usersService.update(user.id, { role: e.target.value as UserRole });
              toast.success('Perfil atualizado', `${user.name} · ${ROLE_LABEL[e.target.value as UserRole]}`);
            }}
          >
            {ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <p className="text-[13px] font-medium text-slate-700">Lojas</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.storeIds === 'all' ? <Badge tone="blue">Todas as lojas</Badge> : user.storeIds.map((id) => <Badge key={id} tone="outline">{db.stores.get(id)?.name}</Badge>)}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-medium text-slate-700">Permissões ({role.permissions.length})</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {role.permissions.map((p) => (
              <code key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                {p}
              </code>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          {user.status === UserStatus.Bloqueado ? (
            <Button variant="outline" disabled={!manage} onClick={async () => { await usersService.update(user.id, { status: UserStatus.Ativo }); toast.success('Usuário reativado'); }}>
              Reativar usuário
            </Button>
          ) : (
            <Button variant="outline" className="text-red-600" disabled={!manage} onClick={async () => { await usersService.update(user.id, { status: UserStatus.Bloqueado }); toast.success('Usuário bloqueado', user.name); }}>
              Bloquear acesso
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export default function UsersPage() {
  const { can, user: me } = useAuth();
  const { data, loading } = useQuery(() => usersService.list(), []);
  const [tab, setTab] = useState<'usuarios' | 'perfis'>('usuarios');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = useMemo(() => (data ?? []).filter((u) => (!role || u.role === role) && (!search || normalize(`${u.name} ${u.email}`).includes(normalize(search)))), [data, role, search]);
  const open = (data ?? []).find((u) => u.id === openId);

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Usuário',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">
              {u.name} {u.id === me?.id && <span className="text-xs font-normal text-slate-400">(você)</span>}
            </p>
            <p className="truncate text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
      sortValue: (u) => u.name,
    },
    { key: 'role', header: 'Perfil', cell: (u) => <Badge tone="outline">{ROLE_LABEL[u.role]}</Badge>, sortValue: (u) => u.role },
    { key: 'org', header: 'Organização', cell: (u) => u.organization, hideBelow: 'lg' },
    { key: 'stores', header: 'Lojas', cell: (u) => (u.storeIds === 'all' ? 'Todas' : `${u.storeIds.length} loja(s)`), hideBelow: 'md' },
    { key: 'status', header: 'Status', cell: (u) => <StatusBadge map={USER_STATUS} value={u.status} />, sortValue: (u) => u.status, hideBelow: 'sm' },
    { key: 'last', header: 'Último acesso', cell: (u) => <span className="text-slate-500">{u.lastAccessAt ? formatRelative(u.lastAccessAt) : 'Nunca'}</span>, sortValue: (u) => u.lastAccessAt ?? '', hideBelow: 'lg' },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários e permissões"
        description="Controle de acesso baseado em perfis (RBAC) para a equipe iMart e do cliente."
        actions={
          <Button onClick={() => setInviteOpen(true)} disabled={!can('users.manage')}>
            <UserPlus /> Convidar usuário
          </Button>
        }
      />
      <Card>
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'usuarios', label: 'Usuários', count: data?.length },
            { value: 'perfis', label: 'Perfis e permissões', count: ROLES.length },
          ]}
        />
        {tab === 'usuarios' ? (
          <>
            <FilterBar search={search} onSearch={setSearch} placeholder="Buscar nome ou e-mail" hasFilters={!!(search || role)} onClear={() => { setSearch(''); setRole(''); }}>
              <FilterSelect value={role} onChange={setRole} allLabel="Todos os perfis" options={ROLES.map((r) => ({ value: r.role, label: r.label }))} />
            </FilterBar>
            <DataTable columns={columns} rows={rows} loading={loading} rowKey={(u) => u.id} onRowClick={(u) => setOpenId(u.id)} empty={{ icon: <Users />, title: 'Nenhum usuário encontrado' }} />
          </>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
              {ROLES.map((r) => (
                <div key={r.role} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{r.label}</p>
                    <span className="text-xs text-slate-400">{(data ?? []).filter((u) => u.role === r.role).length} usuários</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{r.description}</p>
                </div>
              ))}
            </div>
            <CardHeader title="Matriz de permissões" description="V = visualizar · E = criar/editar · A = aprovar/publicar" className="border-t" />
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs text-slate-500">
                    <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left font-medium">Módulo</th>
                    {ROLES.map((r) => (
                      <th key={r.role} className="px-2 py-2.5 text-center font-medium" colSpan={3}>
                        {r.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400">
                    <th className="sticky left-0 bg-white" />
                    {ROLES.map((r) => (
                      <FragmentHeaders key={r.role} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => (
                    <tr key={m.label} className="border-b border-slate-100 last:border-0">
                      <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2 text-slate-700">{m.label}</td>
                      {ROLES.map((r) => (
                        <FragmentCells key={r.role} perms={r.permissions} module={m} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </div>
        )}
      </Card>
      <InviteDialog key={String(inviteOpen)} open={inviteOpen} onClose={() => setInviteOpen(false)} />
      {open && <UserSheet key={open.id} user={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function FragmentHeaders() {
  return (
    <>
      <th className="w-7 py-1 text-center font-medium">V</th>
      <th className="w-7 py-1 text-center font-medium">E</th>
      <th className="w-7 border-r border-slate-100 py-1 text-center font-medium">A</th>
    </>
  );
}

function FragmentCells({ perms, module }: { perms: Permission[]; module: (typeof MODULES)[number] }) {
  return (
    <>
      <td className="py-2">
        <Mark on={perms.includes(module.view)} />
      </td>
      <td className="py-2">{module.edit ? <Mark on={perms.includes(module.edit)} /> : null}</td>
      <td className="border-r border-slate-100 py-2">{module.approve ? <Mark on={perms.includes(module.approve)} /> : null}</td>
    </>
  );
}
