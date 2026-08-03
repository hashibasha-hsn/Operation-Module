import { useState, useEffect, useMemo } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Download,
  ArrowLeft,
  FileText,
  Store,
  Users,
  Building2,
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchProcessReport,
  fetchPublishedProcesses,
  fetchEntities,
} from "@/lib/reportApi";
import { fetchUsers } from "@/lib/processApi";
import { humanLabel, buildIdLabelMap } from "@/lib/displayLabels";

type ViewLevel = "details" | "store" | "team" | "org";

function rateBadgeClass(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function ProcessReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processId, setProcessId] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("details");
  const [processes, setProcesses] = useState<any[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [detailRow, setDetailRow] = useState<any>(null);

  useEffect(() => {
    fetchPublishedProcesses()
      .then((list) => setProcesses(Array.isArray(list) ? list : []))
      .catch(() => setProcesses([]));
    fetchEntities()
      .then((entities) => {
        const map: Record<string, string> = {};
        (entities || []).forEach((entity: any) => {
          const label = humanLabel(entity.storeName, entity.entityName, entity.name, "Unnamed store");
          map[entity.id] = label;
          if (entity.entityId) map[entity.entityId] = label;
        });
        setStoreNames(map);
      })
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => {
        setUserNames(buildIdLabelMap(users, ["userId", "id"], ["name", "fullName", "email", "employeeId"]));
      })
      .catch(() => setUserNames({}));
  }, []);

  useEffect(() => {
    fetchReport();
  }, [processId, dateFilter, statusFilter, storeFilter, teamFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await fetchProcessReport(processId || "all", dateFilter, {
        storeId: storeFilter,
        submittedBy: teamFilter,
        status: statusFilter,
        search: searchTerm || undefined,
        includeAllStatuses: true,
      });
      setReport(data);
    } catch (error) {
      console.error("Error fetching process report:", error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const storeLabel = (id: string) => humanLabel(storeNames[id], "Unnamed store");
  const userLabel = (id?: string) => {
    if (!id) return "—";
    return humanLabel(userNames[id], "Unknown user");
  };

  const submissions = useMemo(() => {
    const rows = Array.isArray(report?.submissions) ? report.submissions : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((s: any) => {
      const store = storeLabel(s.storeId).toLowerCase();
      return (
        s.id?.toLowerCase().includes(q) ||
        s.storeId?.toLowerCase().includes(q) ||
        store.includes(q) ||
        s.submittedBy?.toLowerCase().includes(q) ||
        s.process?.title?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q)
      );
    });
  }, [report, searchTerm, storeNames]);

  const byStore = useMemo(() => {
    const rows = Array.isArray(report?.byStore) ? report.byStore : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r: any) =>
        r.storeId?.toLowerCase().includes(q) || storeLabel(r.storeId).toLowerCase().includes(q),
    );
  }, [report, searchTerm, storeNames]);

  const byTeam = useMemo(() => {
    const rows = Array.isArray(report?.byTeam) ? report.byTeam : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((r: any) => r.userId?.toLowerCase().includes(q));
  }, [report, searchTerm]);

  const byProcess = useMemo(() => {
    const rows = Array.isArray(report?.byProcess) ? report.byProcess : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r: any) =>
        r.processTitle?.toLowerCase().includes(q) ||
        r.processTag?.toLowerCase().includes(q) ||
        r.processId?.toLowerCase().includes(q),
    );
  }, [report, searchTerm]);

  const teamOptions = useMemo(() => {
    const ids = new Set<string>();
    (report?.byTeam || []).forEach((t: any) => ids.add(t.userId));
    (report?.submissions || []).forEach((s: any) => s.submittedBy && ids.add(s.submittedBy));
    return Array.from(ids).sort();
  }, [report]);

  const storeOptions = useMemo(() => {
    const ids = new Set<string>();
    (report?.byStore || []).forEach((s: any) => ids.add(s.storeId));
    Object.keys(storeNames).forEach((id) => ids.add(id));
    return Array.from(ids).sort((a, b) => storeLabel(a).localeCompare(storeLabel(b)));
  }, [report, storeNames]);

  const kpis = report?.kpis || {
    totalSubmitted: 0,
    completed: 0,
    pending: 0,
    rejected: 0,
    expected: 0,
    completionRate: 0,
    complianceRate: 0,
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "default",
      new: "secondary",
      correction: "outline",
      rejected: "destructive",
      pending_review: "outline",
      draft: "secondary",
    };
    return <Badge variant={(statusColors[status] as any) || "outline"}>{status}</Badge>;
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const title = (report?.processTitle || "process").replace(/\s+/g, "-").toLowerCase();

    if (viewLevel === "store") {
      exportRowsToCsv(
        `process-report-store-${title}-${stamp}.csv`,
        ["Store", "Submitted", "Completed", "Pending", "Expected", "Completion %", "Compliance %"],
        byStore.map((r: any) => [
          storeLabel(r.storeId),
          String(r.submitted),
          String(r.completed),
          String(r.pending),
          String(r.expected),
          String(r.completionRate),
          String(r.complianceRate),
        ]),
      );
      return;
    }

    if (viewLevel === "team") {
      exportRowsToCsv(
        `process-report-team-${title}-${stamp}.csv`,
        ["User", "Submitted", "Completed", "Pending", "Rejected", "Compliance %"],
        byTeam.map((r: any) => [
          userLabel(r.userId),
          String(r.submitted),
          String(r.completed),
          String(r.pending),
          String(r.rejected),
          String(r.complianceRate),
        ]),
      );
      return;
    }

    if (viewLevel === "org") {
      exportRowsToCsv(
        `process-report-org-${stamp}.csv`,
        ["Process", "Tag", "Submitted", "Completed", "Pending", "Expected", "Completion %", "Compliance %"],
        byProcess.map((r: any) => [
          r.processTitle,
          r.processTag,
          String(r.submitted),
          String(r.completed),
          String(r.pending),
          String(r.expected),
          String(r.completionRate),
          String(r.complianceRate),
        ]),
      );
      return;
    }

    exportRowsToCsv(
      `process-report-details-${title}-${stamp}.csv`,
      ["Process", "Store", "Submitted By", "Status", "Submitted At"],
      submissions.map((s: any) => [
        s.process?.title || report?.processTitle || "",
        storeLabel(s.storeId),
        s.submittedBy,
        s.status,
        s.submittedAt || s.createdAt || "",
      ]),
    );
  };

  const views: { key: ViewLevel; label: string; icon: typeof FileText }[] = [
    { key: "details", label: "Details", icon: FileText },
    { key: "store", label: "Store Level", icon: Store },
    { key: "team", label: "Team Level", icon: Users },
    { key: "org", label: "Org Level", icon: Building2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <div className="p-2 rounded-lg bg-teal-50">
            <FileText className="w-7 h-7 text-teal-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("processReport")}</h1>
            <p className="text-muted-foreground mt-1">{t("processReportsDesc")}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading || !report}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Submitted", value: kpis.totalSubmitted, icon: Activity },
          { label: "Completed", value: kpis.completed, icon: CheckCircle2 },
          { label: "Pending", value: kpis.pending, icon: Clock },
          { label: "Expected", value: kpis.expected, icon: FileText },
          { label: "Completion Rate", value: `${kpis.completionRate}%`, icon: TrendingUp },
          { label: "Compliance Rate", value: `${kpis.complianceRate}%`, icon: CheckCircle2 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-4 h-4 text-teal-700" />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Process</label>
              <Select value={processId} onValueChange={setProcessId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder={t("selectProcess")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processes</SelectItem>
                  {processes.map((process) => (
                    <SelectItem key={process.id} value={process.id}>
                      {process.title || process.name || process.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search store, user, status, id..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchReport()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Store</label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {storeOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {storeLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Team Member</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team</SelectItem>
                  {teamOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {userLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("dateRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTime")}</SelectItem>
                  <SelectItem value="today">{t("today")}</SelectItem>
                  <SelectItem value="week">{t("thisWeek")}</SelectItem>
                  <SelectItem value="month">{t("thisMonth")}</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatus")}</SelectItem>
                  <SelectItem value="completed">{t("completed")}</SelectItem>
                  <SelectItem value="new">{t("new")}</SelectItem>
                  <SelectItem value="correction">{t("correction")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchReport}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b overflow-x-auto">
        {views.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={viewLevel === key ? "default" : "ghost"}
            onClick={() => setViewLevel(key)}
            className="gap-2 rounded-b-none"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
            <span>
              {viewLevel === "details" && "Process Submissions"}
              {viewLevel === "store" && "Store-Level Process Completion"}
              {viewLevel === "team" && "Team-Level Process Completion"}
              {viewLevel === "org" && "Organization Process Overview"}
              {report?.processTitle ? ` — ${report.processTitle}` : ""}
            </span>
            <Badge variant="outline">
              {viewLevel === "details" && `${submissions.length} records`}
              {viewLevel === "store" && `${byStore.length} stores`}
              {viewLevel === "team" && `${byTeam.length} members`}
              {viewLevel === "org" && `${byProcess.length} processes`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : viewLevel === "details" ? (
            submissions.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">{t("noTasksAvailableDateRange")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Process</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission: any) => (
                      <TableRow
                        key={submission.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setDetailRow(submission)}
                      >
                        <TableCell>{submission.process?.title || report?.processTitle || "—"}</TableCell>
                        <TableCell>{storeLabel(submission.storeId)}</TableCell>
                        <TableCell>{userLabel(submission.submittedBy)}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {submission.submittedAt
                            ? new Date(submission.submittedAt).toLocaleString()
                            : submission.createdAt
                              ? new Date(submission.createdAt).toLocaleString()
                              : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : viewLevel === "store" ? (
            byStore.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No store-level data.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byStore.map((row: any) => (
                      <TableRow
                        key={row.storeId}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => {
                          setStoreFilter(row.storeId);
                          setViewLevel("details");
                        }}
                      >
                        <TableCell className="font-medium">{storeLabel(row.storeId)}</TableCell>
                        <TableCell>{row.submitted}</TableCell>
                        <TableCell>{row.completed}</TableCell>
                        <TableCell>{row.pending}</TableCell>
                        <TableCell>{row.expected}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rateBadgeClass(row.completionRate)}>
                            {row.completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rateBadgeClass(row.complianceRate)}>
                            {row.complianceRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : viewLevel === "team" ? (
            byTeam.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No team-level data.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byTeam.map((row: any) => (
                      <TableRow
                        key={row.userId}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => {
                          setTeamFilter(row.userId);
                          setViewLevel("details");
                        }}
                      >
                        <TableCell className="font-medium">{userLabel(row.userId)}</TableCell>
                        <TableCell>{row.submitted}</TableCell>
                        <TableCell>{row.completed}</TableCell>
                        <TableCell>{row.pending}</TableCell>
                        <TableCell>{row.rejected}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rateBadgeClass(row.complianceRate)}>
                            {row.complianceRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : byProcess.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No organization process data.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byProcess.map((row: any) => (
                    <TableRow
                      key={row.processId}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => {
                        setProcessId(row.processId);
                        setViewLevel("details");
                      }}
                    >
                      <TableCell className="font-medium">{row.processTitle}</TableCell>
                      <TableCell>{row.processTag}</TableCell>
                      <TableCell>{row.submitted}</TableCell>
                      <TableCell>{row.completed}</TableCell>
                      <TableCell>{row.pending}</TableCell>
                      <TableCell>{row.expected}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={rateBadgeClass(row.completionRate)}>
                          {row.completionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.complianceHidden ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={rateBadgeClass(row.complianceRate)}>
                            {row.complianceRate}%
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(detailRow)} onOpenChange={(open) => !open && setDetailRow(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Submission Detail</SheetTitle>
            <SheetDescription>
              {detailRow?.process?.title || report?.processTitle || "Process submission"}
            </SheetDescription>
          </SheetHeader>
          {detailRow && (
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">Store</span>
                <span>{storeLabel(detailRow.storeId)}</span>
              </div>
              <div className="flex justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">Submitted By</span>
                <span>{userLabel(detailRow.submittedBy)}</span>
              </div>
              <div className="flex justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(detailRow.status)}
              </div>
              <div className="flex justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">Submitted At</span>
                <span>
                  {detailRow.submittedAt
                    ? new Date(detailRow.submittedAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">Score</span>
                <span>{detailRow.score ?? "—"}</span>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => {
                  setStoreFilter(detailRow.storeId);
                  setDetailRow(null);
                  setViewLevel("store");
                }}
              >
                View Store Level
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
