import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  FileText,
  AlertCircle,
  Ticket,
  Package,
  BookOpen,
  CheckCircle,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchUsers } from "@/lib/processApi";
import { buildStoreNameMap, buildUserNameMap, humanLabel } from "@/lib/displayLabels";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchActionPointsOrgReport,
  fetchAssessmentResultsReport,
  fetchAssessmentAnalytics,
  fetchEntities,
  fetchLearningOrgReport,
  fetchProcessReport,
  fetchTicketOrgReport,
  fetchAssetOrgReport,
} from "@/lib/reportApi";

type ReportType =
  | "process"
  | "actionPoints"
  | "tickets"
  | "assets"
  | "learning"
  | "assessments";

const HIDDEN_TABLE_COLUMNS = new Set(["id", "storeId"]);

function visibleRowColumns(row: Record<string, unknown>) {
  return Object.keys(row).filter((key) => !HIDDEN_TABLE_COLUMNS.has(key));
}

const REPORT_CONFIG: {
  id: ReportType;
  labelKey: string;
  descKey: string;
  icon: typeof FileText;
}[] = [
  { id: "process", labelKey: "processReports", descKey: "processReportsDesc", icon: FileText },
  { id: "actionPoints", labelKey: "actionPointsReports", descKey: "actionPointsReportsDesc", icon: AlertCircle },
  { id: "tickets", labelKey: "ticketReports", descKey: "ticketReportsDesc", icon: Ticket },
  { id: "assets", labelKey: "assetReports", descKey: "assetReportsDesc", icon: Package },
  { id: "learning", labelKey: "learningReports", descKey: "learningReportsDesc", icon: BookOpen },
  { id: "assessments", labelKey: "assessmentReports", descKey: "assessmentReportsDesc", icon: CheckCircle },
];

