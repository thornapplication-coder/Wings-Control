import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, Archive, Trash2, MessageSquarePlus, PhoneCall, PackageCheck, Send } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import {
  Avatar, Button, Card, Drawer, EmptyState, Field, FleetTag, Input, Modal, PriorityTag, SectionTitle, Select, StatusPill, Tag, Textarea, cx,
} from '../components/ui';
import { TASK_VIEWS, applyTaskView, filterTasks, isDependencyOverdue, isFollowUpDue, isOverdue, type TaskView } from '../lib/metrics';
import { fmtDate, fmtDateTime, fmtShort, relDays, todayISO } from '../lib/dates';
import { downloadCsv } from '../lib/export';
import { EW } from '../assets/icons';
import type { DependencyStatus, Priority, Task, TaskStatus } from '../types';

const DEP_LABEL: Record<DependencyStatus, string> = {
  not_requested: 'Not requested', requested: 'Requested', in_progress_ext: 'In progress externally', received: 'Received', overdue: 'Overdue / escalation required',
};
const SOURCE_LABEL: Record<Task['source'], string> = { project: 'Project', meeting: 'Meeting action', compliance: 'Compliance', stakeholder: 'Stakeholder follow-up', instructor: 'Instructor mgmt', manual: 'Manual' };

export function TasksPage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const session = useStore((s) => s.session)!;
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') as TaskView) || 'team';
  const openId = params.get('open');
  const [q, setQ] = useState('');
  const [prio, setPrio] = useState<'ALL' | Priority>('ALL');
  const [source, setSource] = useState<'ALL' | Task['source']>('ALL');
  const [editing, setEditing] = useState<Task | null>(null);
  const T = todayISO();

  useEffect(() => {
    if (params.get('new')) { setEditing(blankTask(session.memberId)); params.delete('new'); setParams(params, { replace: true }); }
  }, [params, setParams, session.memberId]);

  const base = useMemo(() => filterTasks(data.tasks, filters), [data.tasks, filters]);
  const counts = useMemo(() => Object.fromEntries(TASK_VIEWS.map((v) => [v.key, applyTaskView(base, v.key, session.memberId, T).length])), [base, session.memberId, T]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return applyTaskView(base, view, session.memberId, T)
      .filter((t) => (prio === 'ALL' || t.priority === prio) && (source === 'ALL' || t.source === source) && (!s || t.title.toLowerCase().includes(s) || t.ref.toLowerCase().includes(s)))
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  }, [base, view, session.memberId, q, prio, source, T]);

  const setView = (v: TaskView) => { params.set('view', v); setParams(params); };
  const openTask = data.tasks.find((t) => t.id === openId);
  const exportCsv = () => downloadCsv(`wings-control-tasks-${view}-${T}.csv`, list.map((t) => ({
    ID: t.ref, Title: t.title, Status: t.status, Priority: t.priority, Fleet: t.fleet, Base: t.base ?? '', Project: data.projects.find((p) => p.id === t.projectId)?.title ?? '',
    Owner: memberName(data.members, t.ownerId), Due: t.dueDate ?? '', 'Waiting for': data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson ?? '',
    'Awaited item': t.awaitedItem ?? '', 'Follow-up': t.followUpDate ?? '', Source: t.source,
  })), { view, ...filters });

  return (
    <div>
      <SectionTitle title="Action Tracker" subtitle="Central register of tasks and actions from all modules – one canonical record per action"
        actions={<>
          <Button onClick={exportCsv}><Download size={16} /> <span className="hidden sm:inline">Export view</span></Button>
          <Button variant="primary" onClick={() => setEditing(blankTask(session.memberId))}><Plus size={16} /> New task</Button>
        </>} />
      <FilterBar resultCount={list.length} resultLabel="tasks" />

      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="flex gap-1.5">
          {TASK_VIEWS.map((v) => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={cx('flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition',
                view === v.key ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-muted hover:border-ink-soft')}>
              {v.label}
              <span className={cx('rounded-full px-1.5 text-[10px]', view === v.key ? 'bg-white/25' : (v.key === 'overdue' || v.key === 'blocked') && counts[v.key] > 0 ? 'bg-status-redBg text-status-red' : 'bg-surface-muted')}>{counts[v.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or ID" className="pl-9" aria-label="Search tasks" />
        </div>
        <Select value={prio} onChange={(e) => setPrio(e.target.value as typeof prio)} className="w-auto" aria-label="Priority">
          <option value="ALL">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="w-auto" aria-label="Source module">
          <option value="ALL">All sources</option>
          {Object.entries(SOURCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </div>

      <Card>
        {list.length === 0 ? <EmptyState icon={EW.checklist} title="No tasks in this view" text="Try another saved view or clear the filters." /> : (
          <>
            <table className="hidden w-full text-left text-sm lg:table">
              <thead className="border-b border-line/70 bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Task</th><th className="px-2 py-2.5 font-bold">Status</th><th className="px-2 py-2.5 font-bold">Priority</th>
                  <th className="px-2 py-2.5 font-bold">Owner</th><th className="px-2 py-2.5 font-bold">Waiting for</th><th className="px-2 py-2.5 font-bold">Due</th><th className="px-4 py-2.5 font-bold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {list.map((t) => (
                  <tr key={t.id} className="cursor-pointer hover:bg-surface-subtle" onClick={() => { params.set('open', t.id); setParams(params); }}>
                    <td className="max-w-[340px] px-4 py-3">
                      <div className="truncate font-semibold text-ink">{t.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft"><span>{t.ref}</span><FleetTag fleet={t.fleet} />{t.base && <Tag>{t.base}</Tag>}<span className="truncate">{data.projects.find((p) => p.id === t.projectId)?.title}</span></div>
                    </td>
                    <td className="px-2 py-3"><StatusPill status={t.status} /></td>
                    <td className="px-2 py-3"><PriorityTag priority={t.priority} /></td>
                    <td className="px-2 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-ink-muted"><Avatar name={memberName(data.members, t.ownerId)} size={24} />{memberName(data.members, t.ownerId)}</span></td>
                    <td className="max-w-[180px] px-2 py-3 text-xs">
                      {t.dependencyType ? <><div className="truncate font-semibold text-ink">{data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson}</div>
                        <div className={cx(isFollowUpDue(t, T) ? 'font-bold text-status-amber' : 'text-ink-soft')}>follow-up {fmtShort(t.followUpDate)}</div></> : <span className="text-ink-soft">—</span>}
                    </td>
                    <td className={cx('px-2 py-3 text-xs font-semibold', isOverdue(t, T) ? 'text-status-red' : 'text-ink-muted')}>{fmtShort(t.dueDate)}<div className="font-normal">{t.status !== 'completed' && relDays(t.dueDate, T)}</div></td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{SOURCE_LABEL[t.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line/60 lg:hidden">
              {list.map((t) => (
                <li key={t.id}>
                  <button onClick={() => { params.set('open', t.id); setParams(params); }} className="block w-full px-4 py-3.5 text-left">
                    <div className="flex items-start gap-3">
                      <Avatar name={memberName(data.members, t.ownerId)} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">{t.title}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusPill status={t.status} /><PriorityTag priority={t.priority} /><FleetTag fleet={t.fleet} />
                          <span className={cx('text-xs font-semibold', isOverdue(t, T) ? 'text-status-red' : 'text-ink-soft')}>{fmtShort(t.dueDate)}{isOverdue(t, T) && ` · ${relDays(t.dueDate, T)}`}</span>
                        </div>
                        {t.dependencyType && <div className={cx('mt-1 text-xs', isFollowUpDue(t, T) ? 'font-bold text-status-amber' : 'text-ink-soft')}>Waiting for {data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson} · follow-up {fmtShort(t.followUpDate)}</div>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {openTask && <TaskDrawer task={openTask} onClose={() => { params.delete('open'); setParams(params); }} onEdit={() => setEditing(openTask)} />}
      {editing && <TaskForm task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function blankTask(ownerId?: string): Task {
  const now = new Date().toISOString();
  return {
    id: `t-${Math.random().toString(36).slice(2, 9)}`, ref: '', title: '', description: '', fleet: 'GEN', ownerId, contributorIds: [], status: 'open', priority: 'normal',
    createdAt: now, source: 'manual', timeline: [], archived: false, updatedAt: now,
  };
}

function TaskDrawer({ task: t, onClose, onEdit }: { task: Task; onClose: () => void; onEdit: () => void }) {
  const data = useStore((s) => s.data);
  const admin = useStore((s) => s.admin);
  const upsert = useStore((s) => s.upsert);
  const addEvent = useStore((s) => s.addTaskEvent);
  const setArchived = useStore((s) => s.setArchived);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.showToast);
  const [comment, setComment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const T = todayISO();
  const project = data.projects.find((p) => p.id === t.projectId);
  const ws = data.workstreams.find((w) => w.id === t.workstreamId);
  const org = data.organizations.find((o) => o.id === t.waitingForOrgId);
  const meeting = data.meetings.find((m) => m.id === t.sourceMeetingId);

  const setStatus = (status: TaskStatus) => {
    upsert('tasks', { ...t, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }, `${t.ref} ${t.title}`);
    addEvent(t.id, status === 'completed' ? 'completed' : 'status', `Status changed to ${status.replace('_', ' ')}`);
  };
  const depAction = (kind: 'requested' | 'followup' | 'received') => {
    if (kind === 'received') {
      upsert('tasks', { ...t, dependencyStatus: 'received', status: t.status === 'waiting' ? 'in_progress' : t.status });
      addEvent(t.id, 'received', `Awaited item received: ${t.awaitedItem ?? ''}`);
      toast('Dependency cleared');
    } else if (kind === 'requested') {
      upsert('tasks', { ...t, dependencyStatus: 'requested' });
      addEvent(t.id, 'requested', 'Request sent / noted');
    } else {
      addEvent(t.id, 'followup', 'Follow-up completed');
      toast('Follow-up logged – set the next follow-up date via Edit');
    }
  };

  return (
    <Drawer open onClose={onClose} wide
      title={<div><div className="flex items-center gap-2 text-xs font-bold text-ink-soft">{t.ref} <FleetTag fleet={t.fleet} /> {t.base && <Tag>{t.base}</Tag>}</div><h2 className="mt-1 text-lg font-extrabold leading-snug text-ink">{t.title}</h2></div>}
      footer={<div className="flex flex-wrap items-center gap-2">
        <Button onClick={onEdit}>Edit</Button>
        {t.status !== 'completed' && <Button variant="primary" onClick={() => setStatus('completed')}>Mark completed</Button>}
        <span className="flex-1" />
        <Button variant="ghost" onClick={() => { setArchived('tasks', t.id, true, `${t.ref} ${t.title}`); onClose(); }}><Archive size={15} /> Archive</Button>
        {admin && <Button variant="ghost" className="text-status-red" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</Button>}
      </div>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={t.status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="h-9 w-auto text-sm" aria-label="Status">
            {(['open', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled'] as TaskStatus[]).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
          <PriorityTag priority={t.priority} />
          {isOverdue(t, T) && <span className="rounded-full bg-status-redBg px-2 py-0.5 text-xs font-bold text-status-red">Overdue {relDays(t.dueDate, T)}</span>}
        </div>
        {t.description && <p className="text-sm text-ink-muted">{t.description}</p>}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Def label="Primary owner" value={<span className="flex items-center gap-1.5"><Avatar name={memberName(data.members, t.ownerId)} size={22} />{memberName(data.members, t.ownerId)}</span>} />
          <Def label="Contributors" value={t.contributorIds.length ? t.contributorIds.map((c) => memberName(data.members, c)).join(', ') : '—'} />
          <Def label="Due date" value={fmtDate(t.dueDate)} />
          <Def label="Project" value={project ? <Link className="text-brand hover:underline" to={`/projects/${project.id}`}>{project.title}</Link> : '—'} />
          <Def label="Workstream" value={ws?.name ?? '—'} />
          <Def label="Source" value={meeting ? <Link className="text-brand hover:underline" to={`/meetings/${meeting.id}`}>{SOURCE_LABEL[t.source]}: {meeting.title}</Link> : SOURCE_LABEL[t.source]} />
        </dl>

        {t.dependencyType && (
          <div className={cx('rounded-xl border p-4', isDependencyOverdue(t, T) ? 'border-status-red/40 bg-status-redBg/50' : 'border-status-amberDot/50 bg-status-amberBg/60')}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">{t.dependencyType === 'external' ? 'External' : 'Internal'} dependency</h3>
              <span className="text-xs font-bold text-ink">{DEP_LABEL[t.dependencyStatus ?? 'not_requested']}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Def label="Waiting for" value={org?.name ?? t.waitingForPerson ?? '—'} />
              <Def label="Awaited item" value={t.awaitedItem ?? '—'} />
              <Def label="Expected" value={<span className={isDependencyOverdue(t, T) ? 'font-bold text-status-red' : ''}>{fmtDate(t.expectedDate)}</span>} />
              <Def label="Next follow-up" value={<span className={isFollowUpDue(t, T) ? 'font-bold text-status-amber' : ''}>{fmtDate(t.followUpDate)}</span>} />
            </dl>
            <p className="mt-2 text-[11px] text-ink-muted">Accountable for chasing: <b>{memberName(data.members, t.ownerId)}</b>. No e-mails are sent automatically.</p>
            {t.dependencyStatus !== 'received' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => depAction('requested')}><Send size={14} /> Request sent</Button>
                <Button size="sm" onClick={() => depAction('followup')}><PhoneCall size={14} /> Follow-up done</Button>
                <Button size="sm" variant="primary" onClick={() => depAction('received')}><PackageCheck size={14} /> Received</Button>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Activity timeline</h3>
          <ol className="relative ml-2 border-l border-line pl-5">
            {[...t.timeline].reverse().map((e, i) => (
              <li key={i} className="mb-3">
                <span className={cx('absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full', e.kind === 'completed' || e.kind === 'received' ? 'bg-status-green' : e.kind === 'comment' ? 'bg-sky' : 'bg-brand')} />
                <p className="text-sm text-ink">{e.text}</p>
                <p className="text-[11px] text-ink-soft">{e.by} · {fmtDateTime(e.at)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" aria-label="Comment" />
            <Button disabled={!comment.trim()} onClick={() => { addEvent(t.id, 'comment', comment.trim()); setComment(''); }}><MessageSquarePlus size={16} /></Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">Attachments (e-mails, documents) are added in the production build with secure storage.</p>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete task permanently?"
        footer={<><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={() => { remove('tasks', t.id, `${t.ref} ${t.title}`); setConfirmDelete(false); onClose(); }}>Move to recycle bin</Button></>}>
        <p className="text-sm text-ink-muted">Impact: {t.timeline.length} timeline entries{meeting ? ', link to meeting action item' : ''}. The task moves to the recycle bin and can be restored by the Superadmin for {data.settings.recycleRetentionDays} days. Archive is preferred for completed work.</p>
      </Modal>
    </Drawer>
  );
}

function Def({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{label}</dt><dd className="mt-0.5 break-words text-sm text-ink">{value}</dd></div>;
}

export function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const toast = useStore((s) => s.showToast);
  const session = useStore((s) => s.session)!;
  const [t, setT] = useState<Task>(task);
  const isNew = !data.tasks.some((x) => x.id === task.id);
  const set = <K extends keyof Task>(k: K, v: Task[K]) => setT((p) => ({ ...p, [k]: v }));
  const ws = data.workstreams.filter((w) => w.projectId === t.projectId);

  const save = () => {
    if (!t.title.trim()) return;
    const ref = t.ref || `T-${String(data.tasks.length + 1).padStart(4, '0')}`;
    const timeline = isNew ? [{ at: new Date().toISOString(), by: session.displayName, kind: 'created' as const, text: 'Task created' }] : t.timeline;
    upsert('tasks', { ...t, ref, timeline }, `${ref} ${t.title}`);
    toast(isNew ? 'Task created' : 'Task saved');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={isNew ? 'New task' : `Edit ${t.ref}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={!t.title.trim()}>Save</Button></>}>
      <div className="space-y-3.5">
        <Field label="Title *"><Input value={t.title} onChange={(e) => set('title', e.target.value)} autoFocus /></Field>
        <Field label="Description"><Textarea value={t.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project"><Select value={t.projectId ?? ''} onChange={(e) => { set('projectId', e.target.value || undefined); set('workstreamId', undefined); }}><option value="">— none —</option>{data.projects.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
          <Field label="Workstream"><Select value={t.workstreamId ?? ''} onChange={(e) => set('workstreamId', e.target.value || undefined)} disabled={!ws.length}><option value="">— none —</option>{ws.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="Fleet"><Select value={t.fleet} onChange={(e) => set('fleet', e.target.value as Task['fleet'])}>{data.fleets.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}</Select></Field>
          <Field label="Base"><Select value={t.base ?? ''} onChange={(e) => set('base', e.target.value || undefined)}><option value="">— not base-specific —</option>{data.bases.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}</Select></Field>
          <Field label="Primary owner"><Select value={t.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value || undefined)}><option value="">Unassigned</option>{data.members.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Contributor"><Select value={t.contributorIds[0] ?? ''} onChange={(e) => set('contributorIds', e.target.value ? [e.target.value] : [])}><option value="">— none —</option>{data.members.filter((m) => m.active && m.id !== t.ownerId).map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Priority"><Select value={t.priority} onChange={(e) => set('priority', e.target.value as Priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></Select></Field>
          <Field label="Status"><Select value={t.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>{(['open', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled'] as TaskStatus[]).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</Select></Field>
          <Field label="Start date"><Input type="date" value={t.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} /></Field>
          <Field label="Due date"><Input type="date" value={t.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} /></Field>
        </div>
        <div className="rounded-xl border border-line/70 p-3">
          <Field label="Dependency">
            <Select value={t.dependencyType ?? ''} onChange={(e) => set('dependencyType', (e.target.value || undefined) as Task['dependencyType'])}>
              <option value="">No dependency</option><option value="external">External party</option><option value="internal">Internal party</option>
            </Select>
          </Field>
          {t.dependencyType && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Organisation"><Select value={t.waitingForOrgId ?? ''} onChange={(e) => set('waitingForOrgId', e.target.value || undefined)}><option value="">— other —</option>{data.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
              <Field label="Person / department"><Input value={t.waitingForPerson ?? ''} onChange={(e) => set('waitingForPerson', e.target.value || undefined)} /></Field>
              <Field label="Awaited item" className="col-span-2"><Input value={t.awaitedItem ?? ''} onChange={(e) => set('awaitedItem', e.target.value || undefined)} placeholder="Response, document, approval, decision…" /></Field>
              <Field label="Expected date"><Input type="date" value={t.expectedDate ?? ''} onChange={(e) => set('expectedDate', e.target.value || undefined)} /></Field>
              <Field label="Next follow-up"><Input type="date" value={t.followUpDate ?? ''} onChange={(e) => set('followUpDate', e.target.value || undefined)} /></Field>
              <Field label="Dependency status" className="col-span-2"><Select value={t.dependencyStatus ?? 'not_requested'} onChange={(e) => set('dependencyStatus', e.target.value as DependencyStatus)}>{Object.entries(DEP_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
