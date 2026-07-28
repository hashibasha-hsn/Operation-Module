import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AssessmentHeader from "@/components/AssessmentHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveAssessmentDraft } from "@/lib/assessmentApi";
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

  const updateSettings = (patch: Partial<AssessmentCertificateSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

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

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Certificate Configuration</h2>

          <div className="space-y-2">
            <Label>Primary Color</Label>
            <Input
              type="color"
              value={settings.primaryColor ?? "#0284c7"}
              onChange={(e) => updateSettings({ primaryColor: e.target.value })}
            />
          </div>

          <ToggleField
            label="Certificate Header"
            enabled={settings.certificateHeader?.enabled ?? true}
            onToggle={(enabled) =>
              updateSettings({
                certificateHeader: { ...(settings.certificateHeader ?? { text: "" }), enabled },
              })
            }
            value={settings.certificateHeader?.text ?? ""}
            onValueChange={(text) =>
              updateSettings({
                certificateHeader: { enabled: settings.certificateHeader?.enabled ?? true, text },
              })
            }
            placeholder="Certificate of Achievement"
          />

          <ToggleField
            label="Assessment Name"
            enabled={settings.assessmentName?.enabled ?? true}
            onToggle={(enabled) =>
              updateSettings({
                assessmentName: { ...(settings.assessmentName ?? { text: draft.title }), enabled },
              })
            }
            value={settings.assessmentName?.text ?? draft.title}
            onValueChange={(text) =>
              updateSettings({
                assessmentName: { enabled: settings.assessmentName?.enabled ?? true, text },
              })
            }
            placeholder={draft.title || "Food Safety Basics"}
          />

          <ToggleField
            label="Trainer Name"
            enabled={settings.trainerName?.enabled ?? false}
            onToggle={(enabled) =>
              updateSettings({
                trainerName: { ...(settings.trainerName ?? { text: "" }), enabled },
              })
            }
            value={settings.trainerName?.text ?? ""}
            onValueChange={(text) =>
              updateSettings({
                trainerName: { enabled: settings.trainerName?.enabled ?? false, text },
              })
            }
            placeholder="John Smith"
          />

          <div className="flex items-center justify-between">
            <Label>Issued Date</Label>
            <Switch
              checked={settings.issuedDate?.enabled ?? true}
              onCheckedChange={(enabled) => updateSettings({ issuedDate: { enabled } })}
            />
          </div>

          <div className="space-y-2">
            <Label>Validity</Label>
            <Select
              value={settings.validityType ?? "duration"}
              onValueChange={(value: "duration" | "fixed" | "none") =>
                updateSettings({ validityType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duration">Duration from issue date</SelectItem>
                <SelectItem value="fixed">Fixed expiry date</SelectItem>
                <SelectItem value="none">No expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.validityType === "duration" && (
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={settings.validityDuration ?? "1 year"}
                onValueChange={(value) => updateSettings({ validityDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="6 months">6 months</SelectItem>
                  <SelectItem value="1 year">1 year</SelectItem>
                  <SelectItem value="3 years">3 years</SelectItem>
                  <SelectItem value="5 years">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {settings.validityType === "fixed" && (
            <div className="space-y-2">
              <Label>Fixed Expiry Date</Label>
              <Input
                type="date"
                value={settings.fixedExpiryDate ?? ""}
                onChange={(e) => updateSettings({ fixedExpiryDate: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 font-semibold">Preview</h3>
          <div
            className="mx-auto flex min-h-[420px] max-w-sm flex-col items-center justify-center rounded-lg border-2 p-6 text-center"
            style={{ borderColor: settings.primaryColor ?? "#0284c7" }}
          >
            {settings.certificateHeader?.enabled !== false && (
              <p className="text-lg font-bold" style={{ color: settings.primaryColor ?? "#0284c7" }}>
                {settings.certificateHeader?.text || "Certificate of Achievement"}
              </p>
            )}
            {settings.assessmentName?.enabled !== false && (
              <p className="mt-4 text-base font-medium">
                {settings.assessmentName?.text || draft.title || "Assessment Name"}
              </p>
            )}
            {settings.trainerName?.enabled && settings.trainerName?.text && (
              <p className="mt-2 text-sm text-muted-foreground">Trainer: {settings.trainerName.text}</p>
            )}
            {settings.issuedDate?.enabled !== false && (
              <p className="mt-6 text-xs text-muted-foreground">
                Issued: {new Date().toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  enabled,
  onToggle,
  value,
  onValueChange,
  placeholder,
}: {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <Input value={value} onChange={(e) => onValueChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}