export default function FeatureReports() {
  const { t } = useLanguage();
  const [activeReport, setActiveReport] = useState<ReportType>("process");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [processKpis, setProcessKpis] = useState<any>(null);
  const [actionPointKpis, setActionPointKpis] = useState<any>(null);
  const [ticketKpis, setTicketKpis] = useState<any>(null);
  const [assetKpis, setAssetKpis] = useState<any>(null);
  const [learningKpis, setLearningKpis] = useState<any>(null);
  const [assessmentKpis, setAssessmentKpis] = useState<any>(null);

  useEffect(() => {
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  const storeLabel = (id?: string) => (id ? humanLabel(storeNames[id], "—") : "—");
  const userLabel = (id?: string) => (id ? humanLabel(userNames[id], "—") : "—");

  const loadReportData = async () => {
    setLoading(true);
    setProcessKpis(null);
    setActionPointKpis(null);
    setTicketKpis(null);
    setAssetKpis(null);
    setLearningKpis(null);
    setAssessmentKpis(null);
    try {
      if (activeReport === "process") {
        const report = await fetchProcessReport("all", dateFilter, { includeAllStatuses: true });
        setProcessKpis(report?.kpis || null);
        const processRows = Array.isArray(report?.byProcess) ? report.byProcess : [];
        setRows(
          processRows.map((p: any) => ({
            id: p.processId,
            process: p.processTitle,
            tag: p.processTag || "—",
            submitted: p.submitted,
            completed: p.completed,
            pending: p.pending,
            expected: p.expected,
            completionRate: `${p.completionRate ?? 0}%`,
            complianceRate: `${p.complianceRate ?? 0}%`,
          })),
        );
      } else if (activeReport === "actionPoints") {
        const report = await fetchActionPointsOrgReport({ dateFilter });
        setActionPointKpis(report?.kpis || null);
        setRows(
          (report?.actionPoints || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            store: storeLabel(item.storeId),
            priority: capitalize(item.priority),
            status: capitalize(String(item.status).replace(/_/g, " ")),
            assignee: userLabel(item.assignedTo),
            dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—",
            flag: item.isOverdue ? "Overdue" : item.isDueToday ? "Due Today" : "—",
          })),
        );
      } else if (activeReport === "tickets") {
        const report = await fetchTicketOrgReport({ dateFilter });
        setTicketKpis(report?.kpis || null);
        setRows(
          (report?.tickets || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.subject,
            store: storeLabel(item.storeId),
            priority: capitalize(item.priority),
            status: capitalize(String(item.status).replace(/_/g, " ")),
            assignee: userLabel(item.assignedTo),
            vendor: humanLabel(item.vendor, "—"),
            category: item.categoryName || "—",
            cycleHours: item.cycleHours != null ? item.cycleHours : "—",
            flag: item.isOverdue ? "Overdue" : item.isDueToday ? "Due Today" : "—",
          })),
        );
      } else if (activeReport === "assets") {
        const report = await fetchAssetOrgReport({ dateFilter });
        setAssetKpis(report?.kpis || null);
        setRows(
          (report?.assets || []).map((item: any) => ({
            id: item.id,
            name: item.name || item.assetName,
            store: storeLabel(item.storeId),
            status: capitalize(item.status),
            condition: item.condition || "—",
            utilization: `${item.utilizationPercent ?? 0}%`,
            expiry: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—",
            flag: item.isExpired
              ? "Expired"
              : item.isExpiringSoon
                ? "Expiring Soon"
                : item.needsRenewal
                  ? "Needs Renewal"
                  : "—",
          })),
        );
      } else if (activeReport === "learning") {
        const report = await fetchLearningOrgReport(dateFilter, "courses");
        setLearningKpis(report?.kpis || null);
        setRows(
          (report?.courses || []).map((item: any) => ({
            id: item.courseId,
            name: item.courseTitle,
            category: item.category,
            assigned: item.assigned ?? 0,
            completed: item.completed ?? 0,
            completion: `${item.completionRate ?? 0}%`,
            avgProgress: `${item.avgProgress ?? 0}%`,
            overdue: item.overdue ?? 0,
            status: item.status,
          })),
        );
      } else if (activeReport === "assessments") {
        const [items, analytics] = await Promise.all([
          fetchAssessmentResultsReport(dateFilter),
          fetchAssessmentAnalytics(dateFilter),
        ]);
        setAssessmentKpis(analytics?.kpis || null);
        setRows(
          (items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            user: item.user,
            score: `${item.percentage ?? item.score ?? 0}%`,
            status: item.status,
            date: item.date ? new Date(item.date).toLocaleDateString() : "—",
          })),
        );
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateFilter, storeNames, userNames]);

  const filteredData = useMemo(
    () =>
      rows.filter((item) => {
        const matchesSearch = Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        );
        const matchesStatus =
          statusFilter === "all" ||
          String(item.status).toLowerCase().includes(statusFilter.toLowerCase());
        return matchesSearch && matchesStatus;
      }),
    [rows, searchTerm, statusFilter],
  );

  const activeConfig = REPORT_CONFIG.find((r) => r.id === activeReport)!;

  const handleExport = () => {
    if (!filteredData.length) return;
    const columns = visibleRowColumns(filteredData[0]);
    exportRowsToCsv(
      `${activeReport}-report.csv`,
      columns,
      filteredData.map((item) => columns.map((key) => String(item[key] ?? ""))),
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("featureReports")}</h1>
            <p className="text-muted-foreground mt-1">{t("featureReportsPageDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/custom-dashboards">
            <Button variant="outline" className="gap-2">
              {t("customDashboards")}
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!filteredData.length}>
            <Download className="w-4 h-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CONFIG.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeReport === report.id ? "border-primary border-2" : ""
              }`}
              onClick={() => setActiveReport(report.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{t(report.labelKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t(report.descKey)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchReports")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTime")}</SelectItem>
            <SelectItem value="today">{t("today")}</SelectItem>
            <SelectItem value="week">{t("thisWeek")}</SelectItem>
            <SelectItem value="month">{t("thisMonth")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
            <SelectItem value="open">{t("open")}</SelectItem>
            <SelectItem value="draft">{t("draft")}</SelectItem>
            <SelectItem value="passed">{t("passed")}</SelectItem>
            <SelectItem value="failed">{t("failed")}</SelectItem>
          </SelectContent>
        </Select>
        {activeReport === "process" && (
          <Link href="/standard-reports/process-report">
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Open Full Process Report
            </Button>
          </Link>
        )}
        {activeReport === "actionPoints" && (
          <Link href="/standard-reports/action-points-org-report">
            <Button variant="outline" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Open Full Action Points Report
            </Button>
          </Link>
        )}
        {activeReport === "tickets" && (
          <Link href="/standard-reports/ticket-org-report">
            <Button variant="outline" className="gap-2">
              <Ticket className="w-4 h-4" />
              Open Full Ticket Report
            </Button>
          </Link>
        )}
        {activeReport === "assets" && (
          <Link href="/standard-reports/asset-org-report">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" />
              Open Full Asset Report
            </Button>
          </Link>
        )}
        {activeReport === "learning" && (
          <Link href="/standard-reports/learning-org-report">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Open Full Learning Report
            </Button>
          </Link>
        )}
        {activeReport === "assessments" && (
          <Link href="/standard-reports/assessment-results">
            <Button variant="outline" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Open Assessment Results Dashboard
            </Button>
          </Link>
        )}
      </div>

      {activeReport === "process" && processKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Submitted", value: processKpis.totalSubmitted },
            { label: "Completed", value: processKpis.completed },
            { label: "Pending", value: processKpis.pending },
            { label: "Expected", value: processKpis.expected },
            { label: "Completion", value: `${processKpis.completionRate}%` },
            { label: "Compliance", value: `${processKpis.complianceRate}%` },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeReport === "actionPoints" && actionPointKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: actionPointKpis.total },
            { label: "Open", value: actionPointKpis.open },
            { label: "Overdue", value: actionPointKpis.overdue },
            { label: "Resolved", value: actionPointKpis.resolved },
            { label: "Resolution", value: `${actionPointKpis.resolutionRate}%` },
            { label: "Overdue Rate", value: `${actionPointKpis.overdueRate}%` },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeReport === "tickets" && ticketKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: ticketKpis.total },
            { label: "Open", value: ticketKpis.open },
            { label: "Overdue", value: ticketKpis.overdue },
            { label: "Resolved", value: ticketKpis.resolved },
            { label: "Resolution", value: `${ticketKpis.resolutionRate}%` },
            { label: "Avg Cycle (h)", value: ticketKpis.avgCycleHours },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeReport === "assets" && assetKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: assetKpis.total },
            { label: "Active", value: assetKpis.active },
            { label: "Expired", value: assetKpis.expired },
            { label: "Expiring Soon", value: assetKpis.expiringSoon },
            { label: "Needs Renewal", value: assetKpis.needsRenewal },
            { label: "Avg Utilization", value: `${assetKpis.avgUtilization}%` },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeReport === "learning" && learningKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Courses", value: learningKpis.totalCourses },
            { label: "Learners", value: learningKpis.totalLearners },
            { label: "Completed", value: learningKpis.completed },
            { label: "Completion", value: `${learningKpis.completionRate}%` },
            { label: "Avg Progress", value: `${learningKpis.avgProgress}%` },
            { label: "Compliance", value: `${learningKpis.complianceRate}%` },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeReport === "assessments" && assessmentKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Completed", value: assessmentKpis.completedAttempts },
            { label: "Passed", value: assessmentKpis.passed },
            { label: "Failed", value: assessmentKpis.failed },
            { label: "Pass Rate", value: `${assessmentKpis.passRate}%` },
            { label: "Avg Score", value: `${assessmentKpis.avgScore}%` },
            { label: "Candidates", value: assessmentKpis.uniqueCandidates },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t(activeConfig.labelKey)}</span>
            <Badge variant="outline">
              {filteredData.length} {t("records")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">{t("loading")}</p>
          ) : filteredData.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">{t("noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleRowColumns(filteredData[0]).map((key) => (
                      <TableHead key={key} className="capitalize">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      {visibleRowColumns(item).map((key) => (
                        <TableCell key={key}>
                          {key === "status" ? (
                            <Badge variant="outline">{String(item[key])}</Badge>
                          ) : (
                            String(item[key] ?? "—")
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function capitalize(value: string) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
