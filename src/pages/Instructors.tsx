import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, Upload, RotateCcw, Search, Info, Plus, Columns3, Pencil, ChevronUp, ChevronDown, ArrowUpDown, Trash2, X, Archive, BarChart3, Table2,
} from 'lucide-react';
import { DEFAULT_TRAINER_COLUMNS, useStore } from '../store/store';
import { Button, Card, CardHeader, Drawer, EmptyState, Field, HBar, Input, Modal, SectionTitle, Segmented, Select, Tag, cx } from '../components/ui';
import { EMPTY_TRAINER_FILTER, countBy, filterTrainers, missingFields, qualByAircraft, type TrainerFilter } from '../lib/metrics';
import { fmtDate, todayISO } from '../lib/dates';
import { downloadCsv } from '../lib/export';
import { EW } from '../assets/icons';
import type { CustomColumn, Trainer } from '../types';

const MISSING = '__missing';
const label = (k: string) => (k === MISSING ? 'Not recorded' : k);

// ---------- Column registry (built-in source columns + user-defined columns) ----------
interface ColDef { id: string; label: string; value: (t: Trainer) => string | number | undefined; render?: (t: Trainer) => ReactNode; locked?: boolean; custom?: boolean }

const BUILTIN: ColDef[] = [
  { id: 'tlc', label: 'TLC', value: (t) => t.tlc, render: (t) => <span className="font-mono font-bold text-ink">{t.tlc}</span> },
  { id: 'name', label: 'Name', value: (t) => t.name, render: (t) => <span className="font-semibold text-ink">{t.name}</span>, locked: true },
  { id: 'qual', label: 'Trainer Qual', value: (t) => t.trainerQualRaw },
  { id: 'aircraft', label: 'Aircraft', value: (t) => t.aircraft.join(' + ') },
  { id: 'base', label: 'Base', value: (t) => t.bases.join(', ') },
  { id: 'remark', label: 'Remark', value: (t) => t.remark },
  { id: 'partTime', label: 'Part Time', value: (t) => t.partTimeRaw },
  { id: 'sim', label: 'SIM Sessions', value: (t) => t.simSessions },
  { id: 'lifus', label: 'LIFUS Legs', value: (t) => t.lifusLegs },
  { id: 'ore', label: 'ORE', value: (t) => t.ore },
  { id: 'sinceLtc', label: 'Trainer seit LTC', value: (t) => t.sinceLtc, render: (t) => (t.sinceLtc ? fmtDate(t.sinceLtc) : undefined) },
  { id: 'sinceTri', label: 'Trainer seit TRI', value: (t) => t.sinceTri, render: (t) => (t.sinceTri ? fmtDate(t.sinceTri) : undefined) },
  { id: 'sinceTre', label: 'Trainer seit TRE', value: (t) => t.sinceTre, render: (t) => (t.sinceTre ? fmtDate(t.sinceTre) : undefined) },
  { id: 'authority', label: 'Issuing authority', value: (t) => t.authority },
  { id: 'bAb', label: 'B ab', value: (t) => t.bAbRaw },
  {
    id: 'data', label: 'Data', value: (t) => missingFields(t).length,
    render: (t) => (missingFields(t).length ? <span className="font-bold text-status-amber">{missingFields(t).length} missing</span> : <span className="text-status-green">complete</span>),
  },
];

function useColumns() {
  const custom = useStore((s) => s.data.trainerColumns);
  const visible = useStore((s) => s.trainerView.visible);
  const all: ColDef[] = useMemo(() => [
    ...BUILTIN,
    ...custom.map((c): ColDef => ({ id: c.id, label: c.label, value: (t) => t.custom?.[c.id], custom: true })),
  ], [custom]);
  const shown = visible.map((id) => all.find((c) => c.id === id)).filter((c): c is ColDef => !!c);
  if (!shown.some((c) => c.id === 'name')) shown.unshift(all.find((c) => c.id === 'name')!);
  return { all, shown };
}

