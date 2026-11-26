// Prototype state store (in-browser only).
// In the production build this layer is replaced by the Supabase data API; the action
// names below are the intended API surface so UI code can stay largely unchanged.

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { buildSeed, type Dataset } from '../mock/seed';
import type { ActivityEntry, Filters, ID, Task, TeamMember } from '../types';
import { todayISO } from '../lib/dates';

export type Collection =
  | 'projects' | 'workstreams' | 'milestones' | 'tasks' | 'risks' | 'decisions' | 'meetings'
  | 'trainingEvents' | 'compliance' | 'trainers' | 'organizations' | 'members';

interface TrashEntry { collection: Collection; item: { id: ID } & Record<string, unknown>; deletedAt: string; deletedBy: string }

interface Session { memberId: ID; displayName: string; sessionId: ID; since: string }

interface State {
  data: Dataset;
  session: Session | null;
  admin: { since: string } | null; // separate Superadmin authentication (prototype)
  filters: Filters;
  trash: TrashEntry[];
  rememberedMemberId?: ID;
  toast?: { text: string; at: number };

  // access
  signIn: (memberId: ID, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  adminSignIn: (password: string) => { ok: boolean; error?: string };
  adminSignOut: () => void;

  // filters
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;

  // generic CRUD
  upsert: <K extends Collection>(c: K, item: Dataset[K][number], label?: string) => void;
  setArchived: (c: Collection, id: ID, archived: boolean, label: string) => void;
  remove: (c: Collection, id: ID, label: string) => void;
  restore: (index: number) => void;
  purgeTrash: (index: number) => void;

  // domain actions
  createTaskFromActionItem: (meetingId: ID, actionItemId: ID) => ID | null;
  addTaskEvent: (taskId: ID, kind: Task['timeline'][number]['kind'], text: string) => void;
  markNotification: (id: ID) => void;
  markAllNotifications: () => void;

  // administration
  changeSharedPassword: (pw: string) => { ok: boolean; error?: string };
  revokeSession: (id: ID) => void;
  revokeAllSessions: () => void;
  updateSettings: (patch: Partial<Dataset['settings']>) => void;
  addMember: (name: string) => void;
  patchReference: (patch: Partial<Pick<Dataset, 'bases' | 'fleets' | 'qualificationTypes' | 'workstreamTemplate' | 'reportWorkstreamTemplate'>>, label: string) => void;
  setMemberActive: (id: ID, active: boolean) => void;

  showToast: (text: string) => void;
  resetDemo: () => void;
}

const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_FILTERS: Filters = { fleet: 'ALL', base: 'ALL', projectId: 'ALL' };

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const actor = () => {
        const s = get();
        if (s.admin) {
          const sa = s.data.members.find((m) => m.isSuperadmin);
          return { name: sa?.displayName ?? 'Superadmin', verified: true };
        }
        return { name: s.session?.displayName ?? 'Unknown', verified: false };
      };
      const log = (kind: ActivityEntry['kind'], action: string, targetLabel: string, link?: string) => {
        const a = actor();
        const entry: ActivityEntry = { id: uid('a'), at: new Date().toISOString(), actor: a.name, actorVerified: a.verified, kind, action, targetLabel, link };
        set((s) => ({ data: { ...s.data, activity: [entry, ...s.data.activity].slice(0, 200) } }));
      };
      const kindOf = (c: Collection): ActivityEntry['kind'] =>
        c === 'tasks' ? 'task' : c === 'risks' ? 'risk' : c === 'decisions' ? 'decision' : c === 'meetings' ? 'meeting'
          : c === 'trainers' ? 'trainer' : c === 'compliance' ? 'compliance' : c === 'members' || c === 'organizations' ? 'admin' : 'project';

