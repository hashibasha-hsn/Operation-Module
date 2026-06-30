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
import { Search, Download, Filter, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchProcessReport,
  fetchPublishedProcesses,
} from "@/lib/reportApi";

export default function ProcessReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processId, setProcessId] = useState("");
  const [processes, setProcesses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPublishedProcesses().then(setProcesses).catch(() => setProcesses([]));
  }, []);

  useEffect(() => {
    if (processId) fetchProcessReportData();
  }, [processId, dateFilter, statusFilter]);

  const fetchProcessReportData = async () => {
    if (!processId) return;
    setLoading(true);
    try {
      const data = await fetchProcessReport(processId, dateFilter);
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching process report:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = 
      submission.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <h1 className="text-3xl font-bold">{t("processReport")}</h1>
            <p className="text-muted-foreground mt-1">{t("processReportsDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              exportRowsToCsv(
                "process-report.csv",
                ["ID", "Store ID", "Submitted By", "Status", "Submitted At"],
                filteredSubmissions.map((s) => [
                  s.id,
                  s.storeId,
                  s.submittedBy,
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
        <Select value={processId} onValueChange={setProcessId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t("selectProcess")} />
          </SelectTrigger>
          <SelectContent>
            {processes.map((process) => (
              <SelectItem key={process.id} value={process.id}>
                {process.title || process.name || process.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 relative">
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

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Process Submissions</span>
            <Badge variant="outline">{filteredSubmissions.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!processId ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t("selectProcess")}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t('noTasksAvailableDateRange')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">{submission.id.slice(0, 8)}...</TableCell>
                      <TableCell>{submission.storeId}</TableCell>
                      <TableCell>{submission.submittedBy}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleDateString() 
                          : 'N/A'}
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
