# WINGS CONTROL -- Product Requirements & Technical Blueprint

**Dokumenttyp:** Product Requirements Document (PRD) / Technical
Blueprint\
**Version:** 0.3 -- access model and administration revised\
**Status:** Initial concept -- requirements to be refined\
**Produktname:** WINGS CONTROL\
**Produkttyp:** Responsive Aviation Training Management PWA

------------------------------------------------------------------------

## 1. Product Vision

WINGS CONTROL is a clean, modern and responsive web application for a
small airline training-management team.

It provides one central place to manage and monitor:

-   Projects and workstreams
-   Tasks, responsibilities and follow-ups
-   Instructor profiles, qualifications and availability
-   Training activities and planning
-   Regulatory approvals, compliance topics and document references
-   Meetings, decisions and action items
-   Management reporting, updates and notifications

The application should feel like a premium, uncluttered management
cockpit: highly usable, fast to understand and consistent across
desktop, iPad and iPhone.

The app must not display the users' internal job titles or
organizational positions. Use names only for normal users. The special
**Superadmin** designation is used only for system administration and
must not expose internal airline job titles.

### Product principles

1.  Clean dashboard with immediate visibility of priorities.
2.  Responsive and touch-friendly experience on desktop, iPad and
    iPhone.
3.  Clear ownership for every task and project.
4.  Fast visibility of overdue, blocked and time-critical items.
5.  Fleet-aware information architecture.
6.  Simple access using one shared team password and a user-entered
    name.
7.  A separate, protected Superadmin area for full system
    administration.
8.  Modular design that can grow over time.
9.  The app complements existing airline systems; it does not replace
    approved operational, ATO or compliance systems.

------------------------------------------------------------------------

## 2. Confirmed Product Decisions

  ---------------------------------------------------------------------
  Topic                              Decision
  ---------------------------------- ----------------------------------
  Product name                       WINGS CONTROL

  Normal users                       Up to 5 regular team members
                                     initially

  Normal access                      One shared password, identical for
                                     all normal users

  User identification                User enters their name; no role
                                     selection

  Password management                Only the Superadmin can change the
                                     shared team password

  Administration                     Dedicated Superadmin
                                     administration area

  Design direction                   Eurowings corporate color scheme

  Design reference                   The implementation AI is already
                                     familiar with the Eurowings color
                                     scheme; reuse its known brand
                                     palette and do not invent new
                                     brand colors

  Dashboard                          Clean, modern, uncluttered

  Supported devices                  Desktop, iPad and iPhone

  Platform                           Progressive Web App

  Initial fleets                     Airbus A320 and Boeing 737 MAX

  Future extensibility               Additional fleets and users may be
                                     added later

  Internal job titles                Must not appear anywhere in the
                                     app
  ---------------------------------------------------------------------

------------------------------------------------------------------------

## 3. Access Model and User Experience

### 3.1 Normal user access

There must be no conventional individual username/password login and no
role-selection screen.

When a user opens WINGS CONTROL:

1.  Show the WINGS CONTROL welcome / access screen.
2.  Ask for the user's **name**.
3.  Ask for the **shared team password**.
4.  Provide a single **Continue** button.
5.  If the password is correct, open the dashboard.
6.  Remember the user's name on that device/browser for convenience, but
    do not store the shared password in plaintext in local storage.

The same shared password is used by all normal users.

The name is a display identity only. It is not proof of identity and
must not grant special permissions.

Provide a visible **Change Name / Switch User** option in the profile
menu. Changing the display name must not bypass the shared password
requirement if the current session has expired.

### 3.2 Shared password management

-   There is exactly one shared team password for normal access.
-   Only the Superadmin can change or reset this password.
-   Normal users must not see the current password.
-   The password must never be displayed in plaintext in the Superadmin
    interface.
-   The Superadmin can set a new password and confirm it.
-   After a password change, existing sessions should be invalidated or
    revalidated according to a clearly documented session policy.
-   Passwords must be stored using a modern, strong password-hashing
    algorithm; never store plaintext passwords.
-   Apply rate limiting and temporary lockouts or progressive delays to
    reduce brute-force attempts.
-   Use HTTPS only.

### 3.3 Superadmin access

There is one designated **Superadmin**: the product owner.

The Superadmin must have a separate, protected way to authenticate to
the administration area. The shared team password must not automatically
grant Superadmin privileges.

Recommended approach:

-   Normal users enter name + shared team password.
-   Superadmin uses a separate administrator credential or a secure
    passkey / MFA-protected account.
-   The Superadmin credential must be independent of the shared team
    password.
-   Superadmin access must be enforced server-side, not by a client-side
    flag or a hidden URL.
-   The Superadmin session should have stronger protections and a
    shorter idle timeout than normal sessions.

This separate administrator authentication is essential: if all users
know the shared team password and that password also grants
administrator access, every user could change the password and
administer the application.

### 3.4 Session behavior

-   Keep users signed in for a configurable period to avoid repeated
    password entry.
-   Provide a clear logout / end session option.
-   Provide a Superadmin-controlled option to invalidate all normal
    sessions after a password change.
-   Do not rely solely on local storage for authentication state.
-   Session tokens must be securely issued and validated by the backend.

------------------------------------------------------------------------

## 4. Superadmin Administration Area

WINGS CONTROL must include a dedicated **Administration** area
accessible only to the Superadmin.

The Superadmin must be able to manage the entire application: view, add,
edit, archive and delete records and configure the system.

### 4.1 Administration dashboard

Show an overview of:

-   Total projects
-   Total tasks
-   Open and overdue tasks
-   Instructors
-   Training events
-   Pending approvals
-   Recent system activity
-   Data and system status

### 4.2 Full content management

The Superadmin must be able to create, view, edit and delete (CRUD)
records across all application modules.

Administration capabilities must include:

**Projects** - Add projects - Edit all project fields - Change owners
and contributors - Add, edit, reorder and remove workstreams - Manage
milestones and dependencies - Archive or delete projects

**Tasks** - Add tasks - Edit all task fields - Change owners and
contributors - Change status, priority and deadlines - Manage
dependencies - Archive or delete tasks

**Instructors** - Add instructor profiles - Edit instructor
information - Add, edit and remove qualifications - Manage qualification
validity and evidence references - Manage availability and training
history - Archive or delete instructor records

**Training** - Add and edit course types - Create and edit training
events - Manage participants, sessions, instructors and resources -
Cancel, archive or delete training records

**Compliance** - Add and edit approval records - Manage regulatory
tracking items - Add and update audit findings - Manage corrective
actions - Archive or delete records where appropriate

**Meetings and decisions** - Create and edit meetings - Manage
participants and minutes - Add, edit and remove decisions - Create and
manage action items

**Knowledge Base and documents** - Add, edit and remove knowledge
entries - Manage document metadata and links - Update categories and
tags

**Reference data** - Add, edit and remove fleets - Manage aircraft
types - Manage organizations and stakeholders - Manage tags, categories
and status options

### 4.3 User and access administration

The Superadmin must be able to:

-   Change the shared team password
-   Revoke active normal-user sessions
-   View recent access events where technically available
-   Configure session duration
-   Configure password policy and rate limits
-   Update the Superadmin authentication method through a secure process
-   View the current app version and system status

The Superadmin must not be able to retrieve the plaintext shared
password, because it must only be stored as a secure hash.

### 4.4 Delete and archive behavior

For important records, prefer **archive** over permanent deletion.

-   Archive should remove the record from normal active views but
    preserve its history.
-   Permanent deletion should require an explicit confirmation.
-   Show the impact of deletion, including related tasks, comments,
    attachments and dependencies.
-   Prevent accidental deletion of records that are still referenced by
    other records, or require a deliberate resolution of those
    references.
-   Consider a recycle-bin / restore function for a defined retention
    period.

### 4.5 Audit trail

Record Superadmin actions, including:

-   Shared password changed
-   Sessions revoked
-   Project created, edited, archived or deleted
-   Task created, edited, archived or deleted
-   Instructor or qualification changed
-   Compliance record changed
-   Reference data changed
-   System settings changed

Audit records should include timestamp, action, affected record and
authenticated Superadmin identity. Normal user activity can include the
entered display name, but this name is self-declared and not
independently verified.

------------------------------------------------------------------------

## 5. Brand and Visual Design

### Product name

Use **WINGS CONTROL** consistently throughout:

-   App header
-   Browser title
-   PWA manifest name
-   Welcome screen
-   Navigation
-   Administration area
-   Reports and exports

### Eurowings-inspired color scheme

Use the existing Eurowings corporate color scheme known to the
implementation AI.

Requirements:

-   Reuse the known Eurowings brand colors.
-   Do not invent a replacement palette or arbitrary hex values.
-   Keep the design clean, professional and restrained.
-   Use brand colors consistently for primary actions, navigation
    highlights and selected states.
-   Use accessible contrast for text and controls.
-   Status colors (success, warning, critical) must remain clearly
    distinguishable and should not be confused with brand colors.
-   Do not reproduce official logos or protected brand assets unless
    supplied or explicitly authorized.

### Visual direction

-   Clean light interface
-   White and very light neutral surfaces
-   Eurowings-inspired brand accents
-   Clear typography hierarchy
-   Generous whitespace
-   Subtle borders and restrained shadows
-   Consistent rounded cards
-   Simple, recognizable icons
-   Minimal decoration
-   No cluttered cockpit-style gauges
-   No excessive aircraft imagery

The result should look like a premium modern enterprise SaaS dashboard
with a subtle aviation identity.

------------------------------------------------------------------------

## 6. Responsive Design -- Desktop, iPad and iPhone

Responsive design is a core requirement, not a later enhancement.

The same application must work well on:

-   Desktop and laptop browsers
-   iPad in portrait and landscape
-   iPhone in portrait
-   Other modern mobile browsers

### Desktop

-   Fixed or collapsible left sidebar
-   Main content area
-   Optional right-hand contextual panel
-   Dashboard cards in a responsive grid
-   Tables for dense data
-   Global search and quick actions in the top bar

### iPad

-   Collapsible sidebar or compact navigation rail
-   Two-column dashboard where space permits
-   Touch-friendly controls
-   Tables that adapt into compact rows or cards
-   Support portrait and landscape orientation
-   Avoid hover-only interactions

### iPhone

