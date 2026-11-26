import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListChecks, Users, GraduationCap, ShieldCheck, CalendarClock, BookOpen,
  BarChart3, Settings2, Bell, Search, Plus, ChevronsLeft, ChevronsRight, MoreHorizontal, LogOut, UserRound,
  AlertTriangle, Building2, KeyRound,
} from 'lucide-react';
import { useStore } from '../../store/store';
import { EW } from '../../assets/icons';
import { cx, IconButton } from '../ui';
import { NotificationPanel } from './NotificationPanel';
import { SearchDialog } from './SearchDialog';
import { QuickCreate } from './QuickCreate';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Action Tracker', icon: ListChecks },
  { to: '/instructors', label: 'Instructors', icon: Users },
  { to: '/training', label: 'Training', icon: GraduationCap },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { to: '/meetings', label: 'Meetings', icon: CalendarClock },
  { to: '/risks', label: 'Risks & Decisions', icon: AlertTriangle },
  { to: '/stakeholders', label: 'Stakeholders', icon: Building2 },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const MOBILE_NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/instructors', label: 'Team', icon: Users },
  { to: '/more', label: 'More', icon: MoreHorizontal },
];

const TITLES: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.to, n.label]));

function readCollapsed(): boolean {
  try { return localStorage.getItem('wc-sidebar') === '1'; } catch { return false; }
}

export function AppShell() {
  const session = useStore((s) => s.session);
  const admin = useStore((s) => s.admin);
  const notifications = useStore((s) => s.data.notifications);
  const signOut = useStore((s) => s.signOut);
  const toast = useStore((s) => s.toast);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { try { localStorage.setItem('wc-sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    if (!toast) return;
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const unread = useMemo(() => notifications.filter((n) => !n.read && (!n.forMemberId || n.forMemberId === session?.memberId)).length, [notifications, session]);
  const section = '/' + (loc.pathname.split('/')[1] ?? '');
  const title = loc.pathname.startsWith('/admin') ? 'Administration' : TITLES[section] ?? (section === '/more' ? 'More' : 'WINGS CONTROL');

  return (
    <div className="min-h-screen">
      {/* Environment banner – PRD: Sandbox must be visibly labelled */}
      <div className="sticky top-0 z-40 h-[22px] truncate bg-ink px-3 text-center text-[11px] font-bold uppercase leading-[22px] tracking-[0.12em] text-white">
        <span className="sm:hidden">Prototype · Test data only</span>
        <span className="hidden sm:inline">Prototype · Synthetic test data only · No real authentication</span>
      </div>

      {/* Sidebar (iPad rail / desktop) */}
      <aside className={cx('fixed bottom-0 left-0 top-[22px] z-30 hidden flex-col border-r border-line/70 bg-white md:flex transition-[width]', collapsed ? 'w-[72px]' : 'w-[72px] lg:w-64')}>
        <div className="flex h-16 items-center gap-2.5 px-4">
          <img src={EW.signet} alt="" className="h-7 w-9 object-contain" />
          <div className={cx('leading-none', collapsed ? 'hidden' : 'hidden lg:block')}>
            <div className="text-[15px] font-black tracking-[0.06em] text-ink">WINGS CONTROL</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Training Management</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} title={n.label}
              className={({ isActive }) => cx('mb-0.5 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
                isActive ? 'bg-brand-tint text-brand' : 'text-ink-muted hover:bg-surface-subtle hover:text-ink')}>
              <n.icon size={19} className="shrink-0" />
              <span className={collapsed ? 'sr-only' : 'sr-only lg:not-sr-only'}>{n.label}</span>
            </NavLink>
          ))}
          {admin && (
            <>
              <div className="mx-3 my-3 border-t border-line/70" />
              <NavLink to="/admin" title="Administration"
                className={({ isActive }) => cx('flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold',
                  isActive ? 'bg-ink text-white' : 'text-ink hover:bg-surface-subtle')}>
                <Settings2 size={19} className="shrink-0" />
                <span className={collapsed ? 'sr-only' : 'sr-only lg:not-sr-only'}>Administration</span>
              </NavLink>
            </>
          )}
        </nav>
        <button onClick={() => setCollapsed((c) => !c)} className="hidden h-11 items-center gap-2 border-t border-line/70 px-6 text-xs font-semibold text-ink-soft hover:text-ink lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>
      </aside>

      <div className={cx('transition-[padding]', collapsed ? 'md:pl-[72px]' : 'md:pl-[72px] lg:pl-64')}>
        {/* Top bar */}
        <header className="sticky top-[22px] z-20 border-b border-line/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-4 sm:h-16 sm:px-6">
            <img src={EW.signet} alt="" className="h-6 w-8 object-contain md:hidden" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-extrabold text-ink sm:text-lg">{title}</div>
            </div>
            <button onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-72 items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 text-sm text-ink-soft hover:border-ink-soft lg:flex">
              <Search size={16} className="shrink-0" /> <span className="truncate">Search projects, tasks…</span> <kbd className="ml-auto rounded border border-line bg-white px-1.5 text-[10px]">⌘K</kbd>
            </button>
            <IconButton label="Search" className="lg:hidden" onClick={() => setSearchOpen(true)}><Search size={20} /></IconButton>
            <IconButton label={`Notifications (${unread} unread)`} onClick={() => setNotifOpen(true)}>
              <Bell size={20} />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{unread}</span>}
            </IconButton>
            <button onClick={() => setCreateOpen(true)} className="hidden h-10 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-bold text-white hover:bg-brand-dark sm:flex">
              <Plus size={18} /> Create
            </button>
            <IconButton label="Create" className="bg-brand text-white hover:bg-brand-dark hover:text-white sm:hidden" onClick={() => setCreateOpen(true)}><Plus size={20} /></IconButton>
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex h-10 items-center gap-2 rounded-lg px-1.5 hover:bg-surface-muted sm:px-2" aria-haspopup="menu" aria-expanded={menuOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-xs font-bold text-brand-dark">
                  {session?.displayName.split(' ').map((p) => p[0]).join('')}
                </span>
                <span className="hidden text-left leading-tight xl:block">
                  <span className="block text-sm font-bold text-ink">{session?.displayName}</span>
                  <span className="block text-[11px] text-ink-soft">{admin ? 'Superadmin session' : 'Team access'}</span>
                </span>
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-line/70 bg-white p-1.5 shadow-pop">
                  <div className="px-3 py-2">
                    <div className="text-sm font-bold text-ink">{session?.displayName}</div>
                    <div className="text-[11px] text-ink-soft">Display name – self-declared, not proof of identity</div>
                  </div>
                  <MenuItem icon={UserRound} label="Change name / switch user" onClick={() => { signOut(); nav('/access'); }} />
                  {admin
                    ? <MenuItem icon={Settings2} label="Administration" onClick={() => nav('/admin')} />
                    : <MenuItem icon={KeyRound} label="Administrator sign-in" onClick={() => nav('/admin-login')} />}
                  <MenuItem icon={LogOut} label="End session" onClick={() => { signOut(); nav('/access'); }} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 md:pb-10 lg:pt-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation – iPhone */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/95 backdrop-blur pb-safe md:hidden" aria-label="Main">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold', isActive ? 'text-brand' : 'text-ink-soft')}>
              <n.icon size={22} />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickCreate open={createOpen} onClose={() => setCreateOpen(false)} />

      {toast && toastVisible && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-pop md:bottom-6">
          {toast.text}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: I, label, onClick }: { icon: typeof LogOut; label: string; onClick: () => void }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-muted hover:bg-surface-subtle hover:text-ink">
      <I size={17} /> {label}
    </button>
  );
}
