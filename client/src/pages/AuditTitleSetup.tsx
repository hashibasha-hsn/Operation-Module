import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AuditHeader from "@/components/AuditHeader";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  loadAuditDraft,
  saveAuditDraftLocal,
  type AuditDraftState,
} from "@/lib/auditDraft";
import { fetchAuditTags, saveAuditDraft } from "@/lib/auditApi";

export default function AuditTitleSetup() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("title");
  const [draft, setDraft] = useState<AuditDraftState>(() => loadAuditDraft());
  const [processTags, setProcessTags] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAuditTags().then(setProcessTags).catch(() => setProcessTags([]));
  }, []);

  useEffect(() => {
    saveAuditDraftLocal(draft);
  }, [draft]);

  const toggleTag = (tagName: string) => {
    setDraft((prev) => ({
      ...prev,
      processTags: prev.processTags.includes(tagName)
        ? prev.processTags.filter((tag) => tag !== tagName)
        : [...prev.processTags, tagName],
    }));
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error(t("auditTitleRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAuditDraft(draft);
      setDraft(saved);
      toast.success(t("auditSavedAsDraft"));
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAudit"));
    } finally {
      setIsSaving(false);
    }
  };

  const goToBuild = async () => {
    if (!draft.title.trim()) {
      toast.error(t("auditTitleRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAuditDraft(draft);
      setDraft(saved);
      navigate("/audit-create-form");
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAudit"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workflow-page text-sm text-slate-700">
      <AuditHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={() => toast.message(t("publishAfterBuildPropertiesAndAssign"))}
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t("auditTitle")}</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={t("auditTitlePlaceholder")}
            className="workflow-input text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t("description")}</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("auditDescriptionPlaceholder")}
            rows={4}
            className="workflow-input"
          />
        </div>

        <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">{t("assignAuditTags")}</h3>
          {processTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAuditTagsYet")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {processTags.map((tag: any) => {
                const tagName = tag.tagName || tag.tag;
                const selected = draft.processTags.includes(tagName);
                return (
                  <button
                    key={tag.id || tagName}
                    type="button"
                    onClick={() => toggleTag(tagName)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      selected ? "workflow-tag-selected" : "workflow-tag-default"
                    }`}
                  >
                    {tagName}
                  </button>
                );
              })}
            </div>
          )}
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
