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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
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
  Calendar as CalendarIcon,
  Filter,
  ArrowLeft,
  Users,
  Store,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { format, isAfter, startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  resolveReportDateRange,
  exportRowsToCsv,
  fetchMyReport,
  fetchEntities,
  fetchWorkflowDetail,
} from "@/lib/reportApi";
import { buildStoreNameMap, humanLabel, buildIdLabelMap } from "@/lib/displayLabels";
import { fetchUsers } from "@/lib/processApi";
import { fileNameFromUrl, isUrlValue } from "@/lib/fileUpload";

function toIsoDate(date?: Date | null) {
  if (!date || !isValid(date)) return undefined;
  return format(date, "yyyy-MM-dd");
}

function parseSubmittedAt(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return isValid(parsed) ? parsed : null;
}

export default function MyReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>();
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailFilter, setDetailFilter] = useState<DateFilter>("all");
  const [detailStartDate, setDetailStartDate] = useState<Date | undefined>();
  const [detailEndDate, setDetailEndDate] = useState<Date | undefined>();
  const [detailCalendarOpen, setDetailCalendarOpen] = useState(false);
  const [detailDraftStart, setDetailDraftStart] = useState<Date | undefined>();
  const [detailDraftEnd, setDetailDraftEnd] = useState<Date | undefined>();
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const activeRange = useMemo(
    () =>
      resolveReportDateRange({
        dateFilter,
        startDate: dateFilter === "custom" ? toIsoDate(customStartDate) : undefined,
        endDate: dateFilter === "custom" ? toIsoDate(customEndDate) : undefined,
      }),
    [dateFilter, customStartDate, customEndDate],
  );

  const draftInvalid =
    Boolean(draftStartDate && draftEndDate && isAfter(startOfDay(draftStartDate), startOfDay(draftEndDate)));

  useEffect(() => {
    fetchEntities()
      .then((entities) => {
        setStoreNames(buildStoreNameMap(entities || []));
      })
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => {
        setUserNames(buildIdLabelMap(users, ["userId", "id"], ["name", "fullName", "email", "employeeId"]));
      })
      .catch(() => setUserNames({}));
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "—") : "—";

  const userLabel = (userId?: string) =>
    userId ? humanLabel(userNames[userId], "—") : "—";

  const handleView = async (submission: any) => {
    setDetailData(null);
    setExpandedSubmissionId(null);
    setDetailFilter("all");
    setDetailStartDate(undefined);
    setDetailEndDate(undefined);
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

  const filteredDetailSubmissions = useMemo(() => {
    const rows = Array.isArray(detailData?.submissions) ? detailData.submissions : [];
    if (detailFilter === "all") return rows;

    const range = resolveReportDateRange({
      dateFilter: detailFilter,
      startDate: detailFilter === "custom" ? detailStartDate?.toISOString().slice(0, 10) : undefined,
      endDate: detailFilter === "custom" ? detailEndDate?.toISOString().slice(0, 10) : undefined,
    });
    if (!range.startDate && !range.endDate) return rows;

    return rows.filter((submission: any) => {
      const submittedAt = parseSubmittedAt(submission.submittedAt || submission.createdAt);
      if (!submittedAt) return false;
      if (range.startDate) {
        const start = startOfDay(parseISO(range.startDate));
        if (submittedAt < start) return false;
      }
      if (range.endDate) {
        const end = endOfDay(parseISO(range.endDate));
        if (submittedAt > end) return false;
      }
      return true;
    });
  }, [detailData, detailFilter, detailStartDate, detailEndDate]);

  const detailCompletedCount = useMemo(
    () => filteredDetailSubmissions.filter((s: any) => s.status === "completed").length,
    [filteredDetailSubmissions],
  );

  const fetchMyReportData = async () => {
    setLoading(true);
    try {
      const data = await fetchMyReport({
        dateFilter,
        startDate: activeRange.startDate,
        endDate: activeRange.endDate,
      });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching my report:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReportData();
  }, [dateFilter, customStartDate, customEndDate, statusFilter]);

  const handlePresetChange = (value: string) => {
    const next = value as DateFilter;
    setDateFilter(next);
    if (next !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
      setDraftStartDate(undefined);
      setDraftEndDate(undefined);
    }
  };

  const handleOpenCalendar = (open: boolean) => {
    setCalendarOpen(open);
    if (open) {
      setDraftStartDate(customStartDate);
      setDraftEndDate(customEndDate);
    }
  };

  const handleApplyCustomRange = () => {
    if (draftInvalid || (!draftStartDate && !draftEndDate)) return;
    setCustomStartDate(draftStartDate);
    setCustomEndDate(draftEndDate);
    setDateFilter("custom");
    setCalendarOpen(false);
  };

  const handleClearCustomRange = () => {
    setDraftStartDate(undefined);
    setDraftEndDate(undefined);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setDateFilter("all");
    setCalendarOpen(false);
  };

  const customRangeLabel = (() => {
    if (dateFilter !== "custom") return t("dateRange") || "Custom range";
    if (customStartDate && customEndDate) {
      return `${format(customStartDate, "MMM d, yyyy")} – ${format(customEndDate, "MMM d, yyyy")}`;
    }
    if (customStartDate) return `From ${format(customStartDate, "MMM d, yyyy")}`;
    if (customEndDate) return `Until ${format(customEndDate, "MMM d, yyyy")}`;
    return t("dateRange") || "Custom range";
  })();

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.process?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.audit?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

    let matchesDate = true;
    if (activeRange.startDate || activeRange.endDate) {
      const submittedAt = parseSubmittedAt(submission.submittedAt);
      if (!submittedAt) {
        matchesDate = false;
      } else {
        if (activeRange.startDate) {
          const start = startOfDay(parseISO(activeRange.startDate));
          if (submittedAt < start) matchesDate = false;
        }
        if (activeRange.endDate) {
          const end = endOfDay(parseISO(activeRange.endDate));
          if (submittedAt > end) matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "default",
      new: "secondary",
      correction: "outline",
      rejected: "destructive",
    };
    return <Badge variant={statusColors[status] as any || "outline"}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t("myReport")}</h1>
            <p className="text-muted-foreground mt-1">{t("myTasks")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              exportRowsToCsv(
                "my-report.csv",
                ["Type", "Title", "Store", "Status", "Submitted At"],
                filteredSubmissions.map((s) => [
                  s.workflowType,
                  s.process?.title || s.audit?.title || "",
                  storeLabel(s.storeId),
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

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchSubmissions")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={dateFilter === "custom" ? "custom" : dateFilter}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("dateRange")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTime")}</SelectItem>
            <SelectItem value="today">{t("today")}</SelectItem>
            <SelectItem value="week">{t("thisWeek")}</SelectItem>
            <SelectItem value="month">{t("thisMonth")}</SelectItem>
            {dateFilter === "custom" && (
              <SelectItem value="custom">Custom</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Popover open={calendarOpen} onOpenChange={handleOpenCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`min-w-[220px] justify-start text-left font-normal ${
                dateFilter === "custom" ? "border-primary text-foreground" : ""
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{customRangeLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="space-y-2">
                <p className="text-sm font-medium">From</p>
                <Calendar
                  mode="single"
                  selected={draftStartDate}
                  onSelect={setDraftStartDate}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">To</p>
                <Calendar
                  mode="single"
                  selected={draftEndDate}
                  onSelect={setDraftEndDate}
                />
              </div>
            </div>
            {draftInvalid && (
              <p className="text-xs text-destructive mt-2">From date must be on or before To date.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={handleClearCustomRange}>
                Clear
              </Button>
              <Button
                type="button"
                onClick={handleApplyCustomRange}
                disabled={draftInvalid || (!draftStartDate && !draftEndDate)}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Submissions</span>
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

      {/* Detail Sheet */}
      <Sheet open={Boolean(detailData)} onOpenChange={(open) => !open && setDetailData(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detailData?.workflow?.title || "Workflow Details"}
            </SheetTitle>
            <SheetDescription>
              {detailData?.workflow
                ? `${(detailData.workflow as any).status || "—"} · ${submissionTypeLabel(detailData.workflow)}`
                : "Loading details..."}
            </SheetDescription>
          </SheetHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : !detailData?.workflow ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No details found for this workflow.
            </div>
          ) : (
            <div className="mt-2 space-y-5">
              {/* Workflow summary */}
              <WorkflowSummary workflow={detailData.workflow} storeLabel={storeLabel} userLabel={userLabel} />

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Users}
                  label="Assigned Users"
                  value={detailData.workflow.assigneeIds?.length ?? 0}
                />
                <StatCard
                  icon={Store}
                  label="Stores"
                  value={detailData.workflow.storeIds?.length ?? 0}
                />
                <StatCard
                  icon={FileText}
                  label="Submissions"
                  value={filteredDetailSubmissions.length}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Completed"
                  value={detailCompletedCount}
                />
              </div>

              {/* Assigned users */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Assigned Users ({detailData.workflow.assigneeIds?.length ?? 0})
                </p>
                {detailData.workflow.assigneeIds?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {detailData.workflow.assigneeIds.map((userId: string) => (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                      >
                        {userLabel(userId)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No users assigned.</p>
                )}
              </div>

              {/* Date filter */}
              <div className="flex items-center gap-2 flex-wrap border-t pt-4">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Submissions
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={detailFilter} onValueChange={(v) => setDetailFilter(v as DateFilter)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder={t("dateRange")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allTime")}</SelectItem>
                      <SelectItem value="today">{t("today")}</SelectItem>
                      <SelectItem value="week">{t("thisWeek")}</SelectItem>
                      <SelectItem value="month">{t("thisMonth")}</SelectItem>
                      {detailFilter === "custom" && <SelectItem value="custom">Custom</SelectItem>}
                    </SelectContent>
                  </Select>
                  <Popover
                    open={detailCalendarOpen}
                    onOpenChange={(open) => {
                      setDetailCalendarOpen(open);
                      if (open) {
                        setDetailDraftStart(detailStartDate);
                        setDetailDraftEnd(detailEndDate);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`gap-2 ${detailFilter === "custom" ? "border-primary" : ""}`}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {detailFilter === "custom" && (detailStartDate || detailEndDate)
                          ? `${detailStartDate ? format(detailStartDate, "MMM d, yyyy") : "?"}${
                              detailEndDate ? ` – ${format(detailEndDate, "MMM d, yyyy")}` : ""
                            }`
                          : "Custom"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">From</p>
                          <Calendar mode="single" selected={detailDraftStart} onSelect={setDetailDraftStart} initialFocus />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">To</p>
                          <Calendar mode="single" selected={detailDraftEnd} onSelect={setDetailDraftEnd} />
                        </div>
                      </div>
                      {detailDraftStart && detailDraftEnd && isAfter(startOfDay(detailDraftStart), startOfDay(detailDraftEnd)) && (
                        <p className="text-xs text-destructive mt-2">From date must be on or before To date.</p>
                      )}
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDetailDraftStart(undefined);
                            setDetailDraftEnd(undefined);
                            setDetailStartDate(undefined);
                            setDetailEndDate(undefined);
                            setDetailFilter("all");
                            setDetailCalendarOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (detailDraftStart && detailDraftEnd && isAfter(startOfDay(detailDraftStart), startOfDay(detailDraftEnd))) return;
                            setDetailStartDate(detailDraftStart);
                            setDetailEndDate(detailDraftEnd);
                            setDetailFilter("custom");
                            setDetailCalendarOpen(false);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Submissions list */}
              <div className="space-y-2">
                {filteredDetailSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No submissions in this range.
                  </p>
                ) : (
                  filteredDetailSubmissions.map((submission: any) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      workflow={detailData.workflow}
                      expanded={expandedSubmissionId === submission.id}
                      onToggle={() =>
                        setExpandedSubmissionId((prev) =>
                          prev === submission.id ? null : submission.id,
                        )
                      }
                      storeLabel={storeLabel}
                      userLabel={userLabel}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function submissionTypeLabel(workflow: any): string {
  if (workflow?.processTag) return `Tag: ${workflow.processTag}`;
  if (workflow?.frequency) return `Frequency: ${workflow.frequency}`;
  return "Process";
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-3">
      <Icon className="w-4 h-4 text-teal-700 mb-1" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function WorkflowSummary({
  workflow,
  storeLabel,
  userLabel,
}: {
  workflow: any;
  storeLabel: (id?: string) => string;
  userLabel: (id?: string) => string;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Status", value: workflow.status || "—" },
    { label: "Description", value: workflow.description || "—" },
    { label: "Frequency", value: workflow.frequency || "—" },
    { label: "Tags", value: workflow.processTags?.length ? workflow.processTags.join(", ") : workflow.processTag || "—" },
    { label: "Created By", value: userLabel(workflow.createdBy) },
    { label: "Created At", value: workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : "—" },
    { label: "Updated At", value: workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : "—" },
  ];
  return (
    <div className="rounded-lg border divide-y">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-medium break-all">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  workflow,
  expanded,
  onToggle,
  storeLabel,
  userLabel,
}: {
  submission: any;
  workflow: any;
  expanded: boolean;
  onToggle: () => void;
  storeLabel: (id?: string) => string;
  userLabel: (id?: string) => string;
}) {
  const statusColors: Record<string, string> = {
    completed: "default",
    new: "secondary",
    correction: "outline",
    rejected: "destructive",
    pending_review: "outline",
    draft: "secondary",
  };
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={(statusColors[submission.status] as any) || "outline"}>
            {submission.status}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {storeLabel(submission.storeId)} · {userLabel(submission.submittedBy)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleString()
              : submission.createdAt
                ? new Date(submission.createdAt).toLocaleString()
                : "—"}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-3 py-3 space-y-4">
          {workflow?.sections?.length ? (
            workflow.sections.map((section: any) => (
              <div key={section.id}>
                <p className="text-sm font-semibold mb-2">{section.title || "Section"}</p>
                <div className="rounded-md border divide-y">
                  {section.questions?.length ? (
                    section.questions.map((question: any, qi: number) => (
                      <AnswerRow key={question.id} question={question} answers={submission.answers} index={qi} />
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground px-3 py-2">No questions.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No form structure available.</p>
          )}
          {submission.reviewHistory?.length ? (
            <div>
              <p className="text-sm font-semibold mb-2">Review History</p>
              <div className="rounded-md border divide-y text-sm">
                {submission.reviewHistory.map((history: any, index: number) => (
                  <div key={index} className="px-3 py-2">
                    <span className="font-medium capitalize">{history.action || "Action"}</span>
                    {history.reviewerName || history.reviewerId ? (
                      <span> · {history.reviewerName || history.reviewerId}</span>
                    ) : null}
                    {history.timestamp ? (
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {submission.score != null ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Score:</span>{" "}
              <span className="font-medium">{submission.score}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AnswerRow({
  question,
  answers,
  index,
}: {
  question: any;
  answers: any;
  index: number;
}) {
  const responses = answers?.responses ?? {};
  const value = responses[question.id];
  const naValue = responses[`${question.id}:na`];
  const comment = responses[`${question.id}:comment`];
  const attachment = responses[`${question.id}:attachment`];

  const parsedArray =
    typeof value === "string" && value.startsWith("[") && value.endsWith("]")
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map((item: any) => String(item)) : null;
          } catch {
            return null;
          }
        })()
      : null;

  const answerText =
    value != null && value !== ""
      ? String(value)
      : naValue === "true"
        ? "N/A"
        : "No answer";

  const answerUrl = value != null && value !== "" && isUrlValue(value) ? String(value) : null;

  return (
    <div className="px-3 py-2 text-sm">
      <p className="font-medium">
        {index + 1}. {question.questionText}
        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="mt-0.5">
        {answerUrl ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {fileNameFromUrl(String(value))}
          </a>
        ) : parsedArray && parsedArray.length > 0 ? (
          <ul className="list-disc pl-5 space-y-0.5">
            {parsedArray.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <span className={answerText === "No answer" ? "italic text-muted-foreground" : ""}>
            {answerText}
          </span>
        )}
      </div>
      {comment && (
        <div className="mt-1 text-sm rounded-md border bg-muted/40 px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground">Comment:</span> {comment}
        </div>
      )}
      {attachment && (
        <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
          Attachment:{" "}
          {isUrlValue(attachment) ? (
            <a
              href={String(attachment)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 underline break-all"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {fileNameFromUrl(String(attachment))}
            </a>
          ) : (
            <span>{attachment}</span>
          )}
        </div>
      )}
    </div>
  );
}
