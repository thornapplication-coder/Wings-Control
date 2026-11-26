import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Plus, ListPlus, Lock, Upload, FileDown, Link2 } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { Button, Card, CardHeader, EmptyState, Field, FleetTag, Input, Modal, PriorityTag, SectionTitle, Select, Tag, Textarea, cx } from '../components/ui';
import { fmtDate, fmtDateTime, todayISO } from '../lib/dates';
import { downloadCsv } from '../lib/export';
import { EW } from '../assets/icons';
import type { Meeting, MinutesStatus, Priority } from '../types';

const MIN_STATUS: Record<MinutesStatus, string> = { draft: 'Draft', in_review: 'In Review', final: 'Final', superseded: 'Superseded', archived: 'Archived' };
const TEMPLATES = ['Standard Management Meeting', 'Project Status Meeting', 'B737 MAX Introduction Meeting', 'Instructor / Training Meeting', 'Partner Coordination Meeting', 'Regulatory / Compliance Meeting'];

export function MeetingsPage() {
  const data = useStore((s) => s.data);
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => { if (params.get('new')) { setCreating(true); params.delete('new'); setParams(params, { replace: true }); } }, [params, setParams]);
  const list = useMemo(() => data.meetings.filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()) || (m.minutes?.notes ?? '').toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [data.meetings, q]);
  return (
    <div>
      <SectionTitle title="Meetings & Minutes" subtitle="Meetings, minutes, decisions and action items"
        actions={<><Button onClick={() => useStore.getState().showToast('Upload of DOCX/PDF minutes follows with secure storage')}><Upload size={16} /> <span className="hidden sm:inline">Upload minutes</span></Button><Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> New meeting</Button></>} />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or minutes text…" className="mb-4 max-w-md" aria-label="Search meetings" />
      <Card>
        {list.length === 0 && <EmptyState icon={EW.meeting} title="No meetings" />}
        <ul className="divide-y divide-line/60">
          {list.map((m) => (
            <li key={m.id}>
              <Link to={`/meetings/${m.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-surface-subtle sm:px-5">
                <span className="w-24 shrink-0"><span className="block text-sm font-bold text-ink">{fmtDate(m.date)}</span><span className="text-[11px] text-ink-soft">{m.start}–{m.end}</span></span>
                <span className="min-w-0 flex-1 basis-56"><span className="block font-semibold text-ink">{m.title}</span><span className="text-xs text-ink-soft">{m.category} · {m.location}</span></span>
                <FleetTag fleet={m.fleet} />
                <Tag className={m.status === 'planned' ? 'bg-sky-lighter text-[#00708C]' : ''}>{m.status}</Tag>
                <span className={cx('w-28 text-right text-xs font-semibold', m.minutes?.status === 'final' ? 'text-status-green' : m.minutes ? 'text-status-amber' : 'text-ink-soft')}>
                  {m.minutes ? `Minutes: ${MIN_STATUS[m.minutes.status]} v${m.minutes.version}` : 'No minutes'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      {creating && <MeetingForm onClose={() => setCreating(false)} />}
    </div>
  );
}

function MeetingForm({ onClose }: { onClose: () => void }) {
  const data = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const session = useStore((s) => s.session)!;
  const nav = useNavigate();
  const [m, setM] = useState<Meeting>({
    id: `mt-${Math.random().toString(36).slice(2, 8)}`, title: '', category: TEMPLATES[0], date: todayISO(), start: '09:00', end: '10:00', organizerId: session.memberId,
    participantIds: [session.memberId], externalParticipants: [], fleet: 'GEN', status: 'planned', agenda: [],
  });
  const set = <K extends keyof Meeting>(k: K, v: Meeting[K]) => setM((x) => ({ ...x, [k]: v }));
  return (
    <Modal open onClose={onClose} title="New meeting"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!m.title.trim()} onClick={() => { upsert('meetings', m, m.title); onClose(); nav(`/meetings/${m.id}`); }}>Create</Button></>}>
      <div className="space-y-3.5">
        <Field label="Title *"><Input value={m.title} onChange={(e) => set('title', e.target.value)} autoFocus /></Field>
        <Field label="Template / category"><Select value={m.category} onChange={(e) => set('category', e.target.value)}>{TEMPLATES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date"><Input type="date" value={m.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Start"><Input type="time" value={m.start} onChange={(e) => set('start', e.target.value)} /></Field>
          <Field label="End"><Input type="time" value={m.end} onChange={(e) => set('end', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project"><Select value={m.projectId ?? ''} onChange={(e) => set('projectId', e.target.value || undefined)}><option value="">—</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
          <Field label="Fleet"><Select value={m.fleet} onChange={(e) => set('fleet', e.target.value as Meeting['fleet'])}>{data.fleets.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}</Select></Field>
        </div>
        <Field label="Location / link"><Input value={m.location ?? ''} onChange={(e) => set('location', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

type SaveState = 'saved' | 'saving' | 'unsaved';

export function MeetingDetailPage() {
  const { id } = useParams();
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session)!;
  const upsert = useStore((s) => s.upsert);
  const convert = useStore((s) => s.createTaskFromActionItem);
  const toast = useStore((s) => s.showToast);
  const nav = useNavigate();
  const m = data.meetings.find((x) => x.id === id);
  const [notes, setNotes] = useState(m?.minutes?.notes ?? '');
  const [save, setSave] = useState<SaveState>('saved');
  const [newAi, setNewAi] = useState(false);
  const timer = useRef<number>();

  // Autosave after 1.2 s inactivity (prototype: local; production: version-checked server write)
  useEffect(() => {
    if (!m || notes === (m.minutes?.notes ?? '')) return;
    setSave('unsaved');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSave('saving');
      const base = m.minutes ?? { status: 'draft' as MinutesStatus, version: 1, notes: '', decisionIds: [], actionItems: [], lastEditedBy: '', lastEditedAt: '' };
      upsert('meetings', { ...m, minutes: { ...base, notes, lastEditedBy: session.displayName, lastEditedAt: new Date().toISOString() } });
      setTimeout(() => setSave('saved'), 350);
    }, 1200);
    return () => window.clearTimeout(timer.current);
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (save !== 'saved') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [save]);

  if (!m) return <Card><EmptyState title="Meeting not found" /></Card>;
  const final = m.minutes?.status === 'final';
  const decisions = data.decisions.filter((d) => m.minutes?.decisionIds.includes(d.id));

  const setStatus = (status: MinutesStatus) => {
    if (!m.minutes) return;
    upsert('meetings', { ...m, minutes: { ...m.minutes, status } }, `Minutes ${m.title} → ${MIN_STATUS[status]}`);
  };
  const newRevision = () => {
    if (!m.minutes) return;
    upsert('meetings', { ...m, minutes: { ...m.minutes, status: 'draft', version: m.minutes.version + 1 } }, `Minutes ${m.title} – revision v${m.minutes.version + 1} opened`);
    toast(`Revision v${m.minutes.version + 1} opened – v${m.minutes.version} preserved`);
  };
  const exportActions = () => downloadCsv(`action-items-${m.date}.csv`, (m.minutes?.actionItems ?? []).map((a) => ({
    Meeting: m.title, Date: m.date, Action: a.text, Owner: memberName(data.members, a.ownerId), Due: a.dueDate ?? '', Priority: a.priority,
    'Linked task': data.tasks.find((t) => t.id === a.linkedTaskId)?.ref ?? '', 'Task status': data.tasks.find((t) => t.id === a.linkedTaskId)?.status ?? '',
  })), { meeting: m.title, version: String(m.minutes?.version ?? '') });

  return (
    <div>
      <Link to="/meetings" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Meetings</Link>
      <SectionTitle title={m.title} subtitle={`${fmtDate(m.date)} · ${m.start}–${m.end} · ${m.location ?? ''} · ${m.category}`}
        actions={<><Button onClick={exportActions}><FileDown size={16} /> Action items CSV</Button><Button onClick={() => window.print()}>Print / PDF</Button></>} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-ink">Minutes</h2>
                {m.minutes && <Tag className={final ? 'bg-status-greenBg text-status-green' : 'bg-status-amberBg text-status-amber'}>{MIN_STATUS[m.minutes.status]} · v{m.minutes.version}</Tag>}
              </div>
              <span className={cx('text-xs font-semibold', save === 'saved' ? 'text-status-green' : save === 'saving' ? 'text-sky' : 'text-status-amber')} role="status">
                {save === 'saved' ? `Saved${m.minutes?.lastEditedAt ? ` · ${fmtDateTime(m.minutes.lastEditedAt)}` : ''}` : save === 'saving' ? 'Saving…' : 'Unsaved changes'}
              </span>
            </div>
            <div className="px-4 py-4 sm:px-5">
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Agenda</h3>
              <ol className="mb-4 list-decimal space-y-0.5 pl-5 text-sm text-ink">{m.agenda.map((a) => <li key={a}>{a}</li>)}{m.agenda.length === 0 && <li className="list-none italic text-ink-soft">No agenda</li>}</ol>
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Discussion & key points</h3>
              {final ? (
                <div className="rounded-lg bg-surface-subtle p-3 text-sm text-ink">
                  <p className="whitespace-pre-wrap">{m.minutes?.notes}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft"><Lock size={13} /> Final minutes cannot be overwritten. Open a revision to edit – the previous version is preserved.</p>
                </div>
              ) : (
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[200px]" placeholder="Record discussion, key points and outcomes… (autosaves)" aria-label="Minutes notes" />
              )}
              <p className="mt-2 text-[11px] text-ink-soft">Prototype editor is plain text. Production: rich text (headings, lists, tables, checklists), version check against concurrent edits.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!final && m.minutes?.status === 'draft' && <Button onClick={() => setStatus('in_review')}>Send to review</Button>}
                {!final && m.minutes && <Button variant="primary" onClick={() => setStatus('final')}><CheckCircle2 size={16} /> Mark as Final</Button>}
                {final && <Button onClick={newRevision}>Open revision v{(m.minutes?.version ?? 1) + 1}</Button>}
              </div>
              {m.minutes && <p className="mt-2 text-[11px] text-ink-soft">Last edited by {m.minutes.lastEditedBy} (self-declared display name) · {fmtDateTime(m.minutes.lastEditedAt)}</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Action items" subtitle="Convert to a task with one click – the task keeps the meeting reference; duplicates are prevented"
              action={!final && <Button size="sm" onClick={() => setNewAi(true)}><Plus size={14} /> Add</Button>} />
            <ul className="divide-y divide-line/60 border-t border-line/60">
              {(m.minutes?.actionItems ?? []).map((a) => {
                const task = data.tasks.find((t) => t.id === a.linkedTaskId);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                    <span className="min-w-0 flex-1 basis-60"><span className="block text-sm font-semibold text-ink">{a.text}</span><span className="text-xs text-ink-soft">{memberName(data.members, a.ownerId)} · due {fmtDate(a.dueDate)}</span></span>
                    <PriorityTag priority={a.priority} />
                    {task ? (
                      <Link to={`/tasks?open=${task.id}&view=all`} className="inline-flex items-center gap-1 rounded-full bg-sky-lighter px-2.5 py-1 text-xs font-bold text-[#00708C]"><Link2 size={13} /> {task.ref} · {task.status.replace('_', ' ')}</Link>
                    ) : (
                      <Button size="sm" variant="primary" onClick={() => { const tid = convert(m.id, a.id); if (tid) toast('Task created from action item'); }}><ListPlus size={14} /> Create task</Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {!(m.minutes?.actionItems.length) && <EmptyState icon={EW.checklist} title="No action items" />}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Decisions" subtitle="Linked to the central Decision Log – no duplicate records" />
            <ul className="divide-y divide-line/60 border-t border-line/60">
              {decisions.map((d) => <li key={d.id} className="px-4 py-3 sm:px-5"><span className="block text-sm font-semibold text-ink">{d.ref} {d.title}</span><span className="text-xs text-ink-soft">{d.status} · {d.authority}</span></li>)}
            </ul>
            {decisions.length === 0 && <p className="px-5 pb-4 text-xs text-ink-soft">No decisions recorded.</p>}
            <div className="px-4 pb-4 sm:px-5"><Button size="sm" onClick={() => nav('/risks?tab=decisions&new=decision')}>Add decision</Button></div>
          </Card>
          <Card>
            <CardHeader title="Participants" />
            <ul className="space-y-1 border-t border-line/60 px-5 py-3 text-sm">
              {m.participantIds.map((p) => <li key={p} className="text-ink">{memberName(data.members, p)}</li>)}
              {m.externalParticipants.map((p) => <li key={p} className="text-ink-muted">{p} <span className="text-[10px] uppercase text-ink-soft">external</span></li>)}
            </ul>
          </Card>
          {!m.minutes && <Card className="p-5"><p className="mb-3 text-sm text-ink-muted">No minutes yet.</p><Button variant="primary" onClick={() => upsert('meetings', { ...m, minutes: { status: 'draft', version: 1, notes: '', decisionIds: [], actionItems: [], lastEditedBy: session.displayName, lastEditedAt: new Date().toISOString() } }, `Minutes started: ${m.title}`)}>Start minutes from template</Button></Card>}
        </div>
      </div>
      {newAi && <ActionItemForm meeting={m} onClose={() => setNewAi(false)} />}
    </div>
  );
}

function ActionItemForm({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const members = useStore((s) => s.data.members);
  const upsert = useStore((s) => s.upsert);
  const [text, setText] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [prio, setPrio] = useState<Priority>('normal');
  const save = () => {
    const base = meeting.minutes ?? { status: 'draft' as MinutesStatus, version: 1, notes: '', decisionIds: [], actionItems: [], lastEditedBy: '', lastEditedAt: new Date().toISOString() };
    upsert('meetings', { ...meeting, minutes: { ...base, actionItems: [...base.actionItems, { id: `ai-${Math.random().toString(36).slice(2, 8)}`, text, ownerId: owner || undefined, dueDate: due || undefined, priority: prio }] } }, `Action item added: ${text}`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="New action item" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!text.trim()} onClick={save}>Add</Button></>}>
      <div className="space-y-3.5">
        <Field label="Action *"><Input value={text} onChange={(e) => setText(e.target.value)} autoFocus /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Owner"><Select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Due"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Priority"><Select value={prio} onChange={(e) => setPrio(e.target.value as Priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></Select></Field>
        </div>
      </div>
    </Modal>
  );
}
