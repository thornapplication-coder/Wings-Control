// WINGS CONTROL – domain model (prototype).
// Mirrors the logical schema of PRD §11 so the later Supabase/PostgreSQL schema can follow it 1:1.

export type ID = string;
export type ISODate = string; // yyyy-mm-dd
export type ISODateTime = string;

export type FleetCode = 'A320' | 'B737' | 'GEN'; // GEN = General / Both
export type Rag = 'green' | 'amber' | 'red' | 'grey';
export type Trend = 'improved' | 'unchanged' | 'worse';
export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type TaskStatus = 'open' | 'in_progress' | 'waiting' | 'blocked' | 'completed' | 'cancelled';
export type DependencyStatus = 'not_requested' | 'requested' | 'in_progress_ext' | 'received' | 'overdue';
export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed';
export type RiskStatus = 'open' | 'monitoring' | 'mitigating' | 'escalated' | 'closed';
export type DecisionStatus = 'proposed' | 'under_review' | 'approved' | 'rejected' | 'superseded';
export type MinutesStatus = 'draft' | 'in_review' | 'final' | 'superseded' | 'archived';

export interface TeamMember {
  id: ID;
  displayName: string;
  active: boolean;
  isSuperadmin: boolean; // granted only via separate admin authentication
}

export interface Fleet { code: FleetCode; label: string; active: boolean }
export interface Base { code: string; label: string; kind: 'base' | 'wp'; active: boolean }

export interface Organization {
  id: ID;
  name: string;
  category: 'authority' | 'partner' | 'internal' | 'oem' | 'supplier';
  contactName?: string;
  contactRole?: string;
  notes?: string;
}

export interface Workstream {
  id: ID;
  projectId: ID;
  name: string;
  order: number;
  ownerId?: ID;
  rag: Rag;
  trend: Trend;
  keyFacts: string;
  nextMilestone?: string;
  nextMilestoneDate?: ISODate;
}

export interface Milestone {
  id: ID;
  projectId: ID;
  title: string;
  date: ISODate;
  done: boolean;
  workstreamId?: ID;
}

export interface Project {
  id: ID;
  title: string;
  description: string;
  fleet: FleetCode;
  ownerId: ID;
  contributorIds: ID[];
  status: ProjectStatus;
  priority: Priority;
  rag: Rag;
  trend: Trend;
  startDate: ISODate;
  targetDate: ISODate;
  progress?: number; // only where a methodology is defined – undefined otherwise
  progressMethod?: string;
  archived: boolean;
  updatedAt: ISODateTime;
}

export interface TaskEvent {
  at: ISODateTime;
  by: string; // self-declared display name – not verified
  kind: 'created' | 'assigned' | 'requested' | 'followup' | 'received' | 'cleared' | 'status' | 'comment' | 'completed';
  text: string;
}

export interface Task {
  id: ID;
  ref: string; // human readable, e.g. T-0012
  title: string;
  description: string;
  projectId?: ID;
  workstreamId?: ID;
  fleet: FleetCode;
  base?: string;
  ownerId?: ID; // primary owner – one accountable person
  contributorIds: ID[];
  status: TaskStatus;
  priority: Priority;
  createdAt: ISODateTime;
  startDate?: ISODate;
  dueDate?: ISODate;
  completedAt?: ISODateTime;
  // External / internal dependency
  dependencyType?: 'external' | 'internal';
  waitingForOrgId?: ID;
  waitingForPerson?: string;
  awaitedItem?: string;
  expectedDate?: ISODate;
  followUpDate?: ISODate;
  dependencyStatus?: DependencyStatus;
  // Source references (Central Action Tracker)
  source: 'project' | 'meeting' | 'compliance' | 'stakeholder' | 'instructor' | 'manual';
  sourceMeetingId?: ID;
  sourceActionItemId?: ID;
  timeline: TaskEvent[];
  archived: boolean;
  updatedAt: ISODateTime;
}

export interface Risk {
  id: ID;
  ref: string;
  kind: 'risk' | 'issue';
  title: string;
  description: string;
  projectId?: ID;
  fleet: FleetCode;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  ownerId?: ID;
  mitigation: string;
  reviewDate?: ISODate;
  targetDate?: ISODate;
  status: RiskStatus;
  archived: boolean;
}

