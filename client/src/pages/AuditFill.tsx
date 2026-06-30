import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  discardAuditSubmissionDraft,
  fetchAuditById,
  fetchEntitiesForUser,
  fetchUserAuditSubmissions,
  getCurrentUserId,
  saveAuditSubmissionDraft,
  startAuditSubmission,
  submitAuditSubmission,
} from "@/lib/auditSubmission";
import { ArrowLeft, Save, Send, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuditFill() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/tasks/audit/:id");
  const auditId = params?.id ?? "";

  const [audit, setAudit] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [submission, setSubmission] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [started, setStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userId = getCurrentUserId();
  const allowDateRange = audit?.properties?.dateRangeSelection === "allowed";

  const questions = useMemo(
    () =>
      (audit?.sections ?? []).flatMap((section: any) =>
        (section.questions ?? []).map((question: any) => ({
          ...question,
          sectionTitle: section.title,
        })),
      ),
    [audit],
  );

  useEffect(() => {
    if (!auditId || !userId) return;
    Promise.all([fetchAuditById(auditId), fetchEntitiesForUser(), fetchUserAuditSubmissions(userId)])
      .then(([auditData, entityData, userSubmissions]) => {
        setAudit(auditData);
        const assignedStores = entityData.filter((entity: any) =>
          auditData.storeIds?.length ? auditData.storeIds.includes(entity.id) : true,
        );
        const storeList = assignedStores.length ? assignedStores : entityData;
        setStores(storeList);

        const existingDraft = userSubmissions.find(
          (item: any) =>
            item.workflowId === auditId && (item.status === "draft" || item.status === "correction"),
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
      })
      .catch(() => toast.error(t('failedToLoadAudit')));
  }, [auditId, userId]);

  const handleStart = async () => {
    if (!storeId) {
      toast.error(t('selectStoreLocationFirst'));
      return;
    }
    try {
      const draft = await startAuditSubmission({
        auditId,
        userId,
        storeId,
        submissionDate: useCustomDate ? submissionDate : undefined,
      });
      setSubmission(draft);
      setResponses(draft.answers?.responses ?? {});
      setStarted(true);
    } catch (error: any) {
      toast.error(error.message || t('couldNotStartAudit'));
    }
  };

  const handleSave = async () => {
    if (!submission?.id) return;
    setIsSaving(true);
    try {
      const saved = await saveAuditSubmissionDraft(
        submission.id,
        userId,
        responses,
        useCustomDate ? submissionDate : undefined,
      );
      setSubmission(saved);
      toast.success(t('draftSavedContinueFromTasks'));
    } catch (error: any) {
      toast.error(error.message || t('failedToSaveDraft'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission?.id) return;
    setIsSaving(true);
    try {
      await submitAuditSubmission(
        submission.id,
        userId,
        responses,
        useCustomDate ? submissionDate : undefined,
      );
      const reviewEnabled = audit?.properties?.processWithReview || audit?.requiresApproval;
      toast.success(
        reviewEnabled
          ? "Submitted — sent to Level 1 reviewer for approval"
          : t("auditSubmittedSuccessfully"),
      );
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || t('failedToSubmitAudit'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!submission?.id || !confirm(t('confirmDiscardDraftAndStartFresh'))) return;
    try {
      await discardAuditSubmissionDraft(submission.id, userId);
      setSubmission(null);
      setResponses({});
      setStarted(false);
      toast.success(t('draftDiscarded'));
    } catch (error: any) {
      toast.error(error.message || t('failedToDiscardDraft'));
    }
  };

  const renderQuestionInput = (question: any) => {
    const value = responses[question.id] ?? "";
    const setValue = (next: string) =>
      setResponses((prev) => ({ ...prev, [question.id]: next }));

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
          <option value="">{t('selectAnOption')}</option>
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

  if (!audit) {
    return <div className="p-6 text-muted-foreground">{t('loadingAudit')}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/tasks")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t('backToTasks')}
      </Button>

      <Card className="border-sky-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{audit.title}</CardTitle>
              {audit.description && (
                <p className="text-sm text-muted-foreground mt-1">{audit.description}</p>
              )}
            </div>
            {audit.passThreshold != null && (
              <Badge variant="outline">{t('passThreshold').replace('{{percent}}', String(audit.passThreshold))}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!started && (
            <>
              <div className="space-y-2">
                <Label>{t('chooseStoreLocation')}</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <option value="">{t('selectStore')}</option>
                  {stores.map((store: any) => (
                    <option key={store.id} value={store.id}>
                      {store.storeName || store.entityName || store.name}
                    </option>
                  ))}
                </select>
              </div>

              {allowDateRange && (
                <div className="space-y-2 rounded-md border p-3 bg-sky-50/50">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={useCustomDate}
                      onCheckedChange={(checked) => setUseCustomDate(Boolean(checked))}
                    />
                    {t('submitForFutureOrPastDates')}
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

              <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-700">
                {t('start')}
              </Button>
            </>
          )}

          {started && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveDraft')}
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="bg-sky-600 hover:bg-sky-700">
                  <Send className="h-4 w-4 mr-2" />
                  {t('submit')}
                </Button>
                <Button variant="destructive" onClick={handleDiscard} disabled={isSaving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('discardDraft')}
                </Button>
              </div>

              <div className="space-y-4">
                {questions.map((question: any, index: number) => (
                  <div key={question.id} className="rounded-lg border p-4 space-y-2">
                    <Label className="flex items-center gap-2 flex-wrap">
                      <span>
                        {index + 1}. {question.questionText}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      {question.isCritical && (
                        <Badge variant="destructive" className="text-xs">
                          {t('critical')}
                        </Badge>
                      )}
                    </Label>
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
