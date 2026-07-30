import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AssessmentHeader from "@/components/AssessmentHeader";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  loadAssessmentDraft,
  saveAssessmentDraftLocal,
  type AssessmentDraftState,
} from "@/lib/assessmentDraft";
import { saveAssessmentDraft } from "@/lib/assessmentApi";

export default function AssessmentTitleSetup() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("title");
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
      toast.success(t("assessmentSavedAsDraft"));
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAssessment"));
    } finally {
      setIsSaving(false);
    }
  };

  const goToBuild = async () => {
    if (!draft.title.trim()) {
      toast.error(t("assessmentTitleRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAssessmentDraft(draft);
      setDraft(saved);
      navigate("/assessment-create-form");
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAssessment"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workflow-page text-sm text-slate-700">
      <AssessmentHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={() => toast.message(t("publishAfterBuildPropertiesAndAssign"))}
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t("assessmentTitle")}</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={t("assessmentTitlePlaceholder")}
            className="workflow-input text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t("description")}</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("assessmentDescPlaceholder")}
            rows={4}
            className="workflow-input"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" disabled={isSaving} onClick={handleSave} className="workflow-btn-outline">
            {t("saveDraft")}
          </button>
          <button type="button" disabled={isSaving} onClick={goToBuild} className="workflow-btn-primary">
            {t("continueToBuild")}
          </button>
        </div>
      </div>
    </div>
  );
}
