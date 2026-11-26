// KPI and filter definitions. Every dashboard number is computed here from records –
// nothing is hard-coded. Definitions are documented in docs/metric-definitions.md.

import type { Decision, Filters, FleetCode, ID, Project, Risk, Task, Trainer } from '../types';
import { daysBetween, todayISO } from './dates';

export const OPEN_STATUSES: Task['status'][] = ['open', 'in_progress', 'waiting', 'blocked'];
export const isActiveTask = (t: Task) => !t.archived && OPEN_STATUSES.includes(t.status);

/** Fleet rule: a specific fleet filter keeps that fleet plus General/Both items. */
export function fleetMatch(fleet: FleetCode, f: Filters['fleet']): boolean {
  return f === 'ALL' || fleet === f || fleet === 'GEN';
}
/** Base rule: items without a base are not base-specific and remain visible. */
export function baseMatch(base: string | undefined, f: string): boolean {
  return f === 'ALL' || !base || base === f;
}

export function filterTasks(tasks: Task[], f: Filters): Task[] {
  return tasks.filter((t) => !t.archived && fleetMatch(t.fleet, f.fleet) && baseMatch(t.base, f.base) && (f.projectId === 'ALL' || t.projectId === f.projectId));
}
export function filterProjects(projects: Project[], f: Filters): Project[] {
  return projects.filter((p) => !p.archived && fleetMatch(p.fleet, f.fleet) && (f.projectId === 'ALL' || p.id === f.projectId));
}
export function filterRisks(risks: Risk[], f: Filters): Risk[] {
  return risks.filter((r) => !r.archived && fleetMatch(r.fleet, f.fleet) && (f.projectId === 'ALL' || r.projectId === f.projectId));
}
export function filterDecisions(ds: Decision[], f: Filters): Decision[] {
  return ds.filter((d) => !d.archived && fleetMatch(d.fleet, f.fleet) && (f.projectId === 'ALL' || d.projectId === f.projectId));
}

/** Overdue: active task with due date before today. */
export const isOverdue = (t: Task, today = todayISO()) => isActiveTask(t) && !!t.dueDate && t.dueDate < today;
/** Due soon: active, due today or within the next 7 days. */
export const isDueSoon = (t: Task, today = todayISO()) => isActiveTask(t) && !!t.dueDate && t.dueDate >= today && daysBetween(today, t.dueDate) <= 7;
/** Waiting For: status "waiting" or an open dependency that is not yet received. */
export const isWaiting = (t: Task) => isActiveTask(t) && (t.status === 'waiting' || (!!t.dependencyType && t.dependencyStatus !== 'received'));
/** Follow-up due: follow-up date today or earlier and awaited item not received. */
export const isFollowUpDue = (t: Task, today = todayISO()) => isWaiting(t) && !!t.followUpDate && t.followUpDate <= today;
/** Dependency overdue: expected date passed and not received. */
export const isDependencyOverdue = (t: Task, today = todayISO()) => isWaiting(t) && !!t.expectedDate && t.expectedDate < today;

export function riskScore(r: Pick<Risk, 'probability' | 'impact'>) { return r.probability * r.impact; }
/** Default scoring matrix (configurable by Superadmin in production): ≥15 critical, ≥10 high, ≥5 medium, else low. */
export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  return score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
}
export const isPendingDecision = (d: Decision) => !d.archived && (d.status === 'proposed' || d.status === 'under_review');

export type TaskView =
  | 'my' | 'team' | 'unassigned' | 'overdue' | 'due_soon' | 'waiting_ext' | 'waiting_int' | 'followup' | 'blocked' | 'completed' | 'all';

