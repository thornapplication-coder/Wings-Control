import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutList, Columns3, Plus } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Avatar, Button, Card, EmptyState, Field, FleetTag, Input, Modal, RagBadge, RagDot, SectionTitle, Segmented, Select, Textarea, TrendBadge } from '../components/ui';
import { filterProjects, isActiveTask, isOverdue } from '../lib/metrics';
import { fmtShort, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { Project, Rag, Trend } from '../types';

export function ProjectsPage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const [mode, setMode] = useState<'list' | 'board'>('list');
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();
  const T = todayISO();

  useEffect(() => { if (params.get('new')) { setCreating(true); params.delete('new'); setParams(params, { replace: true }); } }, [params, setParams]);
  const list = useMemo(() => filterProjects(data.projects, filters), [data.projects, filters]);

  const card = (p: Project) => {
    const tasks = data.tasks.filter((t) => t.projectId === p.id && !t.archived);
    const next = data.milestones.filter((m) => m.projectId === p.id && !m.done).sort((a, b) => a.date.localeCompare(b.date))[0];
    return (
      <Link key={p.id} to={`/projects/${p.id}`} className="block rounded-xl border border-line/70 bg-white p-4 shadow-card transition hover:border-brand/40 hover:shadow-pop">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold leading-snug text-ink">{p.title}</h3>
          <FleetTag fleet={p.fleet} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{p.description}</p>
        <div className="mt-3 flex items-center gap-3"><RagBadge rag={p.rag} /><TrendBadge trend={p.trend} /></div>
        {p.progress !== undefined && (
          <div className="mt-3 flex items-center gap-2"><span className="h-1.5 flex-1 rounded-full bg-surface-muted"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${p.progress}%` }} /></span><span className="text-xs font-bold">{p.progress}%</span></div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Avatar name={memberName(data.members, p.ownerId)} size={22} />{memberName(data.members, p.ownerId)}</span>
          <span><b className="text-ink">{tasks.filter(isActiveTask).length}</b> open · <b className={tasks.some((t) => isOverdue(t, T)) ? 'text-status-red' : 'text-ink'}>{tasks.filter((t) => isOverdue(t, T)).length}</b> overdue</span>
        </div>
        <div className="mt-2 truncate text-[11px] text-ink-soft">{next ? `Next milestone: ${next.title} · ${fmtShort(next.date)}` : 'No open milestone'}</div>
      </Link>
    );
  };

  return (
    <div>
      <SectionTitle title="Projects"
        actions={<>
          <Segmented label="View" value={mode} onChange={setMode} options={[{ value: 'list', label: 'Cards' }, { value: 'board', label: 'Board' }]} />
          <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> New project</Button>
        </>} />
      <FilterBar showBase={false} resultCount={list.length} resultLabel="projects" />
      {list.length === 0 && <Card><EmptyState icon={EW.target} title="No projects match the filters" /></Card>}
      {mode === 'list' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map(card)}</div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[880px] grid-cols-4 gap-4">
            {(['red', 'amber', 'green', 'grey'] as Rag[]).map((r) => (
              <div key={r} className="rounded-xl bg-surface-muted/70 p-2.5">
                <div className="mb-2 flex items-center gap-2 px-1.5 text-xs font-bold text-ink-muted"><RagDot rag={r} />{{ red: 'Critical', amber: 'Attention', green: 'On Track', grey: 'Not set' }[r]} <span className="ml-auto">{list.filter((p) => p.rag === r).length}</span></div>
                <div className="space-y-2.5">{list.filter((p) => p.rag === r).map(card)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-soft"><LayoutList size={14} /> Timeline / Gantt per project is in the project workspace. <Columns3 size={14} /> Board groups by RAG status.</p>
      {creating && <ProjectForm onClose={(id) => { setCreating(false); if (id) nav(`/projects/${id}`); }} />}
    </div>
  );
}

export function ProjectForm({ project, onClose }: { project?: Project; onClose: (id?: string) => void }) {
  const data = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const session = useStore((s) => s.session)!;
  const [useTemplate, setUseTemplate] = useState<'none' | 'eis' | 'report'>('none');
  const [p, setP] = useState<Project>(project ?? {
    id: `p-${Math.random().toString(36).slice(2, 8)}`, title: '', description: '', fleet: 'GEN', ownerId: session.memberId, contributorIds: [],
    status: 'planned', priority: 'normal', rag: 'grey', trend: 'unchanged', startDate: todayISO(), targetDate: todayISO(), archived: false, updatedAt: new Date().toISOString(),
  });
  const set = <K extends keyof Project>(k: K, v: Project[K]) => setP((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!p.title.trim()) return;
    upsert('projects', p, p.title);
    if (!project && useTemplate !== 'none') {
      const names = useTemplate === 'eis' ? data.workstreamTemplate : data.reportWorkstreamTemplate;
      names.forEach((name, i) => upsert('workstreams', { id: `ws-${p.id}-${i + 1}`, projectId: p.id, name, order: i + 1, rag: 'grey', trend: 'unchanged', keyFacts: '' }));
    }
    onClose(p.id);
  };
  return (
    <Modal open onClose={() => onClose()} title={project ? 'Edit project' : 'New project'}
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button variant="primary" disabled={!p.title.trim()} onClick={save}>Save</Button></>}>
      <div className="space-y-3.5">
        <Field label="Title *"><Input value={p.title} onChange={(e) => set('title', e.target.value)} autoFocus /></Field>
        <Field label="Description & objectives"><Textarea value={p.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fleet"><Select value={p.fleet} onChange={(e) => set('fleet', e.target.value as Project['fleet'])}>{data.fleets.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}</Select></Field>
          <Field label="Owner"><Select value={p.ownerId} onChange={(e) => set('ownerId', e.target.value)}>{data.members.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Status (RAG)"><Select value={p.rag} onChange={(e) => set('rag', e.target.value as Rag)}><option value="grey">Not set</option><option value="green">Green – On Track</option><option value="amber">Amber – Attention</option><option value="red">Red – Critical</option></Select></Field>
          <Field label="Trend"><Select value={p.trend} onChange={(e) => set('trend', e.target.value as Trend)}><option value="improved">Improved</option><option value="unchanged">Unchanged</option><option value="worse">Worse</option></Select></Field>
          <Field label="Start"><Input type="date" value={p.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field label="Target completion"><Input type="date" value={p.targetDate} onChange={(e) => set('targetDate', e.target.value)} /></Field>
          <Field label="Lifecycle"><Select value={p.status} onChange={(e) => set('status', e.target.value as Project['status'])}><option value="planned">Planned</option><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option></Select></Field>
          <Field label="Priority"><Select value={p.priority} onChange={(e) => set('priority', e.target.value as Project['priority'])}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></Select></Field>
        </div>
        {!project && (
          <Field label="Workstream template" hint="Templates are editable planning categories, not a statement that a workstream is required or approved.">
            <Select value={useTemplate} onChange={(e) => setUseTemplate(e.target.value as typeof useTemplate)}>
              <option value="none">Blank – no workstreams</option>
              <option value="eis">B737 MAX Introduction (12 workstreams)</option>
              <option value="report">Executive report categories (8 workstreams)</option>
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
