import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AssessmentHeader from "@/components/AssessmentHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveAssessmentDraft } from "@/lib/assessmentApi";
import CourseCertificateDesigner from "@/pages/CourseCertificateDesigner";
import {
  loadAssessmentDraft,
  saveAssessmentDraftLocal,
  type AssessmentCertificateSettings,
  type AssessmentDraftState,
} from "@/lib/assessmentDraft";

export default function AssessmentCertificateSettings() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("certificate");
  const [draft, setDraft] = useState<AssessmentDraftState>(() => loadAssessmentDraft());
  const [settings, setSettings] = useState<AssessmentCertificateSettings>(
    () => loadAssessmentDraft().certificateSettings ?? {},
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!draft.generateCertificate) {
      navigate("/assessment-settings");
    }
  }, [draft.generateCertificate, navigate]);

  useEffect(() => {
    const next = { ...draft, certificateSettings: settings };
    setDraft(next);
    saveAssessmentDraftLocal(next);
  }, [settings]);

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error("Set assessment title in Properties first");
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAssessmentDraft({ ...draft, certificateSettings: settings });
      setDraft(saved);
      setSettings(saved.certificateSettings ?? settings);
      toast.success("Certificate settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save certificate settings");
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
        onPublish={() => toast.message("Publish from the Publish tab after assignment")}
      />

      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <CourseCertificateDesigner
          settings={settings}
          onChange={setSettings}
          courseTitle={draft.title}
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Certificate Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
