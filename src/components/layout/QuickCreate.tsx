import { useNavigate } from 'react-router-dom';
import { ListPlus, CalendarPlus, FolderPlus, AlertTriangle, Gavel, UserPlus } from 'lucide-react';
import { Modal } from '../ui';

const ACTIONS = [
  { icon: ListPlus, label: 'Create task', link: '/tasks?new=1' },
  { icon: CalendarPlus, label: 'Create meeting / minutes', link: '/meetings?new=1' },
  { icon: FolderPlus, label: 'Create project', link: '/projects?new=1' },
  { icon: AlertTriangle, label: 'Add risk / issue', link: '/risks?new=risk' },
  { icon: Gavel, label: 'Add decision', link: '/risks?tab=decisions&new=decision' },
  { icon: UserPlus, label: 'Add / update trainer record', link: '/instructors?new=1' },
];

export function QuickCreate({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  return (
    <Modal open={open} onClose={onClose} title="Quick create">
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button key={a.label} onClick={() => { onClose(); nav(a.link); }}
            className="flex flex-col items-start gap-2 rounded-xl border border-line/70 p-3.5 text-left hover:border-brand/40 hover:bg-brand-tint/40">
            <a.icon size={20} className="text-brand" />
            <span className="text-sm font-bold text-ink">{a.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
