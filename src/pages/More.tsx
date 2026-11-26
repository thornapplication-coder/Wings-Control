import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, KeyRound, LogOut, Settings2, UserRound } from 'lucide-react';
import { useStore } from '../store/store';
import { NAV } from '../components/layout/AppShell';
import { Card } from '../components/ui';

export function MorePage() {
  const admin = useStore((s) => s.admin);
  const session = useStore((s) => s.session)!;
  const signOut = useStore((s) => s.signOut);
  const nav = useNavigate();
  const items = NAV.filter((n) => !['/', '/projects', '/tasks', '/instructors'].includes(n.to));
  return (
    <div className="space-y-5">
      <Card>
        <ul className="divide-y divide-line/60">
          {items.map((n) => (
            <li key={n.to}><Link to={n.to} className="flex h-14 items-center gap-3 px-4 text-[15px] font-semibold text-ink"><n.icon size={20} className="text-brand" />{n.label}<ChevronRight size={18} className="ml-auto text-ink-soft" /></Link></li>
          ))}
        </ul>
      </Card>
      <Card>
        <div className="px-4 py-3"><div className="font-bold text-ink">{session.displayName}</div><div className="text-xs text-ink-soft">Display name – not proof of identity</div></div>
        <ul className="divide-y divide-line/60 border-t border-line/60">
          {admin
            ? <li><Link to="/admin" className="flex h-14 items-center gap-3 px-4 font-semibold text-ink"><Settings2 size={20} />Administration<ChevronRight size={18} className="ml-auto text-ink-soft" /></Link></li>
            : <li><Link to="/admin-login" className="flex h-14 items-center gap-3 px-4 font-semibold text-ink"><KeyRound size={20} />Administrator sign-in<ChevronRight size={18} className="ml-auto text-ink-soft" /></Link></li>}
          <li><button onClick={() => { signOut(); nav('/access'); }} className="flex h-14 w-full items-center gap-3 px-4 font-semibold text-ink"><UserRound size={20} />Change name / switch user</button></li>
          <li><button onClick={() => { signOut(); nav('/access'); }} className="flex h-14 w-full items-center gap-3 px-4 font-semibold text-status-red"><LogOut size={20} />End session</button></li>
        </ul>
      </Card>
    </div>
  );
}
