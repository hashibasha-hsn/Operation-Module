import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TimezoneProvider } from "./contexts/TimezoneContext";
import Layout from "./components/Layout";
import './i18n';
import Dashboard from "./pages/Dashboard";
import CreatorMode from "./pages/CreatorMode";
import Process from "./pages/Process";
import Audit from "./pages/Audit";
import AuditLogs from "./pages/AuditLogs";
import Draft from "./pages/Draft";
import Users from "./pages/Users";
import Attendance from "./pages/Attendance";
import Learning from "./pages/Learning";
import CategoriesAndCourses from "./pages/CategoriesAndCourses";
import CourseCreation from "./pages/CourseCreation";
import Assessments from "./pages/Assessments";
import Entities from "./pages/Entities";
import Tags from "./pages/Tags";
import Settings from "./pages/Settings";
import ProcessCreation from "./pages/ProcessCreation";
import TitleSetup from "./pages/TitleSetup";
import ProcessSettings from "./pages/ProcessSettings";
import AuditCreation from "./pages/AuditCreation";
import AuditTitleSetup from "./pages/AuditTitleSetup";
import AuditSettings from "./pages/AuditSettings";
import AuditCreateForm from "./pages/AuditCreateForm";
import CreateForm from "./pages/CreateForm";
import SecuritySettings from "./pages/SecuritySettings";
import EmailConfig from "./pages/EmailConfig";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import ProcessFill from "./pages/ProcessFill";
import AuditFill from "./pages/AuditFill";
import AssessmentFill from "./pages/AssessmentFill";
import CoursePlayer from "./pages/CoursePlayer";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import AdminSetup from "./pages/AdminSetup";
import FeaturePermissions from "./pages/FeaturePermissions";
import Workflows from "./pages/Workflows";
import Approvals from "./pages/Approvals";
import ActionPoints from "./pages/ActionPoints";
import Tickets from "./pages/Tickets";
import StoreHealth from "./pages/StoreHealth";
import FeatureReports from "./pages/FeatureReports";
import ReportingInsights from "./pages/ReportingInsights";
import CustomDashboards from "./pages/CustomDashboards";
import DashboardView from "./pages/DashboardView";
import StandardReports from "./pages/StandardReports";
import MyReport from "./pages/MyReport";
import StoreReport from "./pages/StoreReport";
import ProcessReport from "./pages/ProcessReport";
import OrganizationReport from "./pages/OrganizationReport";
import VisualReport from "./pages/VisualReport";
import ExpiredSubmissions from "./pages/ExpiredSubmissions";
import LearningMyReport from "./pages/LearningMyReport";
import LearningStoreReport from "./pages/LearningStoreReport";
import LearningTeamReport from "./pages/LearningTeamReport";
import LearningOrgReport from "./pages/LearningOrgReport";
import AssessmentReport from "./pages/AssessmentReport";
import AssessmentOrgReport from "./pages/AssessmentOrgReport";
import AssessmentResultsDashboard from "./pages/AssessmentResultsDashboard";
import AssessmentCreateForm from "./pages/AssessmentCreateForm";
import AssessmentSettings from "./pages/AssessmentSettings";
import AssessmentCertificateSettings from "./pages/AssessmentCertificateSettings";
import AssessmentCreation from "./pages/AssessmentCreation";
import AssessmentTitleSetup from "./pages/AssessmentTitleSetup";
import TicketOrgReport from "./pages/TicketOrgReport";
import TicketAdvanceSearch from "./pages/TicketAdvanceSearch";
import TicketTagReport from "./pages/TicketTagReport";
import TicketSetup from "./pages/TicketSetup";
import ActionPointsOrgReport from "./pages/ActionPointsOrgReport";
import ActionPointsAdvanceReport from "./pages/ActionPointsAdvanceReport";
import Assets from "./pages/Assets";
import AssetTableConfig from "./pages/AssetTableConfig";
import AssetOrgReport from "./pages/AssetOrgReport";
import Courses from "./pages/Courses";
import ProfileSettings from "./pages/ProfileSettings";
import Noticeboard from "./pages/Noticeboard";
import NoticeBoardList from "./pages/NoticeBoardList";
import PlatformSettings from "./pages/PlatformSettings";
import SuperAdmin from "./pages/SuperAdmin";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import AuditSetup from "./pages/AuditSetup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { initUiTheme } from "./lib/uiTheme";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Login} />
      <Route path={"/login"} component={Login} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/admin-setup"} component={AdminSetup} />
      <Route path={"/dashboard"} component={() => <Layout><Dashboard /></Layout>} />
      <Route path={"/creator-mode"} component={() => <Layout><CreatorMode /></Layout>} />
      <Route path={"/tasks"} component={() => <Layout><Tasks /></Layout>} />
      <Route path={"/tasks/process/:id"} component={() => <Layout><ProcessFill /></Layout>} />
      <Route path={"/tasks/audit/:id"} component={() => <Layout><AuditFill /></Layout>} />
      <Route path={"/process"} component={() => <Layout><Process /></Layout>} />
      <Route path={"/audit"} component={() => <Layout><AuditLogs /></Layout>} />
      <Route path={"/audit-setup"} component={() => <Layout><AuditSetup /></Layout>} />
      <Route path={"/draft"} component={() => <Layout><Draft /></Layout>} />
      <Route path={"/users"} component={() => <Layout><Users /></Layout>} />
      <Route path={"/attendance"} component={() => <Layout><Attendance /></Layout>} />
      <Route path={"/learning"} component={() => <Layout><Learning /></Layout>} />
      <Route path={"/learning/course/:id"} component={() => <Layout><CoursePlayer /></Layout>} />
      <Route path={"/learning/assessment/:id"} component={() => <Layout><AssessmentFill /></Layout>} />
      <Route path={"/categories-and-courses"} component={() => <Layout><CategoriesAndCourses /></Layout>} />
      <Route path={"/course-creation"} component={() => <Layout><CourseCreation /></Layout>} />
      <Route path={"/assessments"} component={() => <Layout><Assessments /></Layout>} />
      <Route path={"/assessment-title-setup"} component={() => <Layout><AssessmentTitleSetup /></Layout>} />
      <Route path={"/assessment-create-form"} component={() => <Layout><AssessmentCreateForm /></Layout>} />
      <Route path={"/assessment-settings"} component={() => <Layout><AssessmentSettings /></Layout>} />
      <Route path={"/assessment-certificate-settings"} component={() => <Layout><AssessmentCertificateSettings /></Layout>} />
      <Route path={"/assessment-creation"} component={() => <Layout><AssessmentCreation /></Layout>} />
      <Route path={"/entities"} component={() => <Layout><Entities /></Layout>} />
      <Route path={"/tags"} component={() => <Layout><Tags /></Layout>} />
      <Route path={"/settings"} component={() => <Layout><Settings /></Layout>} />
      <Route path={"/process-creation"} component={() => <Layout><ProcessCreation /></Layout>} />
      <Route path={"/title-setup"} component={() => <Layout><TitleSetup /></Layout>} />
      <Route path={"/process-settings"} component={() => <Layout><ProcessSettings /></Layout>} />
      <Route path={"/audit-creation"} component={() => <Layout><AuditCreation /></Layout>} />
      <Route path={"/audit-title-setup"} component={() => <Layout><AuditTitleSetup /></Layout>} />
      <Route path={"/audit-settings"} component={() => <Layout><AuditSettings /></Layout>} />
      <Route path={"/audit-create-form"} component={() => <Layout><AuditCreateForm /></Layout>} />
      <Route path={"/create-form"} component={() => <Layout><CreateForm /></Layout>} />
      <Route path={"/security"} component={() => <Layout><SecuritySettings /></Layout>} />
      <Route path={"/email-config"} component={() => <Layout><EmailConfig /></Layout>} />
      <Route path={"/notifications"} component={() => <Layout><Notifications /></Layout>} />
      <Route path={"/admin"} component={() => <Layout><Admin /></Layout>} />
      <Route path={"/feature-permissions"} component={() => <Layout><FeaturePermissions /></Layout>} />
      <Route path={"/workflows"} component={() => <Layout><Workflows /></Layout>} />
      <Route path={"/approvals"} component={() => <Layout><Approvals /></Layout>} />
      <Route path={"/action-points"} component={() => <Layout><ActionPoints /></Layout>} />
      <Route path={"/tickets"} component={() => <Layout><Tickets /></Layout>} />
      <Route path={"/ticket-setup"} component={() => <Layout><TicketSetup /></Layout>} />
      <Route path={"/store-health"} component={() => <Layout><StoreHealth /></Layout>} />
      <Route path={"/reporting"} component={() => <Layout><ReportingInsights /></Layout>} />
      <Route path={"/feature-reports"} component={() => <Layout><FeatureReports /></Layout>} />
      <Route path={"/custom-dashboards/:id"} component={() => <Layout><DashboardView /></Layout>} />
      <Route path={"/custom-dashboards"} component={() => <Layout><CustomDashboards /></Layout>} />
      <Route path={"/standard-reports"} component={() => <Layout><StandardReports /></Layout>} />
      <Route path={"/standard-reports/my-report"} component={() => <Layout><MyReport /></Layout>} />
      <Route path={"/standard-reports/store-report"} component={() => <Layout><StoreReport /></Layout>} />
      <Route path={"/standard-reports/process-report"} component={() => <Layout><ProcessReport /></Layout>} />
      <Route path={"/standard-reports/organization-report"} component={() => <Layout><OrganizationReport /></Layout>} />
      <Route path={"/standard-reports/visual-report"} component={() => <Layout><VisualReport /></Layout>} />
      <Route path={"/standard-reports/expired-submissions"} component={() => <Layout><ExpiredSubmissions /></Layout>} />
      <Route path={"/standard-reports/learning-my-report"} component={() => <Layout><LearningMyReport /></Layout>} />
      <Route path={"/standard-reports/learning-store-report"} component={() => <Layout><LearningStoreReport /></Layout>} />
      <Route path={"/standard-reports/learning-team-report"} component={() => <Layout><LearningTeamReport /></Layout>} />
      <Route path={"/standard-reports/learning-org-report"} component={() => <Layout><LearningOrgReport /></Layout>} />
      <Route path={"/standard-reports/assessment-report"} component={() => <Layout><AssessmentReport /></Layout>} />
      <Route path={"/standard-reports/assessment-org-report"} component={() => <Layout><AssessmentOrgReport /></Layout>} />
      <Route path={"/standard-reports/assessment-results"} component={() => <Layout><AssessmentResultsDashboard /></Layout>} />
      <Route path={"/standard-reports/ticket-org-report"} component={() => <Layout><TicketOrgReport /></Layout>} />
      <Route path={"/standard-reports/asset-org-report"} component={() => <Layout><AssetOrgReport /></Layout>} />
      <Route path={"/standard-reports/ticket-advance-search"} component={() => <Layout><TicketAdvanceSearch /></Layout>} />
      <Route path={"/standard-reports/ticket-tag-report"} component={() => <Layout><TicketTagReport /></Layout>} />
      <Route path={"/standard-reports/action-points-org-report"} component={() => <Layout><ActionPointsOrgReport /></Layout>} />
      <Route path={"/standard-reports/action-points-advance-report"} component={() => <Layout><ActionPointsAdvanceReport /></Layout>} />
      <Route path={"/assets"} component={() => <Layout><Assets /></Layout>} />
      <Route path={"/asset-table-config"} component={() => <Layout><AssetTableConfig /></Layout>} />
      <Route path={"/courses"} component={() => <Layout><Courses /></Layout>} />
      <Route path={"/profile-settings"} component={() => <Layout><ProfileSettings /></Layout>} />
      <Route path={"/noticeboard"} component={() => <Layout><NoticeBoardList /></Layout>} />
      <Route path={"/platform-settings"} component={() => <Layout><PlatformSettings /></Layout>} />
      <Route path={"/super-admin"} component={() => <Layout><SuperAdmin /></Layout>} />
      <Route path={"/executive-dashboard"} component={() => <Layout><ExecutiveDashboard /></Layout>} />
      <Route path={"/bi-dashboard"} component={() => <Layout><CustomDashboards /></Layout>} />
      <Route path={"/404"} component={() => <Layout><NotFound /></Layout>} />
      {/* Final fallback route */}
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    initUiTheme().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LanguageProvider>
          <TimezoneProvider>
            <PermissionProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </PermissionProvider>
          </TimezoneProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
