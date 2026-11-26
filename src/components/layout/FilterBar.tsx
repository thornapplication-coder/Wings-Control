import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../../store/store';
import type { Filters } from '../../types';
import { Button, Field, Modal, Segmented, Select, cx } from '../ui';

const FLEET_OPTS: { value: Filters['fleet']; label: string }[] = [
  { value: 'ALL', label: 'All Fleets' }, { value: 'A320', label: 'A320' }, { value: 'B737', label: 'B737 MAX' },
];

/** Global filter context (fleet / base / project). Shared by dashboard, projects and action tracker. */
export function FilterBar({ showBase = true, showProject = true, resultCount, resultLabel }: { showBase?: boolean; showProject?: boolean; resultCount?: number; resultLabel?: string }) {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const clear = useStore((s) => s.clearFilters);
  const bases = useStore((s) => s.data.bases.filter((b) => b.active));
  const projects = useStore((s) => s.data.projects.filter((p) => !p.archived));
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);

  const chips: { key: keyof Filters; label: string }[] = [];
  if (filters.fleet !== 'ALL') chips.push({ key: 'fleet', label: `Fleet: ${filters.fleet === 'B737' ? 'B737 MAX' : filters.fleet}` });
  if (showBase && filters.base !== 'ALL') chips.push({ key: 'base', label: `Base: ${filters.base}` });
  if (showProject && filters.projectId !== 'ALL') chips.push({ key: 'projectId', label: `Project: ${projects.find((p) => p.id === filters.projectId)?.title ?? '?'}` });

  const baseSelect = (value: string, on: (v: string) => void) => (
    <Select aria-label="Base" value={value} onChange={(e) => on(e.target.value)} className="h-9 w-full text-sm lg:w-36">
      <option value="ALL">All Bases</option>
      <optgroup label="Bases">{bases.filter((b) => b.kind === 'base').map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}</optgroup>
      <optgroup label="WP Bases">{bases.filter((b) => b.kind === 'wp').map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}</optgroup>
    </Select>
  );
  const projectSelect = (value: string, on: (v: string) => void) => (
    <Select aria-label="Project" value={value} onChange={(e) => on(e.target.value)} className="h-9 w-full text-sm lg:w-56">
      <option value="ALL">All Projects</option>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
    </Select>
  );

  return (
    <div className="mb-5">
      {/* Desktop / iPad landscape */}
      <div className="hidden flex-wrap items-center gap-2 lg:flex">
        <Segmented label="Fleet" value={filters.fleet} onChange={(v) => setFilters({ fleet: v })} options={FLEET_OPTS} />
        {showBase && baseSelect(filters.base, (v) => setFilters({ base: v }))}
        {showProject && projectSelect(filters.projectId, (v) => setFilters({ projectId: v }))}
        {resultCount !== undefined && <span className="ml-auto text-xs font-semibold text-ink-soft">{resultCount} {resultLabel ?? 'results'}</span>}
      </div>
      {/* iPhone / iPad portrait */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <Segmented label="Fleet" value={filters.fleet} onChange={(v) => setFilters({ fleet: v })} options={FLEET_OPTS} />
        </div>
        {(showBase || showProject) && (
          <Button size="sm" onClick={() => { setDraft(filters); setSheet(true); }} aria-label="More filters">
            <SlidersHorizontal size={15} /> Filters{chips.filter((c) => c.key !== 'fleet').length > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">{chips.filter((c) => c.key !== 'fleet').length}</span>}
          </Button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button key={c.key} onClick={() => setFilters({ [c.key]: 'ALL' } as Partial<Filters>)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-brand/30 bg-brand-tint pl-2.5 pr-1.5 text-xs font-semibold text-brand-dark hover:border-brand">
              {c.label} <X size={13} aria-label="Remove filter" />
            </button>
          ))}
          <button onClick={clear} className={cx('h-7 px-2 text-xs font-bold text-brand hover:underline')}>Clear all</button>
          {resultCount !== undefined && <span className="ml-auto text-xs font-semibold text-ink-soft lg:hidden">{resultCount} {resultLabel ?? 'results'}</span>}
        </div>
      )}

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters"
        footer={<><Button variant="ghost" onClick={() => { clear(); setSheet(false); }}>Reset</Button><Button variant="primary" onClick={() => { setFilters(draft); setSheet(false); }}>Apply</Button></>}>
        <div className="space-y-4">
          <Field label="Fleet">
            <Segmented label="Fleet" value={draft.fleet} onChange={(v) => setDraft({ ...draft, fleet: v })} options={FLEET_OPTS} />
          </Field>
          {showBase && <Field label="Base">{baseSelect(draft.base, (v) => setDraft({ ...draft, base: v }))}</Field>}
          {showProject && <Field label="Project / programme">{projectSelect(draft.projectId, (v) => setDraft({ ...draft, projectId: v }))}</Field>}
          <p className="text-xs text-ink-soft">General / Both items stay visible under a fleet filter. Items without a base stay visible under a base filter.</p>
        </div>
      </Modal>
    </div>
  );
}
