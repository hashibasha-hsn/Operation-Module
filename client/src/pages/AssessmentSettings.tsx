import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AssessmentHeader from "@/components/AssessmentHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ensureAssessmentDraftSaved,
  publishAssessment,
  saveAssessmentDraft,
} from "@/lib/assessmentApi";
import {
  loadAssessmentDraft,
  saveAssessmentDraftLocal,
  type AssessmentDraftState,
} from "@/lib/assessmentDraft";

export default function AssessmentSettings() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("properties");
  const [draft, setDraft] = useState<AssessmentDraftState>(() => loadAssessmentDraft());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    saveAssessmentDraftLocal(draft);
  }, [draft]);

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error(t("assessmentTitleRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAssessmentDraft(draft);
      setDraft(saved);
      toast.success(t("assessmentPropertiesSaved"));
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAssessment"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const synced = await ensureAssessmentDraftSaved(draft);
      const hasAssignment =
        (synced.assigneeIds?.length ?? 0) > 0 ||
        (synced.storeIds?.length ?? 0) > 0 ||
        (synced.assigneeProfileIds?.length ?? 0) > 0 ||
        (synced.designationNames?.length ?? 0) > 0;
      if (!hasAssignment) {
        toast.error(t("assignStoresOrProfilesFirst"));
        navigate("/assessment-creation");
        return;
      }
      await publishAssessment(synced.id!);
      toast.success(t("assessmentPublished"));
      navigate("/assessments");
    } catch (error: any) {
      toast.error(error.message || t("failedToPublishAssessment"));
    }
  };

  const switches = [
    { key: "visible", label: t("visible"), desc: t("visibleDesc") },
    { key: "showResult", label: t("showResult"), desc: t("showResultDesc") },
    { key: "showCorrectAnswer", label: t("showCorrectAnswer"), desc: t("showCorrectAnswerDesc") },
    { key: "dynamicAssignment", label: t("dynamicAssignment"), desc: t("dynamicAssignmentDesc") },
    { key: "generateCertificate", label: t("generateCertificate"), desc: t("generateCertificateDesc") },
    { key: "allowRetake", label: t("allowRetake"), desc: t("allowRetakeDesc") },
  ];

  return (
    <div className="workflow-page text-sm text-slate-700">
      <AssessmentHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("assessmentProperties")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("assessmentPropertiesDesc")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentTitle">{t("titleRequired")}</Label>
          <Input
            id="assessmentTitle"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={t("assessmentTitlePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentDescription">{t("description")}</Label>
          <Textarea
            id="assessmentDescription"
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("assessmentDescPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="passingScore">{t("minimumPassingPercentage")}</Label>
            <Input
              id="passingScore"
              type="number"
              min={0}
              max={100}
              value={draft.passingScore ?? 30}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, passingScore: Number(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">{t("maxAttempts")}</Label>
            <Input
              id="maxAttempts"
              type="number"
              min={1}
              value={draft.maxAttempts ?? 1}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, maxAttempts: Number(e.target.value) || 1 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">{t("startDate")}</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={draft.startDate ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t("endDate")}</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={draft.expiresAt ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, expiresAt: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">{t("durationMinutes")}</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={draft.duration ?? 60}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, duration: Number(e.target.value) || 60 }))
              }
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-white p-4">
          {switches.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={Boolean(draft[item.key as keyof AssessmentDraftState])}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <ButtonLike outline onClick={() => navigate("/assessment-create-form")}>
            {t("backToBuilder")}
          </ButtonLike>
          <ButtonLike onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("saving") : t("saveProperties")}
          </ButtonLike>
          {draft.generateCertificate && (
            <ButtonLike outline onClick={() => navigate("/assessment-certificate-settings")}>
              {t("certificateSettings")}
            </ButtonLike>
          )}
        </div>
      </div>
    </div>
  );
}

function ButtonLike({
  children,
  onClick,
  outline,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  outline?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-medium ${
        outline
          ? "border border-slate-300 bg-white text-slate-700"
          : "bg-sky-600 text-white"
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
