import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search,
  Calendar,
  RefreshCw,
  Inbox,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { useTimezone } from "@/contexts/TimezoneContext";
import { toast } from "sonner";
import {
  exportAuditLogsToCsv,
  fetchAllAuditLogs,
  fetchAuditLogs,
  formatAuditLogDetails,
  formatAuditLogTarget,
  type AuditLogRecord,
} from "@/lib/auditLogApi";

type AuditTab = "workflow" | "system";
type ColumnFilterKey = "target" | "operation" | "performedBy" | "details";

function defaultStartDate() {
  return format(subMonths(new Date(), 3), "yyyy-MM-dd");
}

function defaultEndDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function operationBadgeClass(operation: string) {
  const op = operation.toLowerCase();
  if (op === "discard" || op === "delete" || op === "reject" || op === "revoke") {
    return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100";
  }
  if (op === "update" || op === "submit" || op === "sync") {
    return "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100";
  }
  if (op === "create" || op === "grant") {
    return "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100";
  }
  return "bg-muted text-foreground";
}

export default function AuditLogs() {
  const { formatDateTimeLong: formatCreatedAt } = useTimezone();
  const [activeTab, setActiveTab] = useState<AuditTab>("workflow");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultEndDate);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<Record<ColumnFilterKey, string>>({
    target: "",
    operation: "",
    performedBy: "",
    details: "",
  });
  const [appliedColumnFilters, setAppliedColumnFilters] = useState(columnFilters);

  const loadLogs = async (nextPage = 1, append = false) => {
    setIsLoading(true);
    try {
      const result = await fetchAuditLogs({
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        page: nextPage,
        limit: 50,
        sort: sortDirection,
        category: activeTab,
        target: appliedColumnFilters.target || undefined,
        operation: appliedColumnFilters.operation || undefined,
        performedBy: appliedColumnFilters.performedBy || undefined,
        details: appliedColumnFilters.details || undefined,
      });

      setAuditLogs((prev) => (append ? [...prev, ...result.logs] : result.logs));
      setPage(result.page);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit logs");
      if (!append) setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1, false);
  }, [appliedStartDate, appliedEndDate, appliedColumnFilters, sortDirection, activeTab]);

  const handleSubmit = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedColumnFilters(columnFilters);
    setPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as AuditTab);
    setColumnFilters({
      target: "",
      operation: "",
      performedBy: "",
      details: "",
    });
    setAppliedColumnFilters({
      target: "",
      operation: "",
      performedBy: "",
      details: "",
    });
    setPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadLogs(page + 1, true);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const logs = await fetchAllAuditLogs({
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        sort: sortDirection,
        category: activeTab,
        target: appliedColumnFilters.target || undefined,
        operation: appliedColumnFilters.operation || undefined,
        performedBy: appliedColumnFilters.performedBy || undefined,
        details: appliedColumnFilters.details || undefined,
      });
      if (logs.length === 0) {
        toast.error("No logs available to export for the selected filters");
        return;
      }
      exportAuditLogsToCsv(
        logs,
        activeTab === "workflow" ? "process-audit-report" : "system-activity-report",
      );
      toast.success(`Report downloaded (${logs.length} logs)`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create audit report");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const columnSearch = (key: ColumnFilterKey, label: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center">
          <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <p className="text-xs text-muted-foreground mb-2">Search {label}</p>
        <Input
          value={columnFilters[key]}
          onChange={(e) => setColumnFilters((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder={`Filter ${label.toLowerCase()}`}
        />
      </PopoverContent>
    </Popover>
  );

  const visibleCountLabel = useMemo(
    () => `${auditLogs.length} of ${total}`,
    [auditLogs.length, total],
  );

  const tabDescription =
    activeTab === "workflow"
      ? "Process and audit submission activity"
      : "Users, permissions, entities, tickets, assets, attendance, and other system changes";

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="workflow">Process & Audit</TabsTrigger>
            <TabsTrigger value="system">System Activity</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground">{tabDescription}</p>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Submit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportReport}
            disabled={isExporting || isLoading}
            className="gap-2"
          >
            <Download className={`w-4 h-4 ${isExporting ? "animate-pulse" : ""}`} />
            {isExporting ? "Creating report..." : "Create Report"}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleLoadMore}
          className="gap-2"
          disabled={!hasMore || isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Load More
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{visibleCountLabel} logs shown</p>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14%]">
                <div className="flex items-center gap-2">
                  Target
                  {columnSearch("target", "Target")}
                </div>
              </TableHead>
              <TableHead className="w-[12%]">
                <div className="flex items-center gap-2">
                  Operation
                  {columnSearch("operation", "Operation")}
                </div>
              </TableHead>
              <TableHead className="w-[18%]">
                <div className="flex items-center gap-2">
                  Performed By
                  {columnSearch("performedBy", "Performed By")}
                </div>
              </TableHead>
              <TableHead className="w-[36%]">
                <div className="flex items-center gap-2">
                  Details
                  {columnSearch("details", "Details")}
                </div>
              </TableHead>
              <TableHead className="w-[20%] text-right">
                <div className="flex items-center justify-end gap-2">
                  Created At
                  <button type="button" onClick={toggleSort} aria-label="Sort by date">
                    <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-96">
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Inbox className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">{isLoading ? "Loading..." : "No data"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => {
                const targetLabel = formatAuditLogTarget(log);
                const detailsText = formatAuditLogDetails(log.details);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium truncate" title={targetLabel}>
                      {targetLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={operationBadgeClass(log.operation)}>
                        {log.operation}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate" title={log.performedBy}>
                      {/^[0-9a-f-]{36}$/i.test(log.performedBy) ? "Unknown User" : log.performedBy}
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground whitespace-normal break-words align-top"
                      title={detailsText}
                    >
                      {detailsText}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap align-top tabular-nums">
                      {formatCreatedAt(log.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
