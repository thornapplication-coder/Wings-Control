import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info, Lock } from 'lucide-react';
import { useStore } from '../store/store';
import { EW } from '../assets/icons';
import { Button, Field, Input, Select } from '../components/ui';

export function AccessPage() {
  const members = useStore((s) => s.data.members.filter((m) => m.active));
  const remembered = useStore((s) => s.rememberedMemberId);
  const signIn = useStore((s) => s.signIn);
  const [memberId, setMemberId] = useState(remembered && members.some((m) => m.id === remembered) ? remembered : '');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = signIn(memberId, pw);
    if (!r.ok) { setError(r.error ?? 'Sign-in failed.'); return; }
    nav(loc.state?.from && loc.state.from !== '/access' ? loc.state.from : '/', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      <div className="bg-ink px-3 py-1 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white">Prototype · Synthetic test data only</div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <img src={EW.signet} alt="" className="mx-auto mb-4 h-12 w-16 object-contain" />
            <h1 className="text-2xl font-black tracking-[0.08em] text-ink">WINGS CONTROL</h1>
            <p className="mt-1 text-sm text-ink-soft">Training Management Cockpit</p>
          </div>
          <form onSubmit={submit} className="rounded-2xl border border-line/70 bg-white p-6 shadow-card sm:p-7">
            <div className="space-y-4">
              <Field label="Your name">
                <Select value={memberId} onChange={(e) => { setMemberId(e.target.value); setError(''); }} required autoFocus>
                  <option value="" disabled>Select your name…</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
                </Select>
              </Field>
              <Field label="Team password">
                <Input type="password" autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} placeholder="Shared team password" />
              </Field>
              {error && <p role="alert" className="rounded-lg bg-status-redBg px-3 py-2 text-sm font-semibold text-status-red">{error}</p>}
              <Button type="submit" variant="primary" className="h-11 w-full text-[15px]">Continue</Button>
            </div>
            <div className="mt-5 flex gap-2 rounded-lg bg-sky-lighter p-3 text-xs text-ink-muted">
              <Info size={16} className="mt-0.5 shrink-0 text-sky" />
              <p>The selected name is a display identity only and is not proof of identity. <b>Prototype:</b> no password is stored or checked – any non-empty entry continues.</p>
            </div>
          </form>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-soft"><Lock size={13} /> Administration uses a separate administrator sign-in.</p>
        </div>
      </div>
    </div>
  );
}
