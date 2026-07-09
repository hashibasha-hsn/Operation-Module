import { Input } from "@/components/ui/input";
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
      {/* Audit-specific scoring card — shown only on the Process section */}
      {selectedSection === "process" && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Audit Scoring &amp; Review</h3>
          <p className="text-sm text-muted-foreground">
            Configure pass/fail thresholds and multi-level review. See the{" "}
            <a
              href="https://docs.taqtics.co/process-and-workflows/store-audits"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 underline"
            >
              Taqtics Store Audits
            </a>{" "}
            guide for details.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pass threshold (%)</label>
              <p className="text-xs text-muted-foreground">
                Submissions scoring below this percentage are marked as failed.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passThreshold}
                  onChange={(e) => onPassThresholdChange(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            To set up multi-level review, go to the{" "}
            <strong>Review</strong> section in the sidebar — enable{" "}
            <em>Process with review</em> then assign reviewers for each level.
          </p>
        </div>
      )}

      {/* Audit-specific review levels card — shown only on the Review section */}
      {selectedSection === "review" && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Audit Review Levels</h3>
          <p className="text-sm text-muted-foreground">
            Number of review levels (L1, L2, …) auditors must pass through before a submission is finalised.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Review levels</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onReviewLevelsChange(n)}
                  className={`h-9 w-9 rounded-full text-sm font-semibold border transition-colors ${
                    reviewLevels === n
                      ? "bg-sky-500 text-white border-sky-500"
                      : "border-gray-300 hover:border-sky-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Then use the <em>Review levels &amp; assignees</em> card below to assign specific reviewers.
            </p>
          </div>
        </div>
      )}

      {/* All 8 standard property sections */}
      <ProcessPropertiesPanel
        properties={properties}
        onChange={onChange}
        selectedSection={selectedSection}
      />
    </div>
  );
}