-   Compact top header
-   Bottom navigation for key modules
-   Single-column dashboard
-   Cards instead of wide tables
-   Large touch targets
-   Simplified filters in a drawer or sheet
-   Forms optimized for mobile input
-   No horizontal scrolling for primary workflows

### Responsive behavior

-   Desktop: full sidebar
-   iPad: collapsible sidebar / navigation rail
-   iPhone: bottom navigation and More menu

Test actual layouts at common desktop, tablet and mobile viewport sizes.

------------------------------------------------------------------------

## 7. Information Architecture and Navigation

### Main navigation

1.  Dashboard
2.  Projects
3.  Tasks
4.  Instructors
5.  Training
6.  Compliance
7.  Meetings
8.  Knowledge Base
9.  Reports
10. Administration (Superadmin only)

Global interface elements:

-   Global search
-   Notification center
-   Current display name
-   Fleet filter
-   Quick-create action
-   Recent activity

### Mobile navigation

Use a compact bottom navigation for the most frequently used areas:

-   Home
-   Projects
-   Tasks
-   Team
-   More

Administration should be accessible through the profile / More area only
when a valid Superadmin session exists.

------------------------------------------------------------------------

## 8. Functional Requirements by Module

### 8.1 Dashboard

The dashboard is the default landing page and must provide an immediate
overview of the team's workload and priorities.

Recommended KPI cards:

-   Active Projects
-   Open Tasks
-   Overdue Tasks
-   Waiting For
-   Critical Items
-   Upcoming Deadlines
-   Pending Approvals
-   Instructor Status

Dashboard sections:

-   My Attention Required
-   Team Attention Required
-   Recently Updated
-   Upcoming Deadlines
-   Upcoming Milestones
-   Activity Feed

Filters:

-   All Fleets
-   A320
-   B737 MAX
-   My Items
-   Team Items

Dashboard figures must be calculated from actual records. Do not use
hardcoded example figures in production.

### 8.2 Project Management

Each project should include:

-   Project title
-   Description and objectives
-   Fleet association
-   Project owner
-   Contributors / members
-   Status
-   Priority
-   Start date
-   Target completion date
-   Overall progress
-   Workstreams
-   Tasks
-   Milestones
-   Dependencies
-   Risks and issues
-   Updates and comments
-   Related documents and links

Recommended views:

-   List
-   Kanban
-   Timeline / Gantt
-   Milestones
-   Project detail page

### 8.3 B737 MAX Introduction -- Initial Workstream Template

Suggested workstreams:

1.  Regulatory & EASA Approvals
2.  Training Concept & Footprint
3.  Type Rating & Difference Training
4.  Instructor & Examiner Training
5.  Simulator Procurement & Qualification
6.  Training Courseware & Documentation
7.  Partner Coordination
8.  Pilot Recruitment & Assessment
9.  Crew Transition & Phase-In
10. OCC Training
11. Operational Readiness
12. Entry Into Service

These are configurable planning categories, not a statement that every
workstream is required or approved. The Superadmin must be able to add,
remove, rename and reorder workstreams.

### 8.4 Task Management

Task fields:

-   Title
-   Description
-   Project
-   Workstream
-   Fleet
-   Primary owner
-   Additional assignees / contributors
-   External responsible party or organization
-   Waiting-for person / organization / deliverable
-   Expected response or delivery date
-   Next follow-up date
-   Internal owner responsible for chasing the dependency
-   Created date
-   Start date
-   Due date
-   Priority
-   Status
-   Dependencies
-   Comments
-   Attachments
-   Last updated date
-   Completion date

Statuses:

-   Open
-   In Progress
-   Waiting For
-   Blocked
-   Completed
-   Cancelled

Priorities:

-   Low
-   Normal
-   High
-   Critical

Every active task should have one clearly accountable primary owner.
External people or organizations may be recorded without giving them app
access.

### 8.5 Instructor Management

Maintain a central instructor directory with:

-   Name
-   Contact details (only where authorized)
-   Base / location
-   Fleet associations
-   Relevant experience
-   Qualifications
-   Qualification validity
-   Availability
-   Training history
-   Course assignments
-   Related documents or links

Qualification management:

-   Qualification type (e.g. TRI, TRE, SFI, FI, as applicable)
-   Aircraft / fleet
-   Issue date
-   Expiry date
-   Status
-   Limitations or scope
-   Evidence reference
-   Last verified date

Features:

-   Qualification matrix
-   Expiry monitoring
-   Availability calendar
-   Instructor development needs
-   Training history
-   Course assignments

The app is a management aid and is not an authoritative licence-control
system unless formally validated and approved for that use.

### 8.6 Training Management

Potential categories:

-   Type Rating
-   Difference Training
-   OCC
-   TRI / TRE Courses
-   Recurrent Training
-   LPC / OPC
-   ZFTT
-   LIFUS
-   Special Training

Manage course types, events, participants, sessions, instructors,
simulator resources, dates, status and notes.

### 8.7 Compliance and Regulatory Tracking

Track:

-   Authority approvals
-   ATO approvals
-   Training programme approvals
-   Manual revisions
-   OSD-related items
-   Regulatory changes
-   Audit findings
-   Corrective actions
-   Internal reviews

Each record should support title, description, fleet, category, owner,
authority, status, due date, submission date, approval date, reference
number, evidence link and history.

### 8.8 Meetings and Meeting Minutes

Meeting management and meeting minutes are a core module. Users must be
able to upload existing minutes and create, edit and maintain minutes
directly inside WINGS CONTROL.

#### Meeting records

Each meeting should include:

-   Meeting title and category
-   Date, start time, end time and time zone
-   Location or meeting link (optional)
-   Organizer
-   Participants and organizations
-   Related fleet(s), project(s) and workstream(s)
-   Agenda
-   Meeting status (Planned, Held, Cancelled)
-   Related documents and attachments

#### In-app meeting-minutes editor

Provide a dedicated editor. Users should be able to:

-   Create minutes from a meeting record or start standalone minutes.
-   Enter meeting details, participants and agenda.
-   Add structured agenda items and notes.
-   Record discussions, key points and outcomes.
-   Record decisions separately from general notes.
-   Create action items with owner, due date, priority and status.
-   Link action items to a project and workstream.
-   Convert action items into tasks without re-entering information.
-   Add attachments and links.
-   Save as Draft, mark as Final, and create later revisions.
-   Preview minutes before finalizing.
-   Search by title, date, participant, project, fleet and keywords.

The editor should support headings, bold and italic text, bullet and
numbered lists, tables, links and checklists. Provide autosave or a
clear save workflow, show the last saved time and warn about unsaved
changes. Prevent silent overwrites when multiple users edit the same
minutes by using version checks or conflict resolution.

#### Meeting-minutes templates

Provide reusable templates:

1.  Standard Management Meeting
2.  Project Status Meeting
3.  B737 MAX Introduction Meeting
4.  Instructor / Training Meeting
5.  Partner Coordination Meeting
6.  Regulatory / Compliance Meeting

Templates should be editable by the Superadmin. Users can also start
with a blank document.

#### Upload existing minutes

Support DOCX and PDF uploads, plus DOC and spreadsheet formats where
reliable. Keep the original file available. Where possible, extract text
for search and preview, but clearly identify extracted content and do
not silently convert an uploaded file into an editable official record.

Users may create a draft from extracted text, review it and then
finalize it. Human review is required before minutes are marked Final.

#### Status and version history

Suggested statuses:

-   Draft
-   In Review
-   Final
-   Superseded
-   Archived

Maintain created-by display name, creation date, last editor, last edit
date, version number, finalized date and revision notes.

Because normal users identify themselves by a typed display name, these
names are not independently verified. Superadmin actions should be
attributable to the authenticated Superadmin account.

Finalized minutes must not be silently overwritten. Editing finalized
minutes should create a new revision or require an explicit reopen
action, preserving the previous version.

#### Export

Meeting minutes should be exportable as:

-   DOCX -- editable Word minutes
-   PDF -- finalized / printable minutes
-   XLSX -- action-item register
-   CSV -- action-item data
-   JSON -- structured administrator export, if required

Exports should use a professional WINGS CONTROL layout and include
meeting title, date, participants, agenda, discussion notes, decisions,
action items, owners, due dates and version/finalization information.

Allow export of full minutes, decisions only, action items only or
attendance list.

#### Action-item integration

Each action item should support description, owner, contributors, due
date, priority, status, related project/workstream, fleet and a link to
the source meeting and minutes.

Users must be able to create a task from an action item with one action.
The created task must retain a reference to the originating meeting and
minutes. Prevent duplicate task creation from the same action item.

### 8.9 Knowledge Base

Provide searchable management knowledge, process notes, project
references, partner information, internal guidance and lessons learned.
Prefer links to authoritative repositories for official manuals.

### 8.10 Management Cockpit

The Dashboard must function as a management cockpit, not merely as a
collection of static KPI cards. It should provide an actionable overview
of the entire training-management operation.

Include:

-   Active projects and project health
-   Open, overdue, blocked and waiting-for actions
-   Critical and high risks
-   Upcoming milestones and deadlines
-   Pending decisions and approvals
-   Instructor qualification and availability alerts
-   Recent activity and significant changes
-   Items requiring management attention

Provide filters for All Fleets, A320, B737 MAX and General / Both, as
well as time period and responsible person where relevant.

Every KPI or alert must link to the underlying records. Dashboard data
must be calculated from live application records, not hardcoded values.
Clearly distinguish actual status from forecast or estimated status.

#### Ownership, external dependencies and follow-up workflow

A task must distinguish between the person accountable for driving the
task internally and any person or organization whose action is required
before the task can progress.

Support the following fields where applicable:

-   **Primary owner:** one internal person accountable for the task from
    start to finish.
-   **Contributors:** internal colleagues who must perform or support
    part of the work.
-   **External dependency:** person, partner, department or authority
    whose input / action is required.
-   **Awaited item:** the specific response, document, approval,
    decision or deliverable expected.
-   **Expected date:** when the awaited item is expected.
-   **Next follow-up date:** when the internal owner should chase the
    item if no response has arrived.
-   **Dependency status:** Not Requested, Requested, In Progress
    Externally, Received, Overdue / Escalation Required.
-   **Linked tasks:** tasks that cannot start or finish until the
    dependency is resolved.

