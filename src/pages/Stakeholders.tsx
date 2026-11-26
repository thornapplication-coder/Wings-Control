import { useStore } from '../store/store';
import { Card, SectionTitle, Tag } from '../components/ui';
import { isWaiting } from '../lib/metrics';
import { Link } from 'react-router-dom';

export function StakeholdersPage() {
  const data = useStore((s) => s.data);
  return (
    <div>
      <SectionTitle title="Stakeholders & Partners" subtitle="External parties are recorded without application access · synthetic organisations" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.organizations.map((o) => {
          const open = data.tasks.filter((t) => t.waitingForOrgId === o.id && isWaiting(t));
          return (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-ink">{o.name}</h3><Tag>{o.category}</Tag></div>
              <p className="mt-1 text-xs text-ink-soft">{o.contactName ? `${o.contactName}${o.contactRole ? ` · ${o.contactRole}` : ''}` : 'No contact recorded'}</p>
              <div className="mt-3 border-t border-line/60 pt-3 text-xs">
                <b className="text-ink">{open.length}</b> <span className="text-ink-muted">open follow-ups</span>
                <ul className="mt-1 space-y-1">{open.map((t) => <li key={t.id}><Link className="text-brand hover:underline" to={`/tasks?open=${t.id}`}>{t.ref} {t.awaitedItem ?? t.title}</Link></li>)}</ul>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-soft">Contact details are stored only where authorised (data protection).</p>
    </div>
  );
}