      return {
        data: buildSeed(),
        session: null,
        admin: null,
        filters: DEFAULT_FILTERS,
        trash: [],

        signIn: (memberId, password) => {
          const m = get().data.members.find((x) => x.id === memberId);
          if (!m || !m.active) return { ok: false, error: 'Please select an active team member.' };
          // PROTOTYPE: no shared password is stored or checked. The real build validates
          // the password server-side against an Argon2id hash with rate limiting.
          if (!password) return { ok: false, error: 'Please enter the team password.' };
          const sessionId = uid('s');
          set((s) => ({
            session: { memberId, displayName: m.displayName, sessionId, since: new Date().toISOString() },
            rememberedMemberId: memberId,
            data: {
              ...s.data,
              sessions: [{ id: sessionId, memberId, displayName: m.displayName, device: navigator.userAgent.includes('iPhone') ? 'iPhone · Safari' : navigator.userAgent.includes('iPad') ? 'iPad · Safari' : 'Browser', startedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), revoked: false }, ...s.data.sessions],
            },
          }));
          return { ok: true };
        },
        signOut: () => set({ session: null, admin: null }),
        adminSignIn: (password) => {
          // PROTOTYPE: separate admin credential, independent of the team password. Not validated here.
          if (!password) return { ok: false, error: 'Please enter the administrator password.' };
          set({ admin: { since: new Date().toISOString() } });
          log('admin', 'signed in to', 'Administration');
          return { ok: true };
        },
        adminSignOut: () => set({ admin: null }),

        setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
        clearFilters: () => set({ filters: DEFAULT_FILTERS }),

        upsert: (c, item, label) => {
          const list = get().data[c] as unknown as { id: ID }[];
          const exists = list.some((x) => x.id === (item as { id: ID }).id);
          const stamped = (c === 'tasks' || c === 'projects') ? { ...(item as object), updatedAt: new Date().toISOString() } : item;
          const next = exists ? list.map((x) => (x.id === (item as { id: ID }).id ? stamped : x)) : [stamped, ...list];
          set((s) => ({ data: { ...s.data, [c]: next } }));
          if (label) log(kindOf(c), exists ? 'updated' : 'created', label);
        },
        setArchived: (c, id, archived, label) => {
          const list = get().data[c] as unknown as ({ id: ID; archived?: boolean })[];
          set((s) => ({ data: { ...s.data, [c]: list.map((x) => (x.id === id ? { ...x, archived } : x)) } }));
          log(kindOf(c), archived ? 'archived' : 'restored', label);
        },
        remove: (c, id, label) => {
          if (!get().admin) return; // permanent deletion is Superadmin-only (enforced server-side in production)
          const list = get().data[c] as unknown as ({ id: ID } & Record<string, unknown>)[];
          const item = list.find((x) => x.id === id);
          if (!item) return;
          set((s) => ({
            data: { ...s.data, [c]: list.filter((x) => x.id !== id) },
            trash: [{ collection: c, item, deletedAt: new Date().toISOString(), deletedBy: actor().name }, ...s.trash],
          }));
          log(kindOf(c), 'deleted (recycle bin)', label);
        },
        restore: (index) => {
          const e = get().trash[index];
          if (!e) return;
          const list = get().data[e.collection] as unknown as { id: ID }[];
          set((s) => ({ data: { ...s.data, [e.collection]: [e.item, ...list] }, trash: s.trash.filter((_, i) => i !== index) }));
          log(kindOf(e.collection), 'restored from recycle bin', String(e.item.title ?? e.item.name ?? e.item.id));
        },
        purgeTrash: (index) => set((s) => ({ trash: s.trash.filter((_, i) => i !== index) })),