The internal primary owner remains accountable even when the next action
lies with an external party. External parties do not need application
accounts. They can be recorded as contacts / organizations in
Stakeholder Management and linked to the task.

Provide dedicated saved views:

-   My Tasks
-   Team Tasks
-   Unassigned Tasks
-   Overdue Tasks
-   Due Soon
-   Waiting For External Input
-   Waiting For Internal Input
-   Follow-up Due
-   Blocked Tasks
-   Completed Tasks

The task detail view should show a simple activity timeline: task
created, assigned, request sent / noted, follow-up completed, response
received, dependency cleared and task completed. Users can add comments
and attach evidence such as emails or documents.

When a follow-up date arrives without the awaited item being marked
Received, create an in-app reminder for the primary owner. If the
expected date passes, flag the dependency as overdue and show it in the
relevant dashboard / action tracker views. Do not automatically send
external emails unless a separately authorized integration and explicit
send action are implemented.

### 8.11 Central Action Tracker

Provide one central action register aggregating actionable items from
all relevant modules:

-   Project tasks
-   Meeting action items
-   Compliance findings and corrective actions
-   Stakeholder and partner follow-ups
-   Instructor-management follow-ups
-   Other manually created actions

Each action must have one accountable primary owner, optional
contributors, due date, priority, status, source module and link to the
originating record. Support filters for fleet, project, owner, status,
priority, source and due date.

An action item converted into a task must retain its source reference.
Prevent duplicate task creation from the same source action. Updating
the task status should be reflected wherever that action is displayed;
do not create disconnected copies of the same action.

### 8.12 Decision Log

Maintain a central decision register. Each decision should include:

-   Decision title and description
-   Decision date
-   Decision owner / responsible person
-   Decision status (Proposed, Under Review, Approved, Rejected,
    Superseded)
-   Background and rationale
-   Options considered, where relevant
-   Impacted fleet, project and workstream
-   Related meeting and meeting minutes
-   Supporting documents and links
-   Follow-up actions

Decisions created in meeting minutes should be linkable to the central
Decision Log without duplicating the underlying decision record.
Preserve decision history and record changes to status or rationale.

### 8.13 Stakeholder and Partner Management

Provide a central directory for internal and external stakeholders,
organizations and partners.

Support:

-   Organization name and category
-   Contact persons and roles
-   Contact details, subject to access permissions and data-protection
    requirements
-   Organization / partner relationship
-   Related fleets, projects and workstreams
-   Responsibilities and areas of involvement
-   Open actions and follow-ups
-   Last interaction and next planned follow-up
-   Related meetings, decisions, documents and notes

External stakeholders must be recordable without being granted
application access. Link stakeholder records to tasks, meetings,
projects and decisions rather than maintaining separate duplicate
contact details in each module.

### 8.14 Risk and Issue Management

Provide a central Risk and Issue Register.

Each risk should support:

-   Title and description
-   Risk category
-   Affected fleet, project and workstream
-   Probability
-   Impact
-   Calculated risk score using a configurable and documented scoring
    matrix
-   Mitigation and contingency actions
-   Risk owner
-   Review date and target date
-   Status (Open, Monitoring, Mitigation in Progress, Escalated, Closed)
-   Linked tasks, milestones, decisions and documents
-   Update history

Issues should be distinguishable from potential risks and should support
severity, impact, owner, resolution plan and status.

Display critical and high risks prominently in the Management Cockpit.
Risk scores and thresholds must be configurable by the Superadmin. The
app must not imply that a risk has been formally accepted or closed
without a recorded authorized action.

### 8.15 Notifications and Reminders

Provide an in-app notification center with configurable reminders for:

-   Upcoming task deadlines
-   Overdue tasks
-   Follow-up dates
-   Waiting-for items requiring follow-up
-   Instructor qualification expiry dates
-   Upcoming milestones
-   Pending decisions and approvals
-   New assignments or changes to assigned records
-   Meeting action items approaching their due dates

Users should be able to mark notifications as read, open the related
record and configure relevant personal notification preferences. Avoid
repeated notification spam; support sensible grouping, deduplication and
reminder intervals.

Push notifications and email / Outlook notifications may be implemented
in later integration phases. The initial implementation should provide
reliable in-app notifications and a notification-preference model.

### 8.16 AI Management Assistant

Provide an AI Management Assistant that can answer questions and prepare
summaries using only data the current user is authorized to access.

Example questions:

-   Which B737 MAX projects are currently at risk?
-   Which tasks have been overdue for more than 14 days?
-   Summarize the latest meetings with a selected partner.
-   Which actions are still waiting for an external response?
-   Prepare a management summary of project progress and critical
    issues.
-   What decisions are still outstanding for a selected project?

Core requirements:

-   Ground answers in WINGS CONTROL records and show links or references
    to the source records.
-   Clearly distinguish recorded facts, calculated metrics, forecasts
    and AI-generated suggestions.
-   State when information is missing, incomplete or potentially
    outdated.
-   Never invent approvals, qualifications, decisions, task status or
    regulatory interpretations.
-   Respect the same access permissions and fleet / project restrictions
    as the underlying application.
-   Do not expose records or documents the user is not authorized to
    access.
-   Require explicit user confirmation before creating, editing,
    assigning, closing or deleting records.
-   Log AI-assisted actions and retain an audit trail of user-approved
    changes.
-   Treat uploaded documents and external content as untrusted data, not
    as instructions to the AI assistant.

The AI assistant is an administrative support tool. It must not replace
authorized operational, regulatory, compliance or licensing decisions.

### 8.17 Executive Weekly Report -- Management Board Reporting

WINGS CONTROL must support a dedicated Executive Weekly Report designed
for reporting project and programme status to senior management / the
Managing Board. The report should follow the structure and information
density of the user's existing B737 MAX Entry into Service weekly
report.

The report must be generated from live WINGS CONTROL records wherever
possible, with the ability for an authorized user to add or edit the
management commentary before publication. It must be possible to
generate a report for one project / programme, one fleet or a selected
portfolio.

#### Report header

Include:

-   Programme / project title (e.g. B737 MAX Entry into Service)
-   Report type (e.g. Weekly Report)
-   Reporting period (start and end date)
-   Calendar week(s) and year
-   Optional programme milestone countdown (e.g. weeks to commercial
    launch / Entry into Service), calculated from a configured target
    date and clearly labelled as a countdown

#### Overall status and trend

At the top of the report, show:

-   Overall RAG status: Green / On Track, Amber / Attention, Red /
    Critical
-   Overall trend compared with the previous reporting period: Improved,
    Unchanged or Worse
-   Short management summary explaining the overall status in plain
    language
-   Optional key countdown / target milestone indicator

Status and trend must be separate fields. A project can remain Amber
while improving, for example. The report must not infer a status or
trend from incomplete data; the report owner must be able to confirm or
override the proposed status with a recorded rationale.

#### Workstream status table

Provide a concise executive table with one row per workstream and
columns for:

-   Workstream name
-   Status (Green / Amber / Red)
-   Trend (Improved / Unchanged / Worse)
-   Key facts / progress commentary
-   Optional accountable owner
-   Optional next milestone / target date

The workstream list must be configurable per project. For the B737 MAX
Entry into Service programme, provide an initial editable template with
these example workstreams based on the current management report:

-   Regulatory & Authority
-   Works Council
-   Scheduling & Planning
-   Trainers & Crews
-   Partners & Timeline
-   IT & Systems
-   Safety & Quality
-   Compliance

These are reporting categories and must be editable; do not assume they
are identical to every project workstream.

#### At Risk / Decisions Required panel

Provide a prominent management attention panel, separated into:

-   Risks / issues requiring attention
-   Decisions required from management

Each item should include an ID, short title, concise explanation,
severity / urgency, owner (where known), required decision or
mitigation, and target date if available. Link each item to its full
record in WINGS CONTROL.

Decision items should identify the decision authority / person or body
required to decide, and distinguish a decision that is merely proposed
from one formally approved.

#### Programme-specific KPI panel

Support configurable progress indicators relevant to the programme. For
the B737 MAX Entry into Service example, include a pilot selection
progress panel showing:

-   Selected pilots / total pilots
-   Visual progress indicator
-   Breakdown by relevant qualification or crew category (e.g. CPT
    TRI/TRE, CPT, F/O), using configured categories
-   Remaining / open candidates

The same panel system should support other project-specific indicators,
such as instructor nominations, simulator readiness, training
completion, approval progress or recruitment status. Do not hardcode the
pilot-selection metric into every report.

#### Visual design and export

The report should be a polished, single-page executive summary where
practical, with optional detailed appendix pages. It should use the
existing Eurowings corporate branding already known to the
implementation team; do not invent a new palette or branding.

Support:

-   PDF export suitable for direct presentation or email to senior
    management
-   PowerPoint export where technically supported, with editable text
    and charts
-   Word export for editable narrative reports
-   Excel export for underlying workstream status, risks, decisions and
    KPI data
-   Preview before publication
-   Reporting-period history and archived snapshots so previously issued
    reports remain unchanged when live project data later changes

The report must identify its reporting period, generation date, author /
report owner and version. Clearly distinguish manually entered
commentary from automatically calculated values. Include a data
freshness indicator or last-updated timestamp for source data.

#### Report workflow

1.  Select project / programme and reporting period.
2.  Pull current workstream status, trends, actions, risks, decisions
    and configured KPIs from WINGS CONTROL.
3.  Highlight missing or stale information for review.
4.  Allow the report owner to edit the management summary and key facts.
5.  Confirm overall RAG status and trend, with rationale for overrides.
6.  Preview the executive report.
7.  Publish / export and store an immutable reporting snapshot.
8.  Carry forward the prior report's workstream statuses and trends as a
    comparison baseline for the next period.

Do not automatically send reports to management. Sending / distribution
integrations require a separate explicit user action and appropriate
authorization.

### 8.18 Instructor / Trainer Management Reporting -- Executive Overview and Individual Profiles

WINGS CONTROL must provide a dedicated trainer-management reporting area
based on the structure of the supplied workbook
`EWL Trainer 737 EVAL.xlsx`. The workbook is the reference for the
initial data fields and reporting dimensions. The implementation must
preserve the source terminology and must not infer meanings for
ambiguous fields.

The trainer reporting area should have two levels:

1.  **Trainer Overview** -- an executive dashboard / report showing the
    overall trainer population and its distribution.
