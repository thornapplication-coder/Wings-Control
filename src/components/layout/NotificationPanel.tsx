import { useNavigate } from 'react-router-dom';
import { BellRing, CalendarClock, Clock, Gavel, UserPlus, BadgeCheck } from 'lucide-react';
import { useStore } from '../../store/store';
import { Button, Drawer, EmptyState, cx } from '../ui';
import { timeAgo } from '../../lib/dates';
import { EW } from '../../assets/icons';

const ICON = { followup: Clock, overdue: BellRing, assignment: UserPlus, milestone: CalendarClock, decision: Gavel, qualification: BadgeCheck };

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useStore((s) => s.session);
  const all = useStore((s) => s.data.notifications);
  const mark = useStore((s) => s.markNotification);
  const markAll = useStore((s) => s.markAllNotifications);
  const nav = useNavigate();
  const list = all.filter((n) => !n.forMemberId || n.forMemberId === session?.memberId);

  return (
    <Drawer open={open} onClose={onClose}
      title={<div><h2 className="text-base font-bold text-ink">Notifications</h2><p className="text-xs text-ink-soft">In-app reminders · e-mail and push in a later phase</p></div>}
      footer={<Button size="sm" variant="ghost" onClick={markAll}>Mark all as read</Button>}>
      {list.length === 0 && <EmptyState icon={EW.checklist} title="No notifications" />}
      <ul className="-mx-2 space-y-1">
        {list.map((n) => {
          const I = ICON[n.kind];
          return (
            <li key={n.id}>
              <button onClick={() => { mark(n.id); onClose(); nav(n.link); }}
                className={cx('flex w-full gap-3 rounded-lg p-2.5 text-left hover:bg-surface-subtle', !n.read && 'bg-brand-tint/50')}>
                <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-surface-muted text-ink-soft' : 'bg-brand text-white')}><I size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{n.title}</span>
                    <span className="shrink-0 text-[11px] text-ink-soft">{timeAgo(n.at)}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{n.body}</span>
                  {!n.forMemberId && <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-ink-soft">Team</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Drawer>
  );
}
