import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ProcessHeader from "@/components/ProcessHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  emptyProcessDraft,
  loadProcessDraft,
  saveProcessDraftLocal,
  type ProcessDraftState,
} from "@/lib/processDraft";
import { fetchProcessTags } from "@/lib/processApi";

export default function TitleSetup() {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("title");
  const [draft, setDraft] = useState<ProcessDraftState>(emptyProcessDraft);
  const [processTags, setProcessTags] = useState<any[]>([]);

  useEffect(() => {
    setDraft(loadProcessDraft());
  }, [location]);

  useEffect(() => {
    fetchProcessTags().then(setProcessTags).catch(() => setProcessTags([]));
  }, []);

  const toggleTag = (tagName: string) => {
    setDraft((prev) => ({
      ...prev,
      processTags: prev.processTags.includes(tagName)
        ? prev.processTags.filter((tag) => tag !== tagName)
        : [...prev.processTags, tagName],
    }));
  };

  const handlePublish = () => {
    toast.message(t('publishAfterConfigDesc'));
  };

  const goToBuild = () => {
    saveProcessDraftLocal(draft);
    navigate("/create-form");
  };

  return (
    <div className="workflow-page text-sm text-slate-700">
      <ProcessHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPublish={handlePublish}
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('processTitle')}</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={t('processTitlePlaceholder')}
            className="workflow-input text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('description')}</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder={t('describeProcessPlaceholder')}
            rows={4}
            className="workflow-input"
          />
        </div>

        <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">{t('assignProcessTags')}</h3>
          {processTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('noProcessTagsYet')}
            </p>
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

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-muted-foreground">
              {draft.id ? t('draftSaved') : t('notSavedYet')}
            </p>
            <button type="button" onClick={goToBuild} className="workflow-btn-primary">
              {t('continueToBuild')}
            </button>
          </div>
      </div>
    </div>
  );
}