2.  **Individual Trainer Profile** -- a searchable record for each
    trainer with qualifications, base, workload indicators, experience
    dates and supporting notes.

#### Trainer master-data fields from the supplied workbook

Map the source workbook fields as follows:

  ---------------------------------------------------------------------
  Source workbook field              WINGS CONTROL field / handling
  ---------------------------------- ----------------------------------
  Trainer Qual                       Trainer qualification / role
                                     category; preserve source value

  Base                               Base / location; preserve codes
                                     such as VIE, PMI, SZG, PRG, ARN

  TLC                                TLC identifier; retain as a source
                                     identifier

  Name                               Trainer name

  Remark                             Notes / function / special remark

  Part Time                          Employment / availability
                                     percentage or source category;
                                     preserve values such as VZ, 0.9,
                                     0.8, 0.75, 0.7, 0.6, 0.25, DEC and
                                     80% + NOV without silently
                                     normalizing

  Trainer SIM Sessions               Recorded number of trainer
                                     simulator sessions

  Trainer LIFUS Legs                 Recorded number of trainer LIFUS
                                     legs

  ORE A - C                          ORE category; preserve A, B, C and
                                     Rente as supplied

  Trainer seit -- LTC                Date from which the trainer has
                                     held the LTC role, where present

  Trainer seit -- TRI                Date from which the trainer has
                                     held the TRI role, where present

  Trainer seit -- TRE                Date from which the trainer has
                                     held the TRE role, where present

  Ausstellende Behörde               Issuing authority; preserve source
                                     text

  B ab                               Preserve as a separate source
                                     field pending confirmation of its
                                     exact business meaning
  ---------------------------------------------------------------------

Do not treat the `Trainer seit` dates as qualification expiry dates. Do
not infer current qualification validity from these fields. The `B ab`
column must be imported and displayed as supplied until its meaning and
intended use are confirmed by the data owner.

#### Trainer Overview dashboard

#### Additional Trainer Overview visualizations -- based on the supplied screenshots

The Trainer Overview must include three prominent, dynamically
calculated visual sections in addition to the KPI cards and roster
views. The supplied screenshots are the visual reference for these
sections.

**A. Issuing Authority**

A horizontal bar chart showing the number of trainers by issuing
authority, including:

-   Authority / country label
-   Trainer count
-   Relative bar length
-   Total trainer population in the chart header

The screenshot example shows a total of 53, with Austria 43, Germany 4,
Czech 3, Sweden 1, Spain 1 and Swiss 1. These are example
source-snapshot values only; the live application must calculate counts
from current filtered trainer records.

**B. Qualification by Aircraft**

A horizontal bar chart showing trainer qualification counts, split by
aircraft type. Include a clear legend and count for each aircraft
series, with a total population in the chart header.

The screenshot example shows qualification categories SEN, TRE, TRI,
LTC, SFI and TKI. It shows A320 53 and B737 0 for that source snapshot.
The qualification categories and aircraft types must be configurable and
data-driven; do not hardcode these example counts.

Important: clarify whether one trainer may hold multiple qualification
categories for the same aircraft. If multiple qualifications per trainer
are allowed, display category counts as qualification-record counts and
label them accordingly; do not imply that category totals represent
unique people. Provide a distinct unique-trainer count where
appropriate.

**C. Qualification by Aircraft and Base**

Provide a grouped breakdown by base. Each base section should show:

-   Base code / name
-   Total trainer count for that base
-   Qualification categories (e.g. SEN, TRE, TRI, LTC, SFI, TKI)
-   Count per category
-   Aircraft split / legend (A320 and B737, and additional aircraft if
    configured)

The supplied screenshot demonstrates this presentation for bases
including PMI and VIE. It shows PMI with a total of 21 and VIE with a
total of 15 in the visible portion. These values are illustrative source
data only. Other bases and counts must be calculated from the imported
roster; do not infer values not visible in the source.

**Interaction and filtering**

-   All three charts must respond to the global fleet / aircraft filter
    and other applicable Trainer Overview filters.
-   Clicking a bar, authority, qualification, aircraft or base should
    filter the trainer roster to the matching records.
-   Provide a clear reset / clear-filter action.
-   Display the reporting / source data date and the number of records
    included.
-   Clearly distinguish zero from missing or unknown data.
-   Where a trainer has multiple aircraft or qualifications, use a
    documented counting rule and avoid double-counting unique trainer
    totals.
-   Ensure chart labels and values remain readable on desktop, iPad and
    iPhone. On narrow screens, use vertically stacked cards and
    responsive chart labels rather than shrinking text excessively.

**Visual styling**

Use the existing Eurowings corporate branding already known to the
implementation team. Follow the supplied screenshots' visual hierarchy:
clean light background, white cards, subtle borders and shadows,
prominent section headings, horizontal progress bars, clearly visible
totals and restrained use of the brand accent. Do not invent a new
colour palette.

Provide configurable KPI cards and visual breakdowns for:

-   Total trainer population
-   Trainer qualification / role distribution (e.g. TRE, TRE/SEN, LTC,
    TRI, new TRI)
-   Base distribution
-   Part-time / full-time distribution
-   ORE category distribution (A, B, C, Rente)
-   Issuing authority distribution
-   Total recorded Trainer SIM Sessions
-   Total recorded Trainer LIFUS Legs
-   Trainers with missing or incomplete source data
-   Trainers with upcoming qualification / document review dates, but
    only where explicit expiry / validity data is available in a
    verified field

Provide filters for fleet / aircraft type, base, qualification, ORE
category, part-time category and reporting date. The 737 trainer roster
must be represented as a configurable dataset, not hardcoded into the
user interface.

#### Workload and experience indicators

Display the source workload indicators separately:

-   Trainer SIM Sessions
-   Trainer LIFUS Legs

Provide totals, averages and distribution by base and trainer
qualification where data is available. Clearly label them as recorded
counts from the source dataset, not as current availability, currency or
authorization.

Display trainer role experience using the `Trainer seit` dates for LTC,
TRI and TRE. Where a date is missing, show "No date recorded" rather
than assuming the trainer does not hold the role.

#### Individual trainer profile

Each trainer profile should include:

-   Name and TLC
-   Base
-   Trainer qualification / role category
-   Remarks
-   Part-time category / percentage as imported
-   Trainer SIM Sessions
-   Trainer LIFUS Legs
-   ORE category
-   Separate `Trainer seit` dates for LTC, TRI and TRE
-   Issuing authority
-   `B ab` source field
-   Supporting documents / evidence links
-   Additional qualifications and validity records, where separately
    verified
-   Availability and course assignments, maintained separately from
    historical session / leg counts

Show a clear distinction between: - Source-imported values - Values
edited or maintained in WINGS CONTROL - Verified qualification /
validity information - Missing or unverified information

#### Trainer report export

Provide an executive trainer report that can be generated for a selected
fleet / aircraft type and reporting date.

Recommended report structure:

1.  Overall trainer population and headline KPIs
2.  Qualification distribution
3.  Base distribution
4.  Full-time / part-time distribution
5.  ORE A / B / C / Rente distribution
6.  Issuing authority distribution
7.  Trainer SIM Sessions and LIFUS Legs
8.  Individual trainer roster with key fields
9.  Missing data / items requiring review

Support: - PDF -- concise management overview - Excel -- detailed roster
and separate statistical worksheets - Word -- editable management
summary - CSV -- filtered trainer roster - Individual trainer profile as
PDF / DOCX

The Excel export should include separate worksheets for Trainer
Overview, Qualifications, Bases, Part-Time Distribution, ORE Categories,
Issuing Authorities, Workload Indicators and Data Dictionary / Export
Notes. Retain stable trainer IDs and TLC identifiers to avoid relying on
names alone.

#### Import and data-quality requirements

-   Support importing the supplied workbook structure through the
    general Excel import workflow.
-   Preview worksheet and column mapping before import.
-   Preserve source values and original workbook as an attachment /
    import record.
-   Identify duplicate trainers using stable identifiers such as TLC
    where present, with manual review where identifiers are missing or
    conflicting.
-   Do not silently overwrite manually verified records with imported
    values.
-   Provide import reconciliation showing new, updated, unchanged,
    duplicate and rejected rows.
-   Record import date, source filename, importing user and mapping
    version.
-   Treat the workbook's stated data date (`Stand: 23.07.2026`) as the
    source snapshot date, not as proof that the data is current at the
    time of import.
-   Require the user to confirm the intended aircraft / fleet
    association before importing; the workbook title indicates 737 EVAL,
    but the exact mapping to fleet records should be confirmed during
    import.
-   Preserve ambiguous source fields such as `B ab` without assigning an
    unsupported meaning.

### 8.10 Reports

Provide reports for project status, task status, overdue tasks,
waiting-for items, milestones, instructor qualifications, availability,
training activity, pending approvals and risks.

------------------------------------------------------------------------

## 9. Additional Features

### Risk and Issue Register

Track title, description, project, workstream, fleet, owner,
probability, impact, risk score, mitigation, due date, status and review
date.

### Stakeholder Management

Maintain people and organizations relevant to projects, including
responsibility, organization, authorized contact details, related
projects, open follow-ups and notes.

### Activity Feed

Record task, project, milestone, instructor, qualification, approval and
decision changes.

### Notifications

Support task assignment, due-soon reminders, overdue alerts, waiting-for
follow-ups, milestone reminders, qualification expiry reminders,
comments and approval updates.

#### Additional Acceptance Criteria -- Sandbox, Autosave and Backups

-   The full application can be deployed and tested in an isolated
    Sandbox before production.
-   Sandbox is visibly labelled and cannot modify production data or
    trigger live external communications.
-   Sandbox can be reset to a known test dataset.
-   Editable content visibly reports autosave status and last successful
    save time.
-   Temporary network failures do not silently lose edits; retries and
    recovery are supported.
-   Concurrent edits are detected and cannot silently overwrite newer
    content.
-   Automated production backups run on the configured schedule and
    expose success / failure status.
-   Backup restoration has been tested in an isolated environment and
    documented.
-   Patrick Thorn is configured as Superadmin and Joost Jansen as a
    standard team user for the initial setup.
-   No shared password or secret is hardcoded in source code, seed data
    or the Sandbox.

## AI Management Assistant -- Later Phase

Potential questions:

-   Which items currently threaten the planned start of the first MAX
    training course?
