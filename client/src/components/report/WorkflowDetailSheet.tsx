import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isAfter, startOfDay, endOfDay, parseISO, isValid, format } from "date-fns";
import {
  Users,
  Store,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { type DateFilter, resolveReportDateRange } from "@/lib/reportApi";
import { fileNameFromUrl, isUrlValue } from "@/lib/fileUpload";

function parseSubmittedAt(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return isValid(parsed) ? parsed : null;
}

export default function WorkflowDetailSheet({
  open,
  onClose,
  detailData,
  loading,
  storeLabel,
  userLabel,
}: {
  open: boolean;
  onClose: () => void;
  detailData: any;
  loading: boolean;
  storeLabel: (id?: string) => string;
  userLabel: (id?: string) => string;
}) {
  const { t } = useLanguage();
  const [detailFilter, setDetailFilter] = useState<DateFilter>("all");
  const [detailStartDate, setDetailStartDate] = useState<Date | undefined>();
  const [detailEndDate, setDetailEndDate] = useState<Date | undefined>();
  const [detailCalendarOpen, setDetailCalendarOpen] = useState(false);
  const [detailDraftStart, setDetailDraftStart] = useState<Date | undefined>();
  const [detailDraftEnd, setDetailDraftEnd] = useState<Date | undefined>();
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const reset = () => {
    setDetailFilter("all");
    setDetailStartDate(undefined);
    setDetailEndDate(undefined);
    setDetailCalendarOpen(false);
    setDetailDraftStart(undefined);
    setDetailDraftEnd(undefined);
    setExpandedSubmissionId(null);
  };

  const filteredDetailSubmissions = useMemo(() => {
    const rows = Array.isArray(detailData?.submissions) ? detailData.submissions : [];
    if (detailFilter === "all") return rows;

    const range = resolveReportDateRange({
      dateFilter: detailFilter,
      startDate: detailFilter === "custom" ? detailStartDate?.toISOString().slice(0, 10) : undefined,
      endDate: detailFilter === "custom" ? detailEndDate?.toISOString().slice(0, 10) : undefined,
    });
    if (!range.startDate && !range.endDate) return rows;

    return rows.filter((submission: any) => {
      const submittedAt = parseSubmittedAt(submission.submittedAt || submission.createdAt);
      if (!submittedAt) return false;
      if (range.startDate) {
        const start = startOfDay(parseISO(range.startDate));
        if (submittedAt < start) return false;
      }
      if (range.endDate) {
        const end = endOfDay(parseISO(range.endDate));
        if (submittedAt > end) return false;
      }
      return true;
    });
  }, [detailData, detailFilter, detailStartDate, detailEndDate]);

  const detailCompletedCount = useMemo(
    () => filteredDetailSubmissions.filter((s: any) => s.status === "completed").length,
    [filteredDetailSubmissions],
  );

  const workflow = detailData?.workflow;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{workflow?.title || "Workflow Details"}</SheetTitle>
          <SheetDescription>
            {workflow
              ? `${workflow.status || "—"} · ${
                  workflow.processTag
                    ? `Tag: ${workflow.processTag}`
                    : workflow.frequency
                      ? `Frequency: ${workflow.frequency}`
                      : "Workflow"
                }`
              : "Loading details..."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : !workflow ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No details found for this workflow.
          </div>
        ) : (
          <div className="mt-2 space-y-5">
            <WorkflowSummary workflow={workflow} userLabel={userLabel} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Users} label="Assigned Users" value={workflow.assigneeIds?.length ?? 0} />
              <StatCard icon={Store} label="Stores" value={workflow.storeIds?.length ?? 0} />
              <StatCard icon={FileText} label="Submissions" value={filteredDetailSubmissions.length} />
              <StatCard icon={CheckCircle2} label="Completed" value={detailCompletedCount} />
            </div>

            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Assigned Users ({workflow.assigneeIds?.length ?? 0})
              </p>
              {workflow.assigneeIds?.length ? (
                <div className="flex flex-wrap gap-2">
                  {workflow.assigneeIds.map((userId: string) => (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      {userLabel(userId)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No users assigned.</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap border-t pt-4">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Submissions
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Select value={detailFilter} onValueChange={(v) => setDetailFilter(v as DateFilter)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={t("dateRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTime")}</SelectItem>
                    <SelectItem value="today">{t("today")}</SelectItem>
                    <SelectItem value="week">{t("thisWeek")}</SelectItem>
                    <SelectItem value="month">{t("thisMonth")}</SelectItem>
                    {detailFilter === "custom" && <SelectItem value="custom">Custom</SelectItem>}
                  </SelectContent>
                </Select>
                <Popover
                  open={detailCalendarOpen}
                  onOpenChange={(open) => {
                    setDetailCalendarOpen(open);
                    if (open) {
                      setDetailDraftStart(detailStartDate);
                      setDetailDraftEnd(detailEndDate);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 ${detailFilter === "custom" ? "border-primary" : ""}`}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {detailFilter === "custom" && (detailStartDate || detailEndDate)
                        ? `${detailStartDate ? format(detailStartDate, "MMM d, yyyy") : "?"}${
                            detailEndDate ? ` – ${format(detailEndDate, "MMM d, yyyy")}` : ""
                          }`
                        : "Custom"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">From</p>
                        <Calendar mode="single" selected={detailDraftStart} onSelect={setDetailDraftStart} initialFocus />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">To</p>
                        <Calendar mode="single" selected={detailDraftEnd} onSelect={setDetailDraftEnd} />
                      </div>
                    </div>
                    {detailDraftStart &&
                      detailDraftEnd &&
                      isAfter(startOfDay(detailDraftStart), startOfDay(detailDraftEnd)) && (
                        <p className="text-xs text-destructive mt-2">From date must be on or before To date.</p>
                      )}
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDetailDraftStart(undefined);
                          setDetailDraftEnd(undefined);
                          setDetailStartDate(undefined);
                          setDetailEndDate(undefined);
                          setDetailFilter("all");
                          setDetailCalendarOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (detailDraftStart && detailDraftEnd && isAfter(startOfDay(detailDraftStart), startOfDay(detailDraftEnd))) return;
                          setDetailStartDate(detailDraftStart);
                          setDetailEndDate(detailDraftEnd);
                          setDetailFilter("custom");
                          setDetailCalendarOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              {filteredDetailSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No submissions in this range.
                </p>
              ) : (
                filteredDetailSubmissions.map((submission: any) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    workflow={workflow}
                    expanded={expandedSubmissionId === submission.id}
                    onToggle={() =>
                      setExpandedSubmissionId((prev) =>
                        prev === submission.id ? null : submission.id,
                      )
                    }
                    storeLabel={storeLabel}
                    userLabel={userLabel}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-3">
      <Icon className="w-4 h-4 text-teal-700 mb-1" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function WorkflowSummary({
  workflow,
  userLabel,
}: {
  workflow: any;
  userLabel: (id?: string) => string;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Status", value: workflow.status || "—" },
    { label: "Description", value: workflow.description || "—" },
    { label: "Frequency", value: workflow.frequency || "—" },
    {
      label: "Tags",
      value: workflow.processTags?.length
        ? workflow.processTags.join(", ")
        : workflow.processTag || "—",
    },
    { label: "Created By", value: userLabel(workflow.createdBy) },
    {
      label: "Created At",
      value: workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : "—",
    },
    {
      label: "Updated At",
      value: workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : "—",
    },
  ];
  return (
    <div className="rounded-lg border divide-y">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-medium break-all">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  workflow,
  expanded,
  onToggle,
  storeLabel,
  userLabel,
}: {
  submission: any;
  workflow: any;
  expanded: boolean;
  onToggle: () => void;
  storeLabel: (id?: string) => string;
  userLabel: (id?: string) => string;
}) {
  const statusColors: Record<string, string> = {
    completed: "default",
    new: "secondary",
    correction: "outline",
    rejected: "destructive",
    pending_review: "outline",
    draft: "secondary",
  };
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={(statusColors[submission.status] as any) || "outline"}>
            {submission.status}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {storeLabel(submission.storeId)} · {userLabel(submission.submittedBy)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleString()
              : submission.createdAt
                ? new Date(submission.createdAt).toLocaleString()
                : "—"}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-3 py-3 space-y-4">
          {workflow?.sections?.length ? (
            workflow.sections.map((section: any) => (
              <div key={section.id}>
                <p className="text-sm font-semibold mb-2">{section.title || "Section"}</p>
                <div className="rounded-md border divide-y">
                  {section.questions?.length ? (
                    section.questions.map((question: any, qi: number) => (
                      <AnswerRow key={question.id} question={question} answers={submission.answers} index={qi} />
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground px-3 py-2">No questions.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No form structure available.</p>
          )}
          {submission.reviewHistory?.length ? (
            <div>
              <p className="text-sm font-semibold mb-2">Review History</p>
              <div className="rounded-md border divide-y text-sm">
                {submission.reviewHistory.map((history: any, index: number) => (
                  <div key={index} className="px-3 py-2">
                    <span className="font-medium capitalize">{history.action || "Action"}</span>
                    {history.reviewerName || history.reviewerId ? (
                      <span> · {history.reviewerName || history.reviewerId}</span>
                    ) : null}
                    {history.timestamp ? (
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {submission.score != null ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Score:</span>{" "}
              <span className="font-medium">{submission.score}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AnswerRow({
  question,
  answers,
  index,
}: {
  question: any;
  answers: any;
  index: number;
}) {
  const responses = answers?.responses ?? {};
  const value = responses[question.id];
  const naValue = responses[`${question.id}:na`];
  const comment = responses[`${question.id}:comment`];
  const attachment = responses[`${question.id}:attachment`];

  const parsedArray =
    typeof value === "string" && value.startsWith("[") && value.endsWith("]")
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map((item: any) => String(item)) : null;
          } catch {
            return null;
          }
        })()
      : null;

  const answerText =
    value != null && value !== ""
      ? String(value)
      : naValue === "true"
        ? "N/A"
        : "No answer";

  const answerUrl = value != null && value !== "" && isUrlValue(value) ? String(value) : null;

  return (
    <div className="px-3 py-2 text-sm">
      <p className="font-medium">
        {index + 1}. {question.questionText}
        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="mt-0.5">
        {answerUrl ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {fileNameFromUrl(String(value))}
          </a>
        ) : parsedArray && parsedArray.length > 0 ? (
          <ul className="list-disc pl-5 space-y-0.5">
            {parsedArray.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <span className={answerText === "No answer" ? "italic text-muted-foreground" : ""}>
            {answerText}
          </span>
        )}
      </div>
      {comment && (
        <div className="mt-1 text-sm rounded-md border bg-muted/40 px-2 py-1">
          <span className="text-xs font-medium text-muted-foreground">Comment:</span> {comment}
        </div>
      )}
      {attachment && (
        <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
          Attachment:{" "}
          {isUrlValue(attachment) ? (
            <a
              href={String(attachment)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 underline break-all"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {fileNameFromUrl(String(attachment))}
            </a>
          ) : (
            <span>{attachment}</span>
          )}
        </div>
      )}
    </div>
  );
}