        createTaskFromActionItem: (meetingId, actionItemId) => {
          const s = get();
          const m = s.data.meetings.find((x) => x.id === meetingId);
          const ai = m?.minutes?.actionItems.find((x) => x.id === actionItemId);
          if (!m || !ai || ai.linkedTaskId) return null; // duplicate protection
          const num = s.data.tasks.length + 1;
          const id = uid('t');
          const now = new Date().toISOString();
          const task: Task = {
            id, ref: `T-${String(num).padStart(4, '0')}`, title: ai.text, description: `Created from action item in "${m.title}".`,
            projectId: m.projectId, fleet: m.fleet, ownerId: ai.ownerId, contributorIds: [], status: 'open', priority: ai.priority,
            createdAt: now, dueDate: ai.dueDate, source: 'meeting', sourceMeetingId: m.id, sourceActionItemId: ai.id,
            timeline: [{ at: now, by: actor().name, kind: 'created', text: `Created from meeting action item (${m.title})` }],
            archived: false, updatedAt: now,
          };
          const meetings = s.data.meetings.map((x) => x.id !== meetingId || !x.minutes ? x : {
            ...x, minutes: { ...x.minutes, actionItems: x.minutes.actionItems.map((a) => (a.id === actionItemId ? { ...a, linkedTaskId: id } : a)) },
          });
          set({ data: { ...s.data, tasks: [task, ...s.data.tasks], meetings } });
          log('task', 'created from action item', `${task.ref} ${task.title}`, `/tasks?open=${id}`);
          return id;
        },
        addTaskEvent: (taskId, kind, text) => {
          const now = new Date().toISOString();
          set((s) => ({
            data: {
              ...s.data,
              tasks: s.data.tasks.map((t) => (t.id === taskId ? { ...t, updatedAt: now, timeline: [...t.timeline, { at: now, by: actor().name, kind, text }] } : t)),
            },
          }));
        },
        markNotification: (id) => set((s) => ({ data: { ...s.data, notifications: s.data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) } })),
        markAllNotifications: () => set((s) => ({ data: { ...s.data, notifications: s.data.notifications.map((n) => ({ ...n, read: true })) } })),

        changeSharedPassword: (pw) => {
          if (!get().admin) return { ok: false, error: 'Superadmin authentication required.' };
          if (pw.length < 12) return { ok: false, error: 'Minimum length is 12 characters.' };
          const s = get();
          const invalidate = s.data.settings.invalidateOnPasswordChange;
          set({
            data: {
              ...s.data,
              settings: { ...s.data.settings, passwordLastChanged: new Date().toISOString() },
              sessions: invalidate ? s.data.sessions.map((x) => ({ ...x, revoked: true })) : s.data.sessions,
            },
          });
          log('admin', invalidate ? 'changed shared password and revoked all sessions in' : 'changed shared password in', 'Access settings');
          return { ok: true };
        },
        revokeSession: (id) => {
          set((s) => ({ data: { ...s.data, sessions: s.data.sessions.map((x) => (x.id === id ? { ...x, revoked: true } : x)) } }));
          log('admin', 'revoked session in', 'Sessions');
        },
        revokeAllSessions: () => {
          set((s) => ({ data: { ...s.data, sessions: s.data.sessions.map((x) => ({ ...x, revoked: true })) } }));
          log('admin', 'revoked all normal sessions in', 'Sessions');
        },
        updateSettings: (patch) => {
          set((s) => ({ data: { ...s.data, settings: { ...s.data.settings, ...patch } } }));
          log('admin', 'changed', 'System settings');
        },
        addMember: (name) => {
          const m: TeamMember = { id: uid('m'), displayName: name.trim(), active: true, isSuperadmin: false };
          set((s) => ({ data: { ...s.data, members: [...s.data.members, m] } }));
          log('admin', 'added team member', m.displayName);
        },
        setMemberActive: (id, active) => {
          const m = get().data.members.find((x) => x.id === id);
          set((s) => ({
            data: {
              ...s.data,
              members: s.data.members.map((x) => (x.id === id ? { ...x, active } : x)),
              sessions: active ? s.data.sessions : s.data.sessions.map((x) => (x.memberId === id ? { ...x, revoked: true } : x)),
            },
          }));
          log('admin', active ? 'reactivated' : 'deactivated (sessions revoked)', m?.displayName ?? id);
        },

        patchReference: (patch, label) => {
          if (!get().admin) return;
          set((s) => ({ data: { ...s.data, ...patch } }));
          log('admin', 'changed reference data', label);
        },

        showToast: (text) => set({ toast: { text, at: Date.now() } }),
        resetDemo: () => set((s) => ({ data: buildSeed(), trash: [], filters: DEFAULT_FILTERS, session: s.session, admin: s.admin })),
      };
    },
    {
      name: 'wings-control-prototype',
      version: 2, // bump to discard outdated prototype data stored in the browser
      storage: createJSONStorage(() => safeStorage),
      // Persist the remembered display name and demo data; the session itself is kept for convenience
      // in the prototype only – production sessions are HTTP-only cookies validated server-side.
      partialize: (s) => ({ data: s.data, session: s.session, rememberedMemberId: s.rememberedMemberId, trash: s.trash, filters: s.filters }),
    },
  ),
);

export const memberName = (members: TeamMember[], id?: ID) =>
  id ? members.find((m) => m.id === id)?.displayName ?? 'Unknown' : 'Unassigned';

export const today = () => todayISO();