-   Which tasks are overdue and assigned to external parties?
-   What changed since my last visit?
-   Which instructors have qualifications approaching expiry?
-   Summarize the current status of the B737 MAX introduction.
-   Prepare a weekly management briefing.

AI answers must link to source records, distinguish facts from
assumptions and never invent project status or regulatory conclusions.

------------------------------------------------------------------------

## 10. Technical Architecture

### Recommended stack

  -----------------------------------------------------------------------
  Layer                   Recommendation          Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React + TypeScript      PWA user interface

  Build tooling           Vite                    Frontend development
                                                  and build

  Styling                 Tailwind CSS            Design system

  UI components           Accessible component    Reusable interface
                          library                 

  Backend                 Supabase                Backend services

  Database                PostgreSQL              Relational data

  Normal access           Shared-password         Team access
                          authentication          

  Superadmin access       Separate protected      Administrative
                          admin authentication    privileges

  Authorization           Server-side policies    Protect admin
                                                  operations

  Hosting                 Vercel or approved      Deployment
                          equivalent              

  Charts                  Recharts or equivalent  Reports

  PWA                     Web App Manifest +      Installability and
                          Service Worker          caching

  Notifications           Web Push                Reminders
  -----------------------------------------------------------------------

### Security architecture

The shared password is a common credential. Anyone who knows it can
access the normal application, so it must not be treated as individual
identity verification.

The Superadmin must have a separate authentication mechanism. All
administrative operations must be authorized on the server.

Recommended implementation:

-   Store the shared password as a strong salted hash, using a modern
    password-hashing algorithm such as Argon2id or an appropriate
    managed authentication mechanism.
-   Never return the password hash to the browser.
-   Validate the shared password server-side.
-   Use rate limiting and progressive delays for failed attempts.
-   Issue secure, HTTP-only, same-site session cookies where supported
    by the deployment architecture.
-   Use HTTPS only.
-   Keep Superadmin credentials separate from the shared password.
-   Prefer passkey or MFA for Superadmin access.
-   Require re-authentication for sensitive administrative actions such
    as changing the shared password or permanently deleting records.
-   Log administrative actions.
-   Never rely on hidden routes, local storage flags or client-side role
    values to protect administration.

The application must not expose database service-role keys or secrets in
frontend code.

------------------------------------------------------------------------

## 11. Database Design -- Proposed Tables

Initial logical schema; exact columns, constraints and indexes are to be
designed during implementation.

### Access and administration

-   `profiles` -- display names for normal users
-   `admin_accounts` -- Superadmin identity / authentication reference
-   `app_settings` -- shared-password hash, session settings and other
    configuration
-   `sessions` or managed session records
-   `notifications`
-   `notification_preferences`
-   `activity_logs`
-   `audit_events`

Do not store the shared password in plaintext. Do not store the
Superadmin password in application settings. Use a secure authentication
provider or a dedicated secure credential flow.

### Reference data

-   `fleets`
-   `aircraft_types`
-   `organizations`
-   `stakeholders`
-   `tags`

### Projects

-   `projects`
-   `project_members`
-   `project_workstreams`
-   `project_milestones`
-   `project_dependencies`
-   `project_updates`
-   `project_risks`
-   `project_documents`

### Tasks

-   `tasks`
-   `task_assignees`
-   `task_comments`
-   `task_attachments`
-   `task_dependencies`
-   `task_history`
-   `task_reminders`

### Instructor management

-   `instructors`
-   `qualification_types`
-   `qualifications`
-   `instructor_qualifications`
-   `instructor_availability`
-   `instructor_training_history`
-   `instructor_assignments`

### Training

-   `training_course_types`
-   `training_events`
-   `training_participants`
-   `training_sessions`
-   `training_resources`
-   `training_allocations`

### Compliance and documentation

-   `approvals`
-   `regulatory_items`
-   `audit_findings`
-   `corrective_actions`
-   `documents`
-   `document_revisions`

### Meetings and decisions

-   `meetings`
-   `meeting_participants`
-   `meeting_minutes`
-   `meeting_action_items`
-   `decisions`

### Common fields

For applicable main entities:

-   `id` -- UUID primary key
-   `created_at`
-   `created_by_profile_id` where appropriate
-   `updated_at`
-   `updated_by_profile_id` where appropriate
-   `status`
-   `fleet_id` or a normalized fleet-association table

Use explicit join tables for many-to-many relationships. Add indexes for
status, due date, fleet, owner and project.

------------------------------------------------------------------------

## 12. PWA Requirements

-   Installable on desktop and mobile.
-   Valid web app manifest.
-   Service worker.
-   HTTPS.
-   Static asset caching.
-   Graceful offline behavior.
-   Responsive layouts for desktop, iPad and iPhone.
-   Consistent functionality across device sizes.

Initially, offline mode should be read-only for previously loaded,
non-sensitive content where safe. Do not implement offline editing or
background synchronization until conflict resolution has been designed
and tested.

Test iOS PWA installation and notification behavior on actual target
devices.

------------------------------------------------------------------------

## 13. Development Roadmap

### Phase 1 -- Foundation and design

-   Confirm hosting and data-processing constraints.
-   Apply WINGS CONTROL branding and known Eurowings color palette.
-   Create responsive design system.
-   Set up repository and environments.
-   Establish database migrations.
-   Implement shared-password access flow.
-   Implement separate Superadmin authentication.
-   Build responsive application shell and navigation.

### Phase 2 -- Core MVP

-   Welcome / name and shared-password screen
-   Dashboard
-   Fleet filters
-   Project management
-   Workstreams and milestones
-   Task management
-   Comments
-   Activity feed
-   Superadmin administration area
-   Shared-password change function
-   CRUD administration for core records
-   Basic reminders

**MVP acceptance criteria:**

-   A user enters a display name and the shared team password.
-   No role-selection screen is shown.
-   The same shared password is used by all normal users.
-   Only an authenticated Superadmin can change the shared password.
-   Normal users cannot access the administration area.
-   The Superadmin can add, view, edit, archive and delete core records.
-   The dashboard works on desktop, iPad and iPhone.
-   Projects and tasks support A320, B737 MAX and General fleet
    categories.
-   Overdue and waiting-for tasks are visible.
-   Important changes appear in the activity feed.
-   Authentication and authorization are enforced server-side.

### Phase 3 -- Instructor Management

-   Instructor directory
-   Qualification types
-   Instructor qualification records
-   Qualification matrix
-   Expiry monitoring
-   Availability
-   Training history

### Phase 4 -- Training and Compliance

-   Course types and training events
-   Participants and sessions
-   Instructor allocation
-   Training calendar
-   Approval tracker
-   Audit findings
-   Corrective actions
-   Document references

### Phase 5 -- Meetings, Risks and Reporting

-   Meeting management
-   Minutes and decisions
-   Meeting action items
-   Risk and issue register
-   Stakeholder management
-   Management reports
-   Export functionality

### Phase 6 -- Intelligence and integrations

-   AI management assistant
-   Daily / weekly briefings
-   Advanced notifications
-   Outlook / Microsoft 365 integration, subject to approval
-   Teams integration, subject to approval
-   SharePoint / OneDrive document links
-   Advanced analytics

------------------------------------------------------------------------

## 14. MVP Prioritization

### Must have

-   Shared team password
-   Name entry
-   No role selection
-   Separate Superadmin authentication
-   Superadmin administration area
-   Superadmin-only shared-password change
-   Dashboard
-   Responsive desktop / iPad / iPhone layouts
-   Projects
-   Workstreams
-   Tasks
-   Task owners and contributors
-   Due dates and priorities
-   Waiting For and Blocked statuses
-   A320 / B737 MAX / General fleet categorization
-   Comments
-   Activity history
-   WINGS CONTROL branding using the known Eurowings color scheme

### Should have

-   Project timeline
-   Milestones
-   Task dependencies
-   Reminders
-   Global search
-   Attachments / document links
-   Basic reporting
-   Session revocation
-   Archive / restore

### Could have later

-   Instructor management
-   Qualification matrix
-   Training planning
-   Compliance tracker
-   Meeting management
-   Risk register
-   AI assistant
-   Microsoft 365 integrations
-   Advanced capacity planning

------------------------------------------------------------------------

## 15. File Import, Export and Document Handling

File handling is a core requirement of WINGS CONTROL. Users must be able
to import existing Excel and Word files, use their contents in the
application where supported, and export application data in common,
reusable formats.

This capability is especially important for the Instructor Management
module. Instructor records and qualification data must be easy to
import, maintain, export, share and archive without being locked into
the application.

### 15.1 Supported import formats

**Spreadsheet import** - `.xlsx` -- required - `.xls` -- desirable for
legacy workbooks - `.csv` -- required

**Word document import** - `.docx` -- required - `.doc` -- desirable for
legacy Word documents, subject to reliable conversion support

**Other useful formats** - `.pdf` -- support attachment and preview
where possible; PDF data extraction should be treated as assisted
extraction, not guaranteed structured import. - `.txt` -- optional for
notes and simple text records.

### 15.2 Excel import workflow

Users should be able to:

1.  Select Import from the relevant module.
2.  Upload an Excel or CSV file.
3.  Preview the workbook, sheet names, headers and sample rows.
4.  Select the worksheet to import.
5.  Map spreadsheet columns to WINGS CONTROL fields.
6.  Review validation warnings and errors.
7.  Preview the records that will be created or updated.
8.  Confirm the import.
9.  Receive an import summary with created, updated, skipped and
    rejected row counts.

Import requirements: - Support column mapping rather than relying on
fixed column names. - Provide downloadable import templates for each
relevant module. - Validate dates, email addresses, fleet names,
qualification types and required fields. - Detect likely duplicate
records. - Offer a safe duplicate-handling choice: skip, update
existing, or import as new, where appropriate. - Never silently
overwrite existing records. - Provide a downloadable error report
identifying the affected row and reason. - Preserve source file name,
import date, importing display name and import summary in an import
history. - Handle multiple worksheets explicitly; do not silently merge
unrelated sheets. - Do not execute macros or embedded scripts from
uploaded files. - Set sensible file-size and row-count limits and
provide clear error messages.

### 15.3 Word document import workflow

Users should be able to upload Word documents (`.docx`) to the relevant
project, instructor, meeting, compliance or knowledge-base record.

