import { useRef, useState } from "react";
import { Upload, X, Award, Image as ImageIcon, Palette, Type, Signature as SignatureIcon, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { uploadCourseFile } from "@/lib/courseApi";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AssessmentCertificateSettings } from "@/lib/assessmentDraft";

type CertificateSettings = AssessmentCertificateSettings;

export default function CourseCertificateDesigner({
  settings,
  onChange,
  courseTitle,
}: {
  settings: CertificateSettings;
  onChange: (next: CertificateSettings) => void;
  courseTitle: string;
}) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<"layout" | "content" | "signature">("layout");

  const s = {
    primaryColor: settings.primaryColor ?? "#0284c7",
    secondaryColor: settings.secondaryColor ?? "#0f766e",
    backgroundColor: settings.backgroundColor ?? "#ffffff",
    logoUrl: settings.logoUrl ?? "",
    showLogo: settings.showLogo ?? false,
    borderStyle: settings.borderStyle ?? "classic",
    certificateHeader: { enabled: true, text: "Certificate of Achievement", ...(settings.certificateHeader ?? {}) },
    recipientLabel: { enabled: true, text: "This is to certify that", ...(settings.recipientLabel ?? {}) },
    bodyText: { enabled: true, text: "has successfully completed", ...(settings.bodyText ?? {}) },
    assessmentName: { enabled: true, text: "", ...(settings.assessmentName ?? {}) },
    trainerName: { enabled: false, text: "", ...(settings.trainerName ?? {}) },
    signature: { enabled: false, name: "", title: "Course Instructor", ...(settings.signature ?? {}) },
    score: { enabled: true, ...(settings.score ?? {}) },
    issuedDate: { enabled: true, ...(settings.issuedDate ?? {}) },
    validityType: settings.validityType ?? "duration",
    validityDuration: settings.validityDuration ?? "1 year",
    fixedExpiryDate: settings.fixedExpiryDate ?? "",
  };

  function patch(p: Partial<CertificateSettings>) {
    onChange({ ...settings, ...p });
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadCourseFile(file);
      if (url) {
        patch({ logoUrl: url, showLogo: true });
        toastSuccess(t("logoUploadedSuccessfully"));
      } else {
        toastError(t("failedToUploadLogo"));
      }
    } catch {
      toastError(t("failedToUploadLogo"));
    } finally {
      setUploadingLogo(false);
    }
  }

  function toastSuccess(msg: string) {
    import("sonner").then(({ toast }) => toast.success(msg));
  }
  function toastError(msg: string) {
    import("sonner").then(({ toast }) => toast.error(msg));
  }

  const tabs = [
    { id: "layout" as const, label: t("certificateDesign"), icon: LayoutGrid },
    { id: "content" as const, label: t("certificateContent"), icon: Type },
    { id: "signature" as const, label: t("signature"), icon: SignatureIcon },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          {activeTab === "layout" && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> {t("logo")}
                </Label>
                <div className="flex items-center gap-3">
                  {s.logoUrl ? (
                    <div className="relative">
                      <img src={s.logoUrl} alt="logo" className="h-14 w-14 object-contain rounded-lg border bg-white p-1" />
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white p-0.5"
                        onClick={() => patch({ logoUrl: "", showLogo: false })}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.showLogo}
                        onCheckedChange={(checked) => patch({ showLogo: checked })}
                      />
                      <Label className="text-sm font-normal">{t("showLogo")}</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploadingLogo}>
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? t("uploading") : t("uploadLogo")}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("borderStyle")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["classic", "modern", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => patch({ borderStyle: style })}
                      className={`p-2 rounded-md border text-sm capitalize ${
                        s.borderStyle === style ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                      }`}
                    >
                      {t(`borderStyle${style[0].toUpperCase() + style.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> {t("colors")}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <ColorField label={t("primaryColor")} value={s.primaryColor} onChange={(v) => patch({ primaryColor: v })} />
                  <ColorField label={t("secondaryColor")} value={s.secondaryColor} onChange={(v) => patch({ secondaryColor: v })} />
                </div>
                <ColorField label={t("backgroundColor")} value={s.backgroundColor} onChange={(v) => patch({ backgroundColor: v })} />
              </div>
            </>
          )}

          {activeTab === "content" && (
            <div className="space-y-3">
              <TextToggleField
                label={t("certificateHeader")}
                enabled={s.certificateHeader.enabled}
                onToggle={(enabled) => patch({ certificateHeader: { ...s.certificateHeader, enabled } })}
                value={s.certificateHeader.text}
                onValueChange={(text) => patch({ certificateHeader: { ...s.certificateHeader, text } })}
                placeholder="Certificate of Achievement"
              />
              <TextToggleField
                label={t("recipientLabel")}
                enabled={s.recipientLabel.enabled}
                onToggle={(enabled) => patch({ recipientLabel: { ...s.recipientLabel, enabled } })}
                value={s.recipientLabel.text}
                onValueChange={(text) => patch({ recipientLabel: { ...s.recipientLabel, text } })}
                placeholder="This is to certify that"
              />
              <TextToggleField
                label={t("bodyText")}
                enabled={s.bodyText.enabled}
                onToggle={(enabled) => patch({ bodyText: { ...s.bodyText, enabled } })}
                value={s.bodyText.text}
                onValueChange={(text) => patch({ bodyText: { ...s.bodyText, text } })}
                placeholder="has successfully completed"
              />
              <TextToggleField
                label={t("assessmentName")}
                enabled={s.assessmentName.enabled}
                onToggle={(enabled) => patch({ assessmentName: { ...s.assessmentName, enabled } })}
                value={s.assessmentName.text}
                onValueChange={(text) => patch({ assessmentName: { ...s.assessmentName, text } })}
                placeholder={courseTitle || "Course Name"}
              />
              <TextToggleField
                label={t("trainerName")}
                enabled={s.trainerName.enabled}
                onToggle={(enabled) => patch({ trainerName: { ...s.trainerName, enabled } })}
                value={s.trainerName.text}
                onValueChange={(text) => patch({ trainerName: { ...s.trainerName, text } })}
                placeholder="John Smith"
              />
              <div className="flex items-center justify-between">
                <Label>{t("score")}</Label>
                <Switch
                  checked={s.score.enabled}
                  onCheckedChange={(enabled) => patch({ score: { enabled } })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("issuedDate")}</Label>
                <Switch
                  checked={s.issuedDate.enabled}
                  onCheckedChange={(enabled) => patch({ issuedDate: { enabled } })}
                />
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>{t("validity")}</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={s.validityType}
                  onChange={(e) => patch({ validityType: e.target.value as any })}
                >
                  <option value="duration">{t("validityDurationLabel")}</option>
                  <option value="fixed">{t("validityFixedLabel")}</option>
                  <option value="none">{t("validityNoneLabel")}</option>
                </select>
              </div>

              {s.validityType === "duration" && (
                <div className="space-y-2">
                  <Label>{t("duration")}</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={s.validityDuration}
                    onChange={(e) => patch({ validityDuration: e.target.value })}
                  >
                    <option value="1 month">1 month</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="3 years">3 years</option>
                    <option value="5 years">5 years</option>
                  </select>
                </div>
              )}

              {s.validityType === "fixed" && (
                <div className="space-y-2">
                  <Label>{t("fixedExpiryDate")}</Label>
                  <Input
                    type="date"
                    value={s.fixedExpiryDate}
                    onChange={(e) => patch({ fixedExpiryDate: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "signature" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <SignatureIcon className="w-4 h-4" /> {t("signature")}
                </Label>
                <Switch
                  checked={s.signature.enabled}
                  onCheckedChange={(enabled) => patch({ signature: { ...s.signature, enabled } })}
                />
              </div>
              {s.signature.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>{t("signatureName")}</Label>
                    <Input
                      value={s.signature.name}
                      onChange={(e) => patch({ signature: { ...s.signature, name: e.target.value } })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("signatureTitle")}</Label>
                    <Input
                      value={s.signature.title}
                      onChange={(e) => patch({ signature: { ...s.signature, title: e.target.value } })}
                      placeholder="Course Instructor"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" /> {t("certificatePreview")}
          </Label>
          <CertificatePreview settings={s} courseTitle={courseTitle} />
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="color" className="w-10 h-9 p-1" value={value} onChange={(e) => onChange(e.target.value)} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      </div>
    </div>
  );
}

function TextToggleField({
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

function CertificatePreview({
  settings,
  courseTitle,
}: {
  settings: NonNullable<AssessmentCertificateSettings> & {
    recipientLabel: { enabled: boolean; text: string };
    bodyText: { enabled: boolean; text: string };
  };
  courseTitle: string;
}) {
  const header = settings.certificateHeader?.enabled ? settings.certificateHeader?.text || "Certificate of Achievement" : null;
  const recipientLabel = settings.recipientLabel.enabled ? settings.recipientLabel.text : null;
  const bodyText = settings.bodyText.enabled ? settings.bodyText.text : null;
  const courseName = settings.assessmentName?.enabled ? settings.assessmentName?.text || courseTitle : courseTitle;
  const trainerName = settings.trainerName?.enabled ? settings.trainerName?.text : null;
  const primary = settings.primaryColor ?? "#0284c7";
  const secondary = settings.secondaryColor ?? "#0f766e";
  const bg = settings.backgroundColor ?? "#ffffff";
  const style = settings.borderStyle ?? "classic";

  return (
    <div
      className="relative aspect-[1.414/1] rounded-lg shadow-md overflow-hidden border flex items-center justify-center p-6"
      style={{ background: bg }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {style === "classic" && (
          <div className="absolute inset-2 rounded-md border-2" style={{ borderColor: primary }} />
        )}
        {style === "modern" && (
          <>
            <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
            <div className="absolute inset-2 rounded-lg border-4 border-double" style={{ borderColor: primary }} />
          </>
        )}
        {style === "minimal" && (
          <>
            <div className="absolute top-0 left-0 h-2 w-full" style={{ background: primary }} />
            <div className="absolute bottom-0 left-0 h-2 w-full" style={{ background: secondary }} />
          </>
        )}
      </div>

      <div className="relative z-10 text-center px-6 w-full">
        {settings.showLogo && settings.logoUrl && (
          <img src={settings.logoUrl} alt="logo" className="h-12 w-12 object-contain mx-auto mb-3" />
        )}
        {header && (
          <p className="text-base font-bold tracking-wide uppercase" style={{ color: primary }}>
            {header}
          </p>
        )}
        {recipientLabel && <p className="text-xs text-slate-500 mt-3">{recipientLabel}</p>}
        <p className="text-2xl font-bold mt-1 text-slate-800" style={{ fontFamily: "Georgia, serif" }}>
          [Recipient Name]
        </p>
        {bodyText && <p className="text-xs text-slate-500 mt-2">{bodyText}</p>}
        <p className="text-base font-semibold mt-1" style={{ color: secondary }}>
          {courseName}
        </p>
        {settings.score?.enabled && <p className="text-[11px] text-slate-500 mt-2">Score: 85%</p>}
        <div className="mt-4 flex items-end justify-center gap-8">
          {settings.signature?.enabled && (
            <div className="text-center">
              <div className="w-24 border-t border-slate-400" />
              <p className="text-[10px] font-medium text-slate-600 mt-1">{settings.signature.name || "Signature"}</p>
              <p className="text-[9px] text-slate-400">{settings.signature.title}</p>
            </div>
          )}
          {settings.issuedDate?.enabled && (
            <div className="text-center">
              <div className="w-24 border-t border-slate-400" />
              <p className="text-[10px] font-medium text-slate-600 mt-1">Date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
