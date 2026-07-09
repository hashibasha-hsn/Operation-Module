import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Check, Plus, Trash2, Copy, ExternalLink, QrCode, Globe, Bell, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ReminderEntry = {
  id: string;
  offsetHours: number;
  offsetMinutes: number;
  direction: "before" | "after";
  anchor: "start" | "end";
  channel: "email" | "push" | "both";
};

export type ReviewLevel = {
  id: string;
  label: string;
  assignee: string;
};

export type ProcessProperties = {
  occurrence: "one-time" | "recurring";
  responsesAfterEndTime: "accept" | "reject";
  numberOfResponses: "one-per-user" | "multiple-per-user";
  submissionBy: "anyone" | "everyone";
  dateRangeSelection: "allowed" | "restricted";
  periodicityType: "daily" | "weekly" | "monthly" | "yearly";
  weeklyDays: string[];
  monthlyDay: number;
  yearlyMonth: number;
  yearlyDay: number;
  startTime: string;
  endTime: string;
  emailAlerts: boolean;
  mobileNotifications: boolean;
  reportUrlSharing: boolean;
  reminders: ReminderEntry[];
  reportTiming: "on-submission" | "after-review";
  reportRecipients: { submitter: boolean; storeManager: boolean; custom: boolean; hierarchical: boolean; storeHierarchical: boolean };
  reportLinkInActionPoint: boolean;
  processWithReview: boolean;
  reviewLevels: ReviewLevel[];
  geoFence: boolean;
  captureGeoTag: boolean;
  hideScores: boolean;
  trackVisualMerchandising: boolean;
  dynamicAssignment: boolean;
  carryForwardActionPoints: boolean;
  createActionPointsFromReports: boolean;
  allowOfflineSubmission: boolean;
  reportConfidentiality: "none" | "admin-only" | "submitter-admin";
  processPriority: "1" | "2" | "3" | "4" | "5";
  pageCount: number;
  publicFormEnabled: boolean;
  defaultLanguage: string;
  supportedLanguages: string[];
};