Required behavior: - Store the original file as an attachment or
approved document link. - Display file name, type, size, upload date and
associated record. - Provide download and, where supported, in-app
preview. - Extract text for search and optional assisted summarization
where technically reliable. - Preserve the original document; extracted
text must not replace it. - If a Word document contains tables, retain
their structure where possible. - Make clear when extraction or preview
is incomplete. - Do not treat text extracted from a document as an
approved regulatory source without human verification.

The app should support attaching Word documents to instructor profiles,
qualification records, projects, tasks, meetings, approvals and
knowledge-base entries.

### 15.4 General export formats

Users should be able to export relevant data from each module, subject
to their permissions.

Required export formats:

  ---------------------------------------------------------------------
  Format                             Intended use
  ---------------------------------- ----------------------------------
  `.xlsx`                            Editable Excel workbooks and
                                     structured tables

  `.csv`                             Data exchange and analysis

  `.pdf`                             Read-only reports and printable
                                     summaries

  `.docx`                            Editable Word reports, profiles
                                     and summaries

  `.json`                            Structured data backup /
                                     integration, primarily for
                                     administrators
  ---------------------------------------------------------------------

Optional: - `.txt` for simple notes or logs. - `.ics` for calendar
events, if calendar export is implemented.

Export requirements: - Provide export for the current filtered view and,
where permitted, the complete module dataset. - Allow users to choose
relevant fields/columns where practical. - Include clear column headings
and consistent date formats. - Preserve relationships when exporting
related records, using IDs and/or separate linked worksheets. - Include
export date and applied filters in report metadata. - Respect access
permissions and avoid exporting records the user cannot view. - Use
UTF-8 for CSV and support European characters (including umlauts). -
Protect against spreadsheet formula injection when exporting untrusted
text to CSV/XLSX. - Do not include passwords, authentication tokens,
secrets or internal security data in exports.

### 15.5 Instructor Management -- Priority Import and Export

Instructor data portability is a high-priority requirement.

The Instructor module must support complete export and controlled import
of:

-   Instructor master data
-   Fleet associations
-   Qualification types
-   Qualification records
-   Issue dates and expiry dates
-   Qualification status and verification status
-   Limitations and scope
-   Availability records, where appropriate
-   Training history
-   Instructor assignments
-   Relevant notes
-   Document references and attachment metadata

Recommended instructor export package:

**Excel workbook (`.xlsx`)** - Sheet 1: Instructor Overview - Sheet 2:
Qualifications - Sheet 3: Availability - Sheet 4: Training History -
Sheet 5: Course Assignments - Sheet 6: Data Dictionary / Export Notes

The workbook should use stable instructor IDs to connect records across
sheets. Do not rely on names alone as unique identifiers.

**CSV export** - Provide separate CSV files for instructors,
qualifications, availability, training history and assignments, or a ZIP
containing these related files. - Use stable IDs to preserve
relationships.

**PDF export** - Generate a professional individual Instructor Profile
PDF. - Generate a Qualification Matrix PDF. - Generate a fleet-filtered
Instructor Overview PDF. - Include generation date and any applied
filters.

**Word export (`.docx`)** - Generate an editable individual Instructor
Profile. - Generate a qualification and experience summary. - Use a
consistent professional template.

**JSON export** - Provide an administrator-only structured export for
backup or migration, preserving IDs and relationships.

Instructor import templates: - Provide a downloadable Excel template
with required and optional columns. - Include a sample row and a data
dictionary. - Support importing instructors and their qualifications in
one controlled workflow, or through linked worksheets using stable
external IDs. - Validate qualification types, fleets and date fields
against configured reference data. - Flag duplicate instructors and
conflicting qualification records for review. - Never silently overwrite
a verified qualification record.

### 15.6 Meeting Minutes -- Acceptance Criteria

-   A user can create a meeting and write minutes directly in WINGS
    CONTROL.
-   A user can start from a reusable template or a blank document.
-   Minutes support structured agenda, discussion, decisions and action
    items.
-   The editor indicates saved state and warns about unsaved changes.
-   Users can upload existing DOCX and PDF minutes and retain the
    original file.
-   Users can export minutes to DOCX and PDF.
-   Action items can be converted into tasks while preserving the source
    meeting reference.
-   Finalized minutes cannot be silently overwritten; revisions preserve
    previous versions.
-   Users can search minutes by date, title, participant, project and
    fleet.
-   The Superadmin can create, edit, archive and manage meeting
    templates.

### 15.6 Bulk operations

For authorized users, support bulk actions where safe:

-   Bulk import instructors
-   Bulk update selected instructor fields
-   Bulk export selected instructors
-   Bulk export qualification matrices by fleet
-   Bulk archive selected records

Bulk deletion should be restricted to the Superadmin and require
explicit confirmation.

### 15.7 Import and export administration

The Superadmin administration area should include:

-   Import history
-   Export history where appropriate
-   Failed import reports
-   Downloadable templates
-   Configurable import mappings where practical
-   File type and size restrictions
-   Storage usage overview
-   Attachment management
-   Retention and deletion controls

### 15.8 File storage and security

-   Validate file extensions and actual file content; do not trust the
    filename alone.
-   Restrict allowed MIME types and file sizes.
-   Store uploaded files outside publicly accessible folders.
-   Use short-lived authorized download links where supported.
-   Scan uploads for malware where the hosting environment provides this
    capability.
-   Do not execute macros, scripts or embedded content.
-   Apply access controls to both the parent record and its attachments.
-   Keep an audit trail for uploads, downloads, replacements and
    deletions.
-   Define backup and retention policies.
-   Keep official controlled manuals in the approved document-management
    repository where required; WINGS CONTROL may store metadata and
    links instead.

### 15.9 Import/export acceptance criteria

-   A user can import an `.xlsx` instructor list using a column-mapping
    and preview workflow.
-   The user can inspect validation errors before confirming the import.
-   Existing records are not silently overwritten.
-   An instructor can be exported with associated qualifications and
    relevant history.
-   The instructor qualification matrix can be exported to Excel and
    PDF.
-   An individual instructor profile can be exported to PDF and Word.
-   Project and task data can be exported to Excel and CSV.
-   Word documents can be uploaded and linked to relevant records.
-   Import and export operations respect access permissions.
-   The Superadmin can review import history and manage templates.

------------------------------------------------------------------------

### Additional Acceptance Criteria -- Approved Management Capabilities

-   The Management Cockpit shows live, actionable information and links
    every KPI or alert to its source records.
-   The Central Action Tracker aggregates actions from projects,
    meetings, compliance and follow-ups without creating duplicate
    records.
-   Decisions from meeting minutes can be linked to the central Decision
    Log.
-   Stakeholders and organizations can be linked to projects, meetings,
    decisions and actions.
-   Risks and issues have owners, review dates, documented scoring and
    mitigation / resolution plans.
-   In-app notifications support due dates, overdue actions, follow-ups,
    milestones and relevant changes.
-   The AI Management Assistant respects record-level permissions, cites
    source records and requires confirmation before changing data.
-   AI-generated summaries clearly distinguish source facts from
    generated suggestions and disclose missing information.

## Sandbox, Environments, Autosave and Backups

### Sandbox-first development and testing

The complete application must be testable in an isolated Sandbox /
Preview environment before any production deployment.

Requirements:

-   Provide a dedicated Sandbox / Preview deployment that can be opened
    and tested through a browser on desktop, iPad and iPhone.
-   The Sandbox must include all core modules and realistic sample data
    so that navigation, workflows, imports, exports, permissions,
    meeting minutes, notifications and dashboards can be tested
    end-to-end.
-   Clearly label the environment as **SANDBOX -- TEST DATA ONLY** so it
    cannot be confused with production.
-   Sandbox data must be isolated from production data, users, storage
    and integrations.
-   Do not send real emails, Outlook invitations, push notifications or
    external partner communications from Sandbox. Use simulated / test
    integrations unless explicitly enabled for a controlled test.
-   Provide a repeatable way to reset Sandbox data to a known test
    state.
-   Support test scenarios for the two initial named users and
    Superadmin access.
-   Include automated checks for critical workflows, authorization and
    data integrity, plus a manual acceptance-testing checklist.
-   No production deployment or migration should happen automatically
    from a Sandbox test. Require an explicit deployment approval.
-   Keep separate environment variables, database projects, storage
    buckets, API keys and secrets for development, Sandbox and
    production.
-   Never copy production personal data into Sandbox by default. Use
    synthetic or anonymized test data.

### Automatic saving (autosave)

The application must automatically save user work wherever practical,
especially:

-   Meeting minutes and agenda notes
-   Project descriptions and updates
-   Task descriptions and comments
-   Risk and issue descriptions / mitigation plans
-   Decision records
-   Knowledge Base entries
-   Instructor notes and editable profile fields

Autosave requirements:

-   Save changes automatically after a short inactivity interval and
    when leaving a field or section where technically appropriate.
-   Show a visible save state such as Saving..., Saved, or Save failed.
-   Display the last successful save time.
-   Warn users before navigating away if unsaved changes remain.
-   Retry temporary network failures safely and avoid creating duplicate
    records.
-   Use version checks / conflict handling when two users edit the same
    record; never silently overwrite another user's newer changes.
-   Keep a recoverable draft or revision history for important content
    such as meeting minutes and decisions.
-   Autosave must not bypass authorization or validation rules.

### Automated backups and recovery

Provide automated, scheduled backups for the database and
application-managed files.

Requirements:

-   Automatically back up the production database and stored attachments
    on a documented schedule.
-   Use a sensible default target of daily backups, with more frequent
    point-in-time recovery where supported by the selected database
    provider and plan.
-   Keep backups encrypted in transit and at rest.
-   Store backups separately from the primary production database /
    storage failure domain where supported.
-   Define configurable retention periods and ensure retention complies
    with organizational policy and applicable data-protection
    requirements.
-   Back up database schema / migrations and essential configuration
    metadata; never include plaintext passwords, API secrets or
    authentication tokens in exported backup files.
-   Provide a documented restore process and restrict restore
    permissions to the Superadmin / authorized technical administrator.
-   Test restore procedures periodically in an isolated recovery
    environment. A backup is not considered reliable until restoration
    has been tested.
-   Record backup status, timestamp, scope, retention expiry and
    failures in an administrative backup status view.
