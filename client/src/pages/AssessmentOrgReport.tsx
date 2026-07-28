import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ArrowLeft, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  deleteAssessmentSubmission,
  exportRowsToCsv,
  fetchAssessmentOrgReport,
  fetchAssessmentSubmissionList,
  fetchEntities,
} from "@/lib/reportApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";

export default function AssessmentOrgReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEntities()
      .then((entities) => {
        setStoreNames(buildStoreNameMap(entities || []));
      })
      .catch(() => setStoreNames({}));
  }, []);

  useEffect(() => {
    loadAssessments();
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "N/A") : "N/A";

  const submitterLabel = (submission: any) =>
    humanLabel(
      submission.submitterName,
      submission.submittedByName,
      submission.email,
      "N/A",
    );

  const loadAssessments = async () => {
    setLoading(true);
    try {
      // Use all-time helper then client-filter if custom dates provided.
      const data = await fetchAssessmentOrgReport("all");
      let rows = Array.isArray(data) ? data : [];
      if (startDate) {
        const start = new Date(startDate);
        rows = rows.filter((a) => new Date(a.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        rows = rows.filter((a) => new Date(a.createdAt) <= end);
      }
      setAssessments(rows);
    } catch (error: any) {
      console.error("Error fetching assessments:", error);
      toast.error(error.message || "Failed to load assessment org report");
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assessment: any) => {
    setLoading(true);
    try {
      const data = await fetchAssessmentSubmissionList(assessment.id);
      setSubmissions(Array.isArray(data) ? data : []);
      setSelectedAssessment(assessment);
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      toast.error(error.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const removeSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await deleteAssessmentSubmission(submissionId);
      toast.success("Submission deleted");
      if (selectedAssessment) {
        loadSubmissions(selectedAssessment);
      }
    } catch (error: any) {
      console.error("Error deleting submission:", error);
      toast.error(error.message || "Failed to delete submission");
    }
  };

  const getStatusBadge = (status: string, passed?: boolean) => {
    if (status === "completed") {
      return passed ? (
        <Badge className="bg-green-100 text-green-800">Passed</Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800">Failed</Badge>
      );
    }
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const handleExport = () => {
    if (selectedAssessment) {
      exportRowsToCsv(
        `${selectedAssessment.title || "assessment"}-submissions.csv`,
        ["Date", "Candidate", "Email", "Store", "Attempt", "Status", "Percentage"],
        submissions.map((s) => [
          s.date ? new Date(s.date).toLocaleDateString() : "",
          submitterLabel(s),
          s.email || "",
          storeLabel(s.storeId),
          String(s.attemptNumber ?? 1),
          s.status === "completed" ? (s.passed ? "Passed" : "Failed") : s.status || "",
          String(s.percentage ?? 0),
        ]),
      );
      return;
    }
    exportRowsToCsv(
      "assessment-org-report.csv",
      ["Title", "Submissions", "Passed", "Failed", "Pass Rate", "Avg Score", "Status", "Created"],
      assessments.map((a) => [
        a.title || "",
        String(a.noOfSubmissions ?? 0),
        String(a.passed ?? 0),
        String(a.failed ?? 0),
        `${a.passRate ?? 0}%`,
        `${a.avgScore ?? 0}%`,
        a.status || "",
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
      ]),
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedAssessment ? (
            <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Link href="/standard-reports/assessment-results">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          )}
          <h1 className="text-2xl font-bold">
            {selectedAssessment ? "Assessment Submissions" : "Assessment Org Report"}
          </h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {!selectedAssessment && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={loadAssessments}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : selectedAssessment ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold">{selectedAssessment.title} - Submissions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Completed {selectedAssessment.noOfSubmissions ?? 0} · Pass rate{" "}
                {selectedAssessment.passRate ?? 0}% · Avg score {selectedAssessment.avgScore ?? 0}%
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Ended At</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">
                        {new Date(submission.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.startedAt
                          ? new Date(submission.startedAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.endedAt
                          ? new Date(submission.endedAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">{submission.attemptNumber}</TableCell>
                      <TableCell className="text-sm">{storeLabel(submission.storeId)}</TableCell>
                      <TableCell className="text-sm">{submitterLabel(submission)}</TableCell>
                      <TableCell className="text-sm">{submission.email || "N/A"}</TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status, submission.passed)}
                      </TableCell>
                      <TableCell className="text-sm">{submission.percentage}%</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubmission(submission.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!submissions.length && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        {t("noDataFound")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Passed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow
                      key={assessment.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => loadSubmissions(assessment)}
                    >
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell>{assessment.noOfSubmissions}</TableCell>
                      <TableCell>{assessment.passed ?? 0}</TableCell>
                      <TableCell>{assessment.failed ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={(assessment.passRate ?? 0) >= 70 ? "default" : "secondary"}>
                          {assessment.passRate ?? 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>{assessment.avgScore ?? 0}%</TableCell>
                      <TableCell>
                        <Badge variant={assessment.status === "Active" ? "default" : "secondary"}>
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!assessments.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {t("noDataFound")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
