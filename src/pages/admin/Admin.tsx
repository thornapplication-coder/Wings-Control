import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, KeyRound, Users, Database, ListTree, SlidersHorizontal, Trash2, ScrollText, LayoutGrid, RotateCcw, Archive, ArchiveRestore, Plus, X } from 'lucide-react';
import { useStore, type Collection } from '../../store/store';
import { Button, Card, CardHeader, EmptyState, Field, Input, Modal, SectionTitle, Select, Tag, cx } from '../../components/ui';
import { fmtDateTime, timeAgo } from '../../lib/dates';
import { isActiveTask, isOverdue } from '../../lib/metrics';

const SUB = [
  { to: '', label: 'Overview', icon: LayoutGrid },
  { to: 'access', label: 'Team & Access', icon: KeyRound },
  { to: 'records', label: 'Records', icon: Database },
  { to: 'reference', label: 'Reference data', icon: ListTree },
  { to: 'settings', label: 'Settings', icon: SlidersHorizontal },
  { to: 'trash', label: 'Recycle bin', icon: Trash2 },
  { to: 'audit', label: 'Audit log', icon: ScrollText },
];

export function AdminPage() {
  const admin = useStore((s) => s.admin)!;
  const adminSignOut = useStore((s) => s.adminSignOut);
  const nav = useNavigate();
  return (
    <div>
      <SectionTitle title="Administration" subtitle={`Superadmin session since ${fmtDateTime(admin.since)} · idle timeout ${useStore.getState().data.settings.adminIdleMinutes} min (production)`}
        actions={<Button onClick={() => { adminSignOut(); nav('/'); }}><LogOut size={16} /> Leave admin session</Button>} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card scrollbar-none">
        {SUB.map((s) => (
          <NavLink key={s.to} to={`/admin${s.to ? `/${s.to}` : ''}`} end
            className={({ isActive }) => cx('flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold', isActive ? 'bg-ink text-white' : 'text-ink-muted hover:bg-surface-subtle')}>
            <s.icon size={15} /> {s.label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="access" element={<AccessAdmin />} />
        <Route path="records" element={<Records />} />
        <Route path="reference" element={<Reference />} />
        <Route path="settings" element={<Settings />} />
        <Route path="trash" element={<Trash />} />
        <Route path="audit" element={<Audit />} />
      </Routes>
    </div>
  );
}

function Overview() {
  const d = useStore((s) => s.data);
  const trash = useStore((s) => s.trash);
  const stats: [string, number | string][] = [
    ['Projects', d.projects.filter((p) => !p.archived).length], ['Tasks', d.tasks.filter((t) => !t.archived).length],
    ['Open tasks', d.tasks.filter(isActiveTask).length], ['Overdue tasks', d.tasks.filter((t) => isOverdue(t)).length],
    ['Trainers', d.trainers.filter((t) => !t.archived).length], ['Training events', d.trainingEvents.length],
    ['Pending approvals', d.compliance.filter((c) => ['in_preparation', 'submitted'].includes(c.status)).length], ['Recycle bin', trash.length],
  ];
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:col-span-2">
        {stats.map(([l, v]) => <Card key={l} className="p-4"><div className="text-2xl font-black text-ink">{v}</div><div className="text-xs font-semibold text-ink-muted">{l}</div></Card>)}
      </div>
      <Card>
        <CardHeader title="System status" />
        <dl className="space-y-2 border-t border-line/60 px-5 py-4 text-sm">
          <Row k="App version" v="0.1.0-prototype" />
          <Row k="Environment" v={<Tag className="bg-ink text-white">PROTOTYPE · local</Tag>} />
          <Row k="Data store" v="Browser storage (this device only)" />
          <Row k="Backups" v={<span className="text-ink-soft">n/a – production: daily + PITR</span>} />
          <Row k="Shared password changed" v={fmtDateTime(d.settings.passwordLastChanged)} />
          <Row k="Active normal sessions" v={d.sessions.filter((s) => !s.revoked).length} />
        </dl>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader title="Recent system activity" />
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {d.activity.slice(0, 6).map((a) => <li key={a.id} className="px-5 py-2.5 text-sm"><b>{a.actor}</b>{a.actorVerified && <ShieldCheck size={13} className="ml-1 inline text-status-green" />} {a.action} <b>{a.targetLabel}</b> <span className="text-xs text-ink-soft">· {timeAgo(a.at)}</span></li>)}
        </ul>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-ink-soft">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>;
}

function AccessAdmin() {
  const d = useStore((s) => s.data);
  const change = useStore((s) => s.changeSharedPassword);
  const revoke = useStore((s) => s.revokeSession);
  const revokeAll = useStore((s) => s.revokeAllSessions);
  const addMember = useStore((s) => s.addMember);
  const setActive = useStore((s) => s.setMemberActive);
  const toast = useStore((s) => s.showToast);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [reauth, setReauth] = useState(false);
  const [err, setErr] = useState('');
  const [newName, setNewName] = useState('');

  // Validate first, then ask for re-authentication, then apply.
  const requestChange = () => {
    if (pw1 !== pw2) { setErr('Passwords do not match.'); return; }
    if (pw1.length < 12) { setErr('Minimum length is 12 characters.'); return; }
    setReauth(true);
  };
  const submit = () => {
    const r = change(pw1);
    if (!r.ok) { setErr(r.error ?? ''); setReauth(false); return; }
    setPw1(''); setPw2(''); setErr(''); setReauth(false);
    toast(d.settings.invalidateOnPasswordChange ? 'Shared password changed · all sessions revoked' : 'Shared password changed');
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader title="Shared team password" subtitle="Stored only as Argon2id hash in production. The current password can never be displayed or retrieved." icon={<KeyRound size={20} className="mt-0.5 text-brand" />} />
        <div className="space-y-3 border-t border-line/60 px-5 py-4">
          <p className="text-xs text-ink-soft">Last changed {fmtDateTime(d.settings.passwordLastChanged)}. Minimum 12 characters. {d.settings.invalidateOnPasswordChange ? 'Changing it revokes all normal sessions immediately.' : 'Existing sessions remain valid.'}</p>
          <Field label="New password"><Input type="password" autoComplete="new-password" value={pw1} onChange={(e) => { setPw1(e.target.value); setErr(''); }} /></Field>
          <Field label="Confirm new password"><Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => { setPw2(e.target.value); setErr(''); }} /></Field>
          {err && <p role="alert" className="text-sm font-semibold text-status-red">{err}</p>}
          <Button variant="primary" disabled={!pw1 || !pw2} onClick={requestChange}>Change password</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Team members" subtitle="Names shown on the access screen. Deactivating revokes that name's sessions – but anyone with the shared password can still pick another name." icon={<Users size={20} className="mt-0.5 text-brand" />} />
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {d.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex-1 font-semibold text-ink">{m.displayName}{m.isSuperadmin && <Tag className="ml-2 bg-ink text-white">Superadmin</Tag>}{!m.active && <Tag className="ml-2">inactive</Tag>}</span>
              {!m.isSuperadmin && <Button size="sm" onClick={() => setActive(m.id, !m.active)}>{m.active ? 'Deactivate' : 'Reactivate'}</Button>}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 border-t border-line/60 px-5 py-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Display name" aria-label="New member name" />
          <Button disabled={!newName.trim() || d.members.some((m) => m.displayName.toLowerCase() === newName.trim().toLowerCase())} onClick={() => { addMember(newName); setNewName(''); }}><Plus size={15} /> Add</Button>
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="Sessions" subtitle="Normal-user sessions (production: server-side session records, HTTP-only cookies)" action={<Button size="sm" variant="danger" onClick={revokeAll}>Revoke all</Button>} />
        <div className="overflow-x-auto border-t border-line/60">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-soft"><tr><th className="px-5 py-2">Display name</th><th className="px-2 py-2">Device</th><th className="px-2 py-2">Started</th><th className="px-2 py-2">Last seen</th><th className="px-5 py-2" /></tr></thead>
            <tbody className="divide-y divide-line/60">
              {d.sessions.map((s) => (
                <tr key={s.id} className={s.revoked ? 'text-ink-soft' : ''}>
                  <td className="px-5 py-2.5 font-semibold">{s.displayName}</td><td className="px-2 py-2.5">{s.device}</td><td className="px-2 py-2.5">{fmtDateTime(s.startedAt)}</td><td className="px-2 py-2.5">{timeAgo(s.lastSeenAt)}</td>
                  <td className="px-5 py-2.5 text-right">{s.revoked ? <Tag>revoked</Tag> : <Button size="sm" onClick={() => revoke(s.id)}>Revoke</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={reauth} onClose={() => setReauth(false)} title="Confirm with administrator password"
        footer={<><Button variant="ghost" onClick={() => setReauth(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Confirm change</Button></>}>
        <p className="mb-3 text-sm text-ink-muted">Sensitive action – re-authentication required.</p>
        <Field label="Administrator password"><Input type="password" autoFocus /></Field>
        <p className="mt-2 text-[11px] text-ink-soft">Prototype: not validated.</p>
      </Modal>
    </div>
  );
}

const COLLECTIONS: { key: Collection; label: string }[] = [
  { key: 'projects', label: 'Projects' }, { key: 'tasks', label: 'Tasks' }, { key: 'workstreams', label: 'Workstreams' }, { key: 'milestones', label: 'Milestones' },
  { key: 'risks', label: 'Risks & issues' }, { key: 'decisions', label: 'Decisions' }, { key: 'meetings', label: 'Meetings' }, { key: 'trainingEvents', label: 'Training events' },
  { key: 'compliance', label: 'Compliance items' }, { key: 'trainers', label: 'Trainers' }, { key: 'organizations', label: 'Organisations' },
];

function Records() {
  const d = useStore((s) => s.data);
  const setArchived = useStore((s) => s.setArchived);
  const remove = useStore((s) => s.remove);
  const [c, setC] = useState<Collection>('projects');
  const [showArchived, setShowArchived] = useState(false);
  const [del, setDel] = useState<{ id: string; label: string } | null>(null);
  const rows = (d[c] as unknown as ({ id: string; archived?: boolean; title?: string; name?: string; ref?: string; status?: string })[]).filter((r) => showArchived || !r.archived);
  const label = (r: (typeof rows)[number]) => `${r.ref ? `${r.ref} ` : ''}${r.title ?? r.name ?? r.id}`;
  const canArchive = rows.some((r) => 'archived' in r);

  const impact = useMemo(() => {
    if (!del) return [];
    const out: string[] = [];
    if (c === 'projects') {
      out.push(`${d.tasks.filter((t) => t.projectId === del.id).length} tasks reference this project`);
      out.push(`${d.workstreams.filter((w) => w.projectId === del.id).length} workstreams, ${d.milestones.filter((m) => m.projectId === del.id).length} milestones`);
      out.push(`${d.risks.filter((r) => r.projectId === del.id).length} risks, ${d.decisions.filter((x) => x.projectId === del.id).length} decisions`);
    }
    if (c === 'organizations') out.push(`${d.tasks.filter((t) => t.waitingForOrgId === del.id).length} tasks wait for this organisation`);
    if (c === 'workstreams') out.push(`${d.tasks.filter((t) => t.workstreamId === del.id).length} tasks are assigned to this workstream`);
    if (c === 'tasks') { const t = d.tasks.find((x) => x.id === del.id); out.push(`${t?.timeline.length ?? 0} timeline entries`); if (t?.sourceMeetingId) out.push('linked to a meeting action item'); }
    return out;
  }, [del, c, d]);
  const blocked = impact.some((i) => /^[1-9]\d* tasks/.test(i));

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-line/60 px-4 py-3 sm:px-5">
        <Select value={c} onChange={(e) => setC(e.target.value as Collection)} className="w-auto" aria-label="Record type">{COLLECTIONS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</Select>
        {canArchive && <label className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived</label>}
        <span className="ml-auto text-xs text-ink-soft">{rows.length} records · create / edit in the module screens</span>
      </div>
      {rows.length === 0 && <EmptyState title="No records" />}
      <ul className="divide-y divide-line/60">
        {rows.map((r) => (
          <li key={r.id} className={cx('flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-5', r.archived && 'bg-surface-subtle text-ink-soft')}>
            <span className="min-w-0 flex-1 basis-60 truncate text-sm font-semibold">{label(r)}</span>
            {r.status && <Tag>{r.status}</Tag>}
            {r.archived && <Tag>archived</Tag>}
            {'archived' in r && <Button size="sm" variant="ghost" onClick={() => setArchived(c, r.id, !r.archived, label(r))}>{r.archived ? <><ArchiveRestore size={14} /> Restore</> : <><Archive size={14} /> Archive</>}</Button>}
            <Button size="sm" variant="ghost" className="text-status-red" onClick={() => setDel({ id: r.id, label: label(r) })}><Trash2 size={14} /> Delete</Button>
          </li>
        ))}
      </ul>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete permanently?"
        footer={<><Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" disabled={blocked} onClick={() => { remove(c, del!.id, del!.label); setDel(null); }}>Move to recycle bin</Button></>}>
        <p className="text-sm font-semibold text-ink">{del?.label}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">{impact.length ? impact.map((i) => <li key={i}>{i}</li>) : <li>No dependent records found.</li>}</ul>
        {blocked && <p className="mt-3 rounded-lg bg-status-amberBg p-2.5 text-xs font-semibold text-status-amber">Still referenced by other records. Resolve the references first, or archive instead.</p>}
      </Modal>
    </Card>
  );
}

function ListEditor({ title, items, onChange, hint }: { title: string; items: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [v, setV] = useState('');
  return (
    <Card>
      <CardHeader title={title} subtitle={hint} />
      <ul className="flex flex-wrap gap-1.5 border-t border-line/60 px-5 py-3">
        {items.map((i) => <li key={i} className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-1 pl-2.5 pr-1 text-xs font-semibold text-ink">{i}<button aria-label={`Remove ${i}`} onClick={() => onChange(items.filter((x) => x !== i))} className="rounded-full p-0.5 hover:bg-line"><X size={12} /></button></li>)}
      </ul>
      <div className="flex gap-2 px-5 pb-4"><Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add…" aria-label={`Add to ${title}`} /><Button disabled={!v.trim() || items.includes(v.trim())} onClick={() => { onChange([...items, v.trim()]); setV(''); }}>Add</Button></div>
    </Card>
  );
}

function Reference() {
  const d = useStore((s) => s.data);
  const patch = useStore((s) => s.patchReference);
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader title="Bases" subtitle="Standard bases and WP bases are kept as distinct values" />
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {d.bases.map((b) => (
            <li key={b.code} className="flex items-center gap-3 px-5 py-2"><span className="w-20 font-mono font-bold">{b.code}</span><Tag>{b.kind === 'wp' ? 'WP base' : 'Base'}</Tag>
              <label className="ml-auto flex items-center gap-2 text-xs"><input type="checkbox" checked={b.active} onChange={(e) => patch({ bases: d.bases.map((x) => (x.code === b.code ? { ...x, active: e.target.checked } : x)) }, `Base ${b.code}`)} /> active</label></li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Fleets / aircraft types" />
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {d.fleets.map((f) => <li key={f.code} className="flex items-center gap-3 px-5 py-2.5"><span className="w-16 font-mono font-bold">{f.code}</span>{f.label}<label className="ml-auto flex items-center gap-2 text-xs"><input type="checkbox" checked={f.active} onChange={(e) => patch({ fleets: d.fleets.map((x) => (x.code === f.code ? { ...x, active: e.target.checked } : x)) }, `Fleet ${f.code}`)} /> active</label></li>)}
        </ul>
      </Card>
      <ListEditor title="Qualification categories" items={d.qualificationTypes} onChange={(v) => patch({ qualificationTypes: v }, 'Qualification categories')} hint="Used for trainer charts and counting rules" />
      <ListEditor title="B737 MAX introduction workstream template" items={d.workstreamTemplate} onChange={(v) => patch({ workstreamTemplate: v }, 'Workstream template')} hint="Planning categories – not a statement that each workstream is required or approved" />
      <ListEditor title="Executive report workstream template" items={d.reportWorkstreamTemplate} onChange={(v) => patch({ reportWorkstreamTemplate: v }, 'Report workstream template')} />
      <Card>
        <CardHeader title="Meeting-minutes templates" />
        <p className="border-t border-line/60 px-5 py-4 text-sm text-ink-muted">Standard Management · Project Status · B737 MAX Introduction · Instructor / Training · Partner Coordination · Regulatory / Compliance. Template editor follows in the production build.</p>
      </Card>
    </div>
  );
}

function Settings() {
  const s = useStore((x) => x.data.settings);
  const update = useStore((x) => x.updateSettings);
  const num = (k: keyof typeof s, label: string, hint?: string) => (
    <Field label={label} hint={hint}><Input type="number" min={1} value={s[k] as number} onChange={(e) => update({ [k]: Number(e.target.value) })} /></Field>
  );
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader title="Sessions" />
        <div className="grid grid-cols-2 gap-3 border-t border-line/60 px-5 py-4">
          {num('sessionDays', 'Normal session duration (days)')}
          {num('adminIdleMinutes', 'Superadmin idle timeout (min)')}
          <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={s.invalidateOnPasswordChange} onChange={(e) => update({ invalidateOnPasswordChange: e.target.checked })} /> Revoke all sessions when the shared password changes</label>
        </div>
      </Card>
      <Card>
        <CardHeader title="Brute-force protection" subtitle="Enforced server-side in production" />
        <div className="grid grid-cols-2 gap-3 border-t border-line/60 px-5 py-4">
          {num('maxFailedAttempts', 'Failed attempts before lockout')}
          {num('lockoutMinutes', 'Lockout duration (min)', 'Progressive delay per attempt')}
        </div>
      </Card>
      <Card>
        <CardHeader title="Retention & programme" />
        <div className="grid grid-cols-2 gap-3 border-t border-line/60 px-5 py-4">
          {num('recycleRetentionDays', 'Recycle bin retention (days)')}
          <Field label="B737 MAX EIS target (countdown)"><Input type="date" value={s.eisTargetDate} onChange={(e) => update({ eisTargetDate: e.target.value })} /></Field>
        </div>
      </Card>
      <Card>
        <CardHeader title="Prototype data" subtitle="Resets all synthetic records on this device" />
        <div className="border-t border-line/60 px-5 py-4"><Button onClick={() => { useStore.getState().resetDemo(); useStore.getState().showToast('Test dataset reset'); }}><RotateCcw size={15} /> Reset to test dataset</Button></div>
      </Card>
    </div>
  );
}

function Trash() {
  const trash = useStore((s) => s.trash);
  const restore = useStore((s) => s.restore);
  const purge = useStore((s) => s.purgeTrash);
  const days = useStore((s) => s.data.settings.recycleRetentionDays);
  return (
    <Card>
      <CardHeader title="Recycle bin" subtitle={`Deleted records are kept for ${days} days, then purged`} />
      {trash.length === 0 && <EmptyState title="Recycle bin is empty" />}
      <ul className="divide-y divide-line/60 border-t border-line/60">
        {trash.map((t, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 px-5 py-3">
            <span className="min-w-0 flex-1 basis-60"><span className="block truncate text-sm font-semibold text-ink">{String(t.item.title ?? t.item.name ?? t.item.id)}</span><span className="text-xs text-ink-soft">{t.collection} · deleted {timeAgo(t.deletedAt)} by {t.deletedBy}</span></span>
            <Button size="sm" onClick={() => restore(i)}><RotateCcw size={14} /> Restore</Button>
            <Button size="sm" variant="ghost" className="text-status-red" onClick={() => purge(i)}>Purge</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Audit() {
  const activity = useStore((s) => s.data.activity);
  const [onlyAdmin, setOnlyAdmin] = useState(true);
  const list = activity.filter((a) => !onlyAdmin || a.actorVerified);
  return (
    <Card>
      <CardHeader title="Audit log" subtitle="Superadmin actions are attributed to the authenticated account (✓). Team actions show a self-declared display name."
        action={<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyAdmin} onChange={(e) => setOnlyAdmin(e.target.checked)} /> Superadmin only</label>} />
      <div className="overflow-x-auto border-t border-line/60">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-soft"><tr><th className="px-5 py-2">Time</th><th className="px-2 py-2">Actor</th><th className="px-2 py-2">Action</th><th className="px-5 py-2">Record</th></tr></thead>
          <tbody className="divide-y divide-line/60">
            {list.map((a) => <tr key={a.id}><td className="whitespace-nowrap px-5 py-2 text-xs">{fmtDateTime(a.at)}</td><td className="px-2 py-2 font-semibold">{a.actor}{a.actorVerified && <ShieldCheck size={13} className="ml-1 inline text-status-green" />}</td><td className="px-2 py-2">{a.action}</td><td className="px-5 py-2">{a.targetLabel}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
