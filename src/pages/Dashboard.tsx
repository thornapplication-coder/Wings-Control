import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, AlertTriangle, ChevronDown, ChevronRight, Gavel, PhoneCall, ShieldCheck } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Avatar, Card, EmptyState, RagDot, TrendBadge, cx } from '../components/ui';
import {
  applyTaskView, attentionSort, baseMatch, filterDecisions, filterProjects, filterRisks, filterTasks, fleetMatch, isActiveTask,
  isDependencyOverdue, isFollowUpDue, isOverdue, isPendingDecision, isWaiting, missingFields, riskLevel, riskScore,
} from '../lib/metrics';
import { daysBetween, fmtDate, fmtShort, isoWeek, relDays, timeAgo, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { Task } from '../types';

const AGENDA_DAYS = 14;

function readMoreOpen(): boolean {
  try { return localStorage.getItem('wc-dash-more') === '1'; } catch { return false; }
}

export function DashboardPage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const session = useStore((s) => s.session)!;
  const T = todayISO();
  const [tab, setTab] = useState<'my' | 'team'>('my');
  const [moreOpen, setMoreOpen] = useState(readMoreOpen);

  const m = useMemo(() => {
    const tasks = filterTasks(data.tasks, filters);
    const projects = filterProjects(data.projects, filters).filter((p) => p.status !== 'completed');
    const risks = filterRisks(data.risks, filters).filter((r) => r.status !== 'closed');
    const decisions = filterDecisions(data.decisions, filters).filter(isPendingDecision);
    const projIds = new Set(projects.map((p) => p.id));
    const inWindow = (d: string) => d >= T && daysBetween(T, d) <= AGENDA_DAYS;
    const agenda = [
      ...data.milestones.filter((x) => projIds.has(x.projectId) && !x.done && inWindow(x.date))
        .map((x) => ({ id: x.id, date: x.date, title: x.title, kind: 'Milestone', link: `/projects/${x.projectId}` })),
      ...data.meetings.filter((x) => x.status === 'planned' && inWindow(x.date) && fleetMatch(x.fleet, filters.fleet))
        .map((x) => ({ id: x.id, date: x.date, title: x.title, kind: `Meeting ${x.start}`, link: `/meetings/${x.id}` })),
      ...data.trainingEvents.filter((e) => e.status !== 'cancelled' && inWindow(e.startDate) && fleetMatch(e.fleet, filters.fleet) && baseMatch(e.base, filters.base))
        .map((e) => ({ id: e.id, date: e.startDate, title: e.title, kind: `Training${e.base ? ` · ${e.base}` : ''}`, link: '/training' })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    return {
      tasks, projects, risks, decisions, agenda,
      overdue: tasks.filter((t) => isOverdue(t, T)),
      followUps: tasks.filter((t) => isFollowUpDue(t, T)),
      waiting: tasks.filter(isWaiting).sort((a, b) => (a.followUpDate ?? '9').localeCompare(b.followUpDate ?? '9')),
      criticalRisks: risks.filter((r) => ['critical', 'high'].includes(riskLevel(riskScore(r)))).sort((a, b) => riskScore(b) - riskScore(a)),
    };
  }, [data, filters, T]);

  const attention = useMemo(() => {
    const base = applyTaskView(m.tasks, tab === 'my' ? 'my' : 'team', session.memberId, T);
    return base.filter((t) => isOverdue(t, T) || t.status === 'blocked' || t.priority === 'critical' || isFollowUpDue(t, T) || (t.dueDate && daysBetween(T, t.dueDate) <= 7))
      .sort((a, b) => attentionSort(a, b, T));
  }, [m.tasks, tab, session.memberId, T]);
  const unassigned = applyTaskView(m.tasks, 'unassigned').length;

  const toggleMore = () => {
    setMoreOpen((o) => { try { localStorage.setItem('wc-dash-more', o ? '0' : '1'); } catch { /* ignore */ } return !o; });
  };

  const kpis = [
    { label: 'Overdue tasks', value: m.overdue.length, icon: AlarmClock, link: '/tasks?view=overdue', alert: m.overdue.length > 0 },
    { label: 'Follow-ups due', value: m.followUps.length, icon: PhoneCall, link: '/tasks?view=followup', alert: m.followUps.length > 0 },
    { label: 'Critical risks', value: m.criticalRisks.length, icon: AlertTriangle, link: '/risks', alert: m.criticalRisks.some((r) => riskLevel(riskScore(r)) === 'critical') },
    { label: 'Open decisions', value: m.decisions.length, icon: Gavel, link: '/risks?tab=decisions', alert: m.decisions.some((d) => !!d.targetDate && d.targetDate < T) },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">Good {greeting()}, {session.displayName.split(' ')[0]}</h1>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{fmtDate(T)} · CW {isoWeek(T)}</p>
      </div>

      <FilterBar />

      {/* 1 · What needs action */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.link} className="group flex items-center gap-3 rounded-xl border border-line/70 bg-white p-4 shadow-card transition hover:border-brand/40">
            <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', k.alert ? 'bg-status-redBg text-status-red' : 'bg-surface-muted text-ink-soft')}><k.icon size={20} /></span>
            <span className="min-w-0">
              <span className={cx('block text-2xl font-black leading-none tabular-nums', k.alert ? 'text-status-red' : 'text-ink')}>{k.value}</span>
              <span className="mt-1 block truncate text-xs font-semibold text-ink-muted">{k.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        {/* 2 · Attention list */}
        <Card className="xl:col-span-7">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
            <h2 className="text-[15px] font-bold text-ink">Needs attention</h2>
            <div className="flex gap-1 rounded-lg bg-surface-muted p-0.5" role="tablist">
              {([['my', 'Mine'], ['team', 'Team']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={cx('h-7 rounded-md px-3 text-xs font-bold', tab === k ? 'bg-white text-brand shadow-sm' : 'text-ink-muted')}>{l}</button>
              ))}
            </div>
          </div>
          <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
            {attention.length === 0 && <li><EmptyState icon={EW.checklist} title="Nothing urgent" text="No overdue, blocked, critical or follow-up items." /></li>}
            {attention.slice(0, 7).map((t) => <AttentionRow key={t.id} t={t} />)}
          </ul>
          <div className="flex items-center justify-between border-t border-line/60 px-4 py-2.5 text-xs sm:px-5">
            <Link to={`/tasks?view=${tab}`} className="font-bold text-brand hover:underline">{attention.length > 7 ? `Show all ${attention.length}` : 'Open Action Tracker'}</Link>
            {unassigned > 0 && <Link to="/tasks?view=unassigned" className="font-semibold text-status-amber hover:underline">{unassigned} without owner</Link>}
          </div>
        </Card>

        {/* 3 · Projects + decisions */}
        <div className="space-y-5 xl:col-span-5">
          <Card>
            <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
              <h2 className="text-[15px] font-bold text-ink">Projects</h2>
              <Link to="/projects" className="text-xs font-bold text-brand hover:underline">All</Link>
            </div>
            <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
              {m.projects.length === 0 && <li className="px-5 py-4 text-sm text-ink-soft">No projects in this filter.</li>}
              {m.projects.map((p) => {
                const overdue = m.tasks.filter((t) => t.projectId === p.id && isOverdue(t, T)).length;
                return (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                      <RagDot rag={p.rag} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.title}</span>
                      {overdue > 0 && <span className="text-[11px] font-bold text-status-red">{overdue} overdue</span>}
                      <TrendBadge trend={p.trend} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
              <h2 className="text-[15px] font-bold text-ink">Decisions required</h2>
              <Link to="/risks?tab=decisions" className="text-xs font-bold text-brand hover:underline">Decision log</Link>
            </div>
            <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
              {m.decisions.length === 0 && <li className="px-5 py-4 text-sm text-ink-soft">No pending decisions.</li>}
              {m.decisions.slice(0, 4).map((d) => (
                <li key={d.id}>
                  <Link to="/risks?tab=decisions" className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                    <Gavel size={15} className="shrink-0 text-brand" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{d.title}</span><span className="block truncate text-[11px] text-ink-soft">{d.authority}</span></span>
                    <span className={cx('shrink-0 text-xs font-semibold', d.targetDate && d.targetDate < T ? 'text-status-red' : 'text-ink-muted')}>{fmtShort(d.targetDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* 4 · Next 14 days */}
        <Card className="xl:col-span-7">
          <div className="flex items-center justify-between px-4 pt-4 sm:px-5"><h2 className="text-[15px] font-bold text-ink">Next {AGENDA_DAYS} days</h2></div>
          <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
            {m.agenda.length === 0 && <li className="px-5 py-4 text-sm text-ink-soft">Nothing scheduled.</li>}
            {m.agenda.slice(0, 8).map((x) => (
              <li key={x.id}>
                <Link to={x.link} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                  <span className="w-14 shrink-0 text-xs font-bold text-ink">{fmtShort(x.date)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{x.title}</span><span className="block text-[11px] text-ink-soft">{x.kind}</span></span>
                  <span className="shrink-0 text-[11px] font-semibold text-ink-soft">{relDays(x.date, T)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* 5 · Waiting for */}
        <Card className="xl:col-span-5">
          <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
            <h2 className="text-[15px] font-bold text-ink">Waiting for others</h2>
            <Link to="/tasks?view=waiting_ext" className="text-xs font-bold text-brand hover:underline">All {m.waiting.length}</Link>
          </div>
          <ul className="mt-2 divide-y divide-line/60 border-t border-line/60">
            {m.waiting.length === 0 && <li className="px-5 py-4 text-sm text-ink-soft">No open dependencies.</li>}
            {m.waiting.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link to={`/tasks?open=${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{t.awaitedItem ?? t.title}</span>
                    <span className="block truncate text-[11px] text-ink-soft">{data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson ?? '—'} · {memberName(data.members, t.ownerId)}</span>
                  </span>
                  <span className={cx('shrink-0 text-right text-[11px] font-bold', isDependencyOverdue(t, T) ? 'text-status-red' : isFollowUpDue(t, T) ? 'text-status-amber' : 'text-ink-soft')}>
                    {isDependencyOverdue(t, T) ? 'overdue' : isFollowUpDue(t, T) ? 'follow up' : fmtShort(t.followUpDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* 6 · More insights (collapsed by default) */}
      <button onClick={toggleMore} aria-expanded={moreOpen} className="mt-6 flex w-full items-center gap-2 border-t border-line pt-4 text-sm font-bold text-ink-muted hover:text-ink">
        {moreOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />} More insights
        <span className="font-normal text-ink-soft">– risks, analytics, trainers, recent activity</span>
      </button>
      {moreOpen && <MoreInsights tasks={m.tasks} />}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

function AttentionRow({ t }: { t: Task }) {
  const members = useStore((s) => s.data.members);
  const T = todayISO();
  const flag = isOverdue(t, T) ? { l: relDays(t.dueDate, T), c: 'text-status-red' }
    : t.status === 'blocked' ? { l: 'blocked', c: 'text-status-red' }
      : isFollowUpDue(t, T) ? { l: 'follow up', c: 'text-status-amber' }
        : { l: fmtShort(t.dueDate), c: 'text-ink-soft' };
  return (
    <li>
      <Link to={`/tasks?open=${t.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
        <Avatar name={memberName(members, t.ownerId)} size={26} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{t.priority === 'critical' && <span className="mr-1 text-status-red" aria-label="critical">▲▲</span>}{t.title}</span>
          <span className="block truncate text-[11px] text-ink-soft">{t.ref} · {t.fleet === 'B737' ? 'B737 MAX' : t.fleet === 'GEN' ? 'General' : t.fleet}</span>
        </span>
        <span className={cx('shrink-0 text-xs font-bold', flag.c)}>{flag.l}</span>
      </Link>
    </li>
  );
}

function MoreInsights({ tasks }: { tasks: Task[] }) {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const T = todayISO();
  const projects = filterProjects(data.projects, filters);
  const risks = filterRisks(data.risks, filters).filter((r) => r.status !== 'closed').sort((a, b) => riskScore(b) - riskScore(a));
  const trainers = data.trainers.filter((t) => !t.archived && (filters.fleet === 'ALL' || t.aircraft.includes(filters.fleet as 'A320' | 'B737')) && (filters.base === 'ALL' || t.bases.includes(filters.base)));
  const open = tasks.filter(isActiveTask);

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Risks & issues</h2>
        <ul className="space-y-2">
          {risks.slice(0, 5).map((r) => {
            const lvl = riskLevel(riskScore(r));
            return (
              <li key={r.id}><Link to="/risks" className="flex items-center gap-3 hover:opacity-80">
                <span className={cx('w-9 shrink-0 rounded-md py-1 text-center text-xs font-black', lvl === 'critical' ? 'bg-status-red text-white' : lvl === 'high' ? 'bg-status-amberBg text-status-amber' : 'bg-surface-muted text-ink-muted')}>{riskScore(r)}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{r.title}</span>
              </Link></li>
            );
          })}
          {risks.length === 0 && <li className="text-sm text-ink-soft">No open risks.</li>}
        </ul>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Status overview</h2>
        <StackBar title="Projects" total={projects.length}
          parts={(['green', 'amber', 'red', 'grey'] as const).map((r) => ({ label: { green: 'On track', amber: 'Attention', red: 'Critical', grey: 'Not set' }[r], value: projects.filter((p) => p.rag === r).length, cls: { green: 'bg-status-green', amber: 'bg-status-amberDot', red: 'bg-status-red', grey: 'bg-status-grey' }[r] }))} />
        <div className="h-4" />
        <StackBar title="Tasks" total={tasks.filter((t) => t.status !== 'cancelled').length}
          parts={[
            { label: 'Open', value: tasks.filter((t) => t.status === 'open').length, cls: 'bg-ink-soft' },
            { label: 'In progress', value: tasks.filter((t) => t.status === 'in_progress').length, cls: 'bg-sky' },
            { label: 'Waiting', value: tasks.filter((t) => t.status === 'waiting').length, cls: 'bg-status-amberDot' },
            { label: 'Blocked', value: tasks.filter((t) => t.status === 'blocked').length, cls: 'bg-status-red' },
            { label: 'Done', value: tasks.filter((t) => t.status === 'completed').length, cls: 'bg-status-green' },
          ]} />
        <div className="mt-4 space-y-1.5">
          {data.members.filter((x) => x.active).map((x) => {
            const n = open.filter((t) => t.ownerId === x.id).length;
            return (
              <div key={x.id} className="grid grid-cols-[110px_1fr_24px] items-center gap-2 text-xs">
                <span className="truncate font-semibold text-ink-muted">{x.displayName}</span>
                <span className="h-2 rounded-full bg-surface-muted"><span className="block h-2 rounded-full bg-brand" style={{ width: `${open.length ? (n / open.length) * 100 : 0}%` }} /></span>
                <span className="text-right font-bold tabular-nums">{n}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Trainers</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: trainers.length, l: 'trainers', link: '/instructors' },
            { n: trainers.filter((t) => t.aircraft.includes('B737')).length, l: 'B737', link: '/instructors' },
            { n: trainers.filter((t) => missingFields(t).length > 0).length, l: 'data gaps', link: '/instructors?missing=1' },
          ].map((x) => (
            <Link key={x.l} to={x.link} className="rounded-lg bg-surface-subtle p-2 hover:bg-surface-muted">
              <b className="block text-xl font-black tabular-nums text-ink">{x.n}</b><span className="text-[11px] font-semibold text-ink-soft">{x.l}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2 xl:col-span-3">
        <h2 className="px-4 pt-4 text-[15px] font-bold text-ink sm:px-5">Recent activity</h2>
        <ul className="mt-2 grid grid-cols-1 divide-y divide-line/60 border-t border-line/60 md:grid-cols-2 md:divide-y-0">
          {data.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="md:border-b md:border-line/60">
              <Link to={a.link ?? '#'} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                <Avatar name={a.actor} size={24} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-ink">{a.actor}</span>{a.actorVerified && <ShieldCheck size={13} className="ml-1 inline text-status-green" aria-label="Authenticated Superadmin" />}{' '}
                  <span className="text-ink-muted">{a.action}</span> <span className="font-semibold text-ink">{a.targetLabel}</span>
                  <span className="block text-[11px] text-ink-soft">{timeAgo(a.at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-[11px] text-ink-soft lg:col-span-2 xl:col-span-3">All figures are calculated from the records in the current filter · {T}</p>
    </div>
  );
}

function StackBar({ title, parts, total }: { title: string; parts: { label: string; value: number; cls: string }[]; total: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between"><span className="text-xs font-bold text-ink-muted">{title}</span><span className="text-[11px] text-ink-soft">{total}</span></div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted" role="img" aria-label={`${title}: ${parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
        {parts.map((p) => p.value > 0 && <span key={p.label} className={p.cls} style={{ width: `${(p.value / Math.max(total, 1)) * 100}%` }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {parts.map((p) => <span key={p.label} className="inline-flex items-center gap-1 text-[11px] text-ink-muted"><span className={cx('h-2 w-2 rounded-full', p.cls)} />{p.label} <b className="text-ink">{p.value}</b></span>)}
      </div>
    </div>
  );
}

