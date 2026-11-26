// SYNTHETIC TEST DATA ONLY.
// All projects, tasks, trainers, organisations and figures below are invented for the prototype.
// Dates are generated relative to "today" so overdue / due-soon states stay meaningful.
// Only the two display identities named in the PRD (initial team setup) are real names.

import type {
  ActivityEntry, AppSettings, Base, ComplianceItem, Decision, Fleet, Meeting, Milestone,
  NotificationItem, Organization, Project, Risk, SessionRecord, Task, TeamMember, Trainer,
  TrainingEvent, Workstream,
} from '../types';
import { addDays, todayISO } from '../lib/dates';

export interface Dataset {
  members: TeamMember[];
  fleets: Fleet[];
  bases: Base[];
  qualificationTypes: string[];
  workstreamTemplate: string[];
  reportWorkstreamTemplate: string[];
  organizations: Organization[];
  projects: Project[];
  workstreams: Workstream[];
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  decisions: Decision[];
  meetings: Meeting[];
  trainingEvents: TrainingEvent[];
  compliance: ComplianceItem[];
  trainers: Trainer[];
  activity: ActivityEntry[];
  notifications: NotificationItem[];
  sessions: SessionRecord[];
  settings: AppSettings;
}

// Deterministic PRNG so the dataset is identical after every reset.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildSeed(): Dataset {
  const T = todayISO();
  const d = (n: number) => addDays(T, n);
  const now = new Date();
  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

  const PT = 'm-patrick';
  const JJ = 'm-joost';

  const members: TeamMember[] = [
    { id: PT, displayName: 'Patrick Thorn', active: true, isSuperadmin: true },
    { id: JJ, displayName: 'Joost Jansen', active: true, isSuperadmin: false },
  ];

  const fleets: Fleet[] = [
    { code: 'A320', label: 'A320', active: true },
    { code: 'B737', label: 'B737 MAX', active: true },
    { code: 'GEN', label: 'General / Both', active: true },
  ];

  const bases: Base[] = [
    { code: 'VIE', label: 'VIE', kind: 'base', active: true },
    { code: 'SZG', label: 'SZG', kind: 'base', active: true },
    { code: 'PMI', label: 'PMI', kind: 'base', active: true },
    { code: 'PRG', label: 'PRG', kind: 'base', active: true },
    { code: 'ARN', label: 'ARN', kind: 'base', active: true },
    { code: 'WP PRG', label: 'WP PRG', kind: 'wp', active: true },
    { code: 'WP PMI', label: 'WP PMI', kind: 'wp', active: true },
    { code: 'WP BCN', label: 'WP BCN', kind: 'wp', active: true },
    { code: 'WP WAW', label: 'WP WAW', kind: 'wp', active: true },
  ];

  const organizations: Organization[] = [
    { id: 'o-naa', name: 'National Aviation Authority (synthetic)', category: 'authority', contactName: 'Inspector (TBD)', contactRole: 'Flight Ops Inspector' },
    { id: 'o-sim', name: 'Simulator Provider Alpha', category: 'supplier', contactName: 'Account Manager', contactRole: 'Sales' },
    { id: 'o-trto', name: 'Type Rating Partner Beta', category: 'partner', contactName: 'Training contact', contactRole: 'Partner coordination' },
    { id: 'o-oem', name: 'OEM Training Services', category: 'oem', contactName: 'Customer training contact' },
    { id: 'o-wc', name: 'Works Council', category: 'internal' },
    { id: 'o-it', name: 'IT Crew Systems', category: 'internal', contactName: 'Crew IT contact' },
    { id: 'o-cp', name: 'Crew Planning', category: 'internal' },
  ];

  // ---------- Projects ----------
  const projects: Project[] = [
    {
      id: 'p-eis', title: 'B737 MAX Entry into Service', fleet: 'B737', ownerId: PT, contributorIds: [JJ],
      description: 'Programme to prepare training, approvals and crews for the B737 MAX entry into service.',
      status: 'active', priority: 'critical', rag: 'amber', trend: 'improved',
      startDate: d(-210), targetDate: d(160), progress: 46, progressMethod: 'Completed milestones / total milestones',
      archived: false, updatedAt: ago(3),
    },
    {
      id: 'p-a320rec', title: 'A320 Recurrent Programme 2027', fleet: 'A320', ownerId: JJ, contributorIds: [PT],
      description: 'Design and approval of the 2027 recurrent training cycle for the A320 fleet.',
      status: 'active', priority: 'high', rag: 'green', trend: 'unchanged',
      startDate: d(-90), targetDate: d(75), progress: 62, progressMethod: 'Completed milestones / total milestones',
      archived: false, updatedAt: ago(26),
    },
    {
      id: 'p-std', title: 'Instructor Standardisation 2027', fleet: 'GEN', ownerId: PT, contributorIds: [JJ],
      description: 'Standardisation seminars and calibration for TRI/TRE/SFI across both fleets.',
      status: 'active', priority: 'normal', rag: 'green', trend: 'improved',
      startDate: d(-40), targetDate: d(120), archived: false, updatedAt: ago(50),
    },
    {
      id: 'p-sim', title: 'Simulator Capacity 2027', fleet: 'B737', ownerId: JJ, contributorIds: [PT],
      description: 'Secure FFS capacity for B737 MAX type rating and recurrent training.',
      status: 'active', priority: 'critical', rag: 'red', trend: 'worse',
      startDate: d(-120), targetDate: d(45), archived: false, updatedAt: ago(5),
    },
    {
      id: 'p-tm', title: 'Training Manual Revision', fleet: 'GEN', ownerId: JJ, contributorIds: [],
      description: 'Revision of training manual chapters affected by fleet introduction.',
      status: 'planned', priority: 'normal', rag: 'grey', trend: 'unchanged',
      startDate: d(14), targetDate: d(180), archived: false, updatedAt: ago(120),
    },
  ];

  const reportWorkstreamTemplate = [
    'Regulatory & Authority', 'Works Council', 'Scheduling & Planning', 'Trainers & Crews',
    'Partners & Timeline', 'IT & Systems', 'Safety & Quality', 'Compliance',
  ];

  const eisWs: [string, Workstream['rag'], Workstream['trend'], string, string, number][] = [
    ['Regulatory & Authority', 'amber', 'improved', 'Programme submission prepared; authority meeting scheduled. OSD differences review ongoing.', 'Submission of training programme', 21],
    ['Works Council', 'amber', 'unchanged', 'Information session held; agreement on selection criteria still open.', 'Agreement on selection criteria', 30],
    ['Scheduling & Planning', 'green', 'unchanged', 'Phase-in plan v2 agreed with planning; course slots reserved.', 'Course plan freeze', 40],
    ['Trainers & Crews', 'green', 'improved', 'Instructor nominations completed for first wave.', 'TRI course start', 55],
    ['Partners & Timeline', 'red', 'worse', 'Simulator availability for first course not yet confirmed by provider.', 'FFS slot confirmation', 7],
    ['IT & Systems', 'amber', 'unchanged', 'Crew qualification codes in planning system pending.', 'Qualification codes live', 35],
    ['Safety & Quality', 'green', 'unchanged', 'Safety assessment draft complete.', 'Safety assessment sign-off', 28],
    ['Compliance', 'green', 'improved', 'Compliance checklist 70 % complete.', 'Compliance audit', 60],
  ];
  const workstreams: Workstream[] = eisWs.map(([name, rag, trend, keyFacts, ms, off], i) => ({
    id: `ws-eis-${i + 1}`, projectId: 'p-eis', name, order: i + 1, ownerId: i % 2 ? JJ : PT,
    rag, trend, keyFacts, nextMilestone: ms, nextMilestoneDate: d(off),
  }));
  const simpleWs = (pid: string, names: string[]) => names.forEach((name, i) =>
    workstreams.push({ id: `ws-${pid}-${i + 1}`, projectId: pid, name, order: i + 1, rag: 'green', trend: 'unchanged', keyFacts: '', ownerId: i % 2 ? PT : JJ }));
  simpleWs('p-a320rec', ['Programme Design', 'Courseware', 'Authority Approval', 'Instructor Briefing']);
  simpleWs('p-std', ['Seminar Design', 'Calibration Sessions', 'Feedback & Evaluation']);
  simpleWs('p-sim', ['Requirements', 'Provider Negotiation', 'Contract & Slots']);
  simpleWs('p-tm', ['Gap Analysis', 'Drafting', 'Review & Submission']);
  workstreams.find((w) => w.id === 'ws-p-sim-2')!.rag = 'red';
  workstreams.find((w) => w.id === 'ws-p-sim-3')!.rag = 'amber';

  const milestones: Milestone[] = [
    { id: 'ms-1', projectId: 'p-eis', title: 'Training programme submitted', date: d(21), done: false, workstreamId: 'ws-eis-1' },
    { id: 'ms-2', projectId: 'p-eis', title: 'First TRI course start', date: d(55), done: false, workstreamId: 'ws-eis-4' },
    { id: 'ms-3', projectId: 'p-eis', title: 'First type rating course start', date: d(95), done: false },
    { id: 'ms-4', projectId: 'p-eis', title: 'Phase-in plan v2 agreed', date: d(-14), done: true },
    { id: 'ms-5', projectId: 'p-eis', title: 'Entry into Service', date: d(160), done: false },
    { id: 'ms-6', projectId: 'p-a320rec', title: 'Recurrent syllabus draft', date: d(9), done: false },
    { id: 'ms-7', projectId: 'p-a320rec', title: 'Authority submission', date: d(38), done: false },
    { id: 'ms-8', projectId: 'p-sim', title: 'FFS slot confirmation', date: d(7), done: false },
    { id: 'ms-9', projectId: 'p-std', title: 'Standardisation seminar #1', date: d(18), done: false },
  ];

  // ---------- Tasks ----------
  let n = 0;
  const mk = (t: Partial<Task> & Pick<Task, 'title'>): Task => {
    n += 1;
    const created = ago(24 * (30 - n));
    return {
      id: `t-${n}`, ref: `T-${String(n).padStart(4, '0')}`, description: '', fleet: 'GEN', contributorIds: [],
      status: 'open', priority: 'normal', createdAt: created, source: 'project', archived: false,
      updatedAt: ago(n * 3), timeline: [{ at: created, by: 'Patrick Thorn', kind: 'created', text: 'Task created' }],
      ...t,
    };
  };

  const tasks: Task[] = [
    mk({ title: 'Confirm FFS slots for first B737 MAX TR course', projectId: 'p-eis', workstreamId: 'ws-eis-5', fleet: 'B737', ownerId: JJ, status: 'waiting', priority: 'critical', dueDate: d(7),
      dependencyType: 'external', waitingForOrgId: 'o-sim', waitingForPerson: 'Account Manager', awaitedItem: 'Written slot confirmation', expectedDate: d(-3), followUpDate: d(-1), dependencyStatus: 'overdue',
      description: 'Provider has to confirm the slot block for the first type rating course.' }),
    mk({ title: 'Submit B737 MAX training programme to authority', projectId: 'p-eis', workstreamId: 'ws-eis-1', fleet: 'B737', ownerId: PT, contributorIds: [JJ], status: 'in_progress', priority: 'high', dueDate: d(21) }),
    mk({ title: 'Obtain OSD differences assessment input', projectId: 'p-eis', workstreamId: 'ws-eis-1', fleet: 'B737', ownerId: PT, status: 'waiting', priority: 'high', dueDate: d(14),
      dependencyType: 'external', waitingForOrgId: 'o-oem', awaitedItem: 'OSD extract and courseware data package', expectedDate: d(5), followUpDate: d(2), dependencyStatus: 'requested' }),
    mk({ title: 'Agree pilot selection criteria with Works Council', projectId: 'p-eis', workstreamId: 'ws-eis-2', fleet: 'B737', ownerId: PT, status: 'waiting', priority: 'high', dueDate: d(30),
      dependencyType: 'external', waitingForOrgId: 'o-wc', awaitedItem: 'Feedback on draft criteria', expectedDate: d(10), followUpDate: d(0), dependencyStatus: 'requested' }),
    mk({ title: 'Create crew qualification codes in planning system', projectId: 'p-eis', workstreamId: 'ws-eis-6', fleet: 'B737', ownerId: JJ, status: 'blocked', priority: 'high', dueDate: d(-2),
      dependencyType: 'internal', waitingForOrgId: 'o-it', awaitedItem: 'Change request implementation', expectedDate: d(-5), followUpDate: d(-4), dependencyStatus: 'overdue' }),
    mk({ title: 'Nominate TRI candidates for first wave', projectId: 'p-eis', workstreamId: 'ws-eis-4', fleet: 'B737', ownerId: PT, status: 'completed', priority: 'high', dueDate: d(-10), completedAt: ago(24 * 11) }),
    mk({ title: 'Draft safety assessment for MAX introduction', projectId: 'p-eis', workstreamId: 'ws-eis-7', fleet: 'B737', ownerId: JJ, status: 'in_progress', priority: 'normal', dueDate: d(12) }),
    mk({ title: 'Update compliance checklist (ORA.ATO / CAT)', projectId: 'p-eis', workstreamId: 'ws-eis-8', fleet: 'B737', ownerId: JJ, status: 'open', priority: 'normal', dueDate: d(4) }),
    mk({ title: 'Review partner TR course syllabus', projectId: 'p-eis', workstreamId: 'ws-eis-5', fleet: 'B737', ownerId: PT, status: 'waiting', priority: 'normal', dueDate: d(18),
      dependencyType: 'external', waitingForOrgId: 'o-trto', awaitedItem: 'Syllabus rev. 2', expectedDate: d(6), followUpDate: d(3), dependencyStatus: 'in_progress_ext' }),
    mk({ title: 'Prepare Phase-in briefing for crew', projectId: 'p-eis', fleet: 'B737', status: 'open', priority: 'normal', dueDate: d(25) }),
    mk({ title: 'Define recurrent 2027 scenario set', projectId: 'p-a320rec', workstreamId: 'ws-p-a320rec-1', fleet: 'A320', ownerId: JJ, status: 'in_progress', priority: 'high', dueDate: d(9) }),
    mk({ title: 'Courseware update – recurrent briefing slides', projectId: 'p-a320rec', workstreamId: 'ws-p-a320rec-2', fleet: 'A320', ownerId: JJ, status: 'open', priority: 'normal', dueDate: d(-4) }),
    mk({ title: 'Authority pre-consultation recurrent 2027', projectId: 'p-a320rec', workstreamId: 'ws-p-a320rec-3', fleet: 'A320', ownerId: PT, status: 'open', priority: 'normal', dueDate: d(16) }),
    mk({ title: 'Instructor briefing pack A320 recurrent', projectId: 'p-a320rec', workstreamId: 'ws-p-a320rec-4', fleet: 'A320', base: 'VIE', ownerId: JJ, status: 'open', priority: 'low', dueDate: d(40) }),
    mk({ title: 'Plan standardisation seminar #1 (VIE)', projectId: 'p-std', workstreamId: 'ws-p-std-1', fleet: 'GEN', base: 'VIE', ownerId: PT, status: 'in_progress', priority: 'normal', dueDate: d(6) }),
    mk({ title: 'Calibration video set – grading examples', projectId: 'p-std', workstreamId: 'ws-p-std-2', fleet: 'GEN', ownerId: JJ, status: 'open', priority: 'normal', dueDate: d(26) }),
    mk({ title: 'Collect seminar feedback PMI', projectId: 'p-std', workstreamId: 'ws-p-std-3', fleet: 'A320', base: 'PMI', ownerId: JJ, status: 'completed', priority: 'low', dueDate: d(-6), completedAt: ago(24 * 6) }),
    mk({ title: 'Negotiate alternative FFS provider', projectId: 'p-sim', workstreamId: 'ws-p-sim-2', fleet: 'B737', ownerId: JJ, contributorIds: [PT], status: 'in_progress', priority: 'critical', dueDate: d(5) }),
    mk({ title: 'Approve budget for additional SIM slots', projectId: 'p-sim', workstreamId: 'ws-p-sim-3', fleet: 'B737', ownerId: PT, status: 'blocked', priority: 'critical', dueDate: d(-1),
      dependencyType: 'internal', waitingForPerson: 'Finance', awaitedItem: 'Budget release', expectedDate: d(-3), followUpDate: d(-2), dependencyStatus: 'overdue' }),
    mk({ title: 'Simulator requirements specification', projectId: 'p-sim', workstreamId: 'ws-p-sim-1', fleet: 'B737', ownerId: JJ, status: 'completed', priority: 'high', dueDate: d(-30), completedAt: ago(24 * 32) }),
    mk({ title: 'Gap analysis training manual chapters', projectId: 'p-tm', workstreamId: 'ws-p-tm-1', fleet: 'GEN', ownerId: JJ, status: 'open', priority: 'normal', dueDate: d(28) }),
    mk({ title: 'Clarify meaning of "B ab" column in trainer workbook', fleet: 'GEN', ownerId: PT, status: 'open', priority: 'normal', dueDate: d(10), source: 'instructor' }),
    mk({ title: 'Respond to audit finding F-2026-07', fleet: 'A320', ownerId: JJ, status: 'in_progress', priority: 'high', dueDate: d(3), source: 'compliance' }),
    mk({ title: 'Follow up partner on instructor exchange', fleet: 'GEN', ownerId: PT, status: 'waiting', priority: 'low', dueDate: d(35), source: 'stakeholder',
      dependencyType: 'external', waitingForOrgId: 'o-trto', awaitedItem: 'Proposal for instructor exchange', expectedDate: d(12), followUpDate: d(8), dependencyStatus: 'requested' }),
    mk({ title: 'Book meeting room for standardisation seminar', fleet: 'GEN', base: 'SZG', status: 'open', priority: 'low', dueDate: d(15), source: 'manual' }),
  ];
  // richer timeline for the first task
  tasks[0].timeline.push(
    { at: ago(24 * 9), by: 'Joost Jansen', kind: 'assigned', text: 'Assigned to Joost Jansen' },
    { at: ago(24 * 8), by: 'Joost Jansen', kind: 'requested', text: 'Request sent to Simulator Provider Alpha (e-mail)' },
    { at: ago(24 * 2), by: 'Joost Jansen', kind: 'followup', text: 'Follow-up call – provider promised answer this week' },
  );

  // ---------- Risks & Decisions ----------
  const risks: Risk[] = [
    { id: 'r-1', ref: 'R-001', kind: 'risk', title: 'FFS availability for first MAX course', description: 'Provider may not confirm slots in time for the first type rating course.', projectId: 'p-eis', fleet: 'B737', probability: 4, impact: 5, ownerId: JJ, mitigation: 'Parallel negotiation with alternative provider; shift course start by 2 weeks as fallback.', reviewDate: d(3), targetDate: d(14), status: 'escalated', archived: false },
    { id: 'r-2', ref: 'R-002', kind: 'risk', title: 'Approval lead time longer than planned', description: 'Authority review could take longer than the planned window.', projectId: 'p-eis', fleet: 'B737', probability: 3, impact: 4, ownerId: PT, mitigation: 'Early pre-consultation; complete package at first submission.', reviewDate: d(10), status: 'mitigating', archived: false },
    { id: 'r-3', ref: 'R-003', kind: 'risk', title: 'Instructor capacity during phase-in', description: 'A320 instructors moving to MAX reduce A320 capacity.', projectId: 'p-eis', fleet: 'GEN', probability: 3, impact: 3, ownerId: PT, mitigation: 'Stagger transitions; temporary support from partner.', reviewDate: d(20), status: 'monitoring', archived: false },
    { id: 'r-4', ref: 'I-001', kind: 'issue', title: 'Qualification codes missing in planning system', description: 'Crew cannot be rostered for MAX courses until codes exist.', projectId: 'p-eis', fleet: 'B737', probability: 5, impact: 3, ownerId: JJ, mitigation: 'Escalated to IT Crew Systems; manual workaround for first course.', reviewDate: d(1), status: 'open', archived: false },
    { id: 'r-5', ref: 'R-004', kind: 'risk', title: 'Courseware delay recurrent 2027', description: 'Slide update may slip behind instructor briefing.', projectId: 'p-a320rec', fleet: 'A320', probability: 2, impact: 2, ownerId: JJ, mitigation: 'Reuse 2026 material where unchanged.', reviewDate: d(14), status: 'monitoring', archived: false },
  ];

  const decisions: Decision[] = [
    { id: 'dc-1', ref: 'D-001', title: 'Approve budget for additional FFS slots', description: 'Release budget for up to 120 additional FFS hours with alternative provider.', authority: 'Management Board', status: 'under_review', projectId: 'p-sim', fleet: 'B737', ownerId: PT, targetDate: d(5), archived: false },
    { id: 'dc-2', ref: 'D-002', title: 'Shift first TR course by two weeks (fallback)', description: 'Fallback if FFS slots are not confirmed by the provider.', authority: 'Training Management Board', status: 'proposed', projectId: 'p-eis', fleet: 'B737', ownerId: PT, targetDate: d(10), archived: false },
    { id: 'dc-3', ref: 'D-003', title: 'Pilot selection criteria for MAX transition', description: 'Final criteria for pilot selection, to be agreed with Works Council.', authority: 'Management + Works Council', status: 'proposed', projectId: 'p-eis', fleet: 'B737', ownerId: PT, targetDate: d(30), archived: false },
    { id: 'dc-4', ref: 'D-004', title: 'Use partner TR course for first wave', description: 'First wave trained at partner TRTO.', authority: 'Management Board', status: 'approved', date: d(-21), rationale: 'Own capacity not available in time.', projectId: 'p-eis', fleet: 'B737', ownerId: PT, meetingId: 'mt-1', archived: false },
  ];

  // ---------- Meetings ----------
  const meetings: Meeting[] = [
    {
      id: 'mt-1', title: 'B737 MAX EIS – Programme Board', category: 'B737 MAX Introduction Meeting', date: d(-7), start: '10:00', end: '11:30', location: 'Teams',
      organizerId: PT, participantIds: [PT, JJ], externalParticipants: ['Crew Planning', 'IT Crew Systems'], projectId: 'p-eis', fleet: 'B737', status: 'held',
      agenda: ['Status per workstream', 'Simulator capacity', 'Works Council update', 'AOB'],
      minutes: {
        status: 'final', version: 2, lastEditedBy: 'Patrick Thorn', lastEditedAt: ago(24 * 6),
        notes: 'Status per workstream reviewed. Simulator capacity remains the critical path. Works Council information session went well; criteria to be finalised.',
        decisionIds: ['dc-4'],
        actionItems: [
          { id: 'ai-1', text: 'Chase FFS provider for written slot confirmation', ownerId: JJ, dueDate: d(-1), priority: 'critical', linkedTaskId: 't-1' },
          { id: 'ai-2', text: 'Prepare fallback plan with course start +2 weeks', ownerId: PT, dueDate: d(5), priority: 'high' },
          { id: 'ai-3', text: 'Send draft selection criteria to Works Council', ownerId: PT, dueDate: d(2), priority: 'normal' },
        ],
      },
    },
    {
      id: 'mt-2', title: 'A320 Recurrent 2027 – Working Session', category: 'Project Status Meeting', date: d(-2), start: '14:00', end: '15:00', location: 'VIE, Room 2',
      organizerId: JJ, participantIds: [JJ, PT], externalParticipants: [], projectId: 'p-a320rec', fleet: 'A320', status: 'held',
      agenda: ['Scenario set', 'Courseware', 'Timeline'],
      minutes: { status: 'draft', version: 1, lastEditedBy: 'Joost Jansen', lastEditedAt: ago(30), notes: 'Scenario set 80 % complete. Courseware slightly behind.', decisionIds: [],
        actionItems: [{ id: 'ai-4', text: 'Finalise scenario set incl. UPRT element', ownerId: JJ, dueDate: d(9), priority: 'high' }] },
    },
    {
      id: 'mt-3', title: 'Authority pre-consultation B737 MAX', category: 'Regulatory / Compliance Meeting', date: d(4), start: '09:30', end: '11:00', location: 'Authority premises',
      organizerId: PT, participantIds: [PT], externalParticipants: ['National Aviation Authority (synthetic)'], projectId: 'p-eis', fleet: 'B737', status: 'planned',
      agenda: ['Programme structure', 'Timeline', 'Instructor qualification route'],
    },
    {
      id: 'mt-4', title: 'Weekly Training Management Jour Fixe', category: 'Standard Management Meeting', date: d(1), start: '08:30', end: '09:15', location: 'Teams',
      organizerId: PT, participantIds: [PT, JJ], externalParticipants: [], fleet: 'GEN', status: 'planned', agenda: ['Action tracker review', 'Upcoming deadlines'],
    },
  ];

  const trainingEvents: TrainingEvent[] = [
    { id: 'te-1', title: 'TRI Course B737 MAX – Wave 1', category: 'TRI / TRE Courses', fleet: 'B737', base: 'VIE', startDate: d(55), endDate: d(68), instructorIds: [], participants: 4, resource: 'FFS (partner)', status: 'planned' },
    { id: 'te-2', title: 'Type Rating B737 MAX – Course 1', category: 'Type Rating', fleet: 'B737', base: 'VIE', startDate: d(95), endDate: d(130), instructorIds: [], participants: 12, resource: 'FFS (TBC)', status: 'planned' },
    { id: 'te-3', title: 'Recurrent A320 – Block 12', category: 'Recurrent Training', fleet: 'A320', base: 'PMI', startDate: d(3), endDate: d(5), instructorIds: [], participants: 16, resource: 'FFS A320', status: 'confirmed' },
    { id: 'te-4', title: 'LPC/OPC A320 – VIE', category: 'LPC / OPC', fleet: 'A320', base: 'VIE', startDate: d(8), endDate: d(9), instructorIds: [], participants: 8, resource: 'FFS A320', status: 'confirmed' },
    { id: 'te-5', title: 'Standardisation Seminar #1', category: 'Special Training', fleet: 'GEN', base: 'VIE', startDate: d(18), endDate: d(18), instructorIds: [], participants: 20, status: 'planned' },
    { id: 'te-6', title: 'OCC A320 – SZG', category: 'OCC', fleet: 'A320', base: 'SZG', startDate: d(-12), endDate: d(-8), instructorIds: [], participants: 6, status: 'completed' },
  ];

  const compliance: ComplianceItem[] = [
    { id: 'c-1', ref: 'C-001', title: 'B737 MAX type rating training programme', category: 'programme_approval', fleet: 'B737', authority: 'NAA (synthetic)', ownerId: PT, status: 'in_preparation', dueDate: d(21), archived: false },
    { id: 'c-2', ref: 'C-002', title: 'OM-D revision – B737 MAX chapters', category: 'manual_revision', fleet: 'B737', authority: 'NAA (synthetic)', ownerId: JJ, status: 'in_preparation', dueDate: d(45), archived: false },
    { id: 'c-3', ref: 'C-003', title: 'OSD review B737 MAX', category: 'osd', fleet: 'B737', authority: 'EASA OSD (reference)', ownerId: PT, status: 'planned', dueDate: d(30), archived: false },
    { id: 'c-4', ref: 'F-2026-07', title: 'Audit finding: instructor records incomplete', category: 'audit_finding', fleet: 'A320', authority: 'Internal audit', ownerId: JJ, status: 'submitted', dueDate: d(3), submittedDate: d(-5), archived: false },
    { id: 'c-5', ref: 'CA-2026-07', title: 'Corrective action: record checklist', category: 'corrective_action', fleet: 'A320', authority: 'Internal audit', ownerId: JJ, status: 'in_preparation', dueDate: d(20), archived: false },
    { id: 'c-6', ref: 'C-004', title: 'Recurrent programme 2027 approval', category: 'programme_approval', fleet: 'A320', authority: 'NAA (synthetic)', ownerId: PT, status: 'planned', dueDate: d(38), archived: false },
    { id: 'c-7', ref: 'C-005', title: 'ATO approval scope extension B737 MAX', category: 'ato_approval', fleet: 'B737', authority: 'NAA (synthetic)', ownerId: PT, status: 'submitted', submittedDate: d(-15), dueDate: d(30), archived: false },
  ];

  // ---------- Trainers (synthetic roster, structure of the source workbook) ----------
  const r = rng(737);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const first = ['Anna', 'Markus', 'Lena', 'Thomas', 'Sophie', 'Lukas', 'Julia', 'Stefan', 'Eva', 'Michael', 'Nina', 'Florian', 'Sarah', 'Daniel', 'Katrin', 'Andreas', 'Petra', 'Martin', 'Laura', 'Jan', 'Clara', 'David', 'Mira', 'Tobias', 'Elena', 'Paul', 'Ines', 'Robert', 'Lisa', 'Erik'];
  const last = ['Berger', 'Huber', 'Novak', 'Lindqvist', 'Moser', 'Wagner', 'Svoboda', 'Garcia', 'Keller', 'Hofer', 'Fischer', 'Dvorak', 'Steiner', 'Brunner', 'Lehner', 'Bauer', 'Nilsson', 'Romero', 'Wolf', 'Mayr', 'Kraus', 'Pichler', 'Horvath', 'Weber', 'Gruber'];
  const qualRaw = ['TRE/SEN', 'TRE', 'TRE', 'TRI', 'TRI', 'TRI', 'TRI', 'TRI new', 'LTC', 'LTC', 'LTC', 'SFI', 'TKI'];
  const baseW = ['VIE', 'VIE', 'VIE', 'PMI', 'PMI', 'PMI', 'SZG', 'PRG', 'ARN', 'WP PRG', 'WP PMI', 'WP BCN', 'WP WAW'];
  const partW = ['VZ', 'VZ', 'VZ', 'VZ', 'VZ', '0.9', '0.8', '0.75', '0.7', '0.6', '0.25', 'DEC', '80% + NOV'];
  const authW = ['Austria', 'Austria', 'Austria', 'Austria', 'Austria', 'Austria', 'Germany', 'Czech', 'Sweden', 'Spain', 'Swiss'];
  const used = new Set<string>();
  const trainers: Trainer[] = [];
  for (let i = 0; i < 48; i++) {
    let name = '';
    do { name = `${pick(first)} ${pick(last)}`; } while (used.has(name));
    used.add(name);
    const raw = pick(qualRaw);
    const quals = raw.replace(' new', '').split('/');
    const ac = r();
    const aircraft: Trainer['aircraft'] = ac < 0.74 ? ['A320'] : ac < 0.9 ? ['B737'] : ['A320', 'B737'];
    const base = pick(baseW);
    const year = () => 2008 + Math.floor(r() * 18);
    const date = () => `${year()}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-01`;
    const tlc = (name.split(' ')[0].slice(0, 1) + name.split(' ')[1].slice(0, 2)).toUpperCase();
    trainers.push({
      id: `tr-${i + 1}`,
      tlc: trainers.some((t) => t.tlc === tlc) ? tlc.slice(0, 2) + String.fromCharCode(65 + (i % 26)) : tlc,
      name,
      trainerQualRaw: raw,
      quals,
      aircraft,
      bases: [base],
      remark: r() < 0.15 ? pick(['Standards pilot', 'Course lead', 'Part of project team', 'Temporarily not active']) : undefined,
      partTimeRaw: r() < 0.05 ? undefined : pick(partW),
      simSessions: r() < 0.08 ? undefined : Math.floor(r() * 110),
      lifusLegs: r() < 0.1 ? undefined : Math.floor(r() * 180),
      ore: r() < 0.06 ? undefined : pick(['A', 'A', 'B', 'B', 'C', 'Rente'] as const),
      sinceLtc: quals.includes('LTC') || r() < 0.6 ? date() : undefined,
      sinceTri: quals.some((q) => ['TRI', 'TRE', 'SEN'].includes(q)) ? date() : undefined,
      sinceTre: quals.includes('TRE') ? date() : undefined,
      authority: r() < 0.05 ? undefined : pick(authW),
      bAbRaw: r() < 0.35 ? pick(['01/2027', '03/2027', 'x', '06/2027', 'tbd']) : undefined,
      sourceSnapshot: '2026-07-23',
      editedFields: [],
      archived: false,
    });
  }

  const activity: ActivityEntry[] = [
    { id: 'a-1', at: ago(2), actor: 'Joost Jansen', actorVerified: false, kind: 'task', action: 'added follow-up to', targetLabel: 'T-0001 Confirm FFS slots', link: '/tasks?open=t-1' },
    { id: 'a-2', at: ago(3), actor: 'Patrick Thorn', actorVerified: false, kind: 'project', action: 'changed status to Amber ↗ on', targetLabel: 'B737 MAX Entry into Service', link: '/projects/p-eis' },
    { id: 'a-3', at: ago(5), actor: 'Joost Jansen', actorVerified: false, kind: 'risk', action: 'escalated', targetLabel: 'R-001 FFS availability', link: '/risks' },
    { id: 'a-4', at: ago(20), actor: 'Patrick Thorn', actorVerified: false, kind: 'decision', action: 'proposed', targetLabel: 'D-002 Shift first TR course', link: '/decisions' },
    { id: 'a-5', at: ago(30), actor: 'Joost Jansen', actorVerified: false, kind: 'meeting', action: 'saved draft minutes of', targetLabel: 'A320 Recurrent 2027 – Working Session', link: '/meetings/mt-2' },
    { id: 'a-6', at: ago(52), actor: 'Patrick Thorn', actorVerified: true, kind: 'admin', action: 'changed session duration in', targetLabel: 'System settings', link: '/admin/settings' },
    { id: 'a-7', at: ago(70), actor: 'Joost Jansen', actorVerified: false, kind: 'compliance', action: 'submitted', targetLabel: 'F-2026-07 Audit finding response', link: '/compliance' },
    { id: 'a-8', at: ago(140), actor: 'Patrick Thorn', actorVerified: true, kind: 'trainer', action: 'imported 48 rows from', targetLabel: 'Trainer roster (synthetic test file)', link: '/instructors' },
  ];

  const notifications: NotificationItem[] = [
    { id: 'n-1', at: ago(1), forMemberId: JJ, title: 'Follow-up overdue', body: 'T-0001 – no slot confirmation received from Simulator Provider Alpha.', link: '/tasks?open=t-1', read: false, kind: 'followup' },
    { id: 'n-2', at: ago(4), forMemberId: PT, title: 'Follow-up due today', body: 'T-0004 – Works Council feedback on selection criteria.', link: '/tasks?open=t-4', read: false, kind: 'followup' },
    { id: 'n-3', at: ago(6), forMemberId: PT, title: 'Decision pending', body: 'D-001 budget for additional FFS slots – target in 5 days.', link: '/decisions', read: false, kind: 'decision' },
    { id: 'n-4', at: ago(28), title: 'Milestone in 7 days', body: 'FFS slot confirmation (Simulator Capacity 2027).', link: '/projects/p-sim', read: true, kind: 'milestone' },
    { id: 'n-5', at: ago(48), forMemberId: JJ, title: 'New assignment', body: 'T-0012 Courseware update assigned to you.', link: '/tasks?open=t-12', read: true, kind: 'assignment' },
  ];

  const sessions: SessionRecord[] = [
    { id: 's-1', memberId: JJ, displayName: 'Joost Jansen', device: 'iPhone · Safari', startedAt: ago(24 * 4), lastSeenAt: ago(2), revoked: false },
    { id: 's-2', memberId: JJ, displayName: 'Joost Jansen', device: 'Windows · Edge', startedAt: ago(24 * 9), lastSeenAt: ago(26), revoked: false },
    { id: 's-3', memberId: PT, displayName: 'Patrick Thorn', device: 'iPad · Safari', startedAt: ago(24 * 2), lastSeenAt: ago(5), revoked: false },
  ];

  const settings: AppSettings = {
    sessionDays: 30, adminIdleMinutes: 15, maxFailedAttempts: 5, lockoutMinutes: 15,
    invalidateOnPasswordChange: true, passwordLastChanged: ago(24 * 40), recycleRetentionDays: 30,
    eisTargetDate: d(160),
  };

  return {
    members, fleets, bases,
    qualificationTypes: ['SEN', 'TRE', 'TRI', 'LTC', 'SFI', 'TKI'],
    workstreamTemplate: [
      'Regulatory & EASA Approvals', 'Training Concept & Footprint', 'Type Rating & Difference Training', 'Instructor & Examiner Training',
      'Simulator Procurement & Qualification', 'Training Courseware & Documentation', 'Partner Coordination', 'Pilot Recruitment & Assessment',
      'Crew Transition & Phase-In', 'OCC Training', 'Operational Readiness', 'Entry Into Service',
    ],
    reportWorkstreamTemplate,
    organizations, projects, workstreams, milestones, tasks, risks, decisions, meetings,
    trainingEvents, compliance, trainers, activity, notifications, sessions, settings,
  };
}