export function InstructorsPage() {
  const trainers = useStore((s) => s.data.trainers);
  const quals = useStore((s) => s.data.qualificationTypes);
  const bases = useStore((s) => s.data.bases);
  const globalFleet = useStore((s) => s.filters.fleet);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'analytics' ? 'analytics' : 'roster';
  const [f, setF] = useState<TrainerFilter>({ ...EMPTY_TRAINER_FILTER, aircraft: globalFleet });
  const [onlyMissing, setOnlyMissing] = useState(params.get('missing') === '1');
  const [importOpen, setImportOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 }>({ id: 'name', dir: 1 });
  const openId = params.get('open');
  const { all, shown } = useColumns();

  useEffect(() => {
    if (params.get('new')) { setEditing(blankTrainer()); params.delete('new'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const list = useMemo(() => filterTrainers(trainers, f).filter((t) => !onlyMissing || missingFields(t).length > 0), [trainers, f, onlyMissing]);
  const sorted = useMemo(() => {
    const col = all.find((c) => c.id === sort.id) ?? all[1];
    return [...list].sort((a, b) => {
      const va = col.value(a); const vb = col.value(b);
      if (va === undefined || va === '') return 1;
      if (vb === undefined || vb === '') return -1;
      return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * sort.dir;
    });
  }, [list, sort, all]);

  const setTab = (t: 'roster' | 'analytics') => { params.set('tab', t); setParams(params); };
  const filterFromChart = (k: keyof TrainerFilter, v: string) => { setF((x) => ({ ...x, [k]: x[k] === v ? 'ALL' : v })); setTab('roster'); };
  const openTrainer = trainers.find((t) => t.id === openId);
  const activeCount = Object.entries(f).filter(([k, v]) => (k === 'q' ? v !== '' : v !== 'ALL')).length + (onlyMissing ? 1 : 0);

  const chips: { label: string; clear: () => void }[] = [];
  if (f.authority !== 'ALL') chips.push({ label: `Authority: ${label(f.authority)}`, clear: () => setF({ ...f, authority: 'ALL' }) });
  if (f.ore !== 'ALL') chips.push({ label: `ORE: ${label(f.ore)}`, clear: () => setF({ ...f, ore: 'ALL' }) });
  if (f.partTime !== 'ALL') chips.push({ label: `Part time: ${label(f.partTime)}`, clear: () => setF({ ...f, partTime: 'ALL' }) });
  if (onlyMissing) chips.push({ label: 'Missing data only', clear: () => setOnlyMissing(false) });

  const exportCsv = () => downloadCsv(`wings-control-trainers-${todayISO()}.csv`, sorted.map((t) => Object.fromEntries([
    ['Trainer ID', t.id], ...shown.map((c) => [c.label, c.value(t) ?? '']),
  ])), { columns: shown.map((c) => c.label).join('/'), aircraft: f.aircraft, base: f.base, qual: f.qual });

  return (
    <div>
      <SectionTitle title="Trainers" subtitle={`${list.length} of ${trainers.filter((t) => !t.archived).length} trainers · source snapshot ${fmtDate(trainers.find((t) => t.origin !== 'manual')?.sourceSnapshot)} (synthetic)`}
        actions={<>
          <Button onClick={() => setImportOpen(true)}><Upload size={16} /> <span className="hidden sm:inline">Import</span></Button>
          <Button onClick={exportCsv}><Download size={16} /> <span className="hidden sm:inline">Export</span></Button>
          <Button variant="primary" onClick={() => setEditing(blankTrainer())}><Plus size={16} /> Add trainer</Button>
        </>} />

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-line" role="tablist">
        {([['roster', 'Roster', Table2], ['analytics', 'Analytics', BarChart3]] as const).map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx('-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-bold', tab === k ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink')}>
            <I size={16} /> {l}
          </button>
        ))}
      </div>

      {/* Shared filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search name or TLC" className="h-9 pl-9" aria-label="Search trainers" />
        </div>
        <Segmented label="Aircraft" value={f.aircraft} onChange={(v) => setF({ ...f, aircraft: v })} options={[{ value: 'ALL', label: 'All' }, { value: 'A320', label: 'A320' }, { value: 'B737', label: 'B737' }]} />
        <Select value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} className="h-9 w-auto text-sm" aria-label="Base">
          <option value="ALL">All bases</option>{bases.filter((b) => b.active).map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
        </Select>
        <Select value={f.qual} onChange={(e) => setF({ ...f, qual: e.target.value })} className="h-9 w-auto text-sm" aria-label="Qualification">
          <option value="ALL">All qualifications</option>{quals.map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
        {tab === 'roster' && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant={onlyMissing ? 'primary' : 'secondary'} onClick={() => setOnlyMissing((x) => !x)}>Missing data</Button>
            <Button size="sm" onClick={() => setColumnsOpen(true)}><Columns3 size={15} /> Columns</Button>
          </div>
        )}
      </div>
      {(chips.length > 0 || activeCount > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex h-7 items-center gap-1 rounded-full border border-brand/30 bg-brand-tint pl-2.5 pr-1.5 text-xs font-semibold text-brand-dark">{c.label} <X size={13} /></button>
          ))}
          <button onClick={() => { setF({ ...EMPTY_TRAINER_FILTER }); setOnlyMissing(false); }} className="inline-flex h-7 items-center gap-1 px-2 text-xs font-bold text-brand hover:underline"><RotateCcw size={12} /> Clear all</button>
        </div>
      )}

      {tab === 'roster' ? (
        <Card>
          {sorted.length === 0 ? <EmptyState icon={EW.team} title="No trainers match the filters" action={<Button variant="primary" onClick={() => setEditing(blankTrainer())}><Plus size={16} /> Add trainer</Button>} /> : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line/70 bg-surface-subtle text-[11px] uppercase tracking-wide text-ink-soft">
                    <tr>
                      {shown.map((c) => (
                        <th key={c.id} className="whitespace-nowrap px-3 py-2.5 font-bold first:pl-5">
                          <button onClick={() => setSort((s) => ({ id: c.id, dir: s.id === c.id ? (s.dir === 1 ? -1 : 1) : 1 }))} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                            {c.label}{sort.id === c.id ? (sort.dir === 1 ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ArrowUpDown size={11} className="opacity-40" />}
                          </button>
                        </th>
                      ))}
                      <th className="w-12 px-3" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {sorted.map((t) => (
                      <tr key={t.id} className="group cursor-pointer hover:bg-surface-subtle" onClick={() => { params.set('open', t.id); setParams(params); }}>
                        {shown.map((c) => {
                          const v = c.render ? c.render(t) : c.value(t);
                          return <td key={c.id} className="whitespace-nowrap px-3 py-2.5 text-ink-muted first:pl-5">{v === undefined || v === '' ? <span className="text-ink-soft/70">—</span> : v}</td>;
                        })}
                        <td className="px-3 py-2.5 text-right">
                          <button aria-label={`Edit ${t.name}`} onClick={(e) => { e.stopPropagation(); setEditing(t); }} className="rounded-md p-1.5 text-ink-soft opacity-60 hover:bg-white hover:text-brand group-hover:opacity-100"><Pencil size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line/60 md:hidden">
                {sorted.map((t) => (
                  <li key={t.id}>
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => { params.set('open', t.id); setParams(params); }}>
                      <span className="w-11 shrink-0 rounded-md bg-surface-muted py-1 text-center font-mono text-xs font-bold">{t.tlc}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{t.name}</span><span className="text-xs text-ink-soft">{t.trainerQualRaw} · {t.aircraft.join('+')} · {t.bases.join(', ')}</span></span>
                      {missingFields(t).length > 0 && <span className="text-[11px] font-bold text-status-amber">{missingFields(t).length} missing</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line/60 px-5 py-2.5 text-xs text-ink-soft">{sorted.length} trainers · {shown.length} of {all.length} columns shown · SIM / LIFUS are recorded counts, not availability or currency</div>
            </>
          )}
        </Card>
      ) : (
        <Analytics list={list} f={f} onFilter={filterFromChart} onBase={(b) => { setF((x) => ({ ...x, base: x.base === b ? 'ALL' : b })); setTab('roster'); }} />
      )}

      {openTrainer && <TrainerProfile t={openTrainer} onClose={() => { params.delete('open'); setParams(params); }} onEdit={() => setEditing(openTrainer)} />}
      {editing && <TrainerForm trainer={editing} onClose={() => setEditing(null)} />}
      {columnsOpen && <ColumnManager onClose={() => setColumnsOpen(false)} />}
      <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

// ---------- Analytics tab ----------
function Analytics({ list, f, onFilter, onBase }: { list: Trainer[]; f: TrainerFilter; onFilter: (k: keyof TrainerFilter, v: string) => void; onBase: (b: string) => void }) {
  const quals = useStore((s) => s.data.qualificationTypes);
  const bases = useStore((s) => s.data.bases);
  const qualRows = qualByAircraft(list, quals, f.aircraft);
  const qualMax = Math.max(1, ...qualRows.map((r) => r.A320 + r.B737));
  const qualRecords = qualRows.reduce((s, r) => s + r.A320 + r.B737, 0);
  const byAuthority = countBy(list, (t) => t.authority);
  const byPart = countBy(list, (t) => t.partTimeRaw);
  const byOre = countBy(list, (t) => t.ore);
  const m = new Map<string, Trainer[]>();
  list.forEach((t) => t.bases.forEach((b) => m.set(b, [...(m.get(b) ?? []), t])));
  const byBase = bases.filter((b) => m.has(b.code)).map((b) => ({ base: b.code, trainers: m.get(b.code)! })).sort((a, b) => b.trainers.length - a.trainers.length);
  const sum = (k: 'simSessions' | 'lifusLegs') => list.reduce((s, t) => s + (t[k] ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi v={list.length} l="Unique trainers" />
        <Kpi v={qualRecords} l="Qualification records" hint="trainer × category × aircraft" />
        <Kpi v={sum('simSessions')} l="SIM sessions (recorded)" hint={`${list.filter((t) => t.simSessions !== undefined).length} of ${list.length} with data`} />
        <Kpi v={sum('lifusLegs')} l="LIFUS legs (recorded)" hint={`${list.filter((t) => t.lifusLegs !== undefined).length} of ${list.length} with data`} />
      </div>
      <p className="text-xs text-ink-soft">Click a bar to filter the roster.</p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Issuing Authority" subtitle={`${list.length} trainers · unique count`} />
          <div className="space-y-0.5 border-t border-line/60 px-3 py-3">
            {byAuthority.map((a) => <HBar key={a.key} label={label(a.key)} value={a.count} max={byAuthority[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-brand'} onClick={() => onFilter('authority', a.key)} />)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Qualification by Aircraft" subtitle={`${qualRecords} qualification records · not unique people`} />
          <div className="border-t border-line/60 px-3 py-3">
            <div className="mb-2 flex gap-4 px-1.5 text-[11px] font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" />A320 {qualRows.reduce((s, r) => s + r.A320, 0)}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky" />B737 {qualRows.reduce((s, r) => s + r.B737, 0)}</span>
            </div>
            {qualRows.map((r) => (
              <button key={r.qual} onClick={() => onFilter('qual', r.qual)} aria-label={`${r.qual}: A320 ${r.A320}, B737 ${r.B737}`}
                className="grid w-full grid-cols-[48px_1fr_56px] items-center gap-3 rounded-md px-1.5 py-1.5 text-left hover:bg-surface-subtle">
                <span className="text-xs font-bold text-ink">{r.qual}</span>
                <span className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted"><span className="bg-brand" style={{ width: `${(r.A320 / qualMax) * 100}%` }} /><span className="bg-sky" style={{ width: `${(r.B737 / qualMax) * 100}%` }} /></span>
                <span className="text-right text-xs tabular-nums text-ink-muted"><b className="text-ink">{r.A320}</b> / <b className="text-ink">{r.B737}</b></span>
              </button>
            ))}
            <p className="mt-2 px-1.5 text-[10px] text-ink-soft">A trainer with “TRE/SEN” on A320 and B737 adds 4 records but counts as 1 unique trainer.</p>
          </div>
        </Card>
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Part time & ORE" subtitle="Values as imported" />
          <div className="grid grid-cols-1 gap-4 border-t border-line/60 px-3 py-3 sm:grid-cols-2 xl:grid-cols-1">
            <div>{byPart.map((a) => <HBar key={a.key} label={label(a.key)} value={a.count} max={byPart[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-brand-dark'} onClick={() => onFilter('partTime', a.key)} />)}</div>
            <div>{byOre.map((a) => <HBar key={a.key} label={a.key === MISSING ? 'ORE not recorded' : `ORE ${a.key}`} value={a.count} max={byOre[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-sky'} onClick={() => onFilter('ore', a.key)} />)}</div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Qualification by Aircraft and Base" subtitle="Unique trainers per base · qualification records per category" />
        <div className="grid grid-cols-1 gap-3 border-t border-line/60 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {byBase.map(({ base, trainers: bt }) => {
            const rows = qualByAircraft(bt, quals, f.aircraft).filter((r) => r.A320 + r.B737 > 0);
            const mx = Math.max(1, ...rows.map((r) => r.A320 + r.B737));
            return (
              <button key={base} onClick={() => onBase(base)} className="rounded-lg border border-line/70 p-3 text-left hover:border-brand/40">
                <div className="mb-2 flex items-baseline justify-between"><span className="text-sm font-black text-ink">{base}</span><span className="text-xs font-bold text-ink-muted">{bt.length} trainers</span></div>
                {rows.map((r) => (
                  <div key={r.qual} className="mb-1 grid grid-cols-[36px_1fr_24px] items-center gap-2">
                    <span className="text-[11px] font-bold text-ink-muted">{r.qual}</span>
                    <span className="flex h-2 overflow-hidden rounded-full bg-surface-muted"><span className="bg-brand" style={{ width: `${(r.A320 / mx) * 100}%` }} /><span className="bg-sky" style={{ width: `${(r.B737 / mx) * 100}%` }} /></span>
                    <span className="text-right text-[11px] font-bold tabular-nums">{r.A320 + r.B737}</span>
                  </div>
                ))}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ v, l, hint }: { v: number; l: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-white p-3.5 shadow-card">
      <div className="text-2xl font-black tabular-nums text-ink">{v}</div>
      <div className="text-[11px] font-semibold text-ink-muted">{l}</div>
      {hint && <div className="text-[10px] text-ink-soft">{hint}</div>}
    </div>
  );
}

// ---------- Column manager ----------
function ColumnManager({ onClose }: { onClose: () => void }) {
  const visible = useStore((s) => s.trainerView.visible);
  const setVisible = useStore((s) => s.setTrainerVisibleColumns);
  const custom = useStore((s) => s.data.trainerColumns);
  const trainers = useStore((s) => s.data.trainers);
  const addColumn = useStore((s) => s.addTrainerColumn);
  const deleteColumn = useStore((s) => s.deleteTrainerColumn);
  const { all } = useColumns();
  const [newLabel, setNewLabel] = useState('');
  const [confirm, setConfirm] = useState<CustomColumn | null>(null);

  // Visible columns first (in their order), then hidden ones.
  const ordered = [...visible.map((id) => all.find((c) => c.id === id)).filter((c): c is ColDef => !!c), ...all.filter((c) => !visible.includes(c.id))];
  const toggle = (id: string) => setVisible(visible.includes(id) ? visible.filter((v) => v !== id) : [...visible, id]);
  const move = (id: string, dir: -1 | 1) => {
    const i = visible.indexOf(id); const j = i + dir;
    if (i < 0 || j < 0 || j >= visible.length) return;
    const next = [...visible]; [next[i], next[j]] = [next[j], next[i]]; setVisible(next);
  };
  const valuesIn = (id: string) => trainers.filter((t) => t.custom?.[id]).length;

  return (
    <Modal open onClose={onClose} title="Columns"
      footer={<><Button variant="ghost" className="mr-auto" onClick={() => setVisible(DEFAULT_TRAINER_COLUMNS)}><RotateCcw size={14} /> Default</Button><Button variant="primary" onClick={onClose}>Done</Button></>}>
      <p className="mb-3 text-xs text-ink-soft">Tick to show, untick to hide. Hidden columns keep their data. Your own columns can be deleted (incl. their values).</p>
      <ul className="divide-y divide-line/60 rounded-lg border border-line/70">
        {ordered.map((c) => {
          const on = visible.includes(c.id) || c.locked;
          return (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              <input type="checkbox" id={`col-${c.id}`} checked={!!on} disabled={c.locked} onChange={() => toggle(c.id)} className="h-4 w-4 accent-brand" />
              <label htmlFor={`col-${c.id}`} className={cx('flex-1 text-sm', on ? 'font-semibold text-ink' : 'text-ink-soft')}>
                {c.label}{c.custom && <Tag className="ml-2 bg-sky-lighter text-[#00708C]">own</Tag>}{c.locked && <span className="ml-2 text-[11px] text-ink-soft">always shown</span>}
              </label>
              {visible.includes(c.id) && (
                <>
                  <button aria-label={`Move ${c.label} up`} onClick={() => move(c.id, -1)} className="rounded p-1 text-ink-soft hover:bg-surface-muted"><ChevronUp size={15} /></button>
                  <button aria-label={`Move ${c.label} down`} onClick={() => move(c.id, 1)} className="rounded p-1 text-ink-soft hover:bg-surface-muted"><ChevronDown size={15} /></button>
                </>
              )}
              {c.custom && <button aria-label={`Delete column ${c.label}`} onClick={() => setConfirm(custom.find((x) => x.id === c.id) ?? null)} className="rounded p-1 text-status-red hover:bg-status-redBg"><Trash2 size={15} /></button>}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex gap-2">
        <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New column, e.g. Phone extension" aria-label="New column name"
          onKeyDown={(e) => { if (e.key === 'Enter' && newLabel.trim()) { addColumn(newLabel); setNewLabel(''); } }} />
        <Button disabled={!newLabel.trim() || all.some((c) => c.label.toLowerCase() === newLabel.trim().toLowerCase())} onClick={() => { addColumn(newLabel); setNewLabel(''); }}><Plus size={15} /> Add</Button>
      </div>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Delete column “${confirm?.label}”?`}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => { deleteColumn(confirm!.id); setConfirm(null); }}>Delete column</Button></>}>
        <p className="text-sm text-ink-muted">The column and its values for <b>{confirm ? valuesIn(confirm.id) : 0}</b> trainer(s) will be deleted. This is recorded in the activity log. To keep the data, hide the column instead.</p>
      </Modal>
    </Modal>
  );
}

// ---------- Add / edit trainer ----------
const blankTrainer = (): Trainer => ({
  id: `tr-${Math.random().toString(36).slice(2, 9)}`, tlc: '', name: '', trainerQualRaw: '', quals: [], aircraft: [], bases: [],
  sourceSnapshot: todayISO(), origin: 'manual', editedFields: [], archived: false, custom: {},
});

const PART_TIME_SUGGESTIONS = ['VZ', '0.9', '0.8', '0.75', '0.7', '0.6', '0.5', '0.25', 'DEC', '80% + NOV'];

function TrainerForm({ trainer, onClose }: { trainer: Trainer; onClose: () => void }) {
  const d = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const toast = useStore((s) => s.showToast);
  const isNew = !d.trainers.some((t) => t.id === trainer.id);
  const [t, setT] = useState<Trainer>({ ...trainer, custom: { ...(trainer.custom ?? {}) } });
  const set = <K extends keyof Trainer>(k: K, v: Trainer[K]) => setT((x) => ({ ...x, [k]: v }));
  const toggleIn = <K extends 'quals' | 'aircraft' | 'bases'>(k: K, v: string) =>
    setT((x) => ({ ...x, [k]: (x[k] as string[]).includes(v) ? (x[k] as string[]).filter((y) => y !== v) : [...(x[k] as string[]), v] }));
  const authorities = [...new Set(d.trainers.map((x) => x.authority).filter(Boolean))] as string[];
  const tlcTaken = d.trainers.some((x) => x.id !== t.id && !x.archived && x.tlc.toUpperCase() === t.tlc.trim().toUpperCase());
  const errors = [
    !t.name.trim() && 'Name is required.',
    !t.tlc.trim() && 'TLC is required.',
    tlcTaken && `TLC ${t.tlc.toUpperCase()} is already used.`,
    t.aircraft.length === 0 && 'Select at least one aircraft type.',
    t.bases.length === 0 && 'Select a base.',
  ].filter(Boolean) as string[];
  const [touched, setTouched] = useState(false);

  const save = () => {
    setTouched(true);
    if (errors.length) return;
    const ordered = d.qualificationTypes.filter((q) => t.quals.includes(q));
    const qualsChanged = ordered.join('/') !== trainer.quals.join('/');
    const next: Trainer = {
      ...t, name: t.name.trim(), tlc: t.tlc.trim().toUpperCase(), quals: ordered,
      trainerQualRaw: isNew || qualsChanged ? ordered.join('/') : trainer.trainerQualRaw, // keep the source value unless changed
    };
    if (!isNew && trainer.origin !== 'manual') {
      const changed = (Object.keys(next) as (keyof Trainer)[]).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(trainer[k]) && k !== 'editedFields');
      next.editedFields = [...new Set([...trainer.editedFields, ...changed])];
    }
    upsert('trainers', next, `Trainer ${next.name} (${next.tlc})`);
    toast(isNew ? 'Trainer added' : 'Trainer saved');
    onClose();
  };

  const chip = (on: boolean, text: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cx('h-8 rounded-full border px-3 text-xs font-bold', on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-muted hover:border-ink-soft')}>{text}</button>
  );

  return (
    <Modal open onClose={onClose} title={isNew ? 'Add trainer' : `Edit ${trainer.name}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{isNew ? 'Add trainer' : 'Save'}</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Name *"><Input value={t.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
          <Field label="TLC *"><Input value={t.tlc} maxLength={4} onChange={(e) => set('tlc', e.target.value.toUpperCase())} className="font-mono uppercase" /></Field>
        </div>
        <Field label="Qualifications"><div className="flex flex-wrap gap-1.5">{d.qualificationTypes.map((q) => chip(t.quals.includes(q), q, () => toggleIn('quals', q)))}</div></Field>
        <Field label="Aircraft *"><div className="flex flex-wrap gap-1.5">{(['A320', 'B737'] as const).map((a) => chip(t.aircraft.includes(a), a, () => toggleIn('aircraft', a)))}</div></Field>
        <Field label="Base *"><div className="flex flex-wrap gap-1.5">{d.bases.filter((b) => b.active).map((b) => chip(t.bases.includes(b.code), b.code, () => toggleIn('bases', b.code)))}</div></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Part Time"><Input list="pt-list" value={t.partTimeRaw ?? ''} onChange={(e) => set('partTimeRaw', e.target.value || undefined)} placeholder="e.g. VZ, 0.8" /></Field>
          <Field label="ORE"><Select value={t.ore ?? ''} onChange={(e) => set('ore', (e.target.value || undefined) as Trainer['ore'])}><option value="">—</option><option>A</option><option>B</option><option>C</option><option>Rente</option></Select></Field>
          <Field label="Issuing authority"><Input list="auth-list" value={t.authority ?? ''} onChange={(e) => set('authority', e.target.value || undefined)} /></Field>
          <Field label="B ab"><Input value={t.bAbRaw ?? ''} onChange={(e) => set('bAbRaw', e.target.value || undefined)} /></Field>
          <Field label="SIM sessions"><Input type="number" min={0} value={t.simSessions ?? ''} onChange={(e) => set('simSessions', e.target.value === '' ? undefined : Number(e.target.value))} /></Field>
          <Field label="LIFUS legs"><Input type="number" min={0} value={t.lifusLegs ?? ''} onChange={(e) => set('lifusLegs', e.target.value === '' ? undefined : Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Trainer seit LTC"><Input type="date" value={t.sinceLtc ?? ''} onChange={(e) => set('sinceLtc', e.target.value || undefined)} /></Field>
          <Field label="Trainer seit TRI"><Input type="date" value={t.sinceTri ?? ''} onChange={(e) => set('sinceTri', e.target.value || undefined)} /></Field>
          <Field label="Trainer seit TRE"><Input type="date" value={t.sinceTre ?? ''} onChange={(e) => set('sinceTre', e.target.value || undefined)} /></Field>
        </div>
        <Field label="Remark"><Input value={t.remark ?? ''} onChange={(e) => set('remark', e.target.value || undefined)} /></Field>
        {d.trainerColumns.length > 0 && (
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-subtle p-3">
            {d.trainerColumns.map((c) => (
              <Field key={c.id} label={c.label}><Input value={t.custom?.[c.id] ?? ''} onChange={(e) => setT((x) => ({ ...x, custom: { ...x.custom, [c.id]: e.target.value } }))} /></Field>
            ))}
          </div>
        )}
        <datalist id="pt-list">{PART_TIME_SUGGESTIONS.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="auth-list">{authorities.map((a) => <option key={a} value={a} />)}</datalist>
        {touched && errors.length > 0 && <ul role="alert" className="list-disc rounded-lg bg-status-redBg py-2 pl-7 pr-3 text-sm font-semibold text-status-red">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {!isNew && trainer.origin !== 'manual' && <p className="text-[11px] text-ink-soft">Imported record: fields you change here are marked “maintained” and are not overwritten by a later import.</p>}
      </div>
    </Modal>
  );
}

// ---------- Profile ----------
function TrainerProfile({ t, onClose, onEdit }: { t: Trainer; onClose: () => void; onEdit: () => void }) {
  const custom = useStore((s) => s.data.trainerColumns);
  const setArchived = useStore((s) => s.setArchived);
  const toast = useStore((s) => s.showToast);
  const map: Record<string, string> = { qual: 'trainerQualRaw', partTime: 'partTimeRaw', sim: 'simSessions', lifus: 'lifusLegs', bAb: 'bAbRaw', base: 'bases' };
  const isEdited = (colId: string) => t.origin === 'manual' || t.editedFields.includes(map[colId] ?? colId);
  return (
    <Drawer open onClose={onClose}
      title={<div><div className="flex items-center gap-2"><Tag className="font-mono">{t.tlc}</Tag>{t.origin === 'manual' && <Tag className="bg-sky-lighter text-[#00708C]">added in WINGS CONTROL</Tag>}</div><h2 className="mt-1 text-lg font-extrabold text-ink">{t.name}</h2>
        <p className="text-xs text-ink-soft">{t.origin === 'manual' ? `Added ${fmtDate(t.sourceSnapshot)}` : `Source snapshot ${fmtDate(t.sourceSnapshot)} – not proof of current status`}</p></div>}
      footer={<div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={onEdit}><Pencil size={15} /> Edit</Button>
        <Button onClick={() => window.print()}>Print / PDF</Button>
        <span className="flex-1" />
        <Button variant="ghost" onClick={() => { setArchived('trainers', t.id, true, `Trainer ${t.name}`); toast('Trainer removed from roster (archived – restorable in Administration)'); onClose(); }}><Archive size={15} /> Remove</Button>
      </div>}>
      <dl className="divide-y divide-line/60">
        {BUILTIN.filter((c) => !['tlc', 'name', 'data'].includes(c.id)).map((c) => {
          const v = c.render ? c.render(t) : c.value(t);
          const empty = v === undefined || v === '';
          return (
            <div key={c.id} className="grid grid-cols-[140px_1fr_auto] items-start gap-3 py-2">
              <dt className="text-xs font-semibold text-ink-soft">{c.label}</dt>
              <dd className="text-sm text-ink">{empty ? <span className="italic text-ink-soft">{c.id.startsWith('since') ? 'No date recorded' : 'not recorded'}</span> : v}{c.id === 'bAb' && !empty && <span className="ml-1 text-[11px] text-ink-soft">(meaning unconfirmed)</span>}</dd>
              <span className={cx('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase', isEdited(c.id) ? 'bg-sky-lighter text-[#00708C]' : 'bg-surface-muted text-ink-soft')}>{isEdited(c.id) ? 'maintained' : 'source'}</span>
            </div>
          );
        })}
        {custom.map((c) => (
          <div key={c.id} className="grid grid-cols-[140px_1fr_auto] items-start gap-3 py-2">
            <dt className="text-xs font-semibold text-ink-soft">{c.label}</dt>
            <dd className="text-sm text-ink">{t.custom?.[c.id] || <span className="italic text-ink-soft">not recorded</span>}</dd>
            <span className="rounded bg-sky-lighter px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#00708C]">own</span>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex gap-2 rounded-lg bg-sky-lighter p-3 text-xs text-ink-muted">
        <Info size={16} className="shrink-0 text-sky" />
        <p>“Trainer seit” dates are role start dates, not expiry dates. Missing values are not interpreted as “not qualified”.</p>
      </div>
    </Drawer>
  );
}

// ---------- Import (workflow preview) ----------
function ImportWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [fleet, setFleet] = useState('');
  const cols = ['Trainer Qual', 'Base', 'TLC', 'Name', 'Remark', 'Part Time', 'Trainer SIM Sessions', 'Trainer LIFUS Legs', 'ORE A - C', 'Trainer seit – LTC', 'Trainer seit – TRI', 'Trainer seit – TRE', 'Ausstellende Behörde', 'B ab'];
  const close = () => { setStep(0); setFleet(''); onClose(); };
  return (
    <Modal open={open} onClose={close} title={`Import trainer workbook – step ${step + 1} of 3`}
      footer={<>
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 2 ? <Button variant="primary" disabled={step === 1 && !fleet} onClick={() => setStep(step + 1)}>Next</Button> : <Button variant="primary" onClick={close}>Close (prototype)</Button>}
      </>}>
      {step === 0 && (
        <div className="space-y-3 text-sm text-ink-muted">
          <div className="rounded-xl border-2 border-dashed border-line p-6 text-center">
            <Upload className="mx-auto mb-2 text-ink-soft" />
            <p className="font-semibold text-ink">Drop .xlsx / .csv here</p>
            <p className="text-xs">Prototype: file parsing is not active. The workflow below shows the planned steps.</p>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Column mapping (source → WINGS CONTROL). Source values are preserved verbatim.</p>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-line/70">
            {cols.map((c) => <div key={c} className="flex justify-between border-b border-line/60 px-3 py-1.5 text-xs last:border-0"><span className="font-semibold text-ink">{c}</span><span className="text-ink-soft">→ {c === 'B ab' ? 'B ab (meaning unconfirmed)' : c}</span></div>)}
          </div>
          <Field label="Confirm aircraft / fleet association *">
            <Select value={fleet} onChange={(e) => setFleet(e.target.value)}><option value="">Select…</option><option value="A320">A320</option><option value="B737">B737</option><option value="both">Per row (column)</option></Select>
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2 text-sm">
          <p className="text-ink-muted">Reconciliation preview (example):</p>
          {[['New', 3, 'text-status-green'], ['Updated', 5, 'text-sky'], ['Unchanged', 38, 'text-ink-muted'], ['Duplicate (TLC conflict – manual review)', 1, 'text-status-amber'], ['Rejected', 1, 'text-status-red']].map(([l, n, c]) => (
            <div key={l as string} className="flex justify-between rounded-lg bg-surface-subtle px-3 py-2"><span>{l}</span><b className={c as string}>{n}</b></div>
          ))}
          <p className="text-xs text-ink-soft">Fields maintained in WINGS CONTROL are never silently overwritten.</p>
        </div>
      )}
    </Modal>
  );
}
