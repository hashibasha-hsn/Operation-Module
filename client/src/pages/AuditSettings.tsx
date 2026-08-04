import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AuditHeader from "@/components/AuditHeader";
import AuditPropertiesPanel from "@/components/audit/AuditPropertiesPanel";
import { PROPERTY_SECTIONS } from "@/components/process/ProcessPropertiesPanel";
import { assignAudit, ensureAuditDraftSaved, publishAudit, saveAuditDraft } from "@/lib/auditApi";
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
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("properties");
  const [selectedSection, setSelectedSection] = useState("process");
  const [auditDraft, setAuditDraft] = useState<AuditDraftState | null>(null);
  const [properties, setProperties] = useState<ProcessProperties>(defaultProcessProperties());
  const [passThreshold, setPassThreshold] = useState(70);
  const [reviewLevels, setReviewLevels] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);

  useEffect(() => {
    const draft = loadAuditDraft();
    setAuditDraft(draft);
    setProperties(mergeProcessProperties({ ...draft.properties, processWithReview: draft.properties?.processWithReview ?? true }));
    setPassThreshold(draft.passThreshold ?? 70);
    setReviewLevels(draft.reviewLevels ?? 1);

    if (draft.title?.trim()) {
      setIsDraftSyncing(true);
      ensureAuditDraftSaved(draft)
        .then((saved) => {
          setAuditDraft(saved);
          setProperties(mergeProcessProperties(saved.properties));
          setPassThreshold(saved.passThreshold ?? 70);
          setReviewLevels(saved.reviewLevels ?? 1);
        })
        .catch((error: any) => {
          toast.error(error.message || "Could not sync audit draft");
        })
        .finally(() => setIsDraftSyncing(false));
    }
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
        passThreshold,
        reviewLevels,
      });
      setAuditDraft(saved);
      toast.success("Audit properties saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit properties");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!auditDraft?.title?.trim()) {
      toast.error("Add an audit title on the Title tab first");
      return;
    }
    const assigneeIds = auditDraft.assigneeIds ?? [];
    const storeIds = auditDraft.storeIds ?? [];
    if (assigneeIds.length === 0 && storeIds.length === 0) {
      toast.error("Assign users or stores on the Assign tab before publishing");
      return;
    }
    if (properties.processWithReview && !isReviewConfigComplete(properties.reviewConfig)) {
      toast.error("Assign a unique reviewer for each review level before publishing");
      return;
    }
    try {
      const synced = await ensureAuditDraftSaved({
        ...auditDraft,
        properties,
        passThreshold,
        reviewLevels,
      });
      await assignAudit(synced.id!, { assigneeIds, storeIds });
      await publishAudit(synced.id!);
      toast.success("Audit published");
      navigate("/process");
    } catch (error: any) {
      toast.error(error.message || "Failed to publish audit");
    }
  };

  const persistLocal = (next: ProcessProperties) => {
    setProperties(next);
    if (auditDraft) {
      const updated = { ...auditDraft, properties: next, passThreshold, reviewLevels };
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
          <h3 className="font-semibold mb-4">Settings</h3>
          <div className="space-y-1">
            {PROPERTY_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-sm ${
                  selectedSection === section.id
                    ? "bg-sky-50 text-sky-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <span>{section.label}</span>
                {sectionStatus[section.id as keyof typeof sectionStatus] === "completed" ? (
                  <Check className="w-4 h-4 text-sky-500" />
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
              Set an audit title on the Title tab before saving properties.
            </div>
          )}
          {isDraftSyncing && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Syncing audit draft...
            </div>
          )}
          <AuditPropertiesPanel
            properties={properties}
            onChange={persistLocal}
            selectedSection={selectedSection}
            passThreshold={passThreshold}
            reviewLevels={reviewLevels}
            onPassThresholdChange={(value) => {
              setPassThreshold(value);
              if (auditDraft) saveAuditDraftLocal({ ...auditDraft, passThreshold: value, reviewLevels });
            }}
            onReviewLevelsChange={(value) => {
              setReviewLevels(value);
              if (auditDraft) saveAuditDraftLocal({ ...auditDraft, passThreshold, reviewLevels: value });
            }}
          />
          {isSaving && <p className="mt-6 text-sm text-muted-foreground">Saving...</p>}
        </div>
      </div>
    </div>
  );
}