export const TASK_VIEWS: { key: TaskView; label: string }[] = [
  { key: 'my', label: 'My Tasks' },
  { key: 'team', label: 'Team Tasks' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due_soon', label: 'Due Soon' },
  { key: 'waiting_ext', label: 'Waiting – External' },
  { key: 'waiting_int', label: 'Waiting – Internal' },
  { key: 'followup', label: 'Follow-up Due' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export function applyTaskView(tasks: Task[], view: TaskView, me?: ID, today = todayISO()): Task[] {
  switch (view) {
    case 'my': return tasks.filter((t) => isActiveTask(t) && (t.ownerId === me || t.contributorIds.includes(me ?? '')));
    case 'team': return tasks.filter(isActiveTask);
    case 'unassigned': return tasks.filter((t) => isActiveTask(t) && !t.ownerId);
    case 'overdue': return tasks.filter((t) => isOverdue(t, today));
    case 'due_soon': return tasks.filter((t) => isDueSoon(t, today));
    case 'waiting_ext': return tasks.filter((t) => isWaiting(t) && t.dependencyType === 'external');
    case 'waiting_int': return tasks.filter((t) => isWaiting(t) && t.dependencyType === 'internal');
    case 'followup': return tasks.filter((t) => isFollowUpDue(t, today));
    case 'blocked': return tasks.filter((t) => isActiveTask(t) && t.status === 'blocked');
    case 'completed': return tasks.filter((t) => !t.archived && t.status === 'completed');
    default: return tasks.filter((t) => !t.archived);
  }
}

/** Attention ordering: overdue → blocked → critical → follow-up due → due date. */
export function attentionSort(a: Task, b: Task, today = todayISO()): number {
  const w = (t: Task) => (isOverdue(t, today) ? 0 : t.status === 'blocked' ? 1 : t.priority === 'critical' ? 2 : isFollowUpDue(t, today) ? 3 : 4);
  return w(a) - w(b) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
}

// ---------- Trainer counting rules ----------
// Unique trainers: each trainer record counted once within the result set.
// Qualification records: one per (trainer × qualification category × aircraft) – a TRE/SEN trainer
// qualified on A320 and B737 contributes 4 qualification records but only 1 unique trainer.

export interface TrainerFilter { aircraft: 'ALL' | 'A320' | 'B737'; base: string; qual: string; authority: string; ore: string; partTime: string; q: string }
export const EMPTY_TRAINER_FILTER: TrainerFilter = { aircraft: 'ALL', base: 'ALL', qual: 'ALL', authority: 'ALL', ore: 'ALL', partTime: 'ALL', q: '' };

export function filterTrainers(list: Trainer[], f: TrainerFilter): Trainer[] {
  const q = f.q.trim().toLowerCase();
  return list.filter((t) => !t.archived
    && (f.aircraft === 'ALL' || t.aircraft.includes(f.aircraft))
    && (f.base === 'ALL' || t.bases.includes(f.base))
    && (f.qual === 'ALL' || t.quals.includes(f.qual))
    && (f.authority === 'ALL' || (f.authority === '__missing' ? !t.authority : t.authority === f.authority))
    && (f.ore === 'ALL' || (f.ore === '__missing' ? !t.ore : t.ore === f.ore))
    && (f.partTime === 'ALL' || (f.partTime === '__missing' ? !t.partTimeRaw : t.partTimeRaw === f.partTime))
    && (!q || t.name.toLowerCase().includes(q) || t.tlc.toLowerCase().includes(q)));
}

export function countBy<T>(list: T[], key: (t: T) => string | undefined): { key: string; count: number }[] {
  const m = new Map<string, number>();
  list.forEach((t) => { const k = key(t) ?? '__missing'; m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

/** Qualification-record counts per category, split by aircraft. */
export function qualByAircraft(list: Trainer[], quals: string[], aircraftScope: 'ALL' | 'A320' | 'B737') {
  return quals.map((q) => {
    const row: { qual: string; A320: number; B737: number } = { qual: q, A320: 0, B737: 0 };
    list.forEach((t) => {
      if (!t.quals.includes(q)) return;
      t.aircraft.forEach((ac) => { if (aircraftScope === 'ALL' || aircraftScope === ac) row[ac] += 1; });
    });
    return row;
  });
}

export const missingFields = (t: Trainer) =>
  ([['Part Time', t.partTimeRaw], ['SIM Sessions', t.simSessions], ['LIFUS Legs', t.lifusLegs], ['ORE', t.ore], ['Issuing authority', t.authority]] as const)
    .filter(([, v]) => v === undefined || v === '').map(([k]) => k);
