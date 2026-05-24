import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import { SocratesPanel } from "./components/shell/SocratesPanel";
import { LoginPage } from "./pages/LoginPage";
import { LiveDocPage } from "./pages/LiveDocPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveDocViewerPage } from "./pages/LiveDocViewerPage";
import { ProjectBrainPage } from "./pages/ProjectBrainPage";
import { ProjectDashboardPage } from "./pages/ProjectDashboardPage";
import { ProjectFlowchartPage } from "./pages/ProjectFlowchartPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CodebaseOverviewPage } from "./pages/CodebaseOverviewPage";
import CodePage from "./pages/CodePage";
import CompanyBrainPulsePage from "./pages/CompanyBrainPulsePage";
import CompanyBrainDocumentsPage from "./pages/CompanyBrainDocumentsPage";
import CompanyBrainDocumentDetailPage from "./pages/CompanyBrainDocumentDetailPage";
import CompanyBrainSearchPage from "./pages/CompanyBrainSearchPage";
import CompanyBrainPermissionsPage from "./pages/CompanyBrainPermissionsPage";
import CompanyBrainAuditPage from "./pages/CompanyBrainAuditPage";
import CompanyBrainPacksPage from "./pages/CompanyBrainPacksPage";
import CompanyBrainFeedbackPage from "./pages/CompanyBrainFeedbackPage";
import InfoPage from "./pages/InfoPage";

function hasRole() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem("orchestra_role"));
}

function ProtectedRoute() {
  if (!hasRole()) {
    window.localStorage.setItem("orchestra_role", "manager");
  }

  return <Outlet />;
}

function DashboardWithSocratesRoute() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <SocratesPanel />
      <main className="min-w-0 flex-1 overflow-hidden bg-bg">
        <DashboardPage />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects/1/info" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardWithSocratesRoute />} />
        <Route path="/overview" element={<Navigate to="/projects/1/overview" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/company-brain" element={<CompanyBrainPulsePage />} />
        <Route path="/company-brain/documents" element={<CompanyBrainDocumentsPage />} />
        <Route path="/company-brain/documents/:docId" element={<CompanyBrainDocumentDetailPage />} />
        <Route path="/company-brain/search" element={<CompanyBrainSearchPage />} />
        <Route path="/company-brain/permissions" element={<CompanyBrainPermissionsPage />} />
        <Route path="/company-brain/audit" element={<CompanyBrainAuditPage />} />
        <Route path="/company-brain/packs" element={<CompanyBrainPacksPage />} />
        <Route path="/company-brain/feedback" element={<CompanyBrainFeedbackPage />} />
        <Route path="/projects/:id" element={<AppShell />}>
          <Route index element={<ProjectDashboardPage />} />
          <Route path="overview" element={<CodePage />} />
          <Route path="overview/repos/:repoId" element={<CodebaseOverviewPage />} />
          <Route path="brain" element={<ProjectBrainPage />} />
          <Route path="flow" element={<ProjectFlowchartPage />} />
          <Route path="live-doc" element={<LiveDocPage />} />
          <Route path="docs/:docId/view" element={<LiveDocViewerPage />} />
          <Route path="info" element={<InfoPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
