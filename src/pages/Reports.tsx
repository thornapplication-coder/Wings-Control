import { Link } from 'react-router-dom';
import { FileBarChart, Users, ListChecks, Hourglass, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/store';
import { Card, FleetTag, RagBadge, SectionTitle, TrendBadge } from '../components/ui';

const OTHER = [
  { icon: Users, t: 'Trainer report', d: 'Qualification, base, part-time, ORE and authority distribution', link: '/instructors' },
  { icon: ListChecks, t: 'Task status / overdue', d: 'Export current view from the Action Tracker', link: '/tasks?view=overdue' },
  { icon: Hourglass, t: 'Waiting-for items', d: 'External and internal dependencies with follow-ups', link: '/tasks?view=waiting_ext' },
  { icon: AlertTriangle, t: 'Risk register', d: 'Risks and issues with scoring', link: '/risks' },
  { icon: ShieldCheck, t: 'Pending approvals', d: 'Compliance and approval tracker', link: '/compliance' },
];

export function ReportsPage() {
  const projects = useStore((s) => s.data.projects.filter((p) => !p.archived && p.status === 'active'));
  return (
    <div>
      <SectionTitle title="Reports" />
      <h2 className="mb-3 text-sm font-bold text-ink">Executive Weekly Report</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} to={`/reports/weekly/${p.id}`} className="rounded-xl border border-line/70 bg-white p-4 shadow-card hover:border-brand/40 hover:shadow-pop">
            <div className="flex items-center justify-between"><FileBarChart size={20} className="text-brand" /><FleetTag fleet={p.fleet} /></div>
            <h3 className="mt-2 font-bold text-ink">{p.title}</h3>
            <div className="mt-2 flex items-center gap-3"><RagBadge rag={p.rag} /><TrendBadge trend={p.trend} /></div>
            <p className="mt-2 text-xs text-ink-soft">Preview, edit commentary, print / PDF</p>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-bold text-ink">Operational reports</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {OTHER.map((o) => (
          <Link key={o.t} to={o.link}><Card className="flex items-start gap-3 p-4 hover:border-brand/40"><o.icon size={20} className="mt-0.5 shrink-0 text-brand" /><div><h3 className="font-bold text-ink">{o.t}</h3><p className="text-xs text-ink-soft">{o.d}</p></div></Card></Link>
        ))}
      </div>
      <p className="mt-5 text-xs text-ink-soft">Prototype exports: CSV (UTF-8, formula-safe) and print-to-PDF. DOCX / XLSX / PPTX exports in the Eurowings templates follow in the production build.</p>
    </div>
  );
}
