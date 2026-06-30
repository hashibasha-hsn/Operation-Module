import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Award, Save, Send, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import AssessmentFillQuestion from "@/components/assessment/AssessmentFillQuestion";
import { fetchAssignedAssessments } from "@/lib/assessmentApi";
import { downloadAssessmentCertificate } from "@/lib/assessmentCertificate";
import type { AssessmentCertificateSettings } from "@/lib/assessmentDraft";
import {
  countCompletedAttempts,
  discardAssessmentAttempt,
  fetchAssessmentById,
  fetchEntitiesForUser,
  fetchUserAssessmentResults,
  flattenAssessmentQuestions,
  getCurrentUserDisplayName,
  getCurrentUserId,
  getInProgressResult,
  saveAssessmentAttemptDraft,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  type AssessmentSubmitResponse,
} from "@/lib/assessmentSubmission";

export default function AssessmentFill() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/learning/assessment/:id");
  const assessmentId = params?.id ?? "";

  const userId = getCurrentUserId();
  const userName = getCurrentUserDisplayName();

  const [assessment, setAssessment] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [attempt, setAttempt] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [started, setStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitResult, setSubmitResult] = useState<AssessmentSubmitResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [userResults, setUserResults] = useState<any[]>([]);

  const questions = useMemo(
    () => (assessment ? flattenAssessmentQuestions(assessment) : []),
    [assessment],
  );

  useEffect(() => {
    if (!assessmentId || !userId) return;

    Promise.all([
      fetchAssessmentById(assessmentId),
      fetchEntitiesForUser(),
      fetchUserAssessmentResults(userId),
      fetchAssignedAssessments(userId, undefined),
    ])
      .then(([assessmentData, entityData, results, assigned]) => {
        if (assessmentData.status !== "published") {
          toast.error("This assessment is not available");
          navigate("/learning");
          return;
        }

        const isAssigned = assigned.some((item: any) => item.id === assessmentId);
        if (assigned.length > 0 && !isAssigned) {
          toast.error("This assessment is not assigned to you");
          navigate("/learning");
          return;
        }

        setUserResults(results);
        setAssessment(assessmentData);
        const assignedStores = entityData.filter((entity: any) =>
          assessmentData.storeIds?.length
            ? assessmentData.storeIds.includes(entity.id)
            : true,
        );
        const storeList = assignedStores.length ? assignedStores : entityData;
        setStores(storeList);

        const inProgress = getInProgressResult(results, assessmentId);
        if (inProgress) {
          setAttempt(inProgress);
          setStoreId(inProgress.storeId ?? "");
          setResponses(inProgress.answers?.responses ?? {});
          setStarted(true);
          return;
        }

        if (storeList.length === 1) setStoreId(storeList[0].id);
      })
      .catch(() => toast.error("Failed to load assessment"));
  }, [assessmentId, userId, navigate]);

  useEffect(() => {
    if (!started || !assessment?.duration || submitResult || !attempt?.id) {
      setRemainingSeconds(null);
      return;
    }

    const durationSeconds = Number(assessment.duration) * 60;
    const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
    const endAt = startedAt + durationSeconds * 1000;
    let autoSubmitted = false;

    const tick = async () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left === 0 && !autoSubmitted && !isSaving) {
        autoSubmitted = true;
        setIsSaving(true);
        try {
          const result = await submitAssessmentAttempt(attempt.id, userId, responses);
          setSubmitResult(result);
          setAttempt(result.result);
          toast.message("Time is up — assessment submitted automatically");
        } catch (error: any) {
          toast.error(error.message || "Failed to submit assessment");
        } finally {
          setIsSaving(false);
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [started, assessment, attempt, submitResult, isSaving, userId, responses]);

  const handleStart = async () => {
    if (!storeId && stores.length > 0) {
      toast.error("Select a store first");
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const draft = await startAssessmentAttempt({
        assessmentId,
        userId,
        userEmail: user.email,
        storeId: storeId || undefined,
      });
      setAttempt(draft);
      setResponses(draft.answers?.responses ?? {});
      setStarted(true);
    } catch (error: any) {
      toast.error(error.message || "Could not start assessment");
    }
  };

  const handleSave = async () => {
    if (!attempt?.id) return;
    setIsSaving(true);
    try {
      const saved = await saveAssessmentAttemptDraft(attempt.id, userId, responses);
      setAttempt(saved);
      toast.success("Progress saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (!attempt?.id) return;

    const missingRequired = questions.filter(
      (question: any) =>
        question.isRequired &&
        (responses[question.id] == null ||
          responses[question.id] === "" ||
          (Array.isArray(responses[question.id]) && responses[question.id].length === 0)),
    );
    if (missingRequired.length > 0 && !auto) {
      toast.error("Please answer all required questions");
      return;
    }

    setIsSaving(true);
    try {
      const result = await submitAssessmentAttempt(attempt.id, userId, responses);
      setSubmitResult(result);
      setAttempt(result.result);

      if (result.result.passed) {
        toast.success(`Passed with ${result.result.percentage}%`);
        if (result.assessment.generateCertificate) {
          downloadAssessmentCertificate({
            userName,
            assessmentTitle: result.assessment.title,
            percentage: result.result.percentage,
            completedAt: new Date(result.result.completedAt || Date.now()),
            settings: result.assessment.certificateSettings as AssessmentCertificateSettings,
          });
          toast.success("Certificate downloaded");
        }
      } else {
        toast.error(`Not passed — score ${result.result.percentage}%`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit assessment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!attempt?.id || !confirm("Discard this attempt and start fresh?")) return;
    try {
      await discardAssessmentAttempt(attempt.id, userId);
      setAttempt(null);
      setResponses({});
      setStarted(false);
      setSubmitResult(null);
      toast.success("Attempt discarded");
    } catch (error: any) {
      toast.error(error.message || "Failed to discard attempt");
    }
  };

  const handleRetake = () => {
    setAttempt(null);
    setResponses({});
    setStarted(false);
    setSubmitResult(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  if (!assessment) {
    return <div className="p-6 text-muted-foreground">Loading assessment...</div>;
  }

  const showResult = submitResult?.assessment?.showResult !== false;
  const showCorrectAnswer = Boolean(submitResult?.assessment?.showCorrectAnswer);
  const questionResultsMap = new Map(
    (submitResult?.questionResults ?? []).map((item) => [item.id, item]),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate("/learning")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Learning
      </Button>

      <Card className="border-sky-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{assessment.title}</CardTitle>
              {assessment.description && (
                <p className="mt-1 text-sm text-muted-foreground">{assessment.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline">Pass: {assessment.passingScore ?? 0}%</Badge>
              {remainingSeconds != null && !submitResult && (
                <Badge variant={remainingSeconds < 60 ? "destructive" : "secondary"} className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimer(remainingSeconds)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!started && !submitResult && (
            <>
              {stores.length > 0 && (
                <div className="space-y-2">
                  <Label>Store</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                  >
                    <option value="">Select store</option>
                    {stores.map((store: any) => (
                      <option key={store.id} value={store.id}>
                        {store.storeName || store.entityName || store.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-700">
                Start Assessment
              </Button>
            </>
          )}

          {started && !submitResult && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Progress
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={isSaving} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
                <Button variant="destructive" onClick={handleDiscard} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>

              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <div key={question.id} className="rounded-lg border bg-white p-4">
                    <div className="mb-3 flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{question.questionText}</p>
                        {question.instructionText && (
                          <p className="mt-1 text-sm text-muted-foreground">{question.instructionText}</p>
                        )}
                      </div>
                    </div>
                    <AssessmentFillQuestion
                      question={question}
                      value={responses[question.id]}
                      onChange={(value) =>
                        setResponses((prev) => ({ ...prev, [question.id]: value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {submitResult && showResult && (
            <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {submitResult.result.passed ? "Congratulations — You passed!" : "Assessment not passed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {submitResult.result.percentage}% · Required: {submitResult.assessment.passingScore}%
                  </p>
                </div>
                <Badge variant={submitResult.result.passed ? "default" : "destructive"}>
                  {submitResult.result.passed ? "Passed" : "Failed"}
                </Badge>
              </div>

              {submitResult.result.passed && submitResult.assessment.generateCertificate && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    downloadAssessmentCertificate({
                      userName,
                      assessmentTitle: submitResult.assessment.title,
                      percentage: submitResult.result.percentage,
                      completedAt: new Date(submitResult.result.completedAt || Date.now()),
                      settings: submitResult.assessment.certificateSettings as AssessmentCertificateSettings,
                    })
                  }
                >
                  <Award className="h-4 w-4" />
                  Download Certificate
                </Button>
              )}

              {showCorrectAnswer && (
                <div className="space-y-3">
                  {questions.map((question: any, index: number) => {
                    const result = questionResultsMap.get(question.id);
                    return (
                      <div key={question.id} className="rounded-md border bg-white p-3">
                        <p className="mb-2 text-sm font-medium">
                          {index + 1}. {question.questionText}
                        </p>
                        <AssessmentFillQuestion
                          question={question}
                          value={responses[question.id]}
                          onChange={() => undefined}
                          showCorrectAnswer
                          correctAnswer={result?.correctAnswer}
                          disabled
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/learning")}>
                  Back to Learning
                </Button>
                {(assessment.allowRetake ||
                  (!submitResult.result.passed &&
                    countCompletedAttempts(userResults, assessmentId) <
                      (assessment.maxAttempts ?? 1))) && (
                  <Button onClick={handleRetake}>Try Again</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
