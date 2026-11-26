import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStore } from '../../store/store';
import { cx } from '../ui';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const r: { type: string; label: string; sub: string; link: string }[] = [];
    data.projects.filter((p) => !p.archived && p.title.toLowerCase().includes(s)).forEach((p) => r.push({ type: 'Project', label: p.title, sub: p.fleet, link: `/projects/${p.id}` }));
    data.tasks.filter((t) => !t.archived && (t.title.toLowerCase().includes(s) || t.ref.toLowerCase().includes(s))).forEach((t) => r.push({ type: 'Task', label: `${t.ref} ${t.title}`, sub: t.status, link: `/tasks?open=${t.id}` }));
    data.trainers.filter((t) => !t.archived && (t.name.toLowerCase().includes(s) || t.tlc.toLowerCase() === s)).forEach((t) => r.push({ type: 'Trainer', label: `${t.name} (${t.tlc})`, sub: `${t.trainerQualRaw} · ${t.bases.join(', ')}`, link: `/instructors?open=${t.id}` }));
    data.meetings.filter((m) => m.title.toLowerCase().includes(s)).forEach((m) => r.push({ type: 'Meeting', label: m.title, sub: m.date, link: `/meetings/${m.id}` }));
    data.risks.filter((x) => x.title.toLowerCase().includes(s)).forEach((x) => r.push({ type: x.kind === 'risk' ? 'Risk' : 'Issue', label: `${x.ref} ${x.title}`, sub: x.status, link: '/risks' }));
    data.decisions.filter((x) => x.title.toLowerCase().includes(s)).forEach((x) => r.push({ type: 'Decision', label: `${x.ref} ${x.title}`, sub: x.status, link: '/risks?tab=decisions' }));
    data.organizations.filter((x) => x.name.toLowerCase().includes(s)).forEach((x) => r.push({ type: 'Stakeholder', label: x.name, sub: x.category, link: '/stakeholders' }));
    return r.slice(0, 30);
  }, [q, data]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-ink/30 p-0 sm:p-4 sm:pt-[12vh]" onClick={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-pop sm:h-auto sm:max-h-[70vh] sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="flex items-center gap-3 border-b border-line/70 px-4">
          <Search size={18} className="text-ink-soft" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search projects, tasks, trainers, meetings…" className="h-14 flex-1 bg-transparent text-base outline-none" />
          <button onClick={onClose} className="text-sm font-semibold text-ink-soft">Close</button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {q.trim().length < 2 && <li className="px-3 py-6 text-center text-sm text-ink-soft">Type at least two characters.</li>}
          {q.trim().length >= 2 && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-soft">No results.</li>}
          {results.map((r, i) => (
            <li key={i}>
              <button onClick={() => { onClose(); setQ(''); nav(r.link); }} className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-subtle')}>
                <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand">{r.type}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                  <span className="block truncate text-xs text-ink-soft">{r.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
