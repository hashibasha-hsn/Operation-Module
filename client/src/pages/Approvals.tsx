import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Clock, AlertCircle, Search, Filter, MoreVertical, FileText, ClipboardCheck } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import {
  approveSubmission,
  fetchPendingApprovals,
  rejectSubmission,
  sendSubmissionForCorrection,
} from "@/lib/submissionApi";
import { fetchEntities, fetchUsers } from "@/lib/processApi";
import { fetchProcessById } from "@/lib/processSubmission";
import { fetchAuditById } from "@/lib/auditSubmission";
import { buildStoreNameMap, buildUserNameMap, humanLabel } from "@/lib/displayLabels";

export default function Approvals() {
  const [activeTab, setActiveTab] = useState("Approvals");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [levelFilter, setLevelFilter] = useState("all");
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [workflowDetail, setWorkflowDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals()
      .then(setSubmissions)
      .catch(() => setSubmissions([]));
  }, []);

  useEffect(() => {
    fetchEntities()
      .then((entities) => {
        setStoreNames(buildStoreNameMap(entities || []));
      })
      .catch(() => setStoreNames({}));
  }, []);

  useEffect(() => {
    fetchUsers(200)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "N/A") : "N/A";

  const userLabel = (userId?: string) =>
    userId ? humanLabel(userNames[userId], "N/A") : "N/A";

  const openDetailDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setWorkflowDetail(null);
    setIsDetailDialogOpen(true);
    if (!submission?.workflowId) return;
    setDetailLoading(true);
    const loader =
      submission.workflowType === "audit"
        ? fetchAuditById(submission.workflowId)
        : fetchProcessById(submission.workflowId);
    loader
      .then((detail) => setWorkflowDetail(detail))
      .catch(() => setWorkflowDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSubmission(id);
      fetchPendingApprovals().then(setSubmissions);
      setIsDetailDialogOpen(false);
    } catch (err: any) {
      console.error('Error approving submission:', err);
      alert(err.message || 'Approve failed');
    }
  };

  const handleSendCorrection = async () => {
    if (!selectedSubmission) return;

    try {
      await sendSubmissionForCorrection(selectedSubmission.id, correctionNotes);
      setCorrectionNotes("");
      setIsCorrectionDialogOpen(false);
      setIsDetailDialogOpen(false);
      fetchPendingApprovals().then(setSubmissions);
    } catch (err) {
      console.error('Error sending correction:', err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please provide rejection reason:");
    if (!reason) return;

    try {
      await rejectSubmission(id, reason);
      fetchPendingApprovals().then(setSubmissions);
      setIsDetailDialogOpen(false);
    } catch (err) {
      console.error('Error rejecting submission:', err);
    }
  };

  const getTimeLeft = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const filteredSubmissions = submissions.filter((s: any) => {
    const matchesLevel =
      levelFilter === "all" || String(s.currentReviewLevel || 1) === levelFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && s.status === "pending_review") ||
      s.status === statusFilter;
    return matchesLevel && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Approvals & Workflow Status</h1>
            <p className="text-muted-foreground mt-1">Review and track submissions</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {["Approvals", "Workflow Status"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="correction">Correction</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Review Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="1">Level 1</SelectItem>
            <SelectItem value="2">Level 2</SelectItem>
            <SelectItem value="3">Level 3</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
        <Button variant="outline" className="gap-2">
          Bulk Approval
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter((s: any) => s.status === "pending_review").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Correction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {submissions.filter((s: any) => s.status === 'correction').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter((s: any) => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      {activeTab === "Approvals" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Review Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No submissions available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.workflowType === 'process' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <ClipboardCheck className="w-4 h-4" />
                          )}
                          <span>{submission.process?.title || submission.audit?.title || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{storeLabel(submission.storeId)}</TableCell>
                      <TableCell>{userLabel(submission.submittedBy)}</TableCell>
                      <TableCell>
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === 'completed' ? 'default' :
                            submission.status === 'correction' ? 'destructive' :
                            submission.status === 'rejected' ? 'secondary' : 'outline'
                          }
                        >
                          {submission.status === "pending_review" ? "Pending review" : submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className={getTimeLeft(submission.dueDate) === 'Overdue' ? 'text-red-600' : ''}>
                            {getTimeLeft(submission.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">L{submission.currentReviewLevel || 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem
                            onClick={() => openDetailDialog(submission)}
                          >
                            Review
                          </DropdownMenuItem>
                        </TableActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === "Workflow Status" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No workflow status available
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.process?.title || submission.audit?.title || 'N/A'}</TableCell>
                      <TableCell>{storeLabel(submission.storeId)}</TableCell>
                      <TableCell>{userLabel(submission.submittedBy)}</TableCell>
                      <TableCell>
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === 'completed' ? 'default' :
                            submission.status === 'correction' ? 'destructive' :
                            submission.status === 'rejected' ? 'secondary' : 'outline'
                          }
                        >
                          {submission.status === "pending_review" ? "Pending review" : submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(submission.currentReviewLevel / 3) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm">L{submission.currentReviewLevel || 1}/3</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.reviewHistory && submission.reviewHistory.length > 0 ? (
                          <div className="text-sm">
                            {submission.reviewHistory[submission.reviewHistory.length - 1]?.action || 'N/A'}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No actions</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
            <DialogDescription>
              Review the submission details and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Workflow</Label>
                  <div className="text-sm mt-1">
                    {selectedSubmission.process?.title || selectedSubmission.audit?.title || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Submitted By</Label>
                  <div className="text-sm mt-1">{userLabel(selectedSubmission.submittedBy)}</div>
                </div>
                <div>
                  <Label>Store</Label>
                  <div className="text-sm mt-1">{storeLabel(selectedSubmission.storeId)}</div>
                </div>
                <div>
                  <Label>Submitted Date</Label>
                  <div className="text-sm mt-1">
                    {selectedSubmission.submittedAt
                      ? new Date(selectedSubmission.submittedAt).toLocaleString()
                      : selectedSubmission.answers?.submissionDate || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedSubmission.status === 'completed' ? 'default' :
                        selectedSubmission.status === 'correction' ? 'destructive' :
                        selectedSubmission.status === 'rejected' ? 'secondary' : 'outline'
                      }
                    >
                      {selectedSubmission.status === "pending_review" ? "Pending review" : selectedSubmission.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Review Level</Label>
                  <div className="mt-1">
                    <Badge variant="outline">L{selectedSubmission.currentReviewLevel || 1}</Badge>
                  </div>
                </div>
              </div>

              {/* Answers read-only */}
              {detailLoading ? (
                <div className="text-sm text-muted-foreground">Loading submission details...</div>
              ) : workflowDetail ? (
                <div>
                  <Label>Answers</Label>
                  <div className="mt-2 border rounded-lg">
                    {(workflowDetail.sections ?? []).map((section: any) => (
                      <div key={section.id} className="border-b last:border-0">
                        <div className="px-4 py-3 bg-muted/40 text-sm font-semibold">
                          {section.title || 'Section'}
                        </div>
                        {(section.questions ?? []).map((question: any, qIndex: number) => (
                          <ReviewAnswerRow
                            key={question.id}
                            question={question}
                            answers={selectedSubmission.answers}
                            index={qIndex}
                          />
                        ))}
                      </div>
                    ))}
                    {!((workflowDetail.sections ?? []).length > 0) && (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No questions found for this {selectedSubmission.workflowType}.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Could not load {selectedSubmission.workflowType} details.
                </div>
              )}

              {selectedSubmission.answers?.correctionNotes && (
                <div>
                  <Label>Correction Notes</Label>
                  <div className="mt-2 text-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    {selectedSubmission.answers.correctionNotes}
                  </div>
                </div>
              )}

              {selectedSubmission.reviewHistory && selectedSubmission.reviewHistory.length > 0 && (
                <div>
                  <Label>Review History</Label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.reviewHistory.map((history: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm border rounded p-2">
                        <Badge variant="outline">L{history.level}</Badge>
                        <Badge variant={history.action === 'approved' ? 'default' : history.action === 'rejected' ? 'destructive' : 'secondary'}>
                          {history.action}
                        </Badge>
                        <span className="text-muted-foreground">
                          {userLabel(history.reviewerId)} · {new Date(history.timestamp).toLocaleString()}
                        </span>
                        {history.notes && <span className="text-muted-foreground">{history.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedSubmission?.status === 'pending_review' && (
              <>
                <Button variant="outline" onClick={() => setIsCorrectionDialogOpen(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Send for Correction
                </Button>
                <Button variant="destructive" onClick={() => handleReject(selectedSubmission.id)}>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedSubmission.id)}>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            {selectedSubmission?.status === 'correction' && (
              <Button onClick={() => handleApprove(selectedSubmission.id)}>
                <Check className="w-4 h-4 mr-2" />
                Approve Correction
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send for Correction</DialogTitle>
            <DialogDescription>
              Provide feedback for the submitter to address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="correctionNotes">Correction Notes</Label>
              <Textarea
                id="correctionNotes"
                placeholder="Describe what needs to be corrected..."
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCorrectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCorrection}>
              Send Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewAnswerRow({
  question,
  answers,
  index,
}: {
  question: any;
  answers: any;
  index: number;
}) {
  const config = question.options ?? {};
  const responses = answers?.responses ?? {};
  const value = responses[question.id];
  const naValue = responses[`${question.id}:na`];
  const comment = responses[`${question.id}:comment`];
  const attachment = responses[`${question.id}:attachment`];
  const timestamp = responses[`${question.id}:timestamp`];

  const answerText =
    value != null && value !== ""
      ? String(value)
      : naValue === "true"
        ? "N/A"
        : "No answer";

  const valueClass =
    value != null && value !== ""
      ? "font-medium"
      : naValue === "true"
        ? "italic text-muted-foreground"
        : "italic text-muted-foreground";

  return (
    <div className="px-4 py-3 border-b last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{index + 1}. {question.questionText}</span>
          {question.isRequired && <span className="text-red-500 ml-1">*</span>}
        </div>
        {config.questionTag && (
          <span className="text-xs text-orange-700 shrink-0">
            Tag: <span className="font-medium">{config.questionTag}</span>
          </span>
        )}
      </div>

      <div className={`mt-1 text-sm ${valueClass}`}>{answerText}</div>

      {config.instructionText && (
        <p className="mt-1 text-xs text-blue-800 bg-blue-50/60 rounded px-2 py-1">
          {config.instructionText}
        </p>
      )}
      {config.questionReferenceFile && (
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          Reference file: {config.questionReferenceFile}
        </p>
      )}

      {comment && (
        <div className="mt-2 text-sm rounded-md border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Comment:</span> {comment}
        </div>
      )}

      {attachment && (
        <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
          Attachment: {attachment}
        </div>
      )}

      {timestamp && (
        <div className="mt-1 text-xs text-muted-foreground">
          Timestamp: {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}
