import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store/store';
import { AppShell } from './components/layout/AppShell';
import { AccessPage } from './pages/Access';
import { AdminLoginPage } from './pages/AdminLogin';
import { DashboardPage } from './pages/Dashboard';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { TasksPage } from './pages/Tasks';
import { InstructorsPage } from './pages/Instructors';
import { TrainingPage } from './pages/Training';
import { CompliancePage } from './pages/Compliance';
import { MeetingsPage, MeetingDetailPage } from './pages/Meetings';
import { RisksPage } from './pages/Risks';
import { StakeholdersPage } from './pages/Stakeholders';
import { KnowledgePage } from './pages/Knowledge';
import { ReportsPage } from './pages/Reports';
import { WeeklyReportPage } from './pages/WeeklyReport';
import { MorePage } from './pages/More';
import { AdminPage } from './pages/admin/Admin';

function RequireSession({ children }: { children: ReactNode }) {
  const session = useStore((s) => s.session);
  const loc = useLocation();
  if (!session) return <Navigate to="/access" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

/** Prototype guard only. Production: every admin operation is authorised server-side (RLS + admin claim). */
function RequireAdmin({ children }: { children: ReactNode }) {
  const admin = useStore((s) => s.admin);
  if (!admin) return <Navigate to="/admin-login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/access" element={<AccessPage />} />
        <Route path="/admin-login" element={<RequireSession><AdminLoginPage /></RequireSession>} />
        <Route path="/reports/weekly/:projectId" element={<RequireSession><WeeklyReportPage /></RequireSession>} />
        <Route element={<RequireSession><AppShell /></RequireSession>}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="instructors" element={<InstructorsPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="meetings/:id" element={<MeetingDetailPage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="stakeholders" element={<StakeholdersPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="admin/*" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
