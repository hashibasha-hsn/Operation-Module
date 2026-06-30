import { useEffect, useState } from "react";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTicketCategory,
  createTicketRule,
  createTicketTag,
  deleteTicketCategory,
  deleteTicketRule,
  deleteTicketTag,
  fetchTicketCategories,
  fetchTicketRules,
  fetchTicketSettings,
  fetchTicketTags,
  updateTicketSettings,
} from "@/lib/ticketApi";

export default function TicketSetup() {
  const [tags, setTags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    attachmentMandatory: false,
    disableTicketDelete: false,
    hidePriorities: false,
  });

  const [tagForm, setTagForm] = useState({
    tagName: "",
    tagType: "ticket",
    tagValues: "",
    isMandatory: false,
  });

  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    parentId: "",
    priority: "medium",
    assigneeIds: "",
    daysFromNow: "3",
  });

  const [ruleForm, setRuleForm] = useState({
    ruleType: "completed_at",
    daysAfter: "7",
    targetStatuses: "on_hold",
  });

  const loadAll = async () => {
    try {
      const [tagData, categoryData, ruleData, settingsData] = await Promise.all([
        fetchTicketTags(),
        fetchTicketCategories(),
        fetchTicketRules(),
        fetchTicketSettings(),
      ]);
      setTags(tagData || []);
      setCategories(categoryData || []);
      setRules(ruleData || []);
      setSettings({
        attachmentMandatory: settingsData?.attachmentMandatory ?? false,
        disableTicketDelete: settingsData?.disableTicketDelete ?? false,
        hidePriorities: settingsData?.hidePriorities ?? false,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load ticket setup");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateTag = async () => {
    if (!tagForm.tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    try {
      await createTicketTag({
        tagName: tagForm.tagName.trim(),
        tagType: tagForm.tagType,
        tagValues: tagForm.tagValues
          ? tagForm.tagValues.split(",").map((v) => v.trim()).filter(Boolean)
          : [],
        isMandatory: tagForm.isMandatory,
      });
      setTagForm({ tagName: "", tagType: "ticket", tagValues: "", isMandatory: false });
      loadAll();
      toast.success("Ticket tag created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create tag");
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await createTicketCategory({
        categoryName: categoryForm.categoryName.trim(),
        parentId: categoryForm.parentId || null,
        priority: categoryForm.priority,
        assigneeIds: categoryForm.assigneeIds
          ? categoryForm.assigneeIds.split(",").map((v) => v.trim()).filter(Boolean)
          : [],
        dueDateConfig: { daysFromNow: Number(categoryForm.daysFromNow) || 3 },
      });
      setCategoryForm({
        categoryName: "",
        parentId: "",
        priority: "medium",
        assigneeIds: "",
        daysFromNow: "3",
      });
      loadAll();
      toast.success("Auto ticket category created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    }
  };

  const handleCreateRule = async () => {
    try {
      await createTicketRule({
        ruleType: ruleForm.ruleType,
        daysAfter: Number(ruleForm.daysAfter) || 7,
        targetStatuses: ruleForm.targetStatuses
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        isActive: true,
      });
      setRuleForm({ ruleType: "completed_at", daysAfter: "7", targetStatuses: "on_hold" });
      loadAll();
      toast.success("Ticket rule created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create rule");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateTicketSettings(settings);
      toast.success("Ticket settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const rootCategories = categories.filter((c) => !c.parentId);

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
            Configure tags, settings, auto tickets, and closure rules per Taqtics Issue Tickets.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tags">
        <TabsList>
          <TabsTrigger value="tags">Ticket Tags</TabsTrigger>
          <TabsTrigger value="settings">Ticket Settings</TabsTrigger>
          <TabsTrigger value="auto">Auto Tickets</TabsTrigger>
          <TabsTrigger value="rules">Ticket Rules</TabsTrigger>
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
              <Label>Mandatory</Label>
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateTag}>
                <Plus className="w-4 h-4 mr-1" />
                Create Tag
              </Button>
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteTicketTag(tag.id);
                        loadAll();
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="border rounded-lg p-4 bg-white space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <Label>Attachment mandatory on create</Label>
              <Switch
                checked={settings.attachmentMandatory}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, attachmentMandatory: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disable ticket delete</Label>
              <Switch
                checked={settings.disableTicketDelete}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, disableTicketDelete: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Hide priorities on create form</Label>
              <Switch
                checked={settings.hidePriorities}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, hidePriorities: checked })
                }
              />
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
                  {rootCategories.map((cat) => (
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
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="lowest">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due in (days)</Label>
              <Input
                type="number"
                value={categoryForm.daysFromNow}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, daysFromNow: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Assignee IDs (comma separated)</Label>
              <Input
                value={categoryForm.assigneeIds}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, assigneeIds: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateCategory}>
                <Plus className="w-4 h-4 mr-1" />
                Create Category
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Days</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.categoryName}</TableCell>
                  <TableCell>
                    {categories.find((c) => c.id === cat.parentId)?.categoryName || "-"}
                  </TableCell>
                  <TableCell>{cat.priority}</TableCell>
                  <TableCell>{cat.dueDateConfig?.daysFromNow ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteTicketCategory(cat.id);
                        loadAll();
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
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
                  <SelectItem value="completed_at">Completed At Rule</SelectItem>
                  <SelectItem value="created_at">Created At Rule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days After</Label>
              <Input
                type="number"
                value={ruleForm.daysAfter}
                onChange={(e) => setRuleForm({ ...ruleForm, daysAfter: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Target Statuses (comma separated)</Label>
              <Input
                value={ruleForm.targetStatuses}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, targetStatuses: e.target.value })
                }
                placeholder="open, in_progress, on_hold, complete"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateRule}>
                <Plus className="w-4 h-4 mr-1" />
                Create Rule
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Days After</TableHead>
                <TableHead>Statuses</TableHead>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteTicketRule(rule.id);
                        loadAll();
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
