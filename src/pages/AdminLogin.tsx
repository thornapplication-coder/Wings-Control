import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/store';
import { Button, Field, Input } from '../components/ui';

export function AdminLoginPage() {
  const adminSignIn = useStore((s) => s.adminSignIn);
  const superadmin = useStore((s) => s.data.members.find((m) => m.isSuperadmin));
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = adminSignIn(pw);
    if (!r.ok) { setError(r.error ?? 'Sign-in failed.'); return; }
    nav('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-pop sm:p-7">
        <button type="button" onClick={() => nav(-1)} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Back</button>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white"><ShieldAlert size={22} /></span>
          <div>
            <h1 className="text-lg font-extrabold text-ink">Administrator sign-in</h1>
            <p className="text-xs text-ink-soft">WINGS CONTROL Administration</p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Administrator account"><Input value={superadmin?.displayName ?? ''} readOnly className="bg-surface-subtle" /></Field>
          <Field label="Administrator password" hint="Independent of the shared team password.">
            <Input type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} />
          </Field>
          {error && <p role="alert" className="rounded-lg bg-status-redBg px-3 py-2 text-sm font-semibold text-status-red">{error}</p>}
          <Button type="submit" className="h-11 w-full bg-ink text-white hover:bg-black">Sign in to Administration</Button>
        </div>
        <p className="mt-4 text-xs text-ink-soft"><b>Prototype:</b> not validated. Production: separate admin credential, server-side check, rate limit, 15-min idle timeout, re-authentication for sensitive actions.</p>
      </form>
    </div>
  );
}