export const defaultProcessProperties = (): ProcessProperties => ({
  occurrence: "one-time",
  responsesAfterEndTime: "accept",
  numberOfResponses: "one-per-user",
  submissionBy: "anyone",
  dateRangeSelection: "allowed",
  periodicityType: "daily",
  weeklyDays: [],
  monthlyDay: 1,
  yearlyMonth: 1,
  yearlyDay: 1,
  startTime: "",
  endTime: "",
  emailAlerts: false,
  mobileNotifications: false,
  reportUrlSharing: false,
  reminders: [],
  reportTiming: "on-submission",
  reportRecipients: { submitter: true, storeManager: false, custom: false, hierarchical: false, storeHierarchical: false },
  reportLinkInActionPoint: false,
  processWithReview: false,
  reviewLevels: [{ id: "L1", label: "L1", assignee: "" }],
  geoFence: false,
  captureGeoTag: false,
  hideScores: false,
  trackVisualMerchandising: false,
  dynamicAssignment: false,
  carryForwardActionPoints: false,
  createActionPointsFromReports: false,
  allowOfflineSubmission: false,
  reportConfidentiality: "none",
  processPriority: "2",
  pageCount: 0,
  publicFormEnabled: false,
  defaultLanguage: "english",
  supportedLanguages: ["english"],
});

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-5 ${className}`}>{children}</div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-1 text-sm font-semibold text-gray-800">{children}</h4>;
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs text-gray-500 leading-relaxed">{children}</p>;
}

function RadioGroup({
  name, value, onChange, options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-start gap-2 cursor-pointer group">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 h-4 w-4 accent-orange-500"
          />
          <span className="text-sm">
            <span className="font-medium text-gray-800 group-hover:text-orange-600">{opt.label}</span>
            {opt.desc && <span className="block text-xs text-gray-500 mt-0.5">{opt.desc}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function ToggleRow({
  title, desc, checked, onChange,
}: { title: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Card className="flex items-center justify-between">
      <div className="pr-4">
        <CardTitle>{title}</CardTitle>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Card>
  );
}

// ─── 1. Process Settings ──────────────────────────────────────────────────────
function ProcessSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Process Settings" />
      <Card>
        <CardTitle>1. Occurrence</CardTitle>
        <CardDesc>One-time for ad-hoc activities. Recurring uses your periodicity schedule.</CardDesc>
        <RadioGroup name="occurrence" value={p.occurrence} onChange={(v) => patch({ occurrence: v as any })}
          options={[
            { value: "one-time", label: "One-time" },
            { value: "recurring", label: "Recurring" },
          ]} />
      </Card>
      <Card>
        <CardTitle>2. Responses After End-Time</CardTitle>
        <CardDesc>What happens when a user tries to submit after the end time.</CardDesc>
        <RadioGroup name="resp-end" value={p.responsesAfterEndTime} onChange={(v) => patch({ responsesAfterEndTime: v as any })}
          options={[
            { value: "accept", label: "Accept late submissions" },
            { value: "reject", label: "Reject late submissions" },
          ]} />
      </Card>
      <Card>
        <CardTitle>3. Number of Responses</CardTitle>
        <CardDesc>Controls whether each user can submit more than once.</CardDesc>
        <RadioGroup name="num-resp" value={p.numberOfResponses} onChange={(v) => patch({ numberOfResponses: v as any })}
          options={[
            { value: "one-per-user", label: "One response per user" },
            { value: "multiple-per-user", label: "Multiple responses per user" },
          ]} />
      </Card>
      <Card>
        <CardTitle>4. Submission By</CardTitle>
        <CardDesc>Controls whether any one person completes it or all assignees must submit individually.</CardDesc>
        <RadioGroup name="sub-by" value={p.submissionBy} onChange={(v) => patch({ submissionBy: v as any })}
          options={[
            { value: "anyone", label: "Anyone (one submitter completes it)" },
            { value: "everyone", label: "Everyone (all assignees must submit)" },
          ]} />
      </Card>
      <Card>
        <CardTitle>5. Date Range Selection</CardTitle>
        <CardDesc>Whether submitters can select past/future dates or only the current date.</CardDesc>
        <RadioGroup name="date-range" value={p.dateRangeSelection} onChange={(v) => patch({ dateRangeSelection: v as any })}
          options={[
            { value: "allowed", label: "Allowed (past/future dates)" },
            { value: "restricted", label: "Restricted (current date only)" },
          ]} />
      </Card>
    </div>
  );
}

// ─── 2. Periodicity ───────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { id: "mon", label: "Mon" }, { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" }, { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" }, { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function PeriodicitySection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  const toggleDay = (id: string) => {
    const next = p.weeklyDays.includes(id) ? p.weeklyDays.filter(d => d !== id) : [...p.weeklyDays, id];
    patch({ weeklyDays: next });
  };
  if (p.occurrence === "one-time") {
    return (
      <div className="max-w-2xl">
        <SectionTitle title="Process Periodicity" />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Periodicity applies only when <strong>Occurrence</strong> is set to <strong>Recurring</strong> (Process tab).
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Process Periodicity" subtitle="Define when this process recurs." />
      <Card>
        <CardTitle>Periodicity Type</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {(["daily","weekly","monthly","yearly"] as const).map(t => (
            <button key={t} onClick={() => patch({ periodicityType: t })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                p.periodicityType === t ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 hover:border-orange-400"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Card>
      {p.periodicityType === "weekly" && (
        <Card>
          <CardTitle>Select Days</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {WEEK_DAYS.map(d => (
              <button key={d.id} onClick={() => toggleDay(d.id)}
                className={`h-9 w-9 rounded-full text-sm font-medium border transition-colors ${
                  p.weeklyDays.includes(d.id) ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 hover:border-orange-400"
                }`}>
                {d.label.slice(0,1)}
              </button>
            ))}
          </div>
        </Card>
      )}
      {p.periodicityType === "monthly" && (
        <Card>
          <CardTitle>Day of Month</CardTitle>
          <Input type="number" min={1} max={31} className="w-24 mt-2"
            value={p.monthlyDay} onChange={e => patch({ monthlyDay: Number(e.target.value) || 1 })} />
        </Card>
      )}
      {p.periodicityType === "yearly" && (
        <Card>
          <CardTitle>Month and Day</CardTitle>
          <div className="flex items-center gap-3 mt-2">
            <select className="rounded border px-2 py-1.5 text-sm" value={p.yearlyMonth}
              onChange={e => patch({ yearlyMonth: Number(e.target.value) })}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <Input type="number" min={1} max={31} className="w-20"
              value={p.yearlyDay} onChange={e => patch({ yearlyDay: Number(e.target.value) || 1 })} />
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>Start & End Time</CardTitle>
        <CardDesc>Mandatory for all periodicity types (local time of each store).</CardDesc>
        <div className="flex flex-wrap gap-4 mt-1">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
            <Input type="time" className="w-36" value={p.startTime} onChange={e => patch({ startTime: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End Time</label>
            <Input type="time" className="w-36" value={p.endTime} onChange={e => patch({ endTime: e.target.value })} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── 3. Reminders & Notifications ─────────────────────────────────────────────
function RemindersSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  const addReminder = () => patch({
    reminders: [...p.reminders, {
      id: Date.now().toString(), offsetHours: 1, offsetMinutes: 0,
      direction: "before", anchor: "end", channel: "push",
    }],
  });
  const updateReminder = (id: string, upd: Partial<ReminderEntry>) => patch({
    reminders: p.reminders.map(r => r.id === id ? { ...r, ...upd } : r),
  });
  const removeReminder = (id: string) => patch({ reminders: p.reminders.filter(r => r.id !== id) });

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Reminders and Notifications" />
      <Card>
        <CardTitle>Email Alerts for the Process</CardTitle>
        <CardDesc>Send email alerts to assignees when the process opens or is due.</CardDesc>
        <RadioGroup name="email-alerts" value={p.emailAlerts ? "yes" : "no"}
          onChange={v => patch({ emailAlerts: v === "yes" })}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
      </Card>
      <Card>
        <CardTitle>Mobile Push Notification Alerts</CardTitle>
        <CardDesc>Push notifications to mobile devices when the process opens or closes.</CardDesc>
        <RadioGroup name="push-alerts" value={p.mobileNotifications ? "yes" : "no"}
          onChange={v => patch({ mobileNotifications: v === "yes" })}
          options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
      </Card>
      <ToggleRow title="Enable Report URL Sharing"
        desc="Include a direct submission report link in email alerts."
        checked={p.reportUrlSharing} onChange={v => patch({ reportUrlSharing: v })} />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Reminders</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Alert assignees before/after start or end time.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addReminder}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Reminder
          </Button>
        </div>
        {p.reminders.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No reminders yet.</p>
        )}
        <div className="space-y-3">
          {p.reminders.map((r, i) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-gray-50">
              <span className="text-xs font-medium text-gray-500 w-16">Reminder {i + 1}</span>
              <Input type="number" min={0} className="w-16 text-center text-sm" placeholder="Hrs"
                value={r.offsetHours} onChange={e => updateReminder(r.id, { offsetHours: Number(e.target.value) })} />
              <span className="text-xs text-gray-400">hrs</span>
              <Input type="number" min={0} max={59} className="w-14 text-center text-sm" placeholder="Min"
                value={r.offsetMinutes} onChange={e => updateReminder(r.id, { offsetMinutes: Number(e.target.value) })} />
              <span className="text-xs text-gray-400">min</span>
              <select className="rounded border px-2 py-1 text-sm" value={r.direction}
                onChange={e => updateReminder(r.id, { direction: e.target.value as any })}>
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
              <select className="rounded border px-2 py-1 text-sm" value={r.anchor}
                onChange={e => updateReminder(r.id, { anchor: e.target.value as any })}>
                <option value="start">Start time</option>
                <option value="end">End time</option>
              </select>
              <select className="rounded border px-2 py-1 text-sm" value={r.channel}
                onChange={e => updateReminder(r.id, { channel: e.target.value as any })}>
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-red-400 hover:text-red-600"
                onClick={() => removeReminder(r.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── 4. Submission Report ─────────────────────────────────────────────────────
function SubmissionReportSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  const patchRecipients = (r: Partial<typeof p.reportRecipients>) =>
    patch({ reportRecipients: { ...p.reportRecipients, ...r } });

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Submission Report Settings" />
      <Card>
        <CardTitle>Timing</CardTitle>
        <CardDesc>When should the PDF report be sent?</CardDesc>
        <RadioGroup name="report-timing" value={p.reportTiming} onChange={v => patch({ reportTiming: v as any })}
          options={[
            { value: "on-submission", label: "On submission" },
            { value: "after-review", label: "After review (when review is enabled)" },
          ]} />
      </Card>
      <Card>
        <CardTitle>Who should receive the PDF report?</CardTitle>
        <CardDesc>Select all roles that should receive the submission report via email.</CardDesc>
        <div className="space-y-3 mt-2">
          {([
            { key: "submitter", label: "Submitter" },
            { key: "storeManager", label: "Store Manager" },
            { key: "custom", label: "Custom (users / designations)" },
          ] as const).map(item => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-orange-500"
                checked={p.reportRecipients[item.key]}
                onChange={e => patchRecipients({ [item.key]: e.target.checked })} />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
          {p.reportRecipients.custom && (
            <div className="ml-6 space-y-2 border-l pl-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-orange-500"
                  checked={p.reportRecipients.hierarchical}
                  onChange={e => patchRecipients({ hierarchical: e.target.checked })} />
                <span className="text-sm text-gray-700">Hierarchical</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-orange-500"
                  checked={p.reportRecipients.storeHierarchical}
                  onChange={e => patchRecipients({ storeHierarchical: e.target.checked })} />
                <span className="text-sm text-gray-700">Store Hierarchical</span>
              </label>
            </div>
          )}
        </div>
      </Card>
      <ToggleRow title="Provide link in Action Point Summary"
        desc="Adds a direct submission report link to action point summaries."
        checked={p.reportLinkInActionPoint} onChange={v => patch({ reportLinkInActionPoint: v })} />
    </div>
  );
}

// ─── 5. Review Settings ───────────────────────────────────────────────────────
function ReviewSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  const addLevel = () => {
    const n = p.reviewLevels.length + 1;
    patch({ reviewLevels: [...p.reviewLevels, { id: `L${n}`, label: `L${n}`, assignee: "" }] });
  };
  const updateLevel = (id: string, upd: Partial<ReviewLevel>) =>
    patch({ reviewLevels: p.reviewLevels.map(l => l.id === id ? { ...l, ...upd } : l) });
  const removeLevel = (id: string) =>
    patch({ reviewLevels: p.reviewLevels.filter(l => l.id !== id) });

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Review Settings" />
      <ToggleRow title="Enable Process With Review"
        desc="When enabled, submissions go through reviewer levels (L1, L2, …) before completion."
        checked={p.processWithReview} onChange={v => patch({ processWithReview: v })} />
      {p.processWithReview && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Review Levels</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitter → L1 → L2 → … → final approval. Correction returns to submitter.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addLevel} disabled={p.reviewLevels.length >= 4}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Level
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600">
                <span className="w-16">Level</span>
                <span className="flex-1">Reviewer Assignee / Role</span>
                <span className="w-8"></span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm text-gray-400">
                <span className="w-16 font-medium">Submitter</span>
                <span className="flex-1 italic">— (fills the form)</span>
              </div>
              {p.reviewLevels.map((level, i) => (
                <div key={level.id} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-semibold text-orange-600">{level.label}</span>
                  <Input className="flex-1 text-sm" placeholder={`Assignee for ${level.label}`}
                    value={level.assignee}
                    onChange={e => updateLevel(level.id, { assignee: e.target.value })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                    onClick={() => removeLevel(level.id)} disabled={p.reviewLevels.length <= 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>Per-question review</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              You can configure review type (No Review / Review Existing / Independent) for each individual question in the Build tab.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── 6. Advance Settings ──────────────────────────────────────────────────────
function AdvanceSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Advance Settings" />
      <Card>
        <CardTitle>Restrict or Track Location While Submitting</CardTitle>
        <CardDesc>Control geo-location behaviour during form submission.</CardDesc>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-orange-500"
              checked={p.geoFence} onChange={e => patch({ geoFence: e.target.checked })} />
            <span className="text-sm">
              <span className="font-medium">Geo-Fence</span>
              <span className="block text-xs text-gray-500">Restrict submissions to within the store radius.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-orange-500"
              checked={p.captureGeoTag} onChange={e => patch({ captureGeoTag: e.target.checked })} />
            <span className="text-sm">
              <span className="font-medium">Capture Geo-Tag</span>
              <span className="block text-xs text-gray-500">Log location without blocking submission.</span>
            </span>
          </label>
        </div>
      </Card>
      <ToggleRow title="Hide Scores & Compliance from Submissions"
        desc="Submitters won't see scores or compliance percentages while filling the form."
        checked={p.hideScores} onChange={v => patch({ hideScores: v })} />
      <ToggleRow title="Track Visual Merchandising Across Stores"
        desc="Unlocks Visual Report view and lets you filter photos by question tags."
        checked={p.trackVisualMerchandising} onChange={v => patch({ trackVisualMerchandising: v })} />
      <ToggleRow title="Auto-Assign Users with Dynamic Assignment"
        desc="Automatically assign new users that match the designation and store mapping."
        checked={p.dynamicAssignment} onChange={v => patch({ dynamicAssignment: v })} />
      <ToggleRow title="Carry Forward Action Points"
        desc="Open, in-progress, and on-hold action points carry to the next submission cycle."
        checked={p.carryForwardActionPoints} onChange={v => patch({ carryForwardActionPoints: v })} />
      <ToggleRow title="Create Action Points from Reports"
        desc="Allow raising action points from submission reports after the form is filled."
        checked={p.createActionPointsFromReports} onChange={v => patch({ createActionPointsFromReports: v })} />
      <ToggleRow title="Allow Offline Submission (Beta)"
        desc="Submitters can fill forms without internet and sync when back online."
        checked={p.allowOfflineSubmission} onChange={v => patch({ allowOfflineSubmission: v })} />
      <Card>
        <CardTitle>Make Reports Confidential</CardTitle>
        <CardDesc>Control who can view submission reports.</CardDesc>
        <RadioGroup name="confidentiality" value={p.reportConfidentiality} onChange={v => patch({ reportConfidentiality: v as any })}
          options={[
            { value: "none", label: "Not confidential" },
            { value: "admin-only", label: "Admin only" },
            { value: "submitter-admin", label: "Submitter & Admin" },
          ]} />
      </Card>
      <Card>
        <CardTitle>Set Process Priority</CardTitle>
        <CardDesc>Priority 1 appears on the Executive Dashboard; 2 is default.</CardDesc>
        <div className="flex flex-wrap gap-2 mt-2">
          {(["1","2","3","4","5"] as const).map(pr => (
            <button key={pr} onClick={() => patch({ processPriority: pr })}
              className={`h-9 w-9 rounded-full text-sm font-semibold border transition-colors ${
                p.processPriority === pr ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 hover:border-orange-400"
              }`}>{pr}</button>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>Add Page Count (Paper Equivalent)</CardTitle>
        <CardDesc>Estimated number of manual paper pages this process replaces.</CardDesc>
        <Input type="number" min={0} className="w-28 mt-2" placeholder="0"
          value={p.pageCount || ""} onChange={e => patch({ pageCount: Number(e.target.value) || 0 })} />
      </Card>
    </div>
  );
}

// ─── 7. Public Form ───────────────────────────────────────────────────────────
function PublicFormSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Public Form via URL or QR Code" />
      <ToggleRow title="Enable Public Form"
        desc="Collect submissions from external users via a shareable URL or QR code."
        checked={p.publicFormEnabled} onChange={v => patch({ publicFormEnabled: v })} />
      {p.publicFormEnabled ? (
        <Card>
          <CardTitle>Public Access</CardTitle>
          <p className="mt-1 text-xs text-gray-500 mb-4">
            After publishing, a unique URL and QR code will be generated for this process.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 bg-gray-50">
              <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-600">Shareable URL</p>
                <p className="text-xs text-gray-400">Available after publishing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 bg-gray-50">
              <QrCode className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-600">QR Code</p>
                <p className="text-xs text-gray-400">Available after publishing</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-gray-50">
          <p className="text-sm text-gray-400 text-center py-2">
            Enable the toggle above to generate a public URL and QR code after publishing.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── 8. Language Settings ─────────────────────────────────────────────────────
const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "arabic", label: "Arabic" },
  { value: "hindi", label: "Hindi" },
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "german", label: "German" },
  { value: "portuguese", label: "Portuguese" },
  { value: "chinese", label: "Chinese (Mandarin)" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "italian", label: "Italian" },
  { value: "russian", label: "Russian" },
  { value: "turkish", label: "Turkish" },
  { value: "dutch", label: "Dutch" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "kannada", label: "Kannada" },
  { value: "malayalam", label: "Malayalam" },
  { value: "bengali", label: "Bengali" },
  { value: "gujarati", label: "Gujarati" },
  { value: "marathi", label: "Marathi" },
  { value: "punjabi", label: "Punjabi" },
  { value: "urdu", label: "Urdu" },
  { value: "swahili", label: "Swahili" },
  { value: "indonesian", label: "Indonesian" },
  { value: "malay", label: "Malay" },
  { value: "thai", label: "Thai" },
  { value: "vietnamese", label: "Vietnamese" },
];

function LanguageSection({ p, set }: { p: ProcessProperties; set: (v: ProcessProperties) => void }) {
  const patch = (k: Partial<ProcessProperties>) => set({ ...p, ...k });
  const toggleSupported = (val: string) => {
    if (val === p.defaultLanguage) return; // can't remove default
    const next = p.supportedLanguages.includes(val)
      ? p.supportedLanguages.filter(l => l !== val)
      : [...p.supportedLanguages, val];
    patch({ supportedLanguages: next.length ? next : [p.defaultLanguage] });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Language Settings" subtitle="Control the language(s) this process supports." />
      <Card>
        <CardTitle>Default Language</CardTitle>
        <CardDesc>The primary language questions are written in.</CardDesc>
        <select className="w-full rounded border px-3 py-2 text-sm mt-1"
          value={p.defaultLanguage}
          onChange={e => {
            const lang = e.target.value;
            const supported = p.supportedLanguages.includes(lang)
              ? p.supportedLanguages
              : [...p.supportedLanguages, lang];
            patch({ defaultLanguage: lang, supportedLanguages: supported });
          }}>
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </Card>
      <Card>
        <CardTitle>Supported Languages</CardTitle>
        <CardDesc>
          Selected languages appear in the Builder so you can add manual translations per question.
          The default language is always included.
        </CardDesc>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map(lang => {
            const isDefault = lang.value === p.defaultLanguage;
            const isSelected = p.supportedLanguages.includes(lang.value);
            return (
              <label key={lang.value}
                className={`flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                  isSelected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                } ${isDefault ? "opacity-60 cursor-not-allowed" : ""}`}>
                <input type="checkbox" className="h-3.5 w-3.5 accent-orange-500"
                  checked={isSelected} disabled={isDefault}
                  onChange={() => toggleSupported(lang.value)} />
                <span className="truncate">{lang.label}</span>
                {isDefault && <span className="ml-auto text-xs text-orange-500 shrink-0">default</span>}
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Main PropertiesPanel ─────────────────────────────────────────────────────
type Section = {
  id: string;
  label: string;
  shortLabel?: string;
};

const SECTIONS: Section[] = [
  { id: "process", label: "Process" },
  { id: "periodicity", label: "Periodicity" },
  { id: "reminders", label: "Reminders and Notifications" },
  { id: "submissionReport", label: "Submission Report" },
  { id: "review", label: "Review" },
  { id: "advanceSettings", label: "Advance Settings" },
  { id: "publicForm", label: "Public Form" },
  { id: "language", label: "Language Settings" },
];

type PropertiesPanelProps = {
  properties: ProcessProperties;
  onChange: (p: ProcessProperties) => void;
  processTitle?: string;
};

export default function PropertiesPanel({ properties: p, onChange, processTitle }: PropertiesPanelProps) {
  const [active, setActive] = useState("process");

  const isComplete = (id: string) => {
    if (id === "process") return true;
    if (id === "periodicity") return p.occurrence === "one-time" || (!!p.startTime && !!p.endTime);
    if (id === "reminders") return true;
    if (id === "submissionReport") return true;
    if (id === "review") return true;
    if (id === "advanceSettings") return true;
    if (id === "publicForm") return true;
    if (id === "language") return !!p.defaultLanguage;
    return false;
  };

  const content: Record<string, React.ReactNode> = {
    process: <ProcessSection p={p} set={onChange} />,
    periodicity: <PeriodicitySection p={p} set={onChange} />,
    reminders: <RemindersSection p={p} set={onChange} />,
    submissionReport: <SubmissionReportSection p={p} set={onChange} />,
    review: <ReviewSection p={p} set={onChange} />,
    advanceSettings: <AdvanceSection p={p} set={onChange} />,
    publicForm: <PublicFormSection p={p} set={onChange} />,
    language: <LanguageSection p={p} set={onChange} />,
  };

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <div className="w-60 shrink-0 border-r bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Settings</h3>
        <nav className="space-y-0.5">
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => setActive(sec.id)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                active === sec.id
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
              <span>{sec.label}</span>
              {isComplete(sec.id) && (
                <Check className={`h-4 w-4 shrink-0 ${active === sec.id ? "text-orange-500" : "text-green-500"}`} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {!processTitle && (
          <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-700">
            Set a process title on the <strong>Title</strong> tab before saving properties.
          </div>
        )}
        {content[active]}
      </div>
    </div>
  );
}
