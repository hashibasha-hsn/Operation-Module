import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ProcessHeader from "@/components/ProcessHeader";
import { toast } from "sonner";
import {
  emptyProcessDraft,
  loadProcessDraft,
  saveProcessDraftLocal,
  type ProcessDraftState,
} from "@/lib/processDraft";
import { fetchProcessTags, saveProcessDraft } from "@/lib/processApi";

export default function TitleSetup() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("title");
  const [draft, setDraft] = useState<ProcessDraftState>(emptyProcessDraft);
  const [processTags, setProcessTags] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error("Process title is required");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveProcessDraft(draft);
      setDraft(saved);
      toast.success("Process saved as draft");
    } catch (error: any) {
      toast.error(error.message || "Failed to save process");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    toast.message("Publish is available after build, properties, and assign are configured");
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
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Process title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g., Daily Opening Checklist"
            className="workflow-input text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Describe what this process is for"
            rows={4}
            className="workflow-input"
          />
        </div>

        <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Assign Process Tags</h3>
          {processTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No process tags yet. Create them in Manage Tags → Process Tag.
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
            {draft.id ? `Draft ID: ${draft.id}` : "Not saved yet"}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={isSaving} className="workflow-btn-outline">
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button type="button" onClick={goToBuild} className="workflow-btn-primary">
              Continue to Build
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
