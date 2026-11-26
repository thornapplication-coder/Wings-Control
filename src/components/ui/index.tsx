import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import type { Priority, Rag, TaskStatus, Trend } from '../../types';

export const cx = clsx;

// ---------- Buttons ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ variant = 'secondary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-dark shadow-sm',
        variant === 'secondary' && 'bg-white text-ink border border-line hover:bg-surface-subtle',
        variant === 'ghost' && 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        variant === 'danger' && 'bg-status-red text-white hover:brightness-95',
        className,
      )}
    />
  );
}

export function IconButton({ label, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...p} aria-label={label} title={label}
      className={cx('relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40', className)}>
      {children}
    </button>
  );
}

// ---------- Card ----------
export function Card({ className, children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' }) {
  return <As className={cx('rounded-xl border border-line/70 bg-white shadow-card', className)}>{children}</As>;
}
export function CardHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ---------- Status ----------
const RAG_LABEL: Record<Rag, string> = { green: 'On Track', amber: 'Attention', red: 'Critical', grey: 'Not set' };
const RAG_DOT: Record<Rag, string> = { green: 'bg-status-green', amber: 'bg-status-amberDot', red: 'bg-status-red', grey: 'bg-status-grey' };
const RAG_PILL: Record<Rag, string> = {
  green: 'bg-status-greenBg text-status-green', amber: 'bg-status-amberBg text-status-amber',
  red: 'bg-status-redBg text-status-red', grey: 'bg-status-greyBg text-ink-muted',
};
export function RagBadge({ rag, compact }: { rag: Rag; compact?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold', RAG_PILL[rag])}>
      <span className={cx('h-2 w-2 rounded-full', RAG_DOT[rag])} aria-hidden />
      {compact ? rag.charAt(0).toUpperCase() + rag.slice(1) : RAG_LABEL[rag]}
    </span>
  );
}
export function RagDot({ rag }: { rag: Rag }) {
  return <span className={cx('inline-block h-2.5 w-2.5 rounded-full', RAG_DOT[rag])} role="img" aria-label={RAG_LABEL[rag]} />;
}

export function TrendBadge({ trend }: { trend: Trend }) {
  const map = {
    improved: { I: ArrowUpRight, t: 'Improved', c: 'text-status-green' },
    unchanged: { I: ArrowRight, t: 'Unchanged', c: 'text-ink-soft' },
    worse: { I: ArrowDownRight, t: 'Worse', c: 'text-status-red' },
  }[trend];
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold', map.c)}>
      <map.I size={14} aria-hidden /> {map.t}
    </span>
  );
}

const STATUS_LABEL: Record<TaskStatus, string> = { open: 'Open', in_progress: 'In Progress', waiting: 'Waiting For', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_CLS: Record<TaskStatus, string> = {
  open: 'bg-surface-muted text-ink-muted', in_progress: 'bg-sky-lighter text-[#00708C]', waiting: 'bg-status-amberBg text-status-amber',
  blocked: 'bg-status-redBg text-status-red', completed: 'bg-status-greenBg text-status-green', cancelled: 'bg-surface-muted text-ink-soft line-through',
};
export const taskStatusLabel = (s: TaskStatus) => STATUS_LABEL[s];
export function StatusPill({ status }: { status: TaskStatus }) {
  return <span className={cx('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_CLS[status])}>{STATUS_LABEL[status]}</span>;
}

const PRIO_CLS: Record<Priority, string> = {
  low: 'text-ink-soft', normal: 'text-ink-muted', high: 'text-status-amber', critical: 'text-status-red',
};
export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-semibold', PRIO_CLS[priority])}>
      <span aria-hidden className="tracking-tighter">{priority === 'critical' ? '▲▲' : priority === 'high' ? '▲' : priority === 'normal' ? '■' : '▽'}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

export function FleetTag({ fleet }: { fleet: string }) {
  const label = fleet === 'B737' ? 'B737 MAX' : fleet === 'GEN' ? 'General' : fleet;
  return (
    <span className={cx('inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide',
      fleet === 'B737' ? 'border-sky/40 bg-sky-lighter text-[#00708C]' : fleet === 'A320' ? 'border-brand/25 bg-brand-tint text-brand-dark' : 'border-line bg-surface-subtle text-ink-muted')}>
      {label}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted', className)}>{children}</span>;
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name === 'Unassigned' ? '?' : name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold', name === 'Unassigned' ? 'border border-dashed border-ink-soft text-ink-soft' : 'bg-brand-tint text-brand-dark')}
      aria-hidden>
      {initials}
    </span>
  );
}

// ---------- Form controls ----------
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-semibold text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>}
    </label>
  );
}
const inputCls = 'rounded-lg border border-line bg-white px-3 text-[15px] sm:text-sm text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
// Width/height utilities passed via className replace the defaults (no tailwind-merge dependency).
const sized = (cls: string | undefined, w: string, h: string) => cx(!/(^|\s)(\w+:)?w-/.test(cls ?? '') && w, !/(^|\s)h-/.test(cls ?? '') && h, cls);
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, sized(className, 'w-full', 'h-10'))} />;
}
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(inputCls, 'pr-8', sized(className, 'w-full', 'h-10'))} />;
}
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, 'w-full py-2 min-h-[90px]', p.className)} />;
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-subtle p-0.5">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('h-8 rounded-md px-3 text-xs font-bold transition whitespace-nowrap', value === o.value ? 'bg-white text-brand shadow-sm' : 'text-ink-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Overlays ----------
function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

/** Right-hand drawer on desktop/iPad, full-height sheet on iPhone. */
export function Drawer({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true"
        className={cx('absolute inset-x-0 bottom-0 top-8 flex flex-col rounded-t-2xl bg-white shadow-pop outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:rounded-none sm:rounded-l-2xl', wide ? 'sm:w-[680px]' : 'sm:w-[520px]')}>
        <div className="flex items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
          <div className="min-w-0 flex-1">{title}</div>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line/70 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-pop sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line/70 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && <img src={icon} alt="" className="mb-3 h-14 w-14 object-contain opacity-90" />}
      <p className="text-sm font-bold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-xs text-ink-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Horizontal bar used by all bar charts – accessible label + value, click to filter. */
export function HBar({ label, value, max, color = 'bg-brand', onClick, active, suffix }: { label: string; value: number; max: number; color?: string; onClick?: () => void; active?: boolean; suffix?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  const El = onClick ? 'button' : 'div';
  return (
    <El onClick={onClick} className={cx('group grid w-full grid-cols-[minmax(84px,30%)_1fr_auto] items-center gap-3 rounded-md px-1.5 py-1 text-left', onClick && 'hover:bg-surface-subtle', active && 'bg-brand-tint')}
      aria-label={`${label}: ${value}${suffix ?? ''}`}>
      <span className="truncate text-xs font-semibold text-ink-muted">{label}</span>
      <span className="h-2.5 rounded-full bg-surface-muted">
        <span className={cx('block h-2.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-8 text-right text-xs font-bold tabular-nums text-ink">{value}</span>
    </El>
  );
}
