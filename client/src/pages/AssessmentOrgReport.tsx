import { useState, useEffect } from "react";
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
import { ORG_API } from "@/lib/apiConfig";

export default function AssessmentOrgReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assessments, setAssessments] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [startDate, endDate]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const params = new URLSearchParams({ organizationId });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${ORG_API}/assessments/reports/org-report?${params.toString()}`
      );
      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assessmentId: string) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const response = await fetch(
        `${ORG_API}/assessments/reports/submission-list/${assessmentId}?organizationId=${organizationId}`
      );
      const data = await response.json();
      setSubmissions(data);
      setSelectedAssessment(assessments.find((a: any) => a.id === assessmentId));
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    try {
      await fetch(`${ORG_API}/assessments/reports/submission/${submissionId}`, {
        method: 'DELETE',
      });
      if (selectedAssessment) {
        fetchSubmissions(selectedAssessment.id);
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedAssessment && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {selectedAssessment ? 'Assessment Submissions' : 'Assessment Org Report'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
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
            <Button onClick={fetchAssessments} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : selectedAssessment ? (
        /* Submission List View */
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold">{selectedAssessment.title} - Submissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ended At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions?.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">{submission.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{new Date(submission.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{submission.startedAt ? new Date(submission.startedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell className="text-sm">{submission.endedAt ? new Date(submission.endedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell className="text-sm">{submission.attemptNumber}</TableCell>
                      <TableCell className="text-sm">{submission.storeId || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{submission.submittedBy?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{submission.email || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-sm">{submission.percentage}%</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubmission(submission.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Main Assessment Grid View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. of Submissions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessments?.map((assessment: any) => (
                    <TableRow 
                      key={assessment.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => fetchSubmissions(assessment.id)}
                    >
                      <TableCell className="font-mono text-sm">{assessment.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell className="text-sm">{assessment.noOfSubmissions}</TableCell>
                      <TableCell>
                        <Badge variant={assessment.status === 'Active' ? 'default' : 'secondary'}>
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(assessment.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
