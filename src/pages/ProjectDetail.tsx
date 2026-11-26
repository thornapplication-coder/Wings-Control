import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileBarChart, Pencil, Plus, Archive, ArrowUp, ArrowDown, CheckCircle2, Circle } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { Avatar, Button, Card, CardHeader, EmptyState, Field, FleetTag, Input, Modal, PriorityTag, RagBadge, RagDot, Select, StatusPill, Textarea, TrendBadge, cx } from '../components/ui';
import { isActiveTask, isOverdue, riskLevel, riskScore } from '../lib/metrics';
import { daysBetween, fmtDate, fmtShort, parseISO, todayISO } from '../lib/dates';
import { ProjectForm } from './Projects';
import { TaskForm, blankTask } from './Tasks';
import { EW } from '../assets/icons';
import type { Milestone, Rag, Trend, Workstream } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams();
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session)!;
  const upsert = useStore((s) => s.upsert);
  const setArchived = useStore((s) => s.setArchived);
  const nav = useNavigate();
  const [tab, setTab] = useState<'overview' | 'tasks' | 'timeline' | 'risks'>('overview');
  const [editP, setEditP] = useState(false);
  const [editWs, setEditWs] = useState<Workstream | null>(null);
  const [newTask, setNewTask] = useState(false);
  const [newMs, setNewMs] = useState(false);
  const T = todayISO();
  const p = data.projects.find((x) => x.id === id);

  const ws = useMemo(() => data.workstreams.filter((w) => w.projectId === id).sort((a, b) => a.order - b.order), [data.workstreams, id]);
  const tasks = useMemo(() => data.tasks.filter((t) => t.projectId === id && !t.archived), [data.tasks, id]);
  const ms = useMemo(() => data.milestones.filter((m) => m.projectId === id).sort((a, b) => a.date.localeCompare(b.date)), [data.milestones, id]);
  const risks = data.risks.filter((r) => r.projectId === id && !r.archived);

  if (!p) return <Card><EmptyState title="Project not found" action={<Button onClick={() => nav('/projects')}>Back to projects</Button>} /></Card>;

  const move = (w: Workstream, dir: -1 | 1) => {
    const idx = ws.findIndex((x) => x.id === w.id);
    const other = ws[idx + dir];
    if (!other) return;
    upsert('workstreams', { ...w, order: other.order });
    upsert('workstreams', { ...other, order: w.order });
  };

  return (
    <div>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Projects</Link>
      <Card className="mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><FleetTag fleet={p.fleet} /><PriorityTag priority={p.priority} /><span className="text-xs text-ink-soft">{p.status}</span></div>
            <h1 className="mt-1.5 text-xl font-extrabold text-ink sm:text-2xl">{p.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">{p.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => nav(`/reports/weekly/${p.id}`)}><FileBarChart size={16} /> Weekly report</Button>
            <Button onClick={() => setEditP(true)}><Pencil size={15} /> Edit</Button>
            <Button variant="ghost" onClick={() => { setArchived('projects', p.id, true, p.title); nav('/projects'); }}><Archive size={15} /></Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line/60 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Status"><RagBadge rag={p.rag} /></Stat>
          <Stat label="Trend"><TrendBadge trend={p.trend} /></Stat>
          <Stat label="Owner"><span className="flex items-center gap-1.5 text-sm font-semibold"><Avatar name={memberName(data.members, p.ownerId)} size={22} />{memberName(data.members, p.ownerId)}</span></Stat>
          <Stat label="Timeline"><span className="text-sm font-semibold">{fmtShort(p.startDate)} → {fmtDate(p.targetDate)}</span></Stat>
          <Stat label="Progress">{p.progress !== undefined ? <span className="text-sm font-bold" title={p.progressMethod}>{p.progress}% <span className="font-normal text-ink-soft">({p.progressMethod?.split('/')[0].trim()})</span></span> : <span className="text-xs text-ink-soft">No method defined</span>}</Stat>
          <Stat label="Tasks"><span className="text-sm font-semibold">{tasks.filter(isActiveTask).length} open · <span className="text-status-red">{tasks.filter((t) => isOverdue(t, T)).length} overdue</span></span></Stat>
        </div>
      </Card>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line scrollbar-none" role="tablist">
        {([['overview', 'Workstreams'], ['tasks', `Tasks (${tasks.length})`], ['timeline', 'Timeline & Milestones'], ['risks', `Risks (${risks.length})`]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx('-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-sm font-bold', tab === k ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink')}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader title="Workstreams" subtitle="Status and trend per workstream feed the executive weekly report"
            action={<Button size="sm" onClick={() => setEditWs({ id: `ws-${Math.random().toString(36).slice(2, 8)}`, projectId: p.id, name: '', order: (ws.at(-1)?.order ?? 0) + 1, rag: 'grey', trend: 'unchanged', keyFacts: '' })}><Plus size={14} /> Add</Button>} />
          {ws.length === 0 && <EmptyState icon={EW.org} title="No workstreams yet" />}
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {ws.map((w, i) => {
              const wt = tasks.filter((t) => t.workstreamId === w.id);
              return (
                <li key={w.id} className="grid grid-cols-1 gap-2 px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(0,220px)_140px_minmax(0,1fr)_auto] md:items-center md:gap-4">
                  <div className="flex items-center gap-2"><RagDot rag={w.rag} /><span className="font-bold text-ink">{w.name}</span></div>
                  <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1"><RagBadge rag={w.rag} /><TrendBadge trend={w.trend} /></div>
                  <div className="min-w-0 text-sm text-ink-muted">
                    {w.keyFacts || <span className="italic text-ink-soft">No key facts recorded</span>}
                    <div className="mt-1 text-xs text-ink-soft">{memberName(data.members, w.ownerId)} · {wt.filter(isActiveTask).length} open tasks{w.nextMilestone && ` · Next: ${w.nextMilestone} (${fmtShort(w.nextMilestoneDate)})`}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(w, -1)}><ArrowUp size={14} /></Button>
                    <Button size="sm" variant="ghost" aria-label="Move down" disabled={i === ws.length - 1} onClick={() => move(w, 1)}><ArrowDown size={14} /></Button>
                    <Button size="sm" onClick={() => setEditWs(w)}>Edit</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === 'tasks' && (
        <Card>
          <CardHeader title="Project tasks" action={<Button size="sm" variant="primary" onClick={() => setNewTask(true)}><Plus size={14} /> Task</Button>} />
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {tasks.sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9')).map((t) => (
              <li key={t.id}>
                <Link to={`/tasks?open=${t.id}&view=all`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-subtle sm:px-5">
                  <span className="min-w-0 flex-1 basis-60"><span className="block truncate text-sm font-semibold text-ink">{t.title}</span><span className="text-xs text-ink-soft">{t.ref} · {ws.find((w) => w.id === t.workstreamId)?.name ?? 'No workstream'} · {memberName(data.members, t.ownerId)}</span></span>
                  <StatusPill status={t.status} /><PriorityTag priority={t.priority} />
                  <span className={cx('w-16 text-right text-xs font-semibold', isOverdue(t, T) ? 'text-status-red' : 'text-ink-muted')}>{fmtShort(t.dueDate)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {tasks.length === 0 && <EmptyState icon={EW.checklist} title="No tasks yet" />}
        </Card>
      )}

      {tab === 'timeline' && (
        <Card>
          <CardHeader title="Timeline" subtitle={`${fmtDate(p.startDate)} – ${fmtDate(p.targetDate)}`} action={<Button size="sm" onClick={() => setNewMs(true)}><Plus size={14} /> Milestone</Button>} />
          <div className="border-t border-line/60 px-4 py-5 sm:px-5">
            <Gantt start={p.startDate} end={p.targetDate} ms={ms} today={T} />
          </div>
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {ms.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <button aria-label={m.done ? 'Mark open' : 'Mark done'} onClick={() => upsert('milestones', { ...m, done: !m.done }, m.title)}>
                  {m.done ? <CheckCircle2 size={20} className="text-status-green" /> : <Circle size={20} className="text-ink-soft" />}
                </button>
                <span className={cx('flex-1 text-sm font-semibold', m.done ? 'text-ink-soft line-through' : 'text-ink')}>{m.title}</span>
                <span className={cx('text-xs font-semibold', !m.done && m.date < T ? 'text-status-red' : 'text-ink-muted')}>{fmtDate(m.date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'risks' && (
        <Card>
          <CardHeader title="Risks & issues" action={<Link to="/risks" className="text-xs font-bold text-brand">Open register</Link>} />
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {risks.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className={cx('w-10 shrink-0 rounded-md py-1 text-center text-xs font-black', riskLevel(riskScore(r)) === 'critical' ? 'bg-status-red text-white' : riskLevel(riskScore(r)) === 'high' ? 'bg-status-amberBg text-status-amber' : 'bg-surface-muted text-ink-muted')}>{riskScore(r)}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-ink">{r.ref} {r.title}</span><span className="block text-xs text-ink-soft">{r.kind} · {r.status} · {r.mitigation}</span></span>
              </li>
            ))}
          </ul>
          {risks.length === 0 && <EmptyState icon={EW.warning} title="No risks recorded" />}
        </Card>
      )}

      {editP && <ProjectForm project={p} onClose={() => setEditP(false)} />}
      {editWs && <WorkstreamForm ws={editWs} onClose={() => setEditWs(null)} />}
      {newTask && <TaskForm task={{ ...blankTask(session.memberId), projectId: p.id, fleet: p.fleet, source: 'project' }} onClose={() => setNewTask(false)} />}
      {newMs && <MilestoneForm projectId={p.id} onClose={() => setNewMs(false)} />}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">{label}</div>{children}</div>;
}

function Gantt({ start, end, ms, today }: { start: string; end: string; ms: Milestone[]; today: string }) {
  const total = Math.max(1, daysBetween(start, end));
  const pos = (d: string) => Math.min(100, Math.max(0, (daysBetween(start, d) / total) * 100));
  const months: { label: string; left: number }[] = [];
  const d = parseISO(start); d.setDate(1); d.setMonth(d.getMonth() + 1);
  while (d <= parseISO(end)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    months.push({ label: d.toLocaleString('en', { month: 'short' }), left: pos(iso) });
    d.setMonth(d.getMonth() + 1);
  }
  return (
    <div className="relative h-24" role="img" aria-label="Project timeline with milestones">
      <div className="absolute inset-x-0 top-10 h-3 rounded-full bg-brand-tint" />
      <div className="absolute top-10 h-3 rounded-l-full bg-brand/70" style={{ width: `${pos(today)}%` }} />
      {months.map((m) => <span key={m.label + m.left} className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold text-ink-soft" style={{ left: `${m.left}%` }}>{m.label}</span>)}
      <span className="absolute top-6 h-10 w-0.5 bg-ink" style={{ left: `${pos(today)}%` }} title="Today" />
      {ms.map((m) => (
        <span key={m.id} className="group absolute top-[34px] -translate-x-1/2" style={{ left: `${pos(m.date)}%` }}>
          <span className={cx('block h-4 w-4 rotate-45 border-2 border-white shadow', m.done ? 'bg-status-green' : m.date < today ? 'bg-status-red' : 'bg-sky')} />
          <span className="pointer-events-none absolute left-1/2 top-6 hidden w-40 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-center text-[11px] text-white group-hover:block">{m.title}<br />{fmtShort(m.date)}</span>
        </span>
      ))}
    </div>
  );
}

function WorkstreamForm({ ws, onClose }: { ws: Workstream; onClose: () => void }) {
  const members = useStore((s) => s.data.members);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const admin = useStore((s) => s.admin);
  const [w, setW] = useState(ws);
  const set = <K extends keyof Workstream>(k: K, v: Workstream[K]) => setW((x) => ({ ...x, [k]: v }));
  return (
    <Modal open onClose={onClose} title={ws.name ? `Workstream: ${ws.name}` : 'New workstream'}
      footer={<>
        {admin && ws.name && <Button variant="ghost" className="mr-auto text-status-red" onClick={() => { remove('workstreams', w.id, w.name); onClose(); }}>Remove</Button>}
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!w.name.trim()} onClick={() => { upsert('workstreams', w, `Workstream ${w.name}`); onClose(); }}>Save</Button>
      </>}>
      <div className="space-y-3.5">
        <Field label="Name *"><Input value={w.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status"><Select value={w.rag} onChange={(e) => set('rag', e.target.value as Rag)}><option value="grey">Not set</option><option value="green">Green</option><option value="amber">Amber</option><option value="red">Red</option></Select></Field>
          <Field label="Trend vs previous period"><Select value={w.trend} onChange={(e) => set('trend', e.target.value as Trend)}><option value="improved">Improved</option><option value="unchanged">Unchanged</option><option value="worse">Worse</option></Select></Field>
          <Field label="Owner"><Select value={w.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value || undefined)}><option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Next milestone date"><Input type="date" value={w.nextMilestoneDate ?? ''} onChange={(e) => set('nextMilestoneDate', e.target.value || undefined)} /></Field>
        </div>
        <Field label="Next milestone"><Input value={w.nextMilestone ?? ''} onChange={(e) => set('nextMilestone', e.target.value || undefined)} /></Field>
        <Field label="Key facts / progress commentary"><Textarea value={w.keyFacts} onChange={(e) => set('keyFacts', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function MilestoneForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const upsert = useStore((s) => s.upsert);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  return (
    <Modal open onClose={onClose} title="New milestone"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!title.trim()} onClick={() => { upsert('milestones', { id: `ms-${Math.random().toString(36).slice(2, 8)}`, projectId, title, date, done: false }, title); onClose(); }}>Save</Button></>}>
      <div className="space-y-3.5">
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
