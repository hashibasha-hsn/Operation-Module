import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { createActionPoint } from "@/lib/actionPointApi";

type ManualActionPointDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionText: string;
  questionId: string;
  submissionId: string;
  workflowType: "process" | "audit";
  workflowId: string;
  storeId: string;
  stores: Array<{ id: string; storeName?: string; entityName?: string; name?: string }>;
  users?: Array<{ id?: string; userId?: string; name?: string; email?: string }>;
  defaultStoreId?: string;
  onCreated?: () => void;
};

export default function ManualActionPointDialog({
  open,
  onOpenChange,
  questionText,
  questionId,
  submissionId,
  workflowType,
  workflowId,
  storeId: defaultStore,
  stores,
  users = [],
  defaultStoreId,
  onCreated,
}: ManualActionPointDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [storeId, setStoreId] = useState(defaultStoreId || defaultStore || "");
  const [assignedTo, setAssignedTo] = useState("");
  const [closureAssignedTo, setClosureAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const assigneeValue = (user: { id?: string; userId?: string }) => user.userId ?? user.id ?? "";

  const handleSubmit = async () => {
    if (!title.trim() || !assignedTo) return;
    setSaving(true);
    try {
      await createActionPoint({
        title: title.trim(),
        description: description.trim() || `Follow-up for: ${questionText}`,
        priority,
        storeId: storeId || defaultStore,
        assignedTo,
        closureAssignedTo: closureAssignedTo || assignedTo,
        dueDate: dueDate || undefined,
        submissionId,
        questionId,
        workflowType,
        workflowId,
        triggerType: "manual",
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("raiseActionPoint")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{questionText}</p>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label>{t("title")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("actionPointTitlePlaceholder")} />
          </div>
          <div className="grid gap-1">
            <Label>{t("description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-1">
            <Label>{t("selectStore")}</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectStore")} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.storeName || s.entityName || s.name || s.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>{t("priority")}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("low")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>{t("assignedTo")} *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectAssignee")} />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id ?? u.userId ?? u.email} value={assigneeValue(u)}>
                    {u.name || u.email || u.userId || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>{t("closureAssigned")}</Label>
            <Select value={closureAssignedTo} onValueChange={setClosureAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectAssignee")} />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={`closure-${u.id ?? u.userId ?? u.email}`} value={assigneeValue(u)}>
                    {u.name || u.email || u.userId || u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>{t("dueDate")}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || !assignedTo}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
