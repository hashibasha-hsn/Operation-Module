import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  discardSubmissionDraft,
  fetchEntitiesForUser,
  fetchProcessById,
  fetchUserSubmissions,
  getCurrentUserId,
  saveSubmissionDraft,
  startProcessSubmission,
  submitProcessSubmission,
} from "@/lib/processSubmission";
import { ArrowLeft, Save, Send, Trash2, AlertCircle } from "lucide-react";
import ManualActionPointDialog from "@/components/action-points/ManualActionPointDialog";
import {
  createActionPointsFromSubmission,
  getQuestionActionPointMode,
  getQuestionAutoTriggers,
} from "@/lib/actionPointApi";
import { fetchUsers } from "@/lib/processApi";

export default function ProcessFill() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/tasks/process/:id");
  const processId = params?.id ?? "";

  const [process, setProcess] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [submission, setSubmission] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [started, setStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [apDialog, setApDialog] = useState<{ question: any } | null>(null);
  const [autoApNotice, setAutoApNotice] = useState<string | null>(null);

  const userId = getCurrentUserId();
  const allowDateRange = process?.properties?.dateRangeSelection === "allowed";

  const questions = useMemo(
    () =>
      (process?.sections ?? []).flatMap((section: any) =>
        (section.questions ?? []).map((question: any) => ({
          ...question,
          sectionTitle: section.title,
        })),
      ),
    [process],
  );

  useEffect(() => {
    if (!processId || !userId) return;
    Promise.all([
      fetchProcessById(processId),
      fetchEntitiesForUser(),
      fetchUserSubmissions(userId),
    ])
      .then(([processData, entityData, userSubmissions]) => {
        setProcess(processData);
        const assignedStores = entityData.filter((entity: any) =>
          processData.storeIds?.length ? processData.storeIds.includes(entity.id) : true,
        );
        const storeList = assignedStores.length ? assignedStores : entityData;
        setStores(storeList);

        const existingDraft = userSubmissions.find(
          (item: any) =>
            item.workflowId === processId && (item.status === "draft" || item.status === "correction"),
        );

        if (existingDraft) {
          setStoreId(existingDraft.storeId ?? "");
          setSubmission(existingDraft);
          setResponses(existingDraft.answers?.responses ?? {});
          if (existingDraft.answers?.submissionDate) {
            setSubmissionDate(existingDraft.answers.submissionDate);
            setUseCustomDate(true);
          }
          setStarted(true);
          return;
        }

        if (storeList.length === 1) setStoreId(storeList[0].id);
        fetchUsers().then(setUsers).catch(() => setUsers([]));
      })
      .catch(() => toast.error("Failed to load process"));
  }, [processId, userId]);

  const handleStart = async () => {
    if (!storeId) {
      toast.error("Select a store/location first");
      return;
    }
    try {
      const draft = await startProcessSubmission({
        processId,
        userId,
        storeId,
        submissionDate: useCustomDate ? submissionDate : undefined,
      });
      setSubmission(draft);
      setResponses(draft.answers?.responses ?? {});
      setStarted(true);
    } catch (error: any) {
      toast.error(error.message || "Could not start process");
    }
  };

  const handleSave = async () => {
    if (!submission?.id) return;
    setIsSaving(true);
    try {
      const saved = await saveSubmissionDraft(
        submission.id,
        userId,
        responses,
        useCustomDate ? submissionDate : undefined,
      );
      setSubmission(saved);
      toast.success("Draft saved — you can continue later from Tasks");
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission?.id) return;
    setIsSaving(true);
    try {
      await submitProcessSubmission(
        submission.id,
        userId,
        responses,
        useCustomDate ? submissionDate : undefined,
      );
      await createActionPointsFromSubmission({
        submissionId: submission.id,
        workflowType: "process",
        workflowId: processId,
        storeId,
        responses,
        questions: questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options ?? {},
        })),
      }).catch(() => undefined);
      const reviewEnabled = process?.properties?.processWithReview || process?.requiresApproval;
      toast.success(
        reviewEnabled
          ? "Submitted — sent to Level 1 reviewer for approval"
          : "Process submitted successfully",
      );
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit process");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerChange = (question: any, value: string) => {
    setResponses((prev) => ({ ...prev, [question.id]: value }));
    const mode = getQuestionActionPointMode(question);
    if (mode === "auto") {
      const triggers = getQuestionAutoTriggers(question);
      if (triggers.includes(value)) {
        setAutoApNotice(`Action point will be auto-created for "${value}" on submit.`);
      } else if (autoApNotice) {
        setAutoApNotice(null);
      }
    }
  };

  const handleDiscard = async () => {
    if (!submission?.id || !confirm("Discard this draft and start fresh?")) return;
    try {
      await discardSubmissionDraft(submission.id, userId);
      setSubmission(null);
      setResponses({});
      setStarted(false);
      toast.success("Draft discarded");
    } catch (error: any) {
      toast.error(error.message || "Failed to discard draft");
    }
  };

  const renderQuestionInput = (question: any) => {
    const value = responses[question.id] ?? "";
    const setValue = (next: string) => handleAnswerChange(question, next);

    if (question.questionType === "long-answer") {
      return (
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[100px]" />
      );
    }
    if (question.questionType === "single-answer" || question.questionType === "dropdown") {
      const options = question.options?.options ?? [];
      return (
        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Select an option</option>
          {options.map((option: any) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
  };

  if (!process) {
    return <div className="p-6 text-muted-foreground">Loading process...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/tasks")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Button>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>{process.title}</CardTitle>
          {process.description && (
            <p className="text-sm text-muted-foreground">{process.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!started && (
            <>
              <div className="space-y-2">
                <Label>Choose store/location</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <option value="">Select store...</option>
                  {stores.map((store: any) => (
                    <option key={store.id} value={store.id}>
                      {store.storeName || store.entityName || store.name}
                    </option>
                  ))}
                </select>
              </div>

              {allowDateRange && (
                <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={useCustomDate}
                      onCheckedChange={(checked) => setUseCustomDate(Boolean(checked))}
                    />
                    Submit for Future or Past Dates
                  </label>
                  {useCustomDate && (
                    <Input
                      type="date"
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                    />
                  )}
                </div>
              )}

              <Button onClick={handleStart} className="bg-primary hover:bg-primary/90">
                Start
              </Button>
            </>
          )}

          {started && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
                <Button variant="destructive" onClick={handleDiscard} disabled={isSaving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Discard Draft
                </Button>
              </div>

              {autoApNotice && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  {autoApNotice}
                </p>
              )}

              <div className="space-y-4">
                {questions.map((question: any, index: number) => {
                  const apMode = getQuestionActionPointMode(question);
                  const hasAnswer = Boolean(responses[question.id]);
                  return (
                  <div key={question.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label>
                        {index + 1}. {question.questionText}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {apMode === "manual" && hasAnswer && submission?.id && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1"
                          onClick={() => setApDialog({ question })}
                        >
                          <AlertCircle className="h-4 w-4" />
                          Action Point
                        </Button>
                      )}
                    </div>
                    {renderQuestionInput(question)}
                  </div>
                );})}
              </div>

              {apDialog && submission?.id && (
                <ManualActionPointDialog
                  open={Boolean(apDialog)}
                  onOpenChange={(open) => !open && setApDialog(null)}
                  questionText={apDialog.question.questionText}
                  questionId={apDialog.question.id}
                  submissionId={submission.id}
                  workflowType="process"
                  workflowId={processId}
                  storeId={storeId}
                  stores={stores}
                  users={users.length ? users : [{ id: userId, name: "Me" }]}
                  defaultStoreId={storeId}
                  onCreated={() => toast.success("Action point created")}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
