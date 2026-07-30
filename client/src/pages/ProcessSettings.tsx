import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import ProcessHeader from "@/components/ProcessHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import ProcessPropertiesPanel, { PROPERTY_SECTIONS } from "@/components/process/ProcessPropertiesPanel";
import { assignProcess, publishProcess, saveProcessDraft } from "@/lib/processApi";
import {
  loadProcessDraft,
  saveProcessDraftLocal,
  type ProcessDraftState,
} from "@/lib/processDraft";
import {
  defaultProcessProperties,
  getSectionStatus,
  mergeProcessProperties,
  type ProcessProperties,
} from "@/lib/processProperties";
import { isReviewConfigComplete } from "@/lib/reviewConfig";
import { toast } from "sonner";
import { AlertCircle, Check } from "lucide-react";

export default function ProcessSettings() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("properties");
  const [selectedSection, setSelectedSection] = useState("process");
  const [processDraft, setProcessDraft] = useState<ProcessDraftState | null>(null);
  const [properties, setProperties] = useState<ProcessProperties>(defaultProcessProperties());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draft = loadProcessDraft();
    setProcessDraft(draft);
    setProperties(mergeProcessProperties(draft.properties));
  }, []);

  const sectionStatus = useMemo(() => getSectionStatus(properties), [properties]);

  const handleSave = async () => {
    if (!processDraft?.title?.trim()) {
      toast.error("Add a process title on the Title tab first");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveProcessDraft({
        ...processDraft,
        properties,
      });
      setProcessDraft(saved);
      setProperties(mergeProcessProperties(saved.properties));
      toast.success(t('processPropertiesSaved'));
    } catch (error: any) {
      toast.error(error.message || t('failedToSaveProcessProperties'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!processDraft?.id) {
      toast.error(t('saveDraftFirst'));
      return;
    }
    const assigneeIds = processDraft.assigneeIds ?? [];
    const storeIds = processDraft.storeIds ?? [];
    if (assigneeIds.length === 0 && storeIds.length === 0) {
      toast.error(t('assignBeforePublishing'));
      return;
    }
    if (properties.processWithReview && !isReviewConfigComplete(properties.reviewConfig)) {
      toast.error(t('assignReviewerBeforePublishing'));
      return;
    }
    try {
      await assignProcess(processDraft.id, { assigneeIds, storeIds });
      await publishProcess(processDraft.id);
      toast.success(t('processPublished'));
      navigate("/process");
    } catch (error: any) {
      toast.error(error.message || t('failedToPublishProcess'));
    }
  };

  const persistLocal = (next: ProcessProperties) => {
    setProperties(next);
    if (processDraft) {
      const updated = { ...processDraft, properties: next };
      setProcessDraft(updated);
      saveProcessDraftLocal(updated);
    }
  };

  return (
    <div className="workflow-page">
      <ProcessHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="flex h-[calc(100vh-48px)]">
        <div className="w-64 border-r bg-white p-4 shrink-0">
          <h3 className="font-semibold mb-4">{t('settings')}</h3>
          <div className="space-y-1">
            {PROPERTY_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-sm ${
                  selectedSection === section.id
                    ? "bg-muted text-foreground"
                    : "hover:bg-gray-100"
                }`}
              >
                <span>{section.label}</span>
                {sectionStatus[section.id as keyof typeof sectionStatus] === "completed" ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-sky-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
          {!processDraft?.title?.trim() && (
            <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {t('setTitleBeforeSavingProperties')}
            </div>
          )}
          <ProcessPropertiesPanel
            properties={properties}
            onChange={persistLocal}
            selectedSection={selectedSection}
          />
          {isSaving && (
            <p className="mt-6 text-sm text-muted-foreground">{t('saving')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
