import { useState, useEffect } from "react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import WorkflowDetailSheet from "@/components/report/WorkflowDetailSheet";
import { Search, Download, Filter, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchOrganizationReport,
  fetchEntities,
  fetchWorkflowDetail,
} from "@/lib/reportApi";
import { fetchUsers } from "@/lib/processApi";
import { buildStoreNameMap, buildUserNameMap, humanLabel } from "@/lib/displayLabels";

export default function OrganizationReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "N/A") : "N/A";
  const userLabel = (id?: string) =>
    id ? humanLabel(userNames[id], "Unknown user") : "N/A";

  const handleView = async (submission: any) => {
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const data = await fetchWorkflowDetail(
        submission.workflowId,
        submission.workflowType || "process",
      );
      setDetailData(data);
    } catch (error) {
      console.error("Error fetching workflow detail:", error);
      setDetailData({ workflow: null, submissions: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchOrganizationReportData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizationReport(dateFilter);
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching organization report:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationReportData();
  }, [dateFilter, statusFilter]);

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.process?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.audit?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.storeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "default",
      new: "secondary",
      correction: "outline",
      rejected: "destructive",
    };
    return <Badge variant={(statusColors[status] as any) || "outline"}>{status}</Badge>;
  };

  const totalSubmissions = submissions.length;
  const completedCount = submissions.filter((s) => s.status === "completed").length;
  const pendingCount = submissions.filter((s) => s.status === "new").length;
  const completionRate =
    totalSubmissions > 0 ? Math.round((completedCount / totalSubmissions) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t("organizationReport")}</h1>
            <p className="text-muted-foreground mt-1">{t("organizationReportDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              exportRowsToCsv(
                "organization-report.csv",
                ["Type", "Title", "Store", "Submitted By", "Status", "Submitted At"],
                filteredSubmissions.map((s) => [
                  s.workflowType,
                  s.process?.title || s.audit?.title || "",
                  storeLabel(s.storeId),
                  userLabel(s.submittedBy),
                  s.status,
                  s.submittedAt || "",
                ]),
              )
            }
            disabled={!filteredSubmissions.length}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalSubmissions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("completed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("completionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchSubmissions")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("dateRange")} />
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
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
            <SelectItem value="new">{t("new")}</SelectItem>
            <SelectItem value="correction">{t("correction")}</SelectItem>
            <SelectItem value="rejected">{t("rejected")}</SelectItem>
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
            <span>{t("organizationReport")}</span>
            <Badge variant="outline">{filteredSubmissions.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t("noTasksAvailableDateRange")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="capitalize">{submission.workflowType}</TableCell>
                      <TableCell className="font-medium">
                        {submission.process?.title || submission.audit?.title || "N/A"}
                      </TableCell>
                      <TableCell>{storeLabel(submission.storeId)}</TableCell>
                      <TableCell>{userLabel(submission.submittedBy)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem onSelect={() => handleView(submission)}>
                            View
                          </DropdownMenuItem>
                        </TableActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkflowDetailSheet
        open={Boolean(detailData)}
        onClose={() => setDetailData(null)}
        detailData={detailData}
        loading={loadingDetail}
        storeLabel={storeLabel}
        userLabel={userLabel}
      />
    </div>
  );
}
