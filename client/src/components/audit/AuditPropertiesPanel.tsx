import ProcessPropertiesPanel from "@/components/process/ProcessPropertiesPanel";
import type { ProcessProperties } from "@/lib/processProperties";

type Props = {
  properties: ProcessProperties;
  onChange: (next: ProcessProperties) => void;
  selectedSection: string;
  onSectionChange?: (section: string) => void;
  passThreshold: number;
  reviewLevels: number;
  onPassThresholdChange: (value: number) => void;
  onReviewLevelsChange: (value: number) => void;
};

export default function AuditPropertiesPanel({
  properties,
  onChange,
  selectedSection,
  onSectionChange,
  passThreshold,
  reviewLevels,
  onPassThresholdChange,
  onReviewLevelsChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Audit Scoring & Review</h3>
        <p className="text-sm text-muted-foreground">
          Configure pass/fail thresholds and multi-level review per the{" "}
          <a
            href="https://docs.taqtics.co/process-and-workflows/store-audits"
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 underline"
          >
            Taqtics Store Audits
          </a>{" "}
          guide.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pass threshold (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={passThreshold}
              onChange={(e) => onPassThresholdChange(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure review levels under <strong>Review</strong> in the sidebar (enable “Process with review”, then assign Level 1, 2, … reviewers).
        </p>
      </div>

      <ProcessPropertiesPanel
        properties={properties}
        onChange={onChange}
        selectedSection={selectedSection}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}
