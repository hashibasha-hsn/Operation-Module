import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AuditHeader from "@/components/AuditHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import ProcessPropertiesPanel, { PROPERTY_SECTIONS } from "@/components/process/ProcessPropertiesPanel";
import { assignAudit, publishAudit, saveAuditDraft } from "@/lib/auditApi";
import {
  loadAuditDraft,
  saveAuditDraftLocal,
  type AuditDraftState,
} from "@/lib/auditDraft";
import {
  defaultProcessProperties,
  getSectionStatus,
  mergeProcessProperties,
  type ProcessProperties,
} from "@/lib/processProperties";
import { isReviewConfigComplete } from "@/lib/reviewConfig";
import { toast } from "sonner";
import { AlertCircle, Check } from "lucide-react";

export default function AuditSettings() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("properties");
  const [selectedSection, setSelectedSection] = useState("process");
  const [auditDraft, setAuditDraft] = useState<AuditDraftState | null>(null);
  const [properties, setProperties] = useState<ProcessProperties>(defaultProcessProperties());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draft = loadAuditDraft();
    setAuditDraft(draft);
    setProperties(mergeProcessProperties(draft.properties));
  }, []);

  const sectionStatus = useMemo(() => getSectionStatus(properties), [properties]);

  const handleSave = async () => {
    if (!auditDraft?.title?.trim()) {
      toast.error("Add an audit title on the Title tab first");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveAuditDraft({
        ...auditDraft,
        properties,
      });
      setAuditDraft(saved);
      setProperties(mergeProcessProperties(saved.properties));
      toast.success(t('processPropertiesSaved'));
    } catch (error: any) {
      toast.error(error.message || t('failedToSaveProcessProperties'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!auditDraft?.id) {
      toast.error(t('saveDraftFirst'));
      return;
    }
    const assigneeIds = auditDraft.assigneeIds ?? [];
    const storeIds = auditDraft.storeIds ?? [];
    if (assigneeIds.length === 0 && storeIds.length === 0) {
      toast.error(t('assignBeforePublishing'));
      return;
    }
    if (properties.processWithReview && !isReviewConfigComplete(properties.reviewConfig)) {
      toast.error(t('assignReviewerBeforePublishing'));
      return;
    }
    try {
      await assignAudit(auditDraft.id, { assigneeIds, storeIds });
      await publishAudit(auditDraft.id);
      toast.success(t('processPublished'));
      navigate("/process");
    } catch (error: any) {
      toast.error(error.message || t('failedToPublishProcess'));
    }
  };

  const persistLocal = (next: ProcessProperties) => {
    setProperties(next);
    if (auditDraft) {
      const updated = { ...auditDraft, properties: next };
      setAuditDraft(updated);
      saveAuditDraftLocal(updated);
    }
  };

  return (
    <div className="workflow-page">
      <AuditHeader
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
                <span>{t(section.key)}</span>
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
          {!auditDraft?.title?.trim() && (
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