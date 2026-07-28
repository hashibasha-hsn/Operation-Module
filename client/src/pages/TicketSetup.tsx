import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Plus, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  applyTicketClosureRules,
  createTicketCategory,
  createTicketClosureQuestion,
  createTicketRule,
  createTicketTag,
  deleteTicketCategory,
  deleteTicketClosureQuestion,
  deleteTicketRule,
  deleteTicketTag,
  fetchTicketCategories,
  fetchTicketClosureQuestions,
  fetchTicketRules,
  fetchTicketSettings,
  fetchTicketTags,
  updateTicketCategory,
  updateTicketClosureQuestion,
  updateTicketRule,
  updateTicketSettings,
  updateTicketTag,
} from "@/lib/ticketApi";
import { fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { humanLabel } from "@/lib/displayLabels";

type PriorityLevel = {
  key: string;
  label: string;
  enabled: boolean;
  defaultDueDays: number;
  color: string;
};

const DEFAULT_PRIORITY_LEVELS: PriorityLevel[] = [
  { key: "highest", label: "Highest", enabled: true, defaultDueDays: 1, color: "#dc2626" },
  { key: "high", label: "High", enabled: true, defaultDueDays: 2, color: "#ea580c" },
  { key: "medium", label: "Medium", enabled: true, defaultDueDays: 3, color: "#ca8a04" },
  { key: "low", label: "Low", enabled: true, defaultDueDays: 5, color: "#2563eb" },
  { key: "lowest", label: "Lowest", enabled: true, defaultDueDays: 7, color: "#6b7280" },
];

const STATUS_OPTIONS = [
  "open",
  "in_progress",
  "on_hold",
  "complete",
  "rejected",
];

const emptyTagForm = {
  tagName: "",
  tagType: "ticket",
  tagValues: "",
  isMandatory: false,
};

const emptyCategoryForm = {
  categoryName: "",
  parentId: "",
  priority: "medium",
  assigneeIds: [] as string[],
  daysFromNow: "3",
};

const emptyRuleForm = {
  ruleType: "completed_at",
  daysAfter: "7",
  targetStatuses: ["complete"] as string[],
  isActive: true,
};

const emptyQuestionForm = {
  questionText: "",
  questionType: "text",
  options: "",
  isRequired: true,
  isActive: true,
  displayOrder: "0",
};

function buildCategoryTree(categories: any[]) {
  const byParent = new Map<string, any[]>();
  categories.forEach((cat) => {
    const key = cat.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  });

  const rows: Array<{ cat: any; depth: number }> = [];
  const walk = (parentId: string, depth: number) => {
    const children = byParent.get(parentId) || [];
    children
      .sort((a, b) => String(a.categoryName).localeCompare(String(b.categoryName)))
      .forEach((cat) => {
        rows.push({ cat, depth });
        walk(cat.id, depth + 1);
      });
  };
  walk("root", 0);
  return rows;
}

export default function TicketSetup() {
  const [tags, setTags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [settings, setSettings] = useState({
    attachmentMandatory: false,
    disableTicketDelete: false,
    hidePriorities: false,
    priorityLevels: DEFAULT_PRIORITY_LEVELS,
  });

  const [tagForm, setTagForm] = useState(emptyTagForm);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [applyingRules, setApplyingRules] = useState(false);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const loadAll = async () => {
    try {
      const [tagData, categoryData, ruleData, settingsData, questionData] = await Promise.all([
        fetchTicketTags(),
        fetchTicketCategories(),
        fetchTicketRules(),
        fetchTicketSettings(),
        fetchTicketClosureQuestions(),
      ]);
      setTags(tagData || []);
      setCategories(categoryData || []);
      setRules(ruleData || []);
      setQuestions(questionData || []);
      setSettings({
        attachmentMandatory: settingsData?.attachmentMandatory ?? false,
        disableTicketDelete: settingsData?.disableTicketDelete ?? false,
        hidePriorities: settingsData?.hidePriorities ?? false,
        priorityLevels:
          Array.isArray(settingsData?.priorityLevels) && settingsData.priorityLevels.length
            ? settingsData.priorityLevels
            : DEFAULT_PRIORITY_LEVELS,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load ticket setup");
    }
  };

  useEffect(() => {
    loadAll();
    fetchUsers(200)
      .then((rows) =>
        setUsers(
          rows
            .map((user: any) => ({
              id: user.userId ?? user.id,
              label: getUserDisplayName(user),
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
      )
      .catch(() => setUsers([]));
  }, []);

  const resetTagForm = () => {
    setTagForm(emptyTagForm);
    setEditingTagId(null);
  };

  const handleSaveTag = async () => {
    if (!tagForm.tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    const payload = {
      tagName: tagForm.tagName.trim(),
      tagType: tagForm.tagType,
      tagValues: tagForm.tagValues
        ? tagForm.tagValues.split(",").map((v) => v.trim()).filter(Boolean)
        : [],
      isMandatory: tagForm.isMandatory,
      isActive: true,
    };
    try {
      if (editingTagId) {
        await updateTicketTag(editingTagId, payload);
        toast.success("Ticket tag updated");
      } else {
        await createTicketTag(payload);
        toast.success("Ticket tag created");
      }
      resetTagForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to save tag");
    }
  };

  const startEditTag = (tag: any) => {
    setEditingTagId(tag.id);
    setTagForm({
      tagName: tag.tagName || "",
      tagType: tag.tagType || "ticket",
      tagValues: (tag.tagValues || []).join(", "),
      isMandatory: !!tag.isMandatory,
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const payload = {
      categoryName: categoryForm.categoryName.trim(),
      parentId: categoryForm.parentId || null,
      priority: categoryForm.priority,
      assigneeIds: categoryForm.assigneeIds,
      teamIds: [],
      dueDateConfig: { daysFromNow: Number(categoryForm.daysFromNow) || 3 },
      isActive: true,
    };
    try {
      if (editingCategoryId) {
        await updateTicketCategory(editingCategoryId, payload);
        toast.success("Category updated");
      } else {
        await createTicketCategory(payload);
        toast.success("Auto ticket category created");
      }
      resetCategoryForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const startEditCategory = (cat: any) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      categoryName: cat.categoryName || "",
      parentId: cat.parentId || "",
      priority: cat.priority || "medium",
      assigneeIds: Array.isArray(cat.assigneeIds) ? cat.assigneeIds : [],
      daysFromNow: String(cat.dueDateConfig?.daysFromNow ?? 3),
    });
  };

  const toggleAssignee = (userId: string, checked: boolean) => {
    setCategoryForm((prev) => ({
      ...prev,
      assigneeIds: checked
        ? [...prev.assigneeIds, userId]
        : prev.assigneeIds.filter((id) => id !== userId),
    }));
  };

  const resetRuleForm = () => {
    setRuleForm(emptyRuleForm);
    setEditingRuleId(null);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.targetStatuses.length) {
      toast.error("Select at least one target status");
      return;
    }
    const payload = {
      ruleType: ruleForm.ruleType,
      daysAfter: Number(ruleForm.daysAfter) || 7,
      targetStatuses: ruleForm.targetStatuses,
      isActive: ruleForm.isActive,
    };
    try {
      if (editingRuleId) {
        await updateTicketRule(editingRuleId, payload);
        toast.success("Ticket rule updated");
      } else {
        await createTicketRule(payload);
        toast.success("Ticket rule created");
      }
      resetRuleForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to save rule");
    }
  };

  const startEditRule = (rule: any) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      ruleType: rule.ruleType || "completed_at",
      daysAfter: String(rule.daysAfter ?? 7),
      targetStatuses: Array.isArray(rule.targetStatuses) ? rule.targetStatuses : [],
      isActive: rule.isActive !== false,
    });
  };

  const toggleRuleStatus = (status: string, checked: boolean) => {
    setRuleForm((prev) => ({
      ...prev,
      targetStatuses: checked
        ? [...prev.targetStatuses, status]
        : prev.targetStatuses.filter((s) => s !== status),
    }));
  };

  const resetQuestionForm = () => {
    setQuestionForm(emptyQuestionForm);
    setEditingQuestionId(null);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    const payload = {
      questionText: questionForm.questionText.trim(),
      questionType: questionForm.questionType,
      options:
        questionForm.questionType === "dropdown"
          ? questionForm.options.split(",").map((v) => v.trim()).filter(Boolean)
          : [],
      isRequired: questionForm.isRequired,
      isActive: questionForm.isActive,
      displayOrder: Number(questionForm.displayOrder) || 0,
    };
    try {
      if (editingQuestionId) {
        await updateTicketClosureQuestion(editingQuestionId, payload);
        toast.success("Closure question updated");
      } else {
        await createTicketClosureQuestion(payload);
        toast.success("Closure question created");
      }
      resetQuestionForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to save question");
    }
  };

  const startEditQuestion = (question: any) => {
    setEditingQuestionId(question.id);
    setQuestionForm({
      questionText: question.questionText || "",
      questionType: question.questionType || "text",
      options: (question.options || []).join(", "),
      isRequired: question.isRequired !== false,
      isActive: question.isActive !== false,
      displayOrder: String(question.displayOrder ?? 0),
    });
  };

  const handleSaveSettings = async () => {
    try {
      await updateTicketSettings({
        attachmentMandatory: settings.attachmentMandatory,
        disableTicketDelete: settings.disableTicketDelete,
        hidePriorities: settings.hidePriorities,
        priorityLevels: settings.priorityLevels,
      });
      toast.success("Ticket settings saved");
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const updatePriorityLevel = (
    key: string,
    patch: Partial<PriorityLevel>,
  ) => {
    setSettings((prev) => ({
      ...prev,
      priorityLevels: prev.priorityLevels.map((level) =>
        level.key === key ? { ...level, ...patch } : level,
      ),
    }));
  };

  const handleApplyRules = async () => {
    try {
      setApplyingRules(true);
      const result = await applyTicketClosureRules();
      toast.success(`Applied rules — closed ${result?.closedCount ?? 0} ticket(s)`);
    } catch (error: any) {
      toast.error(error.message || "Failed to apply rules");
    } finally {
      setApplyingRules(false);
    }
  };

  const getUserLabel = (id: string) =>
    humanLabel(users.find((u) => u.id === id)?.label, "Unknown user");

  const parentOptions = categories.filter((c) => c.id !== editingCategoryId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/creator-mode">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Creator Mode
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ticket Setup</h1>
          <p className="text-sm text-muted-foreground">
            Configure tags, settings, priorities, auto categories, assignment, closure rules, and
            closure questions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tags">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="tags">Ticket Tags</TabsTrigger>
          <TabsTrigger value="settings">Ticket Settings</TabsTrigger>
          <TabsTrigger value="auto">Auto Tickets</TabsTrigger>
          <TabsTrigger value="rules">Closure Rules</TabsTrigger>
          <TabsTrigger value="questions">Closure Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4 border rounded-lg p-4 bg-white">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                value={tagForm.tagName}
                onChange={(e) => setTagForm({ ...tagForm, tagName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tag Type</Label>
              <Select
                value={tagForm.tagType}
                onValueChange={(value) => setTagForm({ ...tagForm, tagType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tag Values (comma separated, optional)</Label>
              <Input
                value={tagForm.tagValues}
                onChange={(e) => setTagForm({ ...tagForm, tagValues: e.target.value })}
                placeholder="Low, Medium, High"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={tagForm.isMandatory}
                onCheckedChange={(checked) => setTagForm({ ...tagForm, isMandatory: checked })}
              />
              <Label>Mandatory on ticket create</Label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleSaveTag}>
                <Plus className="w-4 h-4 mr-1" />
                {editingTagId ? "Update Tag" : "Create Tag"}
              </Button>
              {editingTagId && (
                <Button variant="outline" onClick={resetTagForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.tagName}</TableCell>
                  <TableCell>{tag.tagType}</TableCell>
                  <TableCell>{(tag.tagValues || []).join(", ") || "-"}</TableCell>
                  <TableCell>{tag.isMandatory ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditTag(tag)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete tag "${tag.tagName}"?`)) return;
                        try {
                          await deleteTicketTag(tag.id);
                          toast.success("Tag deleted");
                          loadAll();
                        } catch (error: any) {
                          toast.error(error.message || "Failed to delete tag");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!tags.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No tags configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="border rounded-lg p-4 bg-white space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <Label>Attachment mandatory on create</Label>
                <p className="text-xs text-muted-foreground">
                  Require at least one attachment when creating a ticket.
                </p>
              </div>
              <Switch
                checked={settings.attachmentMandatory}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, attachmentMandatory: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Disable ticket delete</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent users from permanently deleting tickets.
                </p>
              </div>
              <Switch
                checked={settings.disableTicketDelete}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, disableTicketDelete: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Hide priorities on create form</Label>
                <p className="text-xs text-muted-foreground">
                  Hide the priority picker on ticket creation (defaults still apply).
                </p>
              </div>
              <Switch
                checked={settings.hidePriorities}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, hidePriorities: checked })
                }
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div>
                <h3 className="font-semibold">Priority levels</h3>
                <p className="text-xs text-muted-foreground">
                  Enable/disable levels and set default due days applied when no due date is chosen.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Default due (days)</TableHead>
                    <TableHead>Color</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.priorityLevels.map((level) => (
                    <TableRow key={level.key}>
                      <TableCell>
                        <Switch
                          checked={level.enabled}
                          onCheckedChange={(checked) =>
                            updatePriorityLevel(level.key, { enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="capitalize">{level.key}</TableCell>
                      <TableCell>
                        <Input
                          value={level.label}
                          onChange={(e) =>
                            updatePriorityLevel(level.key, { label: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={level.defaultDueDays}
                          onChange={(e) =>
                            updatePriorityLevel(level.key, {
                              defaultDueDays: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="color"
                          className="w-16 h-9 p-1"
                          value={level.color}
                          onChange={(e) =>
                            updatePriorityLevel(level.key, { color: e.target.value })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="auto" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4 border rounded-lg p-4 bg-white">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={categoryForm.categoryName}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, categoryName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={categoryForm.parentId || "none"}
                onValueChange={(value) =>
                  setCategoryForm({
                    ...categoryForm,
                    parentId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Priority</Label>
              <Select
                value={categoryForm.priority}
                onValueChange={(value) =>
                  setCategoryForm({ ...categoryForm, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.priorityLevels
                    .filter((p) => p.enabled)
                    .map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due in (days)</Label>
              <Input
                type="number"
                min={0}
                value={categoryForm.daysFromNow}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, daysFromNow: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Auto-assign users</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users loaded.</p>
                )}
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={categoryForm.assigneeIds.includes(user.id)}
                      onCheckedChange={(checked) =>
                        toggleAssignee(user.id, checked === true)
                      }
                    />
                    {user.label}
                  </label>
                ))}
              </div>
              {categoryForm.assigneeIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  First selected user is assigned when creating an auto ticket.
                </p>
              )}
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleSaveCategory}>
                <Plus className="w-4 h-4 mr-1" />
                {editingCategoryId ? "Update Category" : "Create Category"}
              </Button>
              {editingCategoryId && (
                <Button variant="outline" onClick={resetCategoryForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category tree</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Days</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryTree.map(({ cat, depth }) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <span style={{ paddingLeft: `${depth * 16}px` }} className="inline-flex gap-2">
                      {depth > 0 && <span className="text-muted-foreground">↳</span>}
                      {cat.categoryName}
                    </span>
                  </TableCell>
                  <TableCell>{cat.priority}</TableCell>
                  <TableCell>{cat.dueDateConfig?.daysFromNow ?? "-"}</TableCell>
                  <TableCell>
                    {(cat.assigneeIds || []).length
                      ? (cat.assigneeIds as string[]).map(getUserLabel).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditCategory(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete category "${cat.categoryName}"?`)) return;
                        try {
                          await deleteTicketCategory(cat.id);
                          toast.success("Category deleted");
                          loadAll();
                        } catch (error: any) {
                          toast.error(error.message || "Failed to delete category");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!categories.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No auto ticket categories yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleApplyRules} disabled={applyingRules}>
              <Play className="w-4 h-4 mr-1" />
              {applyingRules ? "Applying..." : "Run closure rules now"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 border rounded-lg p-4 bg-white">
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={ruleForm.ruleType}
                onValueChange={(value) => setRuleForm({ ...ruleForm, ruleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed_at">
                    Auto-close X days after completed_at
                  </SelectItem>
                  <SelectItem value="created_at">
                    Auto-close X days after created_at
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days After</Label>
              <Input
                type="number"
                min={0}
                value={ruleForm.daysAfter}
                onChange={(e) => setRuleForm({ ...ruleForm, daysAfter: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Target Statuses</Label>
              <div className="flex flex-wrap gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={ruleForm.targetStatuses.includes(status)}
                      onCheckedChange={(checked) =>
                        toggleRuleStatus(status, checked === true)
                      }
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleSaveRule}>
                <Plus className="w-4 h-4 mr-1" />
                {editingRuleId ? "Update Rule" : "Create Rule"}
              </Button>
              {editingRuleId && (
                <Button variant="outline" onClick={resetRuleForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Days After</TableHead>
                <TableHead>Statuses</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.ruleType}</TableCell>
                  <TableCell>{rule.daysAfter}</TableCell>
                  <TableCell>{(rule.targetStatuses || []).join(", ")}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditRule(rule)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("Delete this closure rule?")) return;
                        try {
                          await deleteTicketRule(rule.id);
                          toast.success("Rule deleted");
                          loadAll();
                        } catch (error: any) {
                          toast.error(error.message || "Failed to delete rule");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rules.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No closure rules configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4 border rounded-lg p-4 bg-white">
            <div className="space-y-2 md:col-span-2">
              <Label>Question Text</Label>
              <Input
                value={questionForm.questionText}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, questionText: e.target.value })
                }
                placeholder="Was the root cause fixed?"
              />
            </div>
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(value) =>
                  setQuestionForm({ ...questionForm, questionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="yes_no">Yes / No</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={questionForm.displayOrder}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, displayOrder: e.target.value })
                }
              />
            </div>
            {questionForm.questionType === "dropdown" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Options (comma separated)</Label>
                <Input
                  value={questionForm.options}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, options: e.target.value })
                  }
                  placeholder="Resolved, Partially resolved, Escalated"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.isRequired}
                onCheckedChange={(checked) =>
                  setQuestionForm({ ...questionForm, isRequired: checked })
                }
              />
              <Label>Required before close</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.isActive}
                onCheckedChange={(checked) =>
                  setQuestionForm({ ...questionForm, isActive: checked })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleSaveQuestion}>
                <Plus className="w-4 h-4 mr-1" />
                {editingQuestionId ? "Update Question" : "Create Question"}
              </Button>
              {editingQuestionId && (
                <Button variant="outline" onClick={resetQuestionForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.displayOrder}</TableCell>
                  <TableCell>{question.questionText}</TableCell>
                  <TableCell>{question.questionType}</TableCell>
                  <TableCell>{question.isRequired ? "Yes" : "No"}</TableCell>
                  <TableCell>{question.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditQuestion(question)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("Delete this closure question?")) return;
                        try {
                          await deleteTicketClosureQuestion(question.id);
                          toast.success("Question deleted");
                          loadAll();
                        } catch (error: any) {
                          toast.error(error.message || "Failed to delete question");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!questions.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No closure questions configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
