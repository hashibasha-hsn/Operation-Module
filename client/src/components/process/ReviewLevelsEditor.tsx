import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { fetchUsers } from "@/lib/processApi";
import {
  hasDuplicateReviewers,
  isReviewConfigComplete,
  mergeReviewConfig,
  reviewerLabel,
  setReviewAssignee,
  setReviewLevelCount,
  type ReviewConfig,
} from "@/lib/reviewConfig";

type Props = {
  config: ReviewConfig;
  onChange: (config: ReviewConfig) => void;
};

export default function ReviewLevelsEditor({ config, onChange }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const merged = mergeReviewConfig(config);

  useEffect(() => {
    fetchUsers(200).then(setUsers).catch(() => setUsers([]));
  }, []);

  const duplicate = hasDuplicateReviewers(merged);
  const complete = isReviewConfigComplete(merged);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label>Number of review levels</Label>
          <Input
            type="number"
            min={1}
            className="w-32"
            value={merged.levels}
            onChange={(e) =>
              onChange(setReviewLevelCount(merged, Number(e.target.value) || 1))
            }
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange(setReviewLevelCount(merged, merged.levels + 1))}
        >
          <Plus className="h-4 w-4" />
          Add level
        </Button>
      </div>

      <div className="space-y-3">
        {Array.from({ length: merged.levels }, (_, i) => i + 1).map((level) => (
          <div key={level} className="flex items-center gap-3 flex-wrap rounded-lg border bg-white p-3">
            <span className="text-sm font-medium w-28 shrink-0">{reviewerLabel(level)}</span>
            <Select
              value={merged.assignees[String(level)] ?? ""}
              onValueChange={(userId) => onChange(setReviewAssignee(merged, level, userId))}
            >
              <SelectTrigger className="max-w-md flex-1 min-w-[200px]">
                <SelectValue placeholder="Select reviewer" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id ?? user.userId} value={user.id ?? user.userId}>
                    {user.name ?? user.fullName ?? user.email ?? user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {merged.levels > 1 && level === merged.levels && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(setReviewLevelCount(merged, merged.levels - 1))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {duplicate && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Each review level must have a different reviewer on this process/audit.
        </p>
      )}
      {!duplicate && !complete && (
        <p className="text-sm text-amber-700">Assign a reviewer for every level before publishing.</p>
      )}
      {complete && (
        <p className="text-sm text-green-700">
          Review chain: L1 → {merged.levels > 1 ? `L${merged.levels}` : "final"} — reports after last approval.
        </p>
      )}
    </div>
  );
}