-   Alert the Superadmin when a scheduled backup fails or when backup
    freshness exceeds the configured threshold.
-   Sandbox and production backups must remain separate.
-   Do not claim a backup has completed unless the provider or backup
    job confirms success.

Define and document Recovery Point Objective (RPO) and Recovery Time
Objective (RTO) before production launch. The actual achievable values
depend on the selected hosting and database plans.

### Initial team setup

For the initial rollout, configure the application for two named team
members:

1.  **Patrick Thorn** -- Superadmin
2.  **Joost Jansen** -- standard team user

The initial user setup must:

-   Preconfigure these two display identities in the user directory /
    allowed-user list.
-   Give Patrick Thorn Superadmin privileges through the separate secure
    Superadmin authentication mechanism.
-   Give Joost Jansen normal team access only.
-   Keep the agreed normal-user sign-in flow: user selects or enters
    their name and enters the shared team password. Do not add a
    role-selection screen.
-   Ensure the shared team password never grants Superadmin privileges.
-   Allow the Superadmin to add further team members later, without
    requiring a code change.
-   Allow the Superadmin to deactivate a team member and revoke their
    sessions.
-   Clearly explain in the UI that a typed display name is not proof of
    identity. If reliable individual attribution is required later,
    migrate to individual authenticated accounts.

Do not invent, generate or display a shared password in the source code
or seed data. The Superadmin must set or rotate it through the secure
administration flow.

## 16. Open Questions to Resolve Before Production

1.  Should normal users remain signed in for a fixed period (e.g. 7 or
    30 days)?
2.  Should the shared password change invalidate all active sessions
    immediately?
3.  Should Superadmin access use a passkey, MFA-protected account or
    separate administrator password?
4.  Should permanent deletion be restricted to the Superadmin, with
    normal users only able to archive?
5.  Should the Superadmin be able to restore archived or deleted records
    from a recycle bin?
6.  Should the shared password be rotated periodically?
7.  Which instructor and qualification data may legally and
    organizationally be stored?
8.  Which hosting region and data-processing arrangements are
    acceptable?

------------------------------------------------------------------------

## 17. Instructions for an AI Development Assistant

Use this document as the current product and architecture specification.

The product is named **WINGS CONTROL**. Do not use any previous working
title.

The design must use the Eurowings corporate color scheme already known
to you. Do not invent a different palette or arbitrary brand colors.

The dashboard must be exceptionally clean and responsive on desktop,
iPad and iPhone.

### Required access behavior

-   Do not create a role-selection screen.
-   Normal users enter only their name and the shared team password.
-   All normal users use the same shared password.
-   Only the Superadmin can change the shared password.
-   The Superadmin has a separate, protected authentication mechanism.
-   The Superadmin has a dedicated administration area with full CRUD
    capabilities across application data and settings.
-   Normal users must not be able to access Superadmin functions.
-   Enforce Superadmin permissions server-side. Never rely on frontend
    visibility, a local storage flag or a client-provided role.

Before writing substantial code:

1.  Review the requirements and identify ambiguities.
2.  Propose a normalized PostgreSQL schema with keys, constraints and
    indexes.
3.  Explain the shared-password and Superadmin authentication design.
4.  Define responsive routes and component structure.
5.  Define the complete Superadmin CRUD and settings capabilities.
6.  Propose an implementation plan with testable milestones.
7.  Identify privacy, security and deployment risks.
8.  Ask for clarification on unresolved decisions that materially affect
    architecture.

When implementing:

-   Build incrementally.
-   Use TypeScript throughout the frontend.
-   Use database migrations.
-   Validate all inputs server-side.
-   Never hardcode production credentials.
-   Never store passwords in plaintext.
-   Never expose service-role keys or secrets in frontend code.
-   Include automated tests for authentication, authorization and CRUD
    operations.
-   Test that normal users cannot perform Superadmin actions, even by
    calling backend endpoints directly.
-   Test desktop, iPad and iPhone layouts.
-   Keep components modular and reusable.
-   Document setup, environment variables, migrations and deployment.
-   Do not claim a feature is complete until it has been implemented and
    tested.

**First implementation target:** A branded, responsive WINGS CONTROL PWA
with a clean dashboard, name + shared-password access, separate
Superadmin authentication, a complete Superadmin administration area,
fleet filters, project management, workstreams and task management.

------------------------------------------------------------------------

## 18. Definition of Success

The product is successful when:

-   A normal user can open WINGS CONTROL, enter a name and the shared
    password, and reach the dashboard.
-   No role-selection step is required.
-   The Superadmin can securely change the shared password.
-   The Superadmin can manage all application records and settings from
    a dedicated administration area.
-   Normal users cannot access administrative operations.
-   The team can use the same clean application on desktop, iPad and
    iPhone.
-   The team can quickly see project status, open tasks, overdue items,
    owners, external follow-ups and upcoming milestones.

The long-term objective is a dependable, extensible and easy-to-use
management cockpit for A320 and B737 MAX training activities and future
fleet projects.

### Additional Acceptance Criteria -- Executive Weekly Report

-   A user can generate a management weekly report for a selected
    project and reporting period.
-   The report contains an overall RAG status and a separate trend
    indicator.
-   Workstreams show status, trend and concise key facts.
-   Risks and decisions required are displayed in a dedicated management
    attention panel.
-   Configurable project-specific KPIs can be shown, including pilot
    selection progress where applicable.
-   The report can be previewed and exported to PDF, with Word / Excel
    and PowerPoint export supported where technically feasible.
-   Published reports are stored as immutable snapshots and are not
    changed when source records are later edited.
-   The report shows its reporting period, author, generation date and
    source-data freshness.
-   The B737 MAX report template includes the eight example workstreams
    supplied by the user, but they remain editable.

### Additional Acceptance Criteria -- Trainer Management Reporting

-   The supplied `EWL Trainer 737 EVAL.xlsx` structure can be imported
    with a column-mapping preview.
-   Trainer profiles retain Trainer Qual, Base, TLC, Name, Remark, Part
    Time, SIM Sessions, LIFUS Legs, ORE category, LTC/TRI/TRE start
    dates, issuing authority and the separate `B ab` source field.
-   Missing source values remain visibly missing and are not interpreted
    as negative qualification status.
-   The Trainer Overview can report qualification, base, part-time, ORE
    and issuing-authority distributions.
-   SIM Sessions and LIFUS Legs are displayed as source-recorded counts,
    not as currency or availability.
-   The source snapshot date is retained and shown.
-   The trainer report can be exported to PDF and Excel, with individual
    trainer profiles exportable to PDF / DOCX.
-   Ambiguous fields such as `B ab` are preserved without invented
    business meaning.

### Additional Acceptance Criteria -- Trainer Overview Visual Analytics

-   Trainer Overview includes dynamic horizontal bar charts for issuing
    authority, qualification by aircraft and qualification by aircraft /
    base.
-   The chart counts respond to filters and clicking chart elements
    filters the trainer roster.
-   The report distinguishes unique trainer counts from
    qualification-record counts and documents how multi-qualified
    trainers are counted.
-   The chart examples from the screenshots are not hardcoded; all
    values are calculated from imported / maintained records.
-   The charts remain readable and interactive on desktop, iPad and
    iPhone.

### 8.19 App-Wide Filtering and Search Behaviour

Filtering must be a consistent core capability throughout WINGS CONTROL.
Users must be able to narrow down information in every relevant module,
list, dashboard, report and overview. Filters must be contextual to the
module but follow a consistent interaction pattern.

#### Global filters

Where relevant, provide shared filters for:

-   Aircraft / fleet: All, A320, B737
-   Base: All, VIE, SZG, PMI, PRG, ARN, WP PRG, WP PMI, WP BCN, WP WAW
-   Project / programme
-   Workstream
-   Status
-   Responsible person / owner
-   Date range / reporting period
-   Priority
-   Category / type

Not every filter is meaningful in every module. Only show applicable
filters; do not display inactive or misleading controls.

#### Module-specific filters

Examples include:

-   **Trainer Management:** name, TLC, base, aircraft type,
    qualification, issuing authority, ORE category, part-time category,
    availability and qualification validity (only where verified data
    exists).
-   **Projects:** fleet, project status, owner, priority, workstream and
    date range.
-   **Tasks / Action Tracker:** status, owner, contributor, priority,
    source module, due date, project, base and aircraft type where
    applicable.
-   **Training:** aircraft type, base, course type, date range,
    instructor, participant and simulator resource.
-   **Compliance:** authority, approval type, fleet, status, owner and
    due date.
-   **Meetings / Minutes:** date range, participant, project,
    workstream, aircraft type, base and status.
-   **Risks / Issues:** severity, status, owner, project, aircraft type
    and review date.
-   **Stakeholders:** organization, contact, project, partner category
    and open follow-ups.
-   **Reports:** reporting period, project / programme, aircraft type,
    base and report status.

#### Filter interaction requirements

-   Support multiple filters at the same time (AND logic by default).
-   Provide a visible indication of active filters.
-   Provide a one-click Clear All / Reset Filters action.
-   Show result counts after filtering.
-   Preserve filter selections when navigating within the same module
    where practical.
-   Support sorting and text search alongside structured filters.
-   Allow users to save frequently used filter combinations as personal
    saved views, where appropriate.
-   Ensure charts, KPI cards, tables and exports use the same active
    filter context.
-   Export only the filtered results when the user chooses "Export
    current view"; provide a separate explicit option for a full
    authorized export.
-   On mobile, present filters in a compact filter drawer or sheet with
    a clear Apply / Reset interaction.
-   Filters must respect authorization: users must never discover
    records they are not permitted to access through search, counts,
    charts or exports.

#### Base and aircraft data integrity

-   Each trainer may be associated with one or more aircraft types, A320
    and/or B737.
-   Each trainer record should support the applicable base association.
    If trainers can have multiple bases, model this as a many-to-many
    relationship rather than duplicating the trainer record.
-   Keep `Base` and `WP Base` entries distinct.
-   The same trainer may appear in filtered views for more than one
    aircraft type if they are associated with both; unique trainer
    totals must count that person only once within the selected result
    set.
-   Reports must state whether a count represents unique trainers,
    qualification records, course assignments or sessions.
-   Base and aircraft master data must be centrally managed, not
    embedded as hardcoded chart labels.

### Additional Acceptance Criteria -- Bases, Aircraft Types and Global Filters

