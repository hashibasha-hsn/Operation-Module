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
  Filter,
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
import {
  type DateFilter,
  exportRowsToCsv,
  fetchActionPoints,
  fetchAssessmentResultsReport,
  fetchAssets,
  fetchEntities,
  fetchLearningOrgReport,
  fetchOrganizationReport,
  fetchTickets,
} from "@/lib/reportApi";

type ReportType =
  | "process"
  | "actionPoints"
  | "tickets"
  | "assets"
  | "learning"
  | "assessments";

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

  useEffect(() => {
    fetchEntities()
      .then((entities) => {
        const map: Record<string, string> = {};
        entities.forEach((entity: any) => {
          map[entity.id] = entity.storeName || entity.entityName || entity.name || entity.id;
        });
        setStoreNames(map);
      })
      .catch(() => setStoreNames({}));
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === "process") {
        const submissions = await fetchOrganizationReport(dateFilter);
        setRows(
          submissions.map((s: any) => ({
            id: s.id,
            name: s.process?.title || s.audit?.title || "—",
            store: storeNames[s.storeId] || s.storeId,
            status: formatStatus(s.status),
            completion: s.status === "completed" ? 100 : s.status === "draft" ? 25 : 50,
            date: s.submittedAt
              ? new Date(s.submittedAt).toLocaleDateString()
              : new Date(s.createdAt).toLocaleDateString(),
          })),
        );
      } else if (activeReport === "actionPoints") {
        const items = await fetchActionPoints();
        setRows(
          items.map((item: any) => ({
            id: item.id,
            title: item.title,
            store: storeNames[item.storeId] || item.storeId || "—",
            priority: capitalize(item.priority),
            status: capitalize(String(item.status).replace(/_/g, " ")),
            assignee: item.assignedTo || "—",
            dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—",
          })),
        );
      } else if (activeReport === "tickets") {
        const items = await fetchTickets();
        setRows(
          items.map((item: any) => ({
            id: item.id,
            title: item.title || item.subject,
            store: storeNames[item.storeId] || item.storeId || "—",
            priority: capitalize(item.priority),
            status: capitalize(String(item.status).replace(/_/g, " ")),
            assignedTo: item.assignedTo || "—",
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
          })),
        );
      } else if (activeReport === "assets") {
        const items = await fetchAssets();
        setRows(
          items.map((item: any) => ({
            id: item.id,
            name: item.name || item.assetName,
            store: storeNames[item.storeId] || item.storeId || "—",
            status: capitalize(item.status),
            condition: item.condition || item.assetCondition || "—",
            lastMaintenance: item.lastMaintenanceDate
              ? new Date(item.lastMaintenanceDate).toLocaleDateString()
              : "—",
          })),
        );
      } else if (activeReport === "learning") {
        const data = await fetchLearningOrgReport(dateFilter, "courses");
        const courses = data?.courses ?? [];
        setRows(
          courses.map((item: any) => ({
            id: item.courseId,
            name: item.courseTitle,
            category: item.category,
            status: item.status,
            files: item.files ?? 0,
            date: item.launchDate ? new Date(item.launchDate).toLocaleDateString() : "—",
          })),
        );
      } else if (activeReport === "assessments") {
        const items = await fetchAssessmentResultsReport(dateFilter);
        setRows(
          (items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            user: item.user,
            score: item.score ?? 0,
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
  }, [activeReport, dateFilter, storeNames]);

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
    exportRowsToCsv(
      `${activeReport}-report.csv`,
      Object.keys(filteredData[0]),
      filteredData.map((item) => Object.values(item).map(String)),
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
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!filteredData.length}>
          <Download className="w-4 h-4" />
          {t("export")}
        </Button>
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
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t("moreFilters")}
        </Button>
      </div>

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
                    {Object.keys(filteredData[0]).map((key) => (
                      <TableHead key={key} className="capitalize">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      {Object.entries(item).map(([key, value]) => (
                        <TableCell key={key}>
                          {key === "status" ? (
                            <Badge variant="outline">{String(value)}</Badge>
                          ) : (
                            String(value)
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

function formatStatus(status: string) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function capitalize(value: string) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
