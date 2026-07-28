import { useEffect, useState } from "react";
import { Calendar, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchEntities, fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { fetchTicketCategories } from "@/lib/ticketApi";

export type AddTicketModalPayload = {
  tab: "auto" | "custom";
  storeId: string;
  categoryId?: string;
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
  dueDate?: Date;
  attachments?: { name: string; type: string; dataUrl: string }[];
};

interface AddTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTicket?: (data: AddTicketModalPayload) => void | Promise<void>;
}

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export default function AddTicketModal({
  open,
  onOpenChange,
  onCreateTicket,
}: AddTicketModalProps) {
  const [activeTab, setActiveTab] = useState<"auto" | "custom">("custom");
  const [storeId, setStoreId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [attachments, setAttachments] = useState<{ name: string; type: string; dataUrl: string }[]>([]);
  const [assignmentType, setAssignmentType] = useState<"users" | "team">("users");
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([
      fetchEntities().catch(() => []),
      fetchUsers(500).catch(() => []),
      fetchTicketCategories().catch(() => []),
    ])
      .then(([entityRows, userRows, categoryRows]) => {
        setStores(
          (entityRows || []).map((e: any) => ({
            id: e.id,
            name: e.storeName || e.name || e.entityId || e.id,
          })),
        );
        setUsers(
          (userRows || [])
            .map((u: any) => ({
              id: (u.userId ?? u.id) as string,
              label: getUserDisplayName(u),
            }))
            .filter((u) => u.id)
            .sort((a, b) => a.label.localeCompare(b.label)),
        );
        setCategories(categoryRows || []);
      })
      .finally(() => setLoadingOptions(false));
  }, [open]);

  const resetForm = () => {
    setCategoryId("");
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate(undefined);
    setAttachments([]);
    setAssignmentType("users");
    setPriority("Medium");
    setStoreId("");
    setActiveTab("custom");
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<{ name: string; type: string; dataUrl: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          type: file.type,
          dataUrl: String(reader.result || ""),
        });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Attachment must be 5 MB or smaller");
      return;
    }
    try {
      const attachment = await readFileAsDataUrl(file);
      setAttachments([attachment]);
    } catch {
      toast.error("Failed to read attachment");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!storeId) {
      toast.error("Store is required");
      return;
    }
    if (!assignedTo) {
      toast.error("Assignee is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }
    if (activeTab === "auto" && !categoryId) {
      toast.error("Category is required for auto tickets");
      return;
    }

    setSubmitting(true);
    try {
      await onCreateTicket?.({
        tab: activeTab,
        storeId,
        categoryId: categoryId || undefined,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTo,
        dueDate,
        attachments: attachments.length ? attachments : undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch {
      // Parent shows toast; keep modal open for retry
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = (cat: any) => {
    if (!cat?.parentId) return cat?.categoryName || cat?.name || cat?.id;
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent
      ? `${parent.categoryName || parent.name} / ${cat.categoryName || cat.name}`
      : cat.categoryName || cat.name;
  };

  const canSubmitAuto =
    Boolean(storeId && categoryId && title && description && priority && assignedTo && dueDate);
  const canSubmitCustom = Boolean(storeId && title && description && priority && assignedTo && dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Ticket</DialogTitle>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading form options…
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "auto" | "custom")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>
                  Store <span className="text-red-500">*</span>
                </Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No stores available
                      </SelectItem>
                    ) : (
                      stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No categories available
                      </SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {categoryLabel(cat)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Enter Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <AttachmentField attachments={attachments} onChange={handleFileChange} onClear={() => setAttachments([])} />

              <PriorityField priority={priority} onChange={setPriority} />

              <AssigneeField users={users} value={assignedTo} onChange={setAssignedTo} />

              <DueDateField dueDate={dueDate} onChange={setDueDate} />

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => void handleCreate()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!canSubmitAuto || submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Enter Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <PriorityField priority={priority} onChange={setPriority} />

              <div className="space-y-2">
                <Label>
                  Store <span className="text-red-500">*</span>
                </Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No stores available
                      </SelectItem>
                    ) : (
                      stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <AttachmentField attachments={attachments} onChange={handleFileChange} onClear={() => setAttachments([])} />

              <div className="space-y-2">
                <Label>Assignment Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment-type"
                      value="users"
                      checked={assignmentType === "users"}
                      onChange={() => setAssignmentType("users")}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span>Users</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment-type"
                      value="team"
                      checked={assignmentType === "team"}
                      onChange={() => setAssignmentType("team")}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span>Team</span>
                  </label>
                </div>
              </div>

              <AssigneeField
                users={users}
                value={assignedTo}
                onChange={setAssignedTo}
                label={assignmentType === "users" ? "Users" : "Team / User"}
              />

              <DueDateField dueDate={dueDate} onChange={setDueDate} />

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => void handleCreate()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!canSubmitCustom || submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PriorityField({
  priority,
  onChange,
}: {
  priority: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        Priority <span className="text-red-500">*</span>
      </Label>
      <Select value={priority} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AssigneeField({
  users,
  value,
  onChange,
  label = "Users",
}: {
  users: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} <span className="text-red-500">*</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Search users..." />
        </SelectTrigger>
        <SelectContent>
          {users.length === 0 ? (
            <SelectItem value="__none" disabled>
              No users available
            </SelectItem>
          ) : (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function DueDateField({
  dueDate,
  onChange,
}: {
  dueDate?: Date;
  onChange: (value: Date | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        Due Date <span className="text-red-500">*</span>
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Calendar className="mr-2 h-4 w-4" />
            {dueDate ? dueDate.toLocaleDateString() : "Select Due Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent mode="single" selected={dueDate} onSelect={onChange} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AttachmentField({
  attachments,
  onChange,
  onClear,
}: {
  attachments: { name: string; type: string; dataUrl: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <div className="flex items-center gap-2">
        <input type="file" id="ticket-attachments" onChange={onChange} className="hidden" />
        <label htmlFor="ticket-attachments">
          <Button type="button" variant="outline" size="sm" asChild>
            <span className="flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload
            </span>
          </Button>
        </label>
        {attachments[0] && (
          <span className="text-sm text-gray-600 flex items-center gap-2">
            {attachments[0].name}
            <button type="button" onClick={onClear} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