export interface Decision {
  id: ID;
  ref: string;
  title: string;
  description: string;
  date?: ISODate;
  ownerId?: ID;
  authority: string; // person / body required to decide
  status: DecisionStatus;
  rationale?: string;
  projectId?: ID;
  fleet: FleetCode;
  meetingId?: ID;
  targetDate?: ISODate;
  archived: boolean;
}

export interface ActionItem {
  id: ID;
  text: string;
  ownerId?: ID;
  dueDate?: ISODate;
  priority: Priority;
  linkedTaskId?: ID; // prevents duplicate task creation
}

export interface Meeting {
  id: ID;
  title: string;
  category: string;
  date: ISODate;
  start: string;
  end: string;
  location?: string;
  organizerId?: ID;
  participantIds: ID[];
  externalParticipants: string[];
  projectId?: ID;
  fleet: FleetCode;
  status: 'planned' | 'held' | 'cancelled';
  agenda: string[];
  minutes?: {
    status: MinutesStatus;
    version: number;
    notes: string;
    decisionIds: ID[];
    actionItems: ActionItem[];
    lastEditedBy: string;
    lastEditedAt: ISODateTime;
  };
}

export interface TrainingEvent {
  id: ID;
  title: string;
  category: string;
  fleet: FleetCode;
  base?: string;
  startDate: ISODate;
  endDate: ISODate;
  instructorIds: ID[];
  participants: number;
  resource?: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ComplianceItem {
  id: ID;
  ref: string;
  title: string;
  category: 'authority_approval' | 'ato_approval' | 'programme_approval' | 'manual_revision' | 'osd' | 'reg_change' | 'audit_finding' | 'corrective_action';
  fleet: FleetCode;
  authority: string;
  ownerId?: ID;
  status: 'planned' | 'in_preparation' | 'submitted' | 'approved' | 'rejected' | 'closed';
  dueDate?: ISODate;
  submittedDate?: ISODate;
  approvedDate?: ISODate;
  referenceNo?: string;
  archived: boolean;
}

// Trainer record – mirrors the source workbook columns (PRD §8.18). Source values are kept verbatim.
export interface Trainer {
  id: ID; // stable internal id
  tlc: string;
  name: string;
  trainerQualRaw: string; // e.g. "TRE/SEN" – preserved
  quals: string[]; // parsed categories – documented split on "/"
  aircraft: ('A320' | 'B737')[];
  bases: string[];
  remark?: string;
  partTimeRaw?: string; // VZ, 0.9, 80% + NOV … – never normalised
  simSessions?: number;
  lifusLegs?: number;
  ore?: 'A' | 'B' | 'C' | 'Rente';
  sinceLtc?: ISODate;
  sinceTri?: ISODate;
  sinceTre?: ISODate;
  authority?: string;
  bAbRaw?: string; // meaning unconfirmed – displayed as supplied
  sourceSnapshot: ISODate;
  origin?: 'import' | 'manual'; // manual = added in WINGS CONTROL, not from the source workbook
  custom?: Record<string, string>; // values of user-defined columns (key = column id)
  editedFields: string[]; // fields maintained in WINGS CONTROL after import
  archived: boolean;
}

/** User-defined additional column for the trainer roster. */
export interface CustomColumn { id: ID; label: string }

export interface ActivityEntry {
  id: ID;
  at: ISODateTime;
  actor: string;
  actorVerified: boolean; // true only for authenticated Superadmin actions
  kind: 'project' | 'task' | 'meeting' | 'decision' | 'risk' | 'trainer' | 'compliance' | 'admin';
  action: string;
  targetLabel: string;
  link?: string;
}

export interface NotificationItem {
  id: ID;
  at: ISODateTime;
  forMemberId?: ID; // undefined = whole team
  title: string;
  body: string;
  link: string;
  read: boolean;
  kind: 'followup' | 'overdue' | 'assignment' | 'milestone' | 'decision' | 'qualification';
}

export interface SessionRecord {
  id: ID;
  memberId: ID;
  displayName: string;
  device: string;
  startedAt: ISODateTime;
  lastSeenAt: ISODateTime;
  revoked: boolean;
}

export interface AppSettings {
  sessionDays: number;
  adminIdleMinutes: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
  invalidateOnPasswordChange: boolean;
  passwordLastChanged?: ISODateTime;
  recycleRetentionDays: number;
  eisTargetDate: ISODate; // B737 MAX Entry into Service target (synthetic)
}

export interface Filters {
  fleet: 'ALL' | 'A320' | 'B737';
  base: string; // 'ALL' or base code
  projectId: string; // 'ALL' or id
}
