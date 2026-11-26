import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Upload, RotateCcw, Search, Info } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Card, CardHeader, Drawer, EmptyState, Field, HBar, Input, Modal, SectionTitle, Segmented, Select, Tag, cx } from '../components/ui';
import { EMPTY_TRAINER_FILTER, countBy, filterTrainers, missingFields, qualByAircraft, type TrainerFilter } from '../lib/metrics';
import { fmtDate } from '../lib/dates';
import { downloadCsv } from '../lib/export';
import { EW } from '../assets/icons';
import type { Trainer } from '../types';

const MISSING = '__missing';
const label = (k: string) => (k === MISSING ? 'Not recorded' : k);

export function InstructorsPage() {
  const trainers = useStore((s) => s.data.trainers);
  const quals = useStore((s) => s.data.qualificationTypes);
  const bases = useStore((s) => s.data.bases);
  const globalFleet = useStore((s) => s.filters.fleet);
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState<TrainerFilter>({ ...EMPTY_TRAINER_FILTER, aircraft: globalFleet });
  const [onlyMissing, setOnlyMissing] = useState(params.get('missing') === '1');
  const [importOpen, setImportOpen] = useState(params.get('new') === '1');
  const openId = params.get('open');

  useEffect(() => { if (params.get('new')) { params.delete('new'); setParams(params, { replace: true }); } }, [params, setParams]);

  const list = useMemo(() => filterTrainers(trainers, f).filter((t) => !onlyMissing || missingFields(t).length > 0), [trainers, f, onlyMissing]);
  const qualRows = useMemo(() => qualByAircraft(list, quals, f.aircraft), [list, quals, f.aircraft]);
  const qualMax = Math.max(1, ...qualRows.map((r) => r.A320 + r.B737));
  const byAuthority = useMemo(() => countBy(list, (t) => t.authority), [list]);
  const byBase = useMemo(() => {
    const m = new Map<string, Trainer[]>();
    list.forEach((t) => t.bases.forEach((b) => m.set(b, [...(m.get(b) ?? []), t])));
    return bases.filter((b) => m.has(b.code)).map((b) => ({ base: b.code, trainers: m.get(b.code)! })).sort((a, b) => b.trainers.length - a.trainers.length);
  }, [list, bases]);
  const byPart = useMemo(() => countBy(list, (t) => t.partTimeRaw), [list]);
  const byOre = useMemo(() => countBy(list, (t) => t.ore), [list]);
  const sim = list.reduce((s, t) => s + (t.simSessions ?? 0), 0);
  const lifus = list.reduce((s, t) => s + (t.lifusLegs ?? 0), 0);
  const simN = list.filter((t) => t.simSessions !== undefined).length;
  const lifusN = list.filter((t) => t.lifusLegs !== undefined).length;
  const qualRecords = qualRows.reduce((s, r) => s + r.A320 + r.B737, 0);
  const snapshot = trainers[0]?.sourceSnapshot;
  const active = Object.entries(f).filter(([k, v]) => (k === 'q' ? v !== '' : v !== 'ALL')).length + (onlyMissing ? 1 : 0);
  const toggle = (k: keyof TrainerFilter, v: string) => setF((x) => ({ ...x, [k]: x[k] === v ? 'ALL' : v }));
  const openTrainer = trainers.find((t) => t.id === openId);

  const exportCsv = () => downloadCsv(`wings-control-trainers-${new Date().toISOString().slice(0, 10)}.csv`, list.map((t) => ({
    'Trainer ID': t.id, TLC: t.tlc, Name: t.name, 'Trainer Qual': t.trainerQualRaw, Aircraft: t.aircraft.join('/'), Base: t.bases.join('/'), Remark: t.remark ?? '',
    'Part Time': t.partTimeRaw ?? '', 'Trainer SIM Sessions': t.simSessions ?? '', 'Trainer LIFUS Legs': t.lifusLegs ?? '', 'ORE A - C': t.ore ?? '',
    'Trainer seit LTC': t.sinceLtc ?? '', 'Trainer seit TRI': t.sinceTri ?? '', 'Trainer seit TRE': t.sinceTre ?? '', 'Ausstellende Behörde': t.authority ?? '', 'B ab': t.bAbRaw ?? '', 'Source snapshot': t.sourceSnapshot,
  })), { aircraft: f.aircraft, base: f.base, qual: f.qual, authority: f.authority, ore: f.ore, partTime: f.partTime, missingOnly: String(onlyMissing) });

  return (
    <div>
      <SectionTitle title="Trainer Overview" subtitle={`Source snapshot ${fmtDate(snapshot)} (synthetic roster) · ${list.length} of ${trainers.filter((t) => !t.archived).length} records in view`}
        actions={<>
          <Button onClick={() => setImportOpen(true)}><Upload size={16} /> <span className="hidden sm:inline">Import</span></Button>
          <Button onClick={exportCsv}><Download size={16} /> <span className="hidden sm:inline">Export view</span></Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented label="Aircraft" value={f.aircraft} onChange={(v) => setF({ ...f, aircraft: v })} options={[{ value: 'ALL', label: 'All' }, { value: 'A320', label: 'A320' }, { value: 'B737', label: 'B737' }]} />
        <Select value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} className="h-9 w-auto text-sm" aria-label="Base">
          <option value="ALL">All Bases</option>{bases.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
        </Select>
        <Select value={f.qual} onChange={(e) => setF({ ...f, qual: e.target.value })} className="h-9 w-auto text-sm" aria-label="Qualification">
          <option value="ALL">All qualifications</option>{quals.map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Name or TLC" className="h-9 pl-9" aria-label="Search trainers" />
        </div>
        {active > 0 && <Button size="sm" variant="ghost" onClick={() => { setF({ ...EMPTY_TRAINER_FILTER }); setOnlyMissing(false); }}><RotateCcw size={14} /> Clear all ({active})</Button>}
      </div>

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi v={list.length} l="Unique trainers" />
        <Kpi v={qualRecords} l="Qualification records" hint="trainer × category × aircraft" />
        <Kpi v={list.filter((t) => t.aircraft.length > 1).length} l="Dual-type (A320 + B737)" />
        <Kpi v={sim} l="SIM sessions (recorded)" hint={`${simN} of ${list.length} with data`} />
        <Kpi v={lifus} l="LIFUS legs (recorded)" hint={`${lifusN} of ${list.length} with data`} />
        <button onClick={() => setOnlyMissing((x) => !x)} className={cx('rounded-xl border bg-white p-3.5 text-left shadow-card', onlyMissing ? 'border-status-amberDot ring-2 ring-status-amberDot/30' : 'border-line/70')}>
          <div className="text-2xl font-black text-status-amber">{trainers.filter((t) => !t.archived && missingFields(t).length).length}</div>
          <div className="text-[11px] font-semibold text-ink-muted">Missing source data</div>
          <div className="text-[10px] text-ink-soft">{onlyMissing ? 'filter active – click to clear' : 'click to filter'}</div>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Issuing Authority" subtitle={`${list.length} trainers · unique count`} />
          <div className="space-y-0.5 border-t border-line/60 px-3 py-3">
            {byAuthority.map((a) => <HBar key={a.key} label={label(a.key)} value={a.count} max={byAuthority[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-brand'} active={f.authority === a.key} onClick={() => toggle('authority', a.key)} />)}
            {byAuthority.length === 0 && <p className="p-3 text-xs text-ink-soft">No records.</p>}
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
              <button key={r.qual} onClick={() => toggle('qual', r.qual)} aria-label={`${r.qual}: A320 ${r.A320}, B737 ${r.B737}`}
                className={cx('grid w-full grid-cols-[48px_1fr_56px] items-center gap-3 rounded-md px-1.5 py-1.5 text-left hover:bg-surface-subtle', f.qual === r.qual && 'bg-brand-tint')}>
                <span className="text-xs font-bold text-ink">{r.qual}</span>
                <span className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
                  <span className="bg-brand" style={{ width: `${(r.A320 / qualMax) * 100}%` }} />
                  <span className="bg-sky" style={{ width: `${(r.B737 / qualMax) * 100}%` }} />
                </span>
                <span className="text-right text-xs tabular-nums text-ink-muted"><b className="text-ink">{r.A320}</b> / <b className="text-ink">{r.B737}</b></span>
              </button>
            ))}
            <p className="mt-2 px-1.5 text-[10px] text-ink-soft">Counting rule: a trainer with “TRE/SEN” on A320 and B737 adds 4 records but counts as 1 unique trainer.</p>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Distribution" subtitle="Part-time (as imported) · ORE category" />
          <div className="grid grid-cols-1 gap-4 border-t border-line/60 px-3 py-3 sm:grid-cols-2 xl:grid-cols-1">
            <div>{byPart.map((a) => <HBar key={a.key} label={label(a.key)} value={a.count} max={byPart[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-brand-dark'} active={f.partTime === a.key} onClick={() => toggle('partTime', a.key)} />)}</div>
            <div>{byOre.map((a) => <HBar key={a.key} label={a.key === MISSING ? 'ORE not recorded' : `ORE ${a.key}`} value={a.count} max={byOre[0]?.count ?? 1} color={a.key === MISSING ? 'bg-status-grey' : 'bg-sky'} active={f.ore === a.key} onClick={() => toggle('ore', a.key)} />)}</div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Qualification by Aircraft and Base" subtitle="Unique trainers per base · qualification records per category" />
        <div className="grid grid-cols-1 gap-3 border-t border-line/60 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {byBase.map(({ base, trainers: bt }) => {
            const rows = qualByAircraft(bt, quals, f.aircraft).filter((r) => r.A320 + r.B737 > 0);
            const mx = Math.max(1, ...rows.map((r) => r.A320 + r.B737));
            return (
              <button key={base} onClick={() => setF({ ...f, base: f.base === base ? 'ALL' : base })} className={cx('rounded-lg border p-3 text-left hover:border-brand/40', f.base === base ? 'border-brand bg-brand-tint/40' : 'border-line/70')}>
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

      <Card className="mt-5">
        <CardHeader title="Trainer Roster" subtitle={`${list.length} records · SIM sessions and LIFUS legs are recorded counts, not availability or currency`} />
        {list.length === 0 ? <EmptyState icon={EW.team} title="No trainers match the filters" /> : (
          <div className="overflow-x-auto border-t border-line/60">
            <table className="hidden w-full text-left text-xs md:table">
              <thead className="bg-surface-subtle text-[10px] uppercase tracking-wide text-ink-soft">
                <tr>{['TLC', 'Name', 'Trainer Qual', 'Aircraft', 'Base', 'Part Time', 'SIM', 'LIFUS', 'ORE', 'Authority', 'Data'].map((h) => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {list.map((t) => (
                  <tr key={t.id} className="cursor-pointer hover:bg-surface-subtle" onClick={() => { params.set('open', t.id); setParams(params); }}>
                    <td className="px-3 py-2 font-mono font-bold text-ink">{t.tlc}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{t.name}</td>
                    <td className="px-3 py-2">{t.trainerQualRaw}</td>
                    <td className="px-3 py-2">{t.aircraft.join(' + ')}</td>
                    <td className="px-3 py-2">{t.bases.join(', ')}</td>
                    <td className="px-3 py-2">{t.partTimeRaw ?? <Missing />}</td>
                    <td className="px-3 py-2 tabular-nums">{t.simSessions ?? <Missing />}</td>
                    <td className="px-3 py-2 tabular-nums">{t.lifusLegs ?? <Missing />}</td>
                    <td className="px-3 py-2">{t.ore ?? <Missing />}</td>
                    <td className="px-3 py-2">{t.authority ?? <Missing />}</td>
                    <td className="px-3 py-2">{missingFields(t).length ? <span className="font-bold text-status-amber">{missingFields(t).length} missing</span> : <span className="text-status-green">complete</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line/60 md:hidden">
              {list.map((t) => (
                <li key={t.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => { params.set('open', t.id); setParams(params); }}>
                    <span className="w-11 shrink-0 rounded-md bg-surface-muted py-1 text-center font-mono text-xs font-bold">{t.tlc}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{t.name}</span><span className="text-xs text-ink-soft">{t.trainerQualRaw} · {t.aircraft.join('+')} · {t.bases.join(', ')}</span></span>
                    {missingFields(t).length > 0 && <span className="text-[11px] font-bold text-status-amber">{missingFields(t).length} missing</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {openTrainer && <TrainerProfile t={openTrainer} onClose={() => { params.delete('open'); setParams(params); }} />}
      <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function Missing() { return <span className="italic text-ink-soft">not recorded</span>; }

function Kpi({ v, l, hint }: { v: number; l: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-white p-3.5 shadow-card">
      <div className="text-2xl font-black tabular-nums text-ink">{v}</div>
      <div className="text-[11px] font-semibold text-ink-muted">{l}</div>
      {hint && <div className="text-[10px] text-ink-soft">{hint}</div>}
    </div>
  );
}

function TrainerProfile({ t, onClose }: { t: Trainer; onClose: () => void }) {
  const upsert = useStore((s) => s.upsert);
  const [remark, setRemark] = useState(t.remark ?? '');
  const row = (k: string, v: React.ReactNode, src: 'source' | 'edited' = 'source') => (
    <div className="grid grid-cols-[150px_1fr_auto] items-start gap-3 py-2">
      <dt className="text-xs font-semibold text-ink-soft">{k}</dt>
      <dd className="text-sm text-ink">{v ?? <Missing />}</dd>
      <span className={cx('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase', src === 'edited' ? 'bg-sky-lighter text-[#00708C]' : 'bg-surface-muted text-ink-soft')}>{src === 'edited' ? 'maintained' : 'source'}</span>
    </div>
  );
  return (
    <Drawer open onClose={onClose}
      title={<div><div className="flex items-center gap-2"><Tag className="font-mono">{t.tlc}</Tag><span className="text-xs text-ink-soft">ID {t.id}</span></div><h2 className="mt-1 text-lg font-extrabold text-ink">{t.name}</h2><p className="text-xs text-ink-soft">Source snapshot {fmtDate(t.sourceSnapshot)} – not proof of current status</p></div>}
      footer={<div className="flex justify-end gap-2"><Button onClick={() => window.print()}>Print / PDF</Button><Button variant="primary" onClick={() => { upsert('trainers', { ...t, remark: remark || undefined, editedFields: [...new Set([...t.editedFields, 'remark'])] }, `Trainer ${t.name}`); onClose(); }}>Save</Button></div>}>
      <dl className="divide-y divide-line/60">
        {row('Trainer Qual', t.trainerQualRaw)}
        {row('Parsed categories', t.quals.join(', '))}
        {row('Aircraft', t.aircraft.join(' + '))}
        {row('Base', t.bases.join(', '))}
        {row('Part Time', t.partTimeRaw)}
        {row('Trainer SIM Sessions', t.simSessions)}
        {row('Trainer LIFUS Legs', t.lifusLegs)}
        {row('ORE A - C', t.ore)}
        {row('Trainer seit – LTC', t.sinceLtc ? fmtDate(t.sinceLtc) : <span className="italic text-ink-soft">No date recorded</span>)}
        {row('Trainer seit – TRI', t.sinceTri ? fmtDate(t.sinceTri) : <span className="italic text-ink-soft">No date recorded</span>)}
        {row('Trainer seit – TRE', t.sinceTre ? fmtDate(t.sinceTre) : <span className="italic text-ink-soft">No date recorded</span>)}
        {row('Ausstellende Behörde', t.authority)}
        {row('B ab', t.bAbRaw ? <span>{t.bAbRaw} <span className="text-[11px] text-ink-soft">(meaning unconfirmed)</span></span> : undefined)}
      </dl>
      <div className="mt-4">
        <Field label="Remark" hint={t.editedFields.includes('remark') ? 'Maintained in WINGS CONTROL – will not be overwritten by re-import.' : 'Imported from source.'}>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex gap-2 rounded-lg bg-sky-lighter p-3 text-xs text-ink-muted">
        <Info size={16} className="shrink-0 text-sky" />
        <p>“Trainer seit” dates are role start dates, not expiry dates. No verified qualification validity is loaded, so no expiry alerts are shown. Missing values are not interpreted as “not qualified”.</p>
      </div>
    </Drawer>
  );
}

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
          <p className="text-xs">Macros and embedded content are never executed. Original file is stored with the import record.</p>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Column mapping (source → WINGS CONTROL). Source values are preserved verbatim.</p>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-line/70">
            {cols.map((c) => <div key={c} className="flex justify-between border-b border-line/60 px-3 py-1.5 text-xs last:border-0"><span className="font-semibold text-ink">{c}</span><span className="text-ink-soft">→ {c === 'B ab' ? 'B ab (meaning unconfirmed)' : c}</span></div>)}
          </div>
          <Field label="Confirm aircraft / fleet association *" hint="Required – the workbook title alone is not used to infer the fleet.">
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
          <p className="text-xs text-ink-soft">Fields maintained in WINGS CONTROL are never silently overwritten. Import date, filename, user and mapping version are recorded.</p>
        </div>
      )}
    </Modal>
  );
}
