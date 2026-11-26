import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, ListChecks, AlarmClock, Hourglass, AlertTriangle, Flag, Gavel, Users, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Avatar, Card, CardHeader, EmptyState, FleetTag, PriorityTag, RagBadge, RagDot, StatusPill, TrendBadge, cx } from '../components/ui';
import {
  applyTaskView, attentionSort, filterDecisions, filterProjects, filterRisks, filterTasks, isActiveTask, isDependencyOverdue,
  isFollowUpDue, isOverdue, isPendingDecision, isWaiting, missingFields, riskLevel, riskScore, fleetMatch, baseMatch,
} from '../lib/metrics';
import { daysBetween, fmtDate, fmtShort, isoWeek, relDays, timeAgo, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { Task } from '../types';

export function DashboardPage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const session = useStore((s) => s.session)!;
  const nav = useNavigate();
  const T = todayISO();
  const [attTab, setAttTab] = useState<'my' | 'team' | 'unassigned'>('my');

  const m = useMemo(() => {
    const tasks = filterTasks(data.tasks, filters);
    const projects = filterProjects(data.projects, filters);
    const risks = filterRisks(data.risks, filters).filter((r) => r.status !== 'closed');
    const decisions = filterDecisions(data.decisions, filters);
    const projIds = new Set(projects.map((p) => p.id));
    const milestones = data.milestones.filter((x) => projIds.has(x.projectId) && !x.done && x.date >= T && daysBetween(T, x.date) <= 30).sort((a, b) => a.date.localeCompare(b.date));
    const trainers = data.trainers.filter((t) => !t.archived && (filters.fleet === 'ALL' || t.aircraft.includes(filters.fleet as 'A320' | 'B737')) && (filters.base === 'ALL' || t.bases.includes(filters.base)));
    const events = data.trainingEvents.filter((e) => e.status !== 'cancelled' && e.endDate >= T && fleetMatch(e.fleet, filters.fleet) && baseMatch(e.base, filters.base)).sort((a, b) => a.startDate.localeCompare(b.startDate));
    const active = tasks.filter(isActiveTask);
    return {
      tasks, projects, risks, decisions, milestones, trainers, events,
      activeProjects: projects.filter((p) => p.status === 'active'),
      open: active,
      overdue: tasks.filter((t) => isOverdue(t, T)),
      waiting: tasks.filter(isWaiting),
      followUpDue: tasks.filter((t) => isFollowUpDue(t, T)),
      criticalRisks: risks.filter((r) => ['critical', 'high'].includes(riskLevel(riskScore(r)))),
      pending: decisions.filter(isPendingDecision),
      trainerReview: trainers.filter((t) => missingFields(t).length > 0),
    };
  }, [data, filters, T]);

  const attention = useMemo(() => {
    const view = attTab === 'my' ? applyTaskView(m.tasks, 'my', session.memberId) : attTab === 'unassigned' ? applyTaskView(m.tasks, 'unassigned') : applyTaskView(m.tasks, 'team');
    const relevant = attTab === 'unassigned' ? view : view.filter((t) => isOverdue(t, T) || t.status === 'blocked' || t.priority === 'critical' || isFollowUpDue(t, T) || (t.dueDate && daysBetween(T, t.dueDate) <= 7));
    return relevant.sort((a, b) => attentionSort(a, b, T));
  }, [m.tasks, attTab, session.memberId, T]);

  const myPending = m.pending.filter((d) => d.ownerId === session.memberId);
  const summary = `${m.overdue.length} overdue ${m.overdue.length === 1 ? 'task' : 'tasks'}, ${m.followUpDue.length} follow-ups due, ${m.criticalRisks.length} high/critical risks and ${m.pending.length} pending decisions in the current filter.`;

  const kpis: { label: string; value: number; sub: string; icon: typeof FolderKanban; link: string; tone?: 'red' | 'amber' }[] = [
    { label: 'Active Projects', value: m.activeProjects.length, sub: `${m.activeProjects.filter((p) => p.rag === 'red').length} critical · ${m.activeProjects.filter((p) => p.rag === 'amber').length} attention`, icon: FolderKanban, link: '/projects' },
    { label: 'Open Tasks', value: m.open.length, sub: `${m.open.filter((t) => t.priority === 'critical').length} critical priority`, icon: ListChecks, link: '/tasks?view=team' },
    { label: 'Overdue Tasks', value: m.overdue.length, sub: m.overdue.length ? `oldest ${Math.max(...m.overdue.map((t) => daysBetween(t.dueDate!, T)))} d` : 'none overdue', icon: AlarmClock, link: '/tasks?view=overdue', tone: m.overdue.length ? 'red' : undefined },
    { label: 'Waiting For', value: m.waiting.length, sub: `${m.followUpDue.length} follow-ups due`, icon: Hourglass, link: '/tasks?view=waiting_ext', tone: m.followUpDue.length ? 'amber' : undefined },
    { label: 'Critical Risks', value: m.criticalRisks.length, sub: 'score ≥ 10 (high/critical)', icon: AlertTriangle, link: '/risks', tone: m.criticalRisks.some((r) => riskLevel(riskScore(r)) === 'critical') ? 'red' : undefined },
    { label: 'Upcoming Milestones', value: m.milestones.length, sub: 'next 30 days', icon: Flag, link: '/projects' },
    { label: 'Pending Decisions', value: m.pending.length, sub: `${myPending.length} awaiting you`, icon: Gavel, link: '/risks?tab=decisions', tone: m.pending.some((d) => d.targetDate && d.targetDate < T) ? 'red' : undefined },
    { label: 'Instructor Attention', value: m.trainerReview.length, sub: 'records with missing source data', icon: Users, link: '/instructors?missing=1' },
  ];

  return (
    <div>
      {/* A. Executive header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{fmtDate(T)} · CW {isoWeek(T)}</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">Training Management Overview</h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">{summary}</p>
        </div>
        <p className="text-[11px] font-semibold text-ink-soft"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-status-green align-middle" />Calculated live from records</p>
      </div>

      {/* B. Filters */}
      <FilterBar />

      {/* C. KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.link}
            className="group rounded-xl border border-line/70 bg-white p-3.5 shadow-card transition hover:border-brand/40 hover:shadow-pop sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted">{k.label}</span>
              <k.icon size={17} className={cx(k.tone === 'red' ? 'text-status-red' : k.tone === 'amber' ? 'text-status-amber' : 'text-brand')} />
            </div>
            <div className={cx('mt-2 text-3xl font-black tabular-nums', k.tone === 'red' ? 'text-status-red' : 'text-ink')}>{k.value}</div>
            <div className="mt-0.5 truncate text-[11px] text-ink-soft">{k.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* D. Portfolio */}
        <Card className="xl:col-span-8">
          <CardHeader title="Project Portfolio" subtitle="Status (RAG) and trend vs. previous period are separate fields"
            action={<Link to="/projects" className="text-xs font-bold text-brand hover:underline">All projects</Link>} />
          {m.projects.length === 0 ? <EmptyState icon={EW.target} title="No projects match the current filters" /> : (
            <div className="divide-y divide-line/60 border-t border-line/60">
              {m.projects.map((p) => {
                const pt = m.tasks.filter((t) => t.projectId === p.id);
                const next = data.milestones.filter((x) => x.projectId === p.id && !x.done).sort((a, b) => a.date.localeCompare(b.date))[0];
                return (
                  <button key={p.id} onClick={() => nav(`/projects/${p.id}`)} className="grid w-full grid-cols-1 gap-2 px-4 py-3.5 text-left hover:bg-surface-subtle sm:px-5 md:grid-cols-[minmax(0,1.6fr)_120px_minmax(0,1.2fr)_140px] md:items-center md:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <RagDot rag={p.rag} />
                        <span className="truncate text-sm font-bold text-ink">{p.title}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 pl-[18px]">
                        <FleetTag fleet={p.fleet} />
                        <span className="text-xs text-ink-soft">{memberName(data.members, p.ownerId)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-[18px] md:flex-col md:items-start md:gap-1 md:pl-0">
                      <RagBadge rag={p.rag} />
                      <TrendBadge trend={p.trend} />
                    </div>
                    <div className="min-w-0 pl-[18px] md:pl-0">
                      {p.progress !== undefined ? (
                        <div className="mb-1.5 flex items-center gap-2" title={`Progress method: ${p.progressMethod}`}>
                          <span className="h-1.5 flex-1 rounded-full bg-surface-muted"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${p.progress}%` }} /></span>
                          <span className="text-xs font-bold tabular-nums text-ink">{p.progress}%</span>
                        </div>
                      ) : <div className="mb-1 text-[11px] text-ink-soft">No progress method defined</div>}
                      <div className="truncate text-xs text-ink-muted">{next ? <>Next: <b className="text-ink">{next.title}</b> · {fmtShort(next.date)}</> : 'No open milestone'}</div>
                    </div>
                    <div className="flex gap-3 pl-[18px] text-xs md:justify-end md:pl-0">
                      <Count n={pt.filter(isActiveTask).length} label="open" />
                      <Count n={pt.filter((t) => isOverdue(t, T)).length} label="overdue" tone="red" />
                      <Count n={pt.filter((t) => isActiveTask(t) && t.priority === 'critical').length} label="crit." tone="red" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* E. Attention */}
        <Card className="xl:col-span-4">
          <CardHeader title="Attention Required" subtitle="Overdue, blocked, critical and follow-up-due first" />
          <div className="px-4 sm:px-5">
            <div className="flex gap-1 rounded-lg bg-surface-muted p-0.5" role="tablist">
              {([['my', 'My Attention'], ['team', 'Team'], ['unassigned', 'Unassigned']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={attTab === k} onClick={() => setAttTab(k)}
                  className={cx('h-8 flex-1 rounded-md text-xs font-bold', attTab === k ? 'bg-white text-brand shadow-sm' : 'text-ink-muted')}>
                  {l}{k === 'unassigned' && applyTaskView(m.tasks, 'unassigned').length > 0 && <span className="ml-1 rounded-full bg-status-amberDot px-1.5 text-[10px] text-ink">{applyTaskView(m.tasks, 'unassigned').length}</span>}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-2 max-h-[420px] overflow-y-auto px-2 pb-3">
            {attention.length === 0 && <EmptyState icon={EW.checklist} title="Nothing requires attention" text="No overdue, blocked, critical or follow-up-due items in this view." />}
            {attention.slice(0, 8).map((t) => <AttentionRow key={t.id} t={t} />)}
            {attTab === 'my' && myPending.map((d) => (
              <li key={d.id}>
                <Link to="/risks?tab=decisions" className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-surface-subtle">
                  <Gavel size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{d.ref} {d.title}</span>
                    <span className="text-[11px] text-ink-soft">Decision awaiting your input · {d.authority} · target {fmtShort(d.targetDate)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* F. Waiting For */}
        <Card className="xl:col-span-7">
          <CardHeader title="Waiting For / External Dependencies" subtitle="Internal owner stays accountable while another party acts"
            action={<Link to="/tasks?view=waiting_ext" className="text-xs font-bold text-brand hover:underline">Open tracker</Link>} />
          {m.waiting.length === 0 ? <EmptyState icon={EW.calendar} title="No open dependencies" /> : (
            <div className="overflow-x-auto border-t border-line/60">
              <table className="hidden w-full text-left text-xs md:table">
                <thead className="bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-soft">
                  <tr><th className="px-5 py-2 font-bold">Awaited item</th><th className="px-2 py-2 font-bold">From</th><th className="px-2 py-2 font-bold">Owner</th><th className="px-2 py-2 font-bold">Expected</th><th className="px-5 py-2 font-bold">Follow-up</th></tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {m.waiting.sort((a, b) => (a.followUpDate ?? '9').localeCompare(b.followUpDate ?? '9')).map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-surface-subtle" onClick={() => nav(`/tasks?open=${t.id}`)}>
                      <td className="max-w-[260px] px-5 py-2.5"><div className="truncate font-semibold text-ink">{t.awaitedItem ?? t.title}</div><div className="truncate text-ink-soft">{t.ref} · {t.title}</div></td>
                      <td className="px-2 py-2.5 text-ink-muted">{data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson ?? '—'}<div className="text-[10px] uppercase text-ink-soft">{t.dependencyType}</div></td>
                      <td className="px-2 py-2.5 text-ink-muted">{memberName(data.members, t.ownerId)}</td>
                      <td className={cx('px-2 py-2.5 font-semibold', isDependencyOverdue(t, T) ? 'text-status-red' : 'text-ink-muted')}>{fmtShort(t.expectedDate)}<div className="font-normal">{relDays(t.expectedDate, T)}</div></td>
                      <td className={cx('px-5 py-2.5 font-semibold', isFollowUpDue(t, T) ? 'text-status-amber' : 'text-ink-muted')}>{fmtShort(t.followUpDate)}{isFollowUpDue(t, T) && <div className="font-bold">Follow up now</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-line/60 md:hidden">
                {m.waiting.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tasks?open=${t.id}`} className="block px-4 py-3">
                      <div className="text-sm font-semibold text-ink">{t.awaitedItem ?? t.title}</div>
                      <div className="mt-0.5 text-xs text-ink-soft">{data.organizations.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson ?? '—'} · owner {memberName(data.members, t.ownerId)}</div>
                      <div className="mt-1 flex gap-3 text-xs">
                        <span className={isDependencyOverdue(t, T) ? 'font-bold text-status-red' : 'text-ink-muted'}>Expected {fmtShort(t.expectedDate)}</span>
                        <span className={isFollowUpDue(t, T) ? 'font-bold text-status-amber' : 'text-ink-muted'}>Follow-up {fmtShort(t.followUpDate)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* G. Risks & Decisions */}
        <Card className="xl:col-span-5">
          <CardHeader title="Risks & Decisions Required" action={<Link to="/risks" className="text-xs font-bold text-brand hover:underline">Register</Link>} />
          <div className="border-t border-line/60 px-4 py-3 sm:px-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">High / critical risks & issues</h3>
            {m.criticalRisks.length === 0 && <p className="py-2 text-xs text-ink-soft">None in current filter.</p>}
            <ul className="space-y-2">
              {m.criticalRisks.sort((a, b) => riskScore(b) - riskScore(a)).map((r) => {
                const lvl = riskLevel(riskScore(r));
                return (
                  <li key={r.id}>
                    <Link to="/risks" className="flex items-start gap-3 rounded-lg hover:bg-surface-subtle">
                      <span className={cx('mt-0.5 w-12 shrink-0 rounded-md py-1 text-center text-[11px] font-black', lvl === 'critical' ? 'bg-status-red text-white' : 'bg-status-amberBg text-status-amber')}>{riskScore(r)}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{r.ref} {r.title}</span>
                        <span className="block text-[11px] text-ink-soft">{lvl} · {memberName(data.members, r.ownerId)} · {r.status} · review {fmtShort(r.reviewDate)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-line/60 px-4 py-3 sm:px-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Decisions required</h3>
            {m.pending.length === 0 && <p className="py-2 text-xs text-ink-soft">No pending decisions.</p>}
            <ul className="space-y-2">
              {m.pending.map((d) => (
                <li key={d.id}>
                  <Link to="/risks?tab=decisions" className="flex items-start gap-3 rounded-lg hover:bg-surface-subtle">
                    <Gavel size={16} className="mt-1 shrink-0 text-brand" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{d.ref} {d.title}</span>
                      <span className={cx('block text-[11px]', d.targetDate && d.targetDate < T ? 'font-bold text-status-red' : 'text-ink-soft')}>
                        {d.status === 'proposed' ? 'Proposed' : 'Under review'} · decides: {d.authority} · target {fmtShort(d.targetDate)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Charts */}
        <Card className="xl:col-span-4">
          <CardHeader title="Portfolio Analytics" subtitle="Counts within current filter" />
          <div className="space-y-5 border-t border-line/60 px-4 py-4 sm:px-5">
            <StackBar title="Project status" total={m.projects.length} unit="projects"
              parts={(['green', 'amber', 'red', 'grey'] as const).map((r) => ({ label: { green: 'On Track', amber: 'Attention', red: 'Critical', grey: 'Not set' }[r], value: m.projects.filter((p) => p.rag === r).length, cls: { green: 'bg-status-green', amber: 'bg-status-amberDot', red: 'bg-status-red', grey: 'bg-status-grey' }[r] }))} />
            <StackBar title="Task status" total={m.tasks.filter((t) => t.status !== 'cancelled').length} unit="tasks"
              parts={[
                { label: 'Open', value: m.tasks.filter((t) => t.status === 'open').length, cls: 'bg-ink-soft' },
                { label: 'In Progress', value: m.tasks.filter((t) => t.status === 'in_progress').length, cls: 'bg-sky' },
                { label: 'Waiting', value: m.tasks.filter((t) => t.status === 'waiting').length, cls: 'bg-status-amberDot' },
                { label: 'Blocked', value: m.tasks.filter((t) => t.status === 'blocked').length, cls: 'bg-status-red' },
                { label: 'Completed', value: m.tasks.filter((t) => t.status === 'completed').length, cls: 'bg-status-green' },
              ]} />
            <div>
              <h3 className="mb-2 text-xs font-bold text-ink-muted">Open tasks by primary owner</h3>
              {[...data.members.filter((x) => x.active).map((x) => ({ id: x.id as string | undefined, name: x.displayName })), { id: undefined, name: 'Unassigned' }].map((o) => {
                const n = m.open.filter((t) => t.ownerId === o.id).length;
                return (
                  <Link key={o.name} to={o.id ? '/tasks?view=team' : '/tasks?view=unassigned'} className="mb-1.5 grid grid-cols-[110px_1fr_28px] items-center gap-2 text-xs hover:opacity-80">
                    <span className="truncate font-semibold text-ink-muted">{o.name}</span>
                    <span className="h-2.5 rounded-full bg-surface-muted"><span className="block h-2.5 rounded-full bg-brand" style={{ width: `${m.open.length ? (n / m.open.length) * 100 : 0}%` }} /></span>
                    <span className="text-right font-bold tabular-nums">{n}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>

        {/* H. Training & Instructor snapshot */}
        <Card className="xl:col-span-4">
          <CardHeader title="Training & Instructor Snapshot" subtitle="Historical counts ≠ availability or authorisation"
            icon={<img src={EW.simulator} alt="" className="h-8 w-8 object-contain" />} />
          <div className="border-t border-line/60 px-4 py-3 sm:px-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Mini n={new Set(m.trainers.map((t) => t.id)).size} l="unique trainers" link="/instructors" />
              <Mini n={m.trainers.filter((t) => t.aircraft.includes('B737')).length} l="B737 qualified*" link="/instructors" />
              <Mini n={m.trainerReview.length} l="need data review" link="/instructors?missing=1" tone="amber" />
            </div>
            <p className="mt-2 text-[10px] text-ink-soft">* per source roster · no verified expiry data loaded – validity alerts disabled.</p>
            <h3 className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wide text-ink-soft">Upcoming training events</h3>
            <ul className="divide-y divide-line/60">
              {m.events.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2">
                  <span className="w-12 shrink-0 text-center"><span className="block text-[10px] font-bold uppercase text-brand">{fmtShort(e.startDate).split(' ')[1]}</span><span className="block text-lg font-black leading-none text-ink">{fmtShort(e.startDate).split(' ')[0]}</span></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{e.title}</span><span className="text-[11px] text-ink-soft">{e.base ?? '—'} · {e.participants} pax · {e.resource ?? 'no resource'}</span></span>
                  <FleetTag fleet={e.fleet} />
                </li>
              ))}
              {m.events.length === 0 && <li className="py-3 text-xs text-ink-soft">No upcoming events.</li>}
            </ul>
          </div>
        </Card>

        {/* I. Upcoming milestones */}
        <Card className="xl:col-span-4">
          <CardHeader title="Upcoming Milestones & Meetings" subtitle="Next 30 days" icon={<img src={EW.calendar} alt="" className="h-8 w-8 object-contain" />} />
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {[
              ...m.milestones.map((x) => ({ id: x.id, date: x.date, title: x.title, sub: data.projects.find((p) => p.id === x.projectId)?.title ?? '', kind: 'Milestone', link: `/projects/${x.projectId}` })),
              ...data.meetings.filter((x) => x.status === 'planned' && x.date >= T && fleetMatch(x.fleet, filters.fleet)).map((x) => ({ id: x.id, date: x.date, title: x.title, sub: `${x.start}–${x.end} · ${x.location ?? ''}`, kind: 'Meeting', link: `/meetings/${x.id}` })),
            ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7).map((x) => (
              <li key={x.id}>
                <Link to={x.link} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                  <span className="w-14 shrink-0 text-xs font-bold text-ink">{fmtShort(x.date)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{x.title}</span><span className="block truncate text-[11px] text-ink-soft">{x.kind} · {x.sub}</span></span>
                  <span className="shrink-0 text-[11px] font-semibold text-ink-soft">{relDays(x.date, T)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* J. Recent activity */}
        <Card className="xl:col-span-12">
          <CardHeader title="Recent Activity" subtitle="Display names of team users are self-declared; ✓ marks authenticated Superadmin actions" />
          <ul className="grid grid-cols-1 divide-y divide-line/60 border-t border-line/60 md:grid-cols-2 md:divide-y-0">
            {data.activity.slice(0, 8).map((a) => (
              <li key={a.id} className="md:border-b md:border-line/60">
                <Link to={a.link ?? '#'} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-subtle sm:px-5">
                  <Avatar name={a.actor} size={26} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-ink">{a.actor}</span>{a.actorVerified && <ShieldCheck size={13} className="ml-1 inline text-status-green" aria-label="Authenticated Superadmin" />}{' '}
                    <span className="text-ink-muted">{a.action}</span> <span className="font-semibold text-ink">{a.targetLabel}</span>
                    <span className="block text-[11px] text-ink-soft">{a.kind} · {timeAgo(a.at)}</span>
                  </span>
                  <ChevronRight size={16} className="mt-1 text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone?: 'red' }) {
  return <span className="text-center"><b className={cx('block text-base font-black tabular-nums', tone === 'red' && n > 0 ? 'text-status-red' : 'text-ink')}>{n}</b><span className="text-[10px] text-ink-soft">{label}</span></span>;
}

function Mini({ n, l, link, tone }: { n: number; l: string; link: string; tone?: 'amber' }) {
  return (
    <Link to={link} className="rounded-lg bg-surface-subtle p-2 hover:bg-surface-muted">
      <b className={cx('block text-xl font-black tabular-nums', tone === 'amber' && n > 0 ? 'text-status-amber' : 'text-ink')}>{n}</b>
      <span className="text-[10px] font-semibold leading-tight text-ink-soft">{l}</span>
    </Link>
  );
}

function StackBar({ title, parts, total, unit }: { title: string; parts: { label: string; value: number; cls: string }[]; total: number; unit: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between"><h3 className="text-xs font-bold text-ink-muted">{title}</h3><span className="text-[11px] text-ink-soft">{total} {unit}</span></div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-muted" role="img" aria-label={`${title}: ${parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
        {parts.map((p) => p.value > 0 && <span key={p.label} className={p.cls} style={{ width: `${(p.value / Math.max(total, 1)) * 100}%` }} />)}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {parts.map((p) => <span key={p.label} className="inline-flex items-center gap-1 text-[11px] text-ink-muted"><span className={cx('h-2 w-2 rounded-full', p.cls)} />{p.label} <b className="text-ink">{p.value}</b></span>)}
      </div>
    </div>
  );
}

function AttentionRow({ t }: { t: Task }): ReactNode {
  const members = useStore((s) => s.data.members);
  const orgs = useStore((s) => s.data.organizations);
  const T = todayISO();
  const flag = isOverdue(t, T) ? { l: relDays(t.dueDate, T), c: 'text-status-red' } : isFollowUpDue(t, T) ? { l: 'follow-up due', c: 'text-status-amber' } : { l: `due ${fmtShort(t.dueDate)}`, c: 'text-ink-soft' };
  return (
    <li>
      <Link to={`/tasks?open=${t.id}`} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-surface-subtle">
        <Avatar name={memberName(members, t.ownerId)} size={26} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{t.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusPill status={t.status} />
            <PriorityTag priority={t.priority} />
            <span className={cx('text-[11px] font-bold', flag.c)}>{flag.l}</span>
          </span>
          {t.dependencyType && <span className="mt-1 block truncate text-[11px] text-ink-soft">Waiting for {orgs.find((o) => o.id === t.waitingForOrgId)?.name ?? t.waitingForPerson}</span>}
        </span>
        <FleetTag fleet={t.fleet} />
      </Link>
    </li>
  );
}
