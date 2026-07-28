import { Hammer, Settings, Award, Upload, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadAssessmentDraft } from "@/lib/assessmentDraft";

interface AssessmentHeaderProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
}

const HEADER_BG = "linear-gradient(90deg, #0284c7 0%, #0ea5e9 50%, #06b6d4 100%)";
const ACTIVE_COLOR = "#0284c7";

export default function AssessmentHeader({
  activeTab,
  onTabChange,
  onSave,
  onPublish,
}: AssessmentHeaderProps) {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const showCertificate = loadAssessmentDraft().generateCertificate;

  const handleTabChange = (value: string) => {
    onTabChange?.(value);
    if (value === "build") navigate("/assessment-create-form");
    else if (value === "properties") navigate("/assessment-settings");
    else if (value === "certificate") navigate("/assessment-certificate-settings");
    else if (value === "publish") navigate("/assessment-creation");
  };

  const tabStyle = (tab: string) => ({
    padding: "5px 18px",
    fontSize: "13px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: activeTab === tab ? "#fff" : "transparent",
    color: activeTab === tab ? ACTIVE_COLOR : "rgba(255,255,255,0.85)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap" as const,
    transition: "background 0.15s, color 0.15s",
    fontWeight: activeTab === tab ? 500 : 400,
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "48px",
        background: HEADER_BG,
        borderBottom: "1px solid rgba(14, 165, 233, 0.35)",
        gap: "12px",
      }}
    >
      <div style={{ width: 120 }} aria-hidden="true" />

      <div
        style={{
          display: "flex",
          gap: "2px",
          background: "rgba(255,255,255,0.12)",
          borderRadius: "8px",
          padding: "3px",
          overflowX: "auto",
        }}
      >
        <button type="button" onClick={() => handleTabChange("build")} style={tabStyle("build")}>
          <Hammer size={15} /> Builder
        </button>
        <button type="button" onClick={() => handleTabChange("properties")} style={tabStyle("properties")}>
          <Settings size={15} /> Properties
        </button>
        {showCertificate && (
          <button type="button" onClick={() => handleTabChange("certificate")} style={tabStyle("certificate")}>
            <Award size={15} /> Certificate
          </button>
        )}
        <button type="button" onClick={() => handleTabChange("publish")} style={tabStyle("publish")}>
          <Upload size={15} /> Publish
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: "5px 14px",
            border: "1px solid rgba(255,255,255,0.35)",
            background: "transparent",
            color: "#fff",
            borderRadius: "6px",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Save size={15} /> {t("save")}
        </button>
        <button
          type="button"
          onClick={onPublish}
          style={{
            padding: "5px 16px",
            background: "#fff",
            color: ACTIVE_COLOR,
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Upload size={15} /> {t("publish")}
        </button>
      </div>
    </nav>
  );
}
