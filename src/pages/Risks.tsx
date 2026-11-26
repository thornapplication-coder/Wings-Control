import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { memberName, useStore } from '../store/store';
import { FilterBar } from '../components/layout/FilterBar';
import { Button, Card, EmptyState, Field, FleetTag, Input, Modal, SectionTitle, Select, Tag, Textarea, cx } from '../components/ui';
import { filterDecisions, filterRisks, riskLevel, riskScore } from '../lib/metrics';
import { fmtDate, fmtShort, todayISO } from '../lib/dates';
import { EW } from '../assets/icons';
import type { Decision, DecisionStatus, Risk, RiskStatus } from '../types';

const LVL_CLS = { critical: 'bg-status-red text-white', high: 'bg-status-amberDot text-ink', medium: 'bg-status-amberBg text-status-amber', low: 'bg-surface-muted text-ink-muted' };
const DEC_LABEL: Record<DecisionStatus, string> = { proposed: 'Proposed', under_review: 'Under review', approved: 'Approved', rejected: 'Rejected', superseded: 'Superseded' };

export function RisksPage() {
  const data = useStore((s) => s.data);
  const filters = useStore((s) => s.filters);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'decisions' ? 'decisions' : 'risks';
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [editDec, setEditDec] = useState<Decision | null>(null);
  const T = todayISO();

  useEffect(() => {
    const n = params.get('new');
    if (n === 'risk') setEditRisk(newRisk(data.risks.length));
    if (n === 'decision') setEditDec(newDecision(data.decisions.length));
    if (n) { params.delete('new'); setParams(params, { replace: true }); }
  }, [params, setParams, data.risks.length, data.decisions.length]);

  const risks = useMemo(() => filterRisks(data.risks, filters).sort((a, b) => riskScore(b) - riskScore(a)), [data.risks, filters]);
  const decisions = useMemo(() => filterDecisions(data.decisions, filters), [data.decisions, filters]);

  // 5×5 heat map
  const cell = (p: number, i: number) => risks.filter((r) => r.status !== 'closed' && r.probability === p && r.impact === i);

  return (
    <div>
      <SectionTitle title="Risks & Decisions" subtitle="Risk and issue register · central decision log"
        actions={<Button variant="primary" onClick={() => (tab === 'risks' ? setEditRisk(newRisk(data.risks.length)) : setEditDec(newDecision(data.decisions.length)))}><Plus size={16} /> {tab === 'risks' ? 'Risk / issue' : 'Decision'}</Button>} />
      <FilterBar showBase={false} />
      <div className="mb-4 flex gap-1 border-b border-line" role="tablist">
        {(['risks', 'decisions'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { params.set('tab', k); setParams(params); }}
            className={cx('-mb-px border-b-2 px-3 pb-2.5 text-sm font-bold', tab === k ? 'border-brand text-brand' : 'border-transparent text-ink-muted')}>
            {k === 'risks' ? `Risks & Issues (${risks.length})` : `Decision Log (${decisions.length})`}
          </button>
        ))}
      </div>

      {tab === 'risks' ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="p-4 xl:order-2">
            <h2 className="mb-1 font-bold text-ink">Risk matrix</h2>
            <p className="mb-3 text-xs text-ink-soft">Score = probability × impact. ≥15 critical · ≥10 high · ≥5 medium (configurable by Superadmin).</p>
            <div className="grid grid-cols-[20px_repeat(5,1fr)] gap-1 text-center text-[10px]">
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="contents">
                  <span className="flex items-center justify-center font-bold text-ink-soft">{p}</span>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const lvl = riskLevel(p * i);
                    const n = cell(p, i).length;
                    return <span key={i} className={cx('flex aspect-square items-center justify-center rounded-md text-sm font-black', LVL_CLS[lvl], n === 0 && 'opacity-35')} title={`P${p} × I${i}`}>{n || ''}</span>;
                  })}
                </div>
              ))}
              <span />{[1, 2, 3, 4, 5].map((i) => <span key={i} className="font-bold text-ink-soft">{i}</span>)}
            </div>
            <div className="mt-1 flex justify-between pl-6 text-[10px] text-ink-soft"><span>↑ Probability</span><span>Impact →</span></div>
          </Card>
          <Card className="xl:order-1 xl:col-span-2">
            {risks.length === 0 && <EmptyState icon={EW.warning} title="No risks in current filter" />}
            <ul className="divide-y divide-line/60">
              {risks.map((r) => {
                const lvl = riskLevel(riskScore(r));
                return (
                  <li key={r.id}>
                    <button onClick={() => setEditRisk(r)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-subtle sm:px-5">
                      <span className={cx('w-11 shrink-0 rounded-md py-1.5 text-center text-sm font-black', LVL_CLS[lvl])}>{riskScore(r)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-brand">{r.ref}</span><Tag>{r.kind}</Tag><FleetTag fleet={r.fleet} /></span>
                        <span className="mt-0.5 block font-semibold text-ink">{r.title}</span>
                        <span className="block text-xs text-ink-muted">Mitigation: {r.mitigation}</span>
                        <span className="block text-[11px] text-ink-soft">{memberName(data.members, r.ownerId)} · {r.status} · review {fmtShort(r.reviewDate)}{r.reviewDate && r.reviewDate < T && <b className="text-status-red"> (overdue)</b>}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : (
        <Card>
          {decisions.length === 0 && <EmptyState icon={EW.approved} title="No decisions" />}
          <ul className="divide-y divide-line/60">
            {decisions.map((d) => (
              <li key={d.id}>
                <button onClick={() => setEditDec(d)} className="flex w-full flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3.5 text-left hover:bg-surface-subtle sm:px-5">
                  <span className="min-w-0 flex-1 basis-72">
                    <span className="text-xs font-bold text-brand">{d.ref}</span>
                    <span className="block font-semibold text-ink">{d.title}</span>
                    <span className="block text-xs text-ink-muted">{d.description}</span>
                    <span className="block text-[11px] text-ink-soft">Decision authority: <b>{d.authority}</b>{d.meetingId && ' · from meeting minutes'}</span>
                  </span>
                  <span className="text-right text-xs">
                    <span className={cx('inline-block rounded-full px-2 py-0.5 font-bold', d.status === 'approved' ? 'bg-status-greenBg text-status-green' : d.status === 'rejected' ? 'bg-status-redBg text-status-red' : 'bg-status-amberBg text-status-amber')}>{DEC_LABEL[d.status]}</span>
                    <span className="mt-1 block text-ink-soft">{d.date ? `decided ${fmtDate(d.date)}` : `target ${fmtShort(d.targetDate)}`}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editRisk && <RiskForm risk={editRisk} onClose={() => setEditRisk(null)} />}
      {editDec && <DecisionForm d={editDec} onClose={() => setEditDec(null)} />}
    </div>
  );
}

const newRisk = (n: number): Risk => ({ id: `r-${Math.random().toString(36).slice(2, 8)}`, ref: `R-${String(n + 1).padStart(3, '0')}`, kind: 'risk', title: '', description: '', fleet: 'GEN', probability: 3, impact: 3, mitigation: '', status: 'open', archived: false });
const newDecision = (n: number): Decision => ({ id: `dc-${Math.random().toString(36).slice(2, 8)}`, ref: `D-${String(n + 1).padStart(3, '0')}`, title: '', description: '', authority: '', status: 'proposed', fleet: 'GEN', archived: false });

function RiskForm({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const [r, setR] = useState(risk);
  const set = <K extends keyof Risk>(k: K, v: Risk[K]) => setR((x) => ({ ...x, [k]: v }));
  const lvl = riskLevel(riskScore(r));
  return (
    <Modal open onClose={onClose} title={risk.title ? `${r.ref} ${risk.title}` : 'New risk / issue'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!r.title.trim()} onClick={() => { upsert('risks', r, `${r.ref} ${r.title}`); onClose(); }}>Save</Button></>}>
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={r.kind} onChange={(e) => set('kind', e.target.value as Risk['kind'])}><option value="risk">Risk (potential)</option><option value="issue">Issue (occurred)</option></Select></Field>
          <Field label="Status"><Select value={r.status} onChange={(e) => set('status', e.target.value as RiskStatus)}>{(['open', 'monitoring', 'mitigating', 'escalated', 'closed'] as RiskStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Title *"><Input value={r.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Description"><Textarea value={r.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Probability (1–5)"><Select value={r.probability} onChange={(e) => set('probability', Number(e.target.value) as Risk['probability'])}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
          <Field label="Impact (1–5)"><Select value={r.impact} onChange={(e) => set('impact', Number(e.target.value) as Risk['impact'])}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
          <Field label="Score"><div className={cx('flex h-10 items-center justify-center rounded-lg text-sm font-black', LVL_CLS[lvl])}>{riskScore(r)} · {lvl}</div></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner"><Select value={r.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value || undefined)}><option value="">—</option>{data.members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Project"><Select value={r.projectId ?? ''} onChange={(e) => set('projectId', e.target.value || undefined)}><option value="">—</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
          <Field label="Fleet"><Select value={r.fleet} onChange={(e) => set('fleet', e.target.value as Risk['fleet'])}>{data.fleets.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}</Select></Field>
          <Field label="Review date"><Input type="date" value={r.reviewDate ?? ''} onChange={(e) => set('reviewDate', e.target.value || undefined)} /></Field>
        </div>
        <Field label="Mitigation / resolution plan"><Textarea value={r.mitigation} onChange={(e) => set('mitigation', e.target.value)} /></Field>
        {r.status === 'closed' && <p className="rounded-lg bg-status-amberBg p-2.5 text-xs text-status-amber">Closing a risk records your display name. Formal risk acceptance requires an authorised decision in the decision log.</p>}
      </div>
    </Modal>
  );
}

function DecisionForm({ d: init, onClose }: { d: Decision; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const upsert = useStore((s) => s.upsert);
  const [d, setD] = useState(init);
  const set = <K extends keyof Decision>(k: K, v: Decision[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <Modal open onClose={onClose} title={init.title ? `${d.ref} ${init.title}` : 'New decision'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!d.title.trim() || !d.authority.trim()} onClick={() => { upsert('decisions', d, `${d.ref} ${d.title}`); onClose(); }}>Save</Button></>}>
      <div className="space-y-3.5">
        <Field label="Title *"><Input value={d.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Description"><Textarea value={d.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Decision authority *" hint="Person or body required to decide"><Input value={d.authority} onChange={(e) => set('authority', e.target.value)} /></Field>
          <Field label="Status"><Select value={d.status} onChange={(e) => set('status', e.target.value as DecisionStatus)}>{Object.entries(DEC_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          <Field label="Responsible"><Select value={d.ownerId ?? ''} onChange={(e) => set('ownerId', e.target.value || undefined)}><option value="">—</option>{data.members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}</Select></Field>
          <Field label="Target date"><Input type="date" value={d.targetDate ?? ''} onChange={(e) => set('targetDate', e.target.value || undefined)} /></Field>
          <Field label="Project"><Select value={d.projectId ?? ''} onChange={(e) => set('projectId', e.target.value || undefined)}><option value="">—</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
          <Field label="Fleet"><Select value={d.fleet} onChange={(e) => set('fleet', e.target.value as Decision['fleet'])}>{data.fleets.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}</Select></Field>
        </div>
        <Field label="Background & rationale"><Textarea value={d.rationale ?? ''} onChange={(e) => set('rationale', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
