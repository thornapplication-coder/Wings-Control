import { useMemo, useState } from 'react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Card, FleetTag, SectionTitle, Select, cx } from '../components/ui';
import { fleetMatch } from '../lib/metrics';
import { fmtShort, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { ComplianceItem } from '../types';

const CAT: Record<ComplianceItem['category'], string> = {
  authority_approval: 'Authority approval', ato_approval: 'ATO approval', programme_approval: 'Training programme approval', manual_revision: 'Manual revision',
  osd: 'OSD item', reg_change: 'Regulatory change', audit_finding: 'Audit finding', corrective_action: 'Corrective action',
};
const STEPS: ComplianceItem['status'][] = ['planned', 'in_preparation', 'submitted', 'approved'];

export function CompliancePage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const [cat, setCat] = useState('ALL');
  const T = todayISO();
  const list = useMemo(() => data.compliance.filter((c) => !c.archived && fleetMatch(c.fleet, filters.fleet) && (cat === 'ALL' || c.category === cat)), [data.compliance, filters, cat]);
  return (
    <div>
      <SectionTitle title="Compliance & Approvals" />
      <FilterBar showBase={false} showProject={false} resultCount={list.length} resultLabel="items" />
      <div className="mb-4"><Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto" aria-label="Category"><option value="ALL">All categories</option>{Object.entries(CAT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const idx = STEPS.indexOf(c.status);
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><span className="text-xs font-bold text-brand">{c.ref}</span><FleetTag fleet={c.fleet} /></div>
              <h3 className="mt-1 font-bold leading-snug text-ink">{c.title}</h3>
              <p className="mt-1 text-xs text-ink-soft">{CAT[c.category]} · {c.authority}</p>
              {idx >= 0 && (
                <div className="mt-3 flex gap-1" aria-label={`Status: ${c.status}`}>
                  {STEPS.map((s, i) => <span key={s} className={cx('h-1.5 flex-1 rounded-full', i <= idx ? 'bg-brand' : 'bg-surface-muted')} title={s} />)}
                </div>
              )}
              <div className="mt-3 flex justify-between text-xs">
                <span className="font-semibold capitalize text-ink">{c.status.replace('_', ' ')}</span>
                <span className={cx(c.dueDate && c.dueDate < T ? 'font-bold text-status-red' : 'text-ink-muted')}>due {fmtShort(c.dueDate)}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">Owner {memberName(data.members, c.ownerId)}{c.submittedDate && ` · submitted ${fmtShort(c.submittedDate)}`}</p>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && <Card><div className="p-8 text-center"><img src={EW.regulation} alt="" className="mx-auto mb-2 h-14" /><p className="text-sm font-bold">No items</p></div></Card>}
    </div>
  );
}