-   The base filter includes exactly VIE, SZG, PMI, PRG, ARN, WP PRG, WP
    PMI, WP BCN and WP WAW as the initial values.
-   The aircraft-type filter includes A320 and B737.
-   Standard bases and WP bases remain separate values.
-   Trainer records can be associated with A320, B737 or both without
    creating duplicate trainer identities.
-   Multiple trainers can be stored and reported; no chart or KPI count
    is hardcoded from example screenshots.
-   All relevant modules provide contextual filters and support multiple
    simultaneous filters.
-   Charts, KPI cards, tables and filtered exports reflect the same
    active filter context.
-   Users can clear filters and see the resulting record count.
-   Search, filters, charts and exports all enforce the user's access
    permissions.

### Additional Acceptance Criteria -- Task Ownership and Dependencies

-   Each task clearly distinguishes internal primary owner, internal
    contributors and external dependency.
-   The awaited response / deliverable, expected date and next follow-up
    date can be recorded.
-   External contacts can be linked without granting them application
    access.
-   Dedicated views exist for My Tasks, Team Tasks, Waiting For External
    Input, Follow-up Due, Overdue and Blocked.
-   A missed follow-up date creates an in-app reminder for the internal
    primary owner.
-   An overdue external dependency is visible in the dashboard and
    Central Action Tracker.

## Executive Command -- Dashboard Design Specification

### Design objective

The WINGS CONTROL home dashboard shall follow the **Executive Command**
concept: a premium, elegant and highly structured management cockpit
designed for the daily leadership of the training-management
organization and for clear executive oversight.

The design prioritizes clarity, decision-making and operational control
over decorative aviation visuals. It should look like a high-end
enterprise SaaS platform suitable for management and Managing Board
reporting, while retaining a subtle aviation identity.

The dashboard must answer at a glance:

-   What is the overall health of the training-management operation?
-   Which projects and workstreams are on track, at risk or critical?
-   What needs attention from Patrick, Joost or the wider team?
-   Which tasks are overdue, blocked or waiting for external input?
-   Which decisions are required from management?
-   What are the current A320 and B737 priorities?
-   What are the upcoming milestones, training events and instructor
    issues?

### Visual direction and design language

-   Premium Light theme as the default.
-   Use the established Eurowings corporate branding and colour system
    already known to the implementation team. Do not invent a new brand
    palette or arbitrary hex colours.
-   White and light neutral surfaces, elegant typography, subtle borders
    and shadows, generous whitespace and strong alignment.
-   Use the corporate accent colour selectively for primary actions,
    active navigation, key chart series and important emphasis.
-   Use semantic status colours consistently: Green / On Track, Amber /
    Attention, Red / Critical, and neutral grey for inactive or
    informational states. Always pair colours with labels or icons.
-   Keep aviation references subtle and professional: aircraft / fleet
    labels, restrained aviation icons and clear A320 / B737 identifiers.
    Do not use a large decorative flight map as the dominant dashboard
    element.
-   Avoid dark command-centre styling, excessive gradients, glowing
    effects, dense cockpit panels or decorative gauges.
-   The overall impression should be calm, premium, executive and
    data-driven.

### Desktop layout

Use a clean enterprise layout with two primary zones: a persistent
collapsible left navigation sidebar and a wide, grid-based main
dashboard canvas. A contextual right-side panel may appear for selected
records or notifications, but must not permanently compress the main
dashboard.

The sidebar should contain Dashboard, Projects, Tasks / Action Tracker,
Instructors, Training, Compliance, Meetings, Knowledge Base and Reports.
Administration is visible only to the Superadmin.

The top header should include page title and subtitle, global search,
global filters, notification centre with unread indicator, current
user's display identity and permission-aware quick-create actions.

### Dashboard content hierarchy

#### A. Executive header

Show "Training Management Overview", current reporting date, selected
reporting period where relevant, a concise executive status summary and
a quick-create button. Avoid oversized hero banners.

#### B. Fleet and base filters

Provide compact selectors for Fleet (All Fleets, A320, B737), Base (All
Bases, VIE, SZG, PMI, PRG, ARN, WP PRG, WP PMI, WP BCN, WP WAW),
optional project / programme and reporting period. All applicable
widgets must update consistently. General / Both items remain visible
where relevant.

#### C. Executive KPI cards

Display live, clickable cards for:

-   Active Projects
-   Open Tasks
-   Overdue Tasks
-   Waiting For
-   Critical Risks
-   Upcoming Milestones
-   Pending Decisions
-   Instructor Attention

Each card must show a live count from authorized records, a contextual
comparison / trend where meaningful, and navigate to the relevant
pre-filtered module. Respect active filters, show meaningful zero states
and never use hardcoded production numbers. The Superadmin may later
configure KPI selection and order.

#### D. Overall Project Portfolio

This is the central visual element of the dashboard. Display project /
programme name, fleet, overall RAG status, trend versus previous period
(Improved / Unchanged / Worse), progress where a defined methodology
exists, next milestone and target date, primary owner and open / overdue
/ critical action counts. Selecting a project opens its workspace.

The B737 MAX Entry into Service programme should be available as an
initial project template, but project names, workstreams and status
definitions remain configurable.

#### E. Management Attention -- My Attention and Team Attention

Provide two clear views:

-   **My Attention:** tasks assigned to the current user, follow-ups due
    and decisions awaiting their input.
-   **Team Attention:** items requiring action from any team member.

Include an Unassigned view or indicator for work without an accountable
primary owner.

Each item shows title, primary owner, contributors, external dependency
/ awaited party, due date or next follow-up date, priority, status and
project / fleet context. Prioritize overdue, blocked, critical and
follow-up-due items. Every item links to its canonical source record.

#### F. Waiting For / External Dependencies

Provide a dedicated panel for tasks waiting on another person, team,
partner or authority. Show what is awaited, the party responsible for
the next response, the internal primary owner accountable for following
up, expected response date, next follow-up date and days waiting /
overdue where calculable.

The internal owner remains accountable while an external party is
expected to act. The item remains visible until the awaited deliverable
is received or the dependency is explicitly closed.

#### G. Risks and Decisions Required

Show critical / high risks, issues requiring escalation, decisions
required from Patrick / management and decisions overdue or awaiting an
identified decision authority. Each entry shows severity, owner, target
date and requested action, with a link to the full record.

#### H. Training and Instructor Snapshot

Provide a compact summary filtered by fleet and base: upcoming training
events, instructor qualification / validity attention only where
verified expiry data exists, instructor assignments and workload
indicators, trainer distribution by qualification and base, and
simulator / resource conflicts where planning data exists.

Historical Trainer SIM Sessions and LIFUS Legs must remain distinct from
live availability, current authorization and future capacity. Do not
infer availability from historical session counts.

#### I. Upcoming Milestones and Calendar Preview

Show upcoming milestones, deadlines, meetings and training events in a
concise timeline / agenda view with title, date / time, project / fleet,
owner, status and link to the underlying record. Provide a link to the
full calendar / timeline module.

#### J. Recent Activity

Display recent updates to projects, tasks, meetings, decisions, risks
and instructor records. Each entry shows record type, action, display
identity, timestamp and link. Normal users' typed display names are not
independently verified; do not present them as proof of identity.

### Charts and visual analytics

Use a restrained set of decision-support charts:

-   Project status distribution (Green / Amber / Red)
-   Task status distribution (Open / In Progress / Waiting For / Blocked
    / Completed)
-   Workload by owner, where meaningful
-   Trainer distribution by qualification / base
-   Upcoming milestones over time

Charts must respond to filters, use accessible labels and legends,
distinguish zero from missing data, link to filtered records and avoid
double-counting people with multiple qualifications. Label
qualification-record counts separately from unique trainer counts.

### Global dashboard filters

Provide visible filters for aircraft type (All, A320, B737), base (All
and the nine configured bases), project / programme, owner, date range /
reporting period and status / priority where relevant.

Filters combine using AND logic by default. Show active filters as
removable chips and provide Clear All. All applicable KPI cards, charts,
project lists and attention panels use the same filter context. Do not
show irrelevant filters. Counts and results must respect record-level
authorization.

### Quick actions

Provide permission-aware quick actions for Create Task, Create Meeting /
Minutes, Create Project, Add Risk / Issue, Add Decision and Add
Instructor / Update Trainer Record. Use short creation flows. Each
action saves to the canonical record and updates dashboard views without
duplicates.

### Responsive behaviour

**Desktop:** persistent sidebar, wide main content, KPI cards in a
balanced grid, project portfolio and attention panels in a clear
two-column layout.

**iPad:** collapsible sidebar / navigation rail, adaptive two-column
layout in landscape and single-column stacking in portrait,
touch-friendly controls.

**iPhone:** bottom navigation, single-column dashboard, compact KPI grid
or horizontal strip, project cards instead of wide tables, attention
cards, filters in a bottom sheet with Apply / Reset and no horizontal
page overflow.

### Accessibility, performance and interaction

Meet accessible contrast requirements; provide keyboard navigation and
visible focus states; accessible chart summaries; progressive loading;
skeleton, empty, error and retry states; last-updated timestamps; and
responsive performance on normal mobile connections. Never present stale
cached values as live.

### Data integrity and metric definitions

Every KPI and chart must have a documented definition and source record.
Distinguish unique people from qualification records, tasks from action
references, and historical counts from future capacity. Distinguish zero
from unavailable data. Dashboard status must follow recorded data and
approved business rules. AI-generated summaries must be labelled and
linked to source records. All widgets respect permissions and active
filters.

### Dashboard acceptance criteria

-   The dashboard implements the Executive Command visual direction in
    Premium Light styling and established Eurowings branding.
-   It includes navigation, global search, notifications, quick actions
    and fleet / base selectors.
-   KPI cards display live counts and navigate to filtered source
    records.
-   The project portfolio shows RAG status, trend, progress where
    defined, next milestone and owner.
-   My Attention, Team Attention, Waiting For, risks, decisions,
    training snapshot, upcoming milestones and recent activity are
    represented.
-   Charts respond to filters and link to underlying records.
-   Global filters update all applicable widgets consistently and can be
    cleared.
-   Desktop, iPad and iPhone layouts are responsive and usable.
-   Loading, empty, error and stale-data states are implemented.
-   No production metric is hardcoded and every metric has a documented
    source and definition.
