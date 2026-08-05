import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  CheckCircle2,
  Undo2,
  XCircle,
  Clock,
  Users,
  Store,
} from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  approved: "Approved",
  correction: "Sent for correction",
  rejected: "Rejected",
  completed: "Completed",
};

function actionColor(action?: string): string {
  switch (action) {
    case "approved":
    case "completed":
      return "text-emerald-700";
    case "correction":
    case "rejected":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function ActionIcon({ action }: { action?: string }) {
  switch (action) {
    case "approved":
    case "completed":
      return <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />;
    case "correction":
      return <Undo2 className="w-4 h-4 shrink-0 text-red-600" />;
    case "rejected":
      return <XCircle className="w-4 h-4 shrink-0 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />;
  }
}

function humanLabel(name: string | undefined, fallback: string) {
  if (!name) return fallback;
  if (typeof name === "string" && name.includes("@")) {
    return fallback;
  }
  return name;
}

export default function ReviewTimelineDialog({
  submission,
  open,
  onClose,
  userNames,
  storeNames,
}: {
  submission: any;
  open: boolean;
  onClose: () => void;
  userNames: Record<string, string>;
  storeNames: Record<string, string>;
}) {
  if (!submission) return null;

  const history = Array.isArray(submission.reviewHistory)
    ? [...submission.reviewHistory].sort(
        (a: any, b: any) => (a.level ?? 0) - (b.level ?? 0),
      )
    : [];

  const title = submission.process?.title || submission.audit?.title || "Workflow";
  const store = submission.storeId ? humanLabel(storeNames[submission.storeId], "N/A") : "N/A";
  const submitter = submission.submittedBy
    ? humanLabel(userNames[submission.submittedBy], "N/A")
    : "N/A";

  const pendingLevel =
    submission.status === "pending_review" ? submission.currentReviewLevel || 1 : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Workflow review timeline</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Store className="w-3.5 h-3.5" />
            {store}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {submitter}
          </span>
          <Badge
            variant={
              submission.status === "completed"
                ? "default"
                : submission.status === "correction" || submission.status === "rejected"
                  ? "destructive"
                  : "outline"
            }
          >
            {submission.status === "pending_review"
              ? "Pending review"
              : submission.status || "—"}
          </Badge>
        </div>

        <div className="mt-4 space-y-0">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <Send className="w-4 h-4 shrink-0 text-primary" />
              <div className="w-px flex-1 bg-border" />
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium">Submitted</p>
              <p className="text-xs text-muted-foreground">
                by {submitter}
                {submission.submittedAt
                  ? ` · ${new Date(submission.submittedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
          </div>

          {history.map((entry: any, index: number) => {
            const reviewerName = entry.reviewerName || userNames[entry.reviewerId];
            return (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <ActionIcon action={entry.action} />
                  {index < history.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-5 min-w-0">
                  <p className="text-sm">
                    <span className={`font-medium capitalize ${actionColor(entry.action)}`}>
                      {ACTION_LABEL[entry.action] || entry.action || "Action"}
                    </span>
                    <span className="text-muted-foreground"> · Level {entry.level ?? "—"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {humanLabel(reviewerName, "Reviewer")}
                    {entry.timestamp
                      ? ` · ${new Date(entry.timestamp).toLocaleString()}`
                      : ""}
                  </p>
                  {entry.notes && (
                    <p className="text-xs mt-1 rounded-md border bg-muted/40 px-2 py-1">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {pendingLevel != null && (
            <div className="flex gap-3">
              <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Assigned to you · Level {pendingLevel}
                </p>
                <p className="text-xs text-muted-foreground">Waiting for your review</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
