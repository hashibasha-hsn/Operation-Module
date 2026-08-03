import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COMMON_LANGUAGES,
  MONTH_NAMES,
  WEEK_DAYS,
  createReminder,
  type ProcessProperties,
  type ReminderEntry,
} from "@/lib/processProperties";
import ReviewLevelsEditor from "@/components/process/ReviewLevelsEditor";
import { AlertCircle, Check, Trash2 } from "lucide-react";

type ProcessPropertiesPanelProps = {
  properties: ProcessProperties;
  onChange: (properties: ProcessProperties) => void;
  selectedSection: string;
};

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="accent-blue-600"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function SettingCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-4">
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function ProcessPropertiesPanel({
  properties,
  onChange,
  selectedSection,
}: ProcessPropertiesPanelProps) {
  const patch = (partial: Partial<ProcessProperties>) => onChange({ ...properties, ...partial });

  const patchMonthly = (key: 'monthlyStart' | 'monthlyEnd', partial: Partial<ProcessProperties['monthlyStart']>) =>
    onChange({ ...properties, [key]: { ...properties[key], ...partial } });

  const patchYearly = (key: 'yearlyStart' | 'yearlyEnd', partial: Partial<ProcessProperties['yearlyStart']>) =>
    onChange({ ...properties, [key]: { ...properties[key], ...partial } });

  const toggleWeekDay = (day: string) => {
    const next = properties.weeklyDays.includes(day)
      ? properties.weeklyDays.filter((d) => d !== day)
      : [...properties.weeklyDays, day];
    patch({ weeklyDays: next });
  };

  const updateReminders = (reminders: ReminderEntry[]) => patch({ reminders });

  if (selectedSection === 'process') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Process Settings</h3>
        <SettingCard title="1. Occurrence" description="One-time for ad-hoc activities; Recurring uses your periodicity schedule.">
          <RadioGroup
            name="occurrence"
            value={properties.occurrence}
            onChange={(value) => patch({ occurrence: value as ProcessProperties['occurrence'] })}
            options={[
              { value: 'one-time', label: 'One-time' },
              { value: 'recurring', label: 'Recurring' },
            ]}
          />
        </SettingCard>
        <SettingCard title="2. Responses After End-Time">
          <RadioGroup
            name="responsesAfterEndTime"
            value={properties.responsesAfterEndTime}
            onChange={(value) => patch({ responsesAfterEndTime: value as ProcessProperties['responsesAfterEndTime'] })}
            options={[
              { value: 'accept', label: 'Accept late submissions' },
              { value: 'reject', label: 'Reject late submissions' },
            ]}
          />
        </SettingCard>
        <SettingCard title="3. Number of Responses">
          <RadioGroup
            name="numberOfResponses"
            value={properties.numberOfResponses}
            onChange={(value) => patch({ numberOfResponses: value as ProcessProperties['numberOfResponses'] })}
            options={[
              { value: 'one-per-user', label: 'One response per user' },
              { value: 'multiple-per-user', label: 'Multiple responses per user' },
            ]}
          />
        </SettingCard>
        <SettingCard title="4. Submission By">
          <RadioGroup
            name="submissionBy"
            value={properties.submissionBy}
            onChange={(value) => patch({ submissionBy: value as ProcessProperties['submissionBy'] })}
            options={[
              { value: 'anyone', label: 'Anyone (one submitter completes it)' },
              { value: 'everyone', label: 'Everyone (all assignees must submit)' },
            ]}
          />
        </SettingCard>
        <SettingCard title="5. Date Range Selection">
          <RadioGroup
            name="dateRangeSelection"
            value={properties.dateRangeSelection}
            onChange={(value) => patch({ dateRangeSelection: value as ProcessProperties['dateRangeSelection'] })}
            options={[
              { value: 'allowed', label: 'Allowed (past/future dates)' },
              { value: 'restricted', label: 'Restricted (current date only)' },
            ]}
          />
        </SettingCard>
      </div>
    );
  }

  if (selectedSection === 'periodicity') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Process Periodicity</h3>
        {properties.occurrence === 'one-time' && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Periodicity applies when occurrence is set to Recurring.
          </div>
        )}
        <Tabs
          value={properties.periodicityType}
          onValueChange={(value) => patch({ periodicityType: value as ProcessProperties['periodicityType'] })}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Runs every day within the start and end time window.</p>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <Label className="text-sm">Select days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => (
                <Button
                  key={day.id}
                  type="button"
                  size="sm"
                  variant={properties.weeklyDays.includes(day.id) ? 'default' : 'outline'}
                  onClick={() => toggleWeekDay(day.id)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-4">
            {(['monthlyStart', 'monthlyEnd'] as const).map((key) => (
              <SettingCard key={key} title={key === 'monthlyStart' ? 'Start schedule' : 'End schedule'}>
                <RadioGroup
                  name={`${key}-mode`}
                  value={properties[key].mode}
                  onChange={(value) => patchMonthly(key, { mode: value as 'by-date' | 'by-interval' })}
                  options={[
                    { value: 'by-date', label: 'By date (specific days/months)' },
                    { value: 'by-interval', label: 'By interval (every N months)' },
                  ]}
                />
                {properties[key].mode === 'by-date' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Day of month</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={properties[key].days[0] ?? 1}
                        onChange={(e) =>
                          patchMonthly(key, { days: [Number(e.target.value) || 1] })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Months (comma-separated 1-12)</Label>
                      <Input
                        value={properties[key].months.join(',')}
                        onChange={(e) =>
                          patchMonthly(key, {
                            months: e.target.value
                              .split(',')
                              .map((v) => Number(v.trim()))
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Every N months</Label>
                      <Input
                        type="number"
                        min={1}
                        value={properties[key].intervalMonths}
                        onChange={(e) => patchMonthly(key, { intervalMonths: Number(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">On day</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={properties[key].dayOfMonth}
                        onChange={(e) => patchMonthly(key, { dayOfMonth: Number(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                )}
              </SettingCard>
            ))}
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4 mt-4">
            {(['yearlyStart', 'yearlyEnd'] as const).map((key) => (
              <SettingCard key={key} title={key === 'yearlyStart' ? 'Start schedule' : 'End schedule'}>
                <RadioGroup
                  name={`${key}-mode`}
                  value={properties[key].mode}
                  onChange={(value) => patchYearly(key, { mode: value as 'specific-date' | 'custom-rule' })}
                  options={[
                    { value: 'specific-date', label: 'Specific date each year' },
                    { value: 'custom-rule', label: 'Custom rule (e.g. 3rd Sunday of April)' },
                  ]}
                />
                {properties[key].mode === 'specific-date' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Month</Label>
                      <select
                        className="w-full border rounded px-2 py-2 text-sm"
                        value={properties[key].month}
                        onChange={(e) => patchYearly(key, { month: Number(e.target.value) })}
                      >
                        {MONTH_NAMES.map((name, index) => (
                          <option key={name} value={index + 1}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Day</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={properties[key].day}
                        onChange={(e) => patchYearly(key, { day: Number(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Week of month</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={properties[key].weekOfMonth}
                        onChange={(e) => patchYearly(key, { weekOfMonth: Number(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Day of week (0=Sun)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={6}
                        value={properties[key].dayOfWeek}
                        onChange={(e) => patchYearly(key, { dayOfWeek: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Month</Label>
                      <select
                        className="w-full border rounded px-2 py-2 text-sm"
                        value={properties[key].month}
                        onChange={(e) => patchYearly(key, { month: Number(e.target.value) })}
                      >
                        {MONTH_NAMES.map((name, index) => (
                          <option key={name} value={index + 1}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </SettingCard>
            ))}
          </TabsContent>
        </Tabs>

        <SettingCard title="Start Time & End Time" description="Mandatory for all periodicity types (local time).">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                className="w-40"
                value={properties.startTime}
                onChange={(e) => patch({ startTime: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                className="w-40"
                value={properties.endTime}
                onChange={(e) => patch({ endTime: e.target.value })}
              />
            </div>
          </div>
        </SettingCard>
      </div>
    );
  }

  if (selectedSection === 'reminders') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Reminders and Notifications</h3>
        <SettingCard title="Email Alerts for the Process">
          <RadioGroup
            name="emailAlerts"
            value={properties.emailAlerts ? 'yes' : 'no'}
            onChange={(value) => patch({ emailAlerts: value === 'yes' })}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </SettingCard>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Reminders</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => updateReminders([...properties.reminders, createReminder()])}>
              + Add Reminder
            </Button>
          </div>
          {properties.reminders.length === 0 && (
            <p className="text-sm text-muted-foreground">No reminders configured. Add one to alert users before/after start or end time.</p>
          )}
          {properties.reminders.map((reminder, index) => (
            <div key={reminder.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reminder {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateReminders(properties.reminders.filter((r) => r.id !== reminder.id))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Hours</Label>
                  <Input
                    type="number"
                    min={0}
                    value={reminder.hours}
                    onChange={(e) => {
                      const next = properties.reminders.map((r) =>
                        r.id === reminder.id ? { ...r, hours: Number(e.target.value) || 0 } : r,
                      );
                      updateReminders(next);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Minutes</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={reminder.minutes}
                    onChange={(e) => {
                      const next = properties.reminders.map((r) =>
                        r.id === reminder.id ? { ...r, minutes: Number(e.target.value) || 0 } : r,
                      );
                      updateReminders(next);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">When</Label>
                  <select
                    className="w-full border rounded px-2 py-2 text-sm"
                    value={reminder.anchor}
                    onChange={(e) => {
                      const next = properties.reminders.map((r) =>
                        r.id === reminder.id ? { ...r, anchor: e.target.value as ReminderEntry['anchor'] } : r,
                      );
                      updateReminders(next);
                    }}
                  >
                    <option value="before-start">Before start time</option>
                    <option value="after-start">After start time</option>
                    <option value="before-end">Before end time</option>
                    <option value="after-end">After end time</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedSection === 'submissionReport') {
    const recipients = properties.reportRecipients;
    const patchRecipients = (partial: Partial<typeof recipients>) =>
      patch({ reportRecipients: { ...recipients, ...partial } });

    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Submission Report Settings</h3>
        <SettingCard title="Timing">
          <RadioGroup
            name="reportTiming"
            value={properties.reportTiming}
            onChange={(value) => patch({ reportTiming: value as ProcessProperties['reportTiming'] })}
            options={[
              { value: 'on-submission', label: 'On submission' },
              { value: 'after-review', label: 'After review (when review is enabled)' },
            ]}
          />
        </SettingCard>
        <SettingCard title="Who should receive the PDF report?">
          <div className="space-y-2">
            {[
              { key: 'submitter' as const, label: 'Submitter' },
              { key: 'storeManager' as const, label: 'Store Manager' },
              { key: 'custom' as const, label: 'Custom (users/designations)' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={recipients[item.key]}
                  onCheckedChange={(checked) => patchRecipients({ [item.key]: Boolean(checked) })}
                />
                {item.label}
              </label>
            ))}
            {recipients.custom && (
              <div className="ml-6 space-y-2 border-l pl-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={recipients.hierarchical}
                    onCheckedChange={(checked) => patchRecipients({ hierarchical: Boolean(checked) })}
                  />
                  Hierarchical
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={recipients.storeHierarchical}
                    onCheckedChange={(checked) => patchRecipients({ storeHierarchical: Boolean(checked) })}
                  />
                  Store Hierarchical
                </label>
              </div>
            )}
          </div>
        </SettingCard>
        <ToggleRow
          title="Provide link in Action Point Summary"
          description="Adds a direct submission report link to action point summaries."
          checked={properties.reportLinkInActionPointSummary}
          onCheckedChange={(checked) => patch({ reportLinkInActionPointSummary: checked })}
        />
      </div>
    );
  }

  if (selectedSection === 'review') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Review Settings</h3>
        <ToggleRow
          title="Enable process with review"
          description="When enabled, submissions go through reviewer levels (L1, L2, etc.) before completion."
          checked={properties.processWithReview}
          onCheckedChange={(checked) => patch({ processWithReview: checked })}
        />
        {properties.processWithReview && (
          <>
            <SettingCard
              title="Review levels & assignees"
              description="Submitter → Level 1 → Level 2 → … → final approval → reports. Correction returns to submitter only."
            >
              <ReviewLevelsEditor
                config={properties.reviewConfig}
                onChange={(reviewConfig) => patch({ reviewConfig })}
              />
            </SettingCard>
            <SettingCard title="Per-question review" description="Optional review questions in the Build tab.">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Review can be configured per question in the form builder.
              </p>
            </SettingCard>
          </>
        )}
      </div>
    );
  }

  if (selectedSection === 'advanceSettings') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Advance Settings</h3>
        <SettingCard title="Restrict or Track Location While Submitting">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={properties.geoFence} onCheckedChange={(c) => patch({ geoFence: Boolean(c) })} />
              Geo-Fence (restrict submissions to store radius)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={properties.captureGeoTag} onCheckedChange={(c) => patch({ captureGeoTag: Boolean(c) })} />
              Capture Geo-Tag (log location without blocking)
            </label>
          </div>
        </SettingCard>
        <ToggleRow
          title="Hide Scores & Compliance from Submissions"
          checked={properties.hideScoresCompliance}
          onCheckedChange={(checked) => patch({ hideScoresCompliance: checked })}
        />
        <ToggleRow
          title="Track Visual Merchandising Across Stores"
          description="Unlocks Visual Report view and filters photos by question tags."
          checked={properties.trackVisualMerchandising}
          onCheckedChange={(checked) => patch({ trackVisualMerchandising: checked })}
        />
        <ToggleRow
          title="Auto-Assign Users with Dynamic Assignment"
          description="Auto-assign new users matching designation and store mapping."
          checked={properties.dynamicAssignment}
          onCheckedChange={(checked) => patch({ dynamicAssignment: checked })}
        />
        <ToggleRow
          title="Carry Forward Action Points"
          description="Open, in-progress, and on-hold action points carry to the next submission."
          checked={properties.carryForwardActionPoints}
          onCheckedChange={(checked) => patch({ carryForwardActionPoints: checked })}
        />
        <ToggleRow
          title="Create Action Points from Reports"
          description="Allow raising action points from submission reports after fill."
          checked={properties.createActionPointsFromReports}
          onCheckedChange={(checked) => patch({ createActionPointsFromReports: checked })}
        />
        <ToggleRow
          title="Allow Offline Submission (Beta)"
          checked={properties.allowOfflineSubmission}
          onCheckedChange={(checked) => patch({ allowOfflineSubmission: checked })}
        />
        <SettingCard title="Make Reports Confidential">
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={properties.reportConfidentiality}
            onChange={(e) => patch({ reportConfidentiality: e.target.value as ProcessProperties['reportConfidentiality'] })}
          >
            <option value="none">Not confidential</option>
            <option value="admin-only">Only Admin</option>
            <option value="submitter-and-admin">Submitter & Admin</option>
          </select>
        </SettingCard>
        <SettingCard title="Set Process Priority">
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={properties.processPriority}
            onChange={(e) => patch({ processPriority: e.target.value as ProcessProperties['processPriority'] })}
          >
            <option value="1">Priority 1 (highest — Executive Dashboard)</option>
            <option value="2">Priority 2 (default)</option>
            <option value="3">Priority 3</option>
            <option value="4">Priority 4</option>
            <option value="5">Priority 5 (lowest)</option>
          </select>
        </SettingCard>
        <SettingCard title="Add Page Count (Paper Equivalent)">
          <Input
            type="number"
            min={0}
            value={properties.pageCount || ''}
            onChange={(e) => patch({ pageCount: Number(e.target.value) || 0 })}
            placeholder="Estimated manual pages replaced"
          />
        </SettingCard>
      </div>
    );
  }

  if (selectedSection === 'publicForm') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Public Form via URL or QR Code</h3>
        <ToggleRow
          title="Enable public form"
          description="Collect submissions from external users via a shareable URL or QR code after publish."
          checked={properties.publicFormEnabled}
          onCheckedChange={(checked) => patch({ publicFormEnabled: checked })}
        />
        {properties.publicFormEnabled && (
          <SettingCard title="After publish">
            <p className="text-sm text-muted-foreground">
              URL and QR code will be generated when the process is published. They appear in the process list under URL/QR.
            </p>
          </SettingCard>
        )}
      </div>
    );
  }

  if (selectedSection === 'language') {
    return (
      <div className="space-y-4 max-w-3xl">
        <h3 className="font-semibold text-lg">Language Settings</h3>
        <SettingCard title="Default language">
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={properties.defaultLanguage}
            onChange={(e) => patch({ defaultLanguage: e.target.value })}
          >
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </SettingCard>
        <SettingCard title="Supported languages" description="Selected languages appear in the builder for manual translations per question.">
          <div className="grid grid-cols-2 gap-2">
            {COMMON_LANGUAGES.map((lang) => (
              <label key={lang.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={properties.supportedLanguages.includes(lang.value)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...new Set([...properties.supportedLanguages, lang.value])]
                      : properties.supportedLanguages.filter((l) => l !== lang.value);
                    patch({ supportedLanguages: next.length ? next : [properties.defaultLanguage] });
                  }}
                />
                {lang.label}
              </label>
            ))}
          </div>
        </SettingCard>
      </div>
    );
  }

  return null;
}

export const PROPERTY_SECTIONS = [
  { id: 'process', label: 'Process', key: 'processSection' },
  { id: 'periodicity', label: 'Periodicity', key: 'periodicitySection' },
  { id: 'reminders', label: 'Reminders and Notifications', key: 'remindersSection' },
  { id: 'submissionReport', label: 'Submission Report', key: 'submissionReportSection' },
  { id: 'review', label: 'Review', key: 'reviewSection' },
  { id: 'advanceSettings', label: 'Advance Settings', key: 'advanceSettingsSection' },
  { id: 'publicForm', label: 'Public Form', key: 'publicFormSection' },
  { id: 'language', label: 'Language Settings', key: 'languageSettingsSection' },
];
