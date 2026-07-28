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
import { Search, Download, Calendar as CalendarIcon, Filter, ArrowLeft } from "lucide-react";
import { format, isAfter, startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  resolveReportDateRange,
  exportRowsToCsv,
  fetchMyReport,
  fetchEntities,
} from "@/lib/reportApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";

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
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "—") : "—";

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
                          <DropdownMenuItem>View</DropdownMenuItem>
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
    </div>
  );
}
