import { useMemo } from 'react';
import { useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Card, EmptyState, FleetTag, SectionTitle, Tag, cx } from '../components/ui';
import { baseMatch, fleetMatch } from '../lib/metrics';
import { fmtDate, fmtShort, relDays, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';

const STATUS_CLS = { planned: 'bg-surface-muted text-ink-muted', confirmed: 'bg-sky-lighter text-[#00708C]', completed: 'bg-status-greenBg text-status-green', cancelled: 'bg-status-redBg text-status-red' };

export function TrainingPage() {
  const events = useStore((s) => s.data.trainingEvents);
  const filters = useStore((s) => s.filters);
  const T = todayISO();
  const list = useMemo(() => events.filter((e) => fleetMatch(e.fleet, filters.fleet) && baseMatch(e.base, filters.base)).sort((a, b) => a.startDate.localeCompare(b.startDate)), [events, filters]);
  const upcoming = list.filter((e) => e.endDate >= T);
  const past = list.filter((e) => e.endDate < T);
  const Row = ({ e }: { e: (typeof list)[number] }) => (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
      <span className="w-24 shrink-0 text-sm font-bold text-ink">{fmtShort(e.startDate)}{e.endDate !== e.startDate && <span className="block text-[11px] font-normal text-ink-soft">→ {fmtShort(e.endDate)}</span>}</span>
      <span className="min-w-0 flex-1 basis-56"><span className="block font-semibold text-ink">{e.title}</span><span className="text-xs text-ink-soft">{e.category} · {e.participants} participants · {e.resource ?? 'no resource assigned'}</span></span>
      <FleetTag fleet={e.fleet} />{e.base && <Tag>{e.base}</Tag>}
      <span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', STATUS_CLS[e.status])}>{e.status}</span>
      <span className="w-20 text-right text-xs text-ink-soft">{e.endDate >= T ? relDays(e.startDate, T) : ''}</span>
    </li>
  );
  return (
    <div>
      <SectionTitle title="Training" />
      <FilterBar showProject={false} resultCount={list.length} resultLabel="events" />
      <Card className="mb-5">
        <div className="flex items-center gap-3 border-b border-line/60 px-5 py-3"><img src={EW.training} alt="" className="h-8 w-8 object-contain" /><h2 className="font-bold text-ink">Upcoming ({upcoming.length})</h2></div>
        {upcoming.length ? <ul className="divide-y divide-line/60">{upcoming.map((e) => <Row key={e.id} e={e} />)}</ul> : <EmptyState title="No upcoming events" />}
      </Card>
      <Card>
        <div className="border-b border-line/60 px-5 py-3"><h2 className="font-bold text-ink">Completed ({past.length})</h2></div>
        <ul className="divide-y divide-line/60">{past.map((e) => <Row key={e.id} e={e} />)}</ul>
      </Card>
      <p className="mt-4 text-xs text-ink-soft">Prototype scope: list view. Planned for Phase 4: training calendar, instructor allocation with conflict detection, participant management. Today: {fmtDate(T)}.</p>
    </div>
  );
}
