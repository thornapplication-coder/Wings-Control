import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Send, AlertTriangle, Gavel, Pencil } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { Button, Field, RagBadge, Select, Textarea, TrendBadge, cx } from '../components/ui';
import { isPendingDecision, riskLevel, riskScore } from '../lib/metrics';
import { addDays, daysBetween, fmtDate, fmtDateTime, fmtShort, isoWeek, startOfIsoWeek, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { Rag, Trend } from '../types';

// Programme-specific KPI panel – configured per report (synthetic example values, manually entered).
const PILOT_SELECTION = { label: 'Pilot selection', total: 96, categories: [
  { name: 'CPT TRI/TRE', selected: 8, target: 10 },
  { name: 'CPT', selected: 22, target: 38 },
  { name: 'F/O', selected: 19, target: 48 },
] };

export function WeeklyReportPage() {
  const { projectId } = useParams();
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session)!;
  const toast = useStore((s) => s.showToast);
  const nav = useNavigate();
  const T = todayISO();
  const p = data.projects.find((x) => x.id === projectId);
  const [rag, setRag] = useState<Rag>(p?.rag ?? 'grey');
  const [trend, setTrend] = useState<Trend>(p?.trend ?? 'unchanged');
  const [rationale, setRationale] = useState('');
  const [summary, setSummary] = useState(
    p?.id === 'p-eis'
      ? 'Programme remains Amber with an improving trend. Trainer nominations for the first wave are complete and the authority submission is on track. The critical path is simulator availability for the first type rating course; a fallback plan (start +2 weeks) is prepared and a management decision on additional FFS budget is required this week.'
      : '',
  );
  const [editing, setEditing] = useState(false);

  const ws = useMemo(() => data.workstreams.filter((w) => w.projectId === projectId).sort((a, b) => a.order - b.order), [data.workstreams, projectId]);
  if (!p) return <div className="p-8">Project not found.</div>;

  const wkStart = startOfIsoWeek(T);
  const wkEnd = addDays(wkStart, 6);
  const target = p.id === 'p-eis' ? data.settings.eisTargetDate : p.targetDate;
  const weeksTo = Math.ceil(daysBetween(T, target) / 7);
  const risks = data.risks.filter((r) => r.projectId === p.id && !r.archived && r.status !== 'closed').sort((a, b) => riskScore(b) - riskScore(a));
  const decisions = data.decisions.filter((d) => (d.projectId === p.id || (p.id === 'p-eis' && d.projectId === 'p-sim')) && isPendingDecision(d));
  const stale = ws.filter((w) => !w.keyFacts || w.rag === 'grey');
  const freshness = [p.updatedAt, ...data.tasks.filter((t) => t.projectId === p.id).map((t) => t.updatedAt)].sort().at(-1);
  const overridden = rag !== p.rag || trend !== p.trend;
  const selected = PILOT_SELECTION.categories.reduce((s, c) => s + c.selected, 0);

  return (
    <div className="min-h-screen bg-surface-muted pb-10">
      <div className="no-print sticky top-0 z-10 border-b border-line/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-2.5">
          <Button variant="ghost" onClick={() => nav(-1)}><ArrowLeft size={16} /> Back</Button>
          <span className="flex-1 text-sm font-bold text-ink">Executive Weekly Report · Preview (draft)</span>
          <Button onClick={() => setEditing((e) => !e)}><Pencil size={15} /> {editing ? 'Done' : 'Edit commentary'}</Button>
          <Button onClick={() => window.print()}><Printer size={16} /> Print / PDF</Button>
          <Button variant="primary" disabled={overridden && !rationale.trim()} onClick={() => toast('Prototype: snapshot not persisted. Production stores an immutable snapshot.')}><Send size={15} /> Publish snapshot</Button>
        </div>
        {stale.length > 0 && <div className="bg-status-amberBg px-4 py-1.5 text-center text-xs font-semibold text-status-amber">Review before publishing: {stale.length} workstream(s) without status or key facts – {stale.map((w) => w.name).join(', ')}</div>}
      </div>

      {editing && (
        <div className="no-print mx-auto mt-4 max-w-[1200px] px-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-line/70 bg-white p-4 md:grid-cols-4">
            <Field label="Overall status (proposed from project)"><Select value={rag} onChange={(e) => setRag(e.target.value as Rag)}><option value="green">Green – On Track</option><option value="amber">Amber – Attention</option><option value="red">Red – Critical</option><option value="grey">Not set</option></Select></Field>
            <Field label="Trend vs previous report"><Select value={trend} onChange={(e) => setTrend(e.target.value as Trend)}><option value="improved">Improved</option><option value="unchanged">Unchanged</option><option value="worse">Worse</option></Select></Field>
            <Field label={`Override rationale${overridden ? ' *' : ''}`} className="md:col-span-2"><Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} className="min-h-[40px]" placeholder={overridden ? 'Required because status/trend differs from the recorded project status' : 'Only required when overriding'} /></Field>
            <Field label="Management summary (manual commentary)" className="md:col-span-4"><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
          </div>
        </div>
      )}

      {/* Report page */}
      <article className="print-page mx-auto mt-4 max-w-[1200px] overflow-hidden rounded-xl border border-line/70 bg-white shadow-card sm:mx-4 lg:mx-auto">
        <header className="flex flex-wrap items-center gap-4 bg-brand px-6 py-4 text-white">
          <img src={EW.signetWhite} alt="" className="h-8 w-10 object-contain" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">Weekly Report · CW {isoWeek(T)} / {T.slice(0, 4)}</div>
            <h1 className="text-xl font-black sm:text-2xl">{p.title}</h1>
            <div className="text-xs text-white/85">Reporting period {fmtDate(wkStart)} – {fmtDate(wkEnd)}</div>
          </div>
          <div className="rounded-lg bg-white/15 px-4 py-2 text-center">
            <div className="text-3xl font-black leading-none">{weeksTo}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide">weeks to {p.id === 'p-eis' ? 'EIS' : 'target'}</div>
            <div className="text-[10px] text-white/80">countdown · {fmtShort(target)}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_340px]">
          <div className="border-b border-line/60 p-5 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Overall</span>
              <RagBadge rag={rag} /> <TrendBadge trend={trend} />
              {overridden && <span className="text-[11px] font-semibold text-status-amber">Overridden by report owner{rationale && `: ${rationale}`}</span>}
            </div>
            <div className="mb-5 rounded-lg border-l-4 border-brand bg-surface-subtle p-3.5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">Management summary · manual commentary</div>
              <p className="text-sm leading-relaxed text-ink">{summary || <span className="italic text-ink-soft">No summary entered.</span>}</p>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-brand text-[10px] uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-2 font-bold">Workstream</th><th className="px-2 py-2 font-bold">Status</th><th className="px-2 py-2 font-bold">Trend</th><th className="py-2 pl-2 font-bold">Key facts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {ws.map((w) => (
                  <tr key={w.id} className="align-top">
                    <td className="py-2.5 pr-2 font-bold text-ink">{w.name}<div className="font-normal text-ink-soft">{memberName(data.members, w.ownerId)}</div></td>
                    <td className="px-2 py-2.5"><RagBadge rag={w.rag} compact /></td>
                    <td className="px-2 py-2.5"><TrendBadge trend={w.trend} /></td>
                    <td className="py-2.5 pl-2 text-ink-muted">{w.keyFacts || <i className="text-status-amber">missing</i>}{w.nextMilestone && <div className="mt-0.5 text-[11px] text-ink-soft">Next: {w.nextMilestone} · {fmtShort(w.nextMilestoneDate)}</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="space-y-5 p-5">
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-status-red"><AlertTriangle size={14} /> At risk</h2>
              <ul className="space-y-2">
                {risks.slice(0, 4).map((r) => (
                  <li key={r.id} className="rounded-lg border border-line/70 p-2.5">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-ink-soft">{r.ref}</span><span className={cx('rounded px-1.5 text-[10px] font-black uppercase', riskLevel(riskScore(r)) === 'critical' ? 'bg-status-red text-white' : 'bg-status-amberBg text-status-amber')}>{riskLevel(riskScore(r))}</span></div>
                    <div className="text-sm font-bold text-ink">{r.title}</div>
                    <div className="text-[11px] text-ink-muted">{r.mitigation}</div>
                    <div className="text-[10px] text-ink-soft">{memberName(data.members, r.ownerId)} · target {fmtShort(r.targetDate ?? r.reviewDate)}</div>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-brand"><Gavel size={14} /> Decisions required</h2>
              <ul className="space-y-2">
                {decisions.map((d) => (
                  <li key={d.id} className="rounded-lg border border-brand/30 bg-brand-tint/40 p-2.5">
                    <div className="text-[11px] font-bold text-ink-soft">{d.ref} · {d.status === 'proposed' ? 'proposed – not approved' : 'under review'}</div>
                    <div className="text-sm font-bold text-ink">{d.title}</div>
                    <div className="text-[11px] text-ink-muted">Decides: <b>{d.authority}</b> · by {fmtShort(d.targetDate)}</div>
                  </li>
                ))}
                {decisions.length === 0 && <li className="text-xs text-ink-soft">No decisions required.</li>}
              </ul>
            </section>
            {p.id === 'p-eis' && (
              <section>
                <h2 className="mb-2 text-xs font-black uppercase tracking-wide text-ink">{PILOT_SELECTION.label}</h2>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-ink">{selected}</span><span className="text-sm font-bold text-ink-soft">/ {PILOT_SELECTION.total} selected</span></div>
                <div className="my-2 h-2.5 rounded-full bg-surface-muted"><div className="h-2.5 rounded-full bg-brand" style={{ width: `${(selected / PILOT_SELECTION.total) * 100}%` }} /></div>
                {PILOT_SELECTION.categories.map((c) => (
                  <div key={c.name} className="mb-1 grid grid-cols-[86px_1fr_44px] items-center gap-2 text-[11px]">
                    <span className="font-semibold text-ink-muted">{c.name}</span>
                    <span className="h-1.5 rounded-full bg-surface-muted"><span className="block h-1.5 rounded-full bg-sky" style={{ width: `${(c.selected / c.target) * 100}%` }} /></span>
                    <span className="text-right font-bold tabular-nums">{c.selected}/{c.target}</span>
                  </div>
                ))}
                <p className="mt-1 text-[10px] text-ink-soft">{PILOT_SELECTION.total - selected} open candidates · manually entered KPI (synthetic)</p>
              </section>
            )}
          </aside>
        </div>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-line/60 bg-surface-subtle px-5 py-2.5 text-[10px] text-ink-soft">
          <span>Report owner: {session.displayName} · Version: draft · Generated {fmtDateTime(new Date().toISOString())}</span>
          <span>Source data last updated {fmtDateTime(freshness)} · Status & trend: recorded values · Summary: manual · SYNTHETIC TEST DATA</span>
        </footer>
      </article>
    </div>
  );
}
