import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { Search, Download, FileText, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchAssessmentReport,
  fetchAssessmentSubmissionDetail,
  fetchAssessments,
} from "@/lib/reportApi";
import { humanLabel } from "@/lib/displayLabels";

export default function AssessmentReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assessmentId, setAssessmentId] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchAssessments()
      .then((rows) => setAssessments(Array.isArray(rows) ? rows : []))
      .catch(() => setAssessments([]));
  }, []);

  useEffect(() => {
    if (!assessmentId) {
      setResults([]);
      return;
    }
    loadReport();
  }, [assessmentId, dateFilter]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchAssessmentReport(assessmentId, dateFilter);
      setResults(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error fetching assessment report:", error);
      toast.error(error.message || "Failed to load assessment report");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const completed = result.isCompleted !== false && result.status === "completed"
        ? true
        : Boolean(result.completedAt) || result.status === "completed";
      const matchesSearch =
        result.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "passed" && completed && result.passed) ||
        (statusFilter === "failed" && completed && !result.passed) ||
        (statusFilter === "in_progress" && !completed);
      return matchesSearch && matchesStatus;
    });
  }, [results, searchTerm, statusFilter]);

  const getPassBadge = (result: any) => {
    const completed =
      result.isCompleted || result.status === "completed" || Boolean(result.completedAt);
    if (!completed) {
      return <Badge variant="secondary">{result.status || "In Progress"}</Badge>;
    }
    return result.passed ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Passed</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>
    );
  };

  const candidateLabel = (row: any) =>
    humanLabel(row?.userName, row?.userEmail, "Unknown user");

  const handleExport = () => {
    exportRowsToCsv(
      "assessment-report.csv",
      ["User", "Score %", "Points", "Status", "Attempt", "Started", "Completed", "Time Taken"],
      filteredResults.map((result) => [
        candidateLabel(result),
        String(result.percentage ?? 0),
        String(result.score ?? 0),
        result.isCompleted || result.status === "completed"
          ? result.passed
            ? "Passed"
            : "Failed"
          : result.status || "In Progress",
        String(result.attemptNumber ?? 1),
        result.startedAt ? new Date(result.startedAt).toLocaleString() : "",
        result.completedAt ? new Date(result.completedAt).toLocaleString() : "",
        result.timeTaken
          ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`
          : "",
      ]),
    );
  };

  const openDetail = async (id: string) => {
    try {
      const data = await fetchAssessmentSubmissionDetail(id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load submission");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/standard-reports/assessment-results">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("assessmentReport")}</h1>
            <p className="text-muted-foreground mt-1">
              Specific assessment results and pass/fail performance
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!filteredResults.length}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={assessmentId || "none"} onValueChange={(v) => setAssessmentId(v === "none" ? "" : v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select assessment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select assessment</SelectItem>
            {assessments.map((assessment) => (
              <SelectItem key={assessment.id} value={assessment.id}>
                {assessment.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assessment Results</span>
            <Badge variant="outline">{filteredResults.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assessmentId ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Select an assessment to view results</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t("noTasksAvailableDateRange")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        {candidateLabel(result)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.assessment?.title || "Unknown Assessment"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.percentage ?? 0}%</Badge>
                      </TableCell>
                      <TableCell>{getPassBadge(result)}</TableCell>
                      <TableCell>#{result.attemptNumber}</TableCell>
                      <TableCell>
                        {result.startedAt
                          ? new Date(result.startedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {result.timeTaken
                          ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem onClick={() => openDetail(result.id)}>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Detail</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Candidate</p>
                  <p className="font-medium">{candidateLabel(detail)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-medium">{detail.percentage ?? 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Result</p>
                  <p className="font-medium">{detail.passed ? "Passed" : "Failed"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attempt</p>
                  <p className="font-medium">#{detail.attemptNumber}</p>
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Question results</p>
                <div className="space-y-2">
                  {(detail.questionResults || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No per-question breakdown stored.</p>
                  )}
                  {(detail.questionResults || []).map((q: any, index: number) => (
                    <div key={q.questionId || index} className="border rounded p-3 text-sm">
                      <div className="font-medium">{q.prompt || q.questionId || `Question ${index + 1}`}</div>
                      <div className="text-muted-foreground mt-1">
                        Score: {q.score ?? 0} / {q.maxScore ?? q.points ?? "?"} ·{" "}
                        {q.isCorrect ? "Correct" : "Incorrect / Partial"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
