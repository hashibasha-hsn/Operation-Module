import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Lock,
  Unlock,
  Calendar,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  Globe,
  Send,
  Archive,
  Hash,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAssetTables,
  createAssetTable,
  updateAssetTable,
  publishAssetTable,
  archiveAssetTable,
  deleteAssetTable,
  ASSET_FIELD_TYPES,
} from "@/lib/assetApi";
import { getOrganizationId, getCurrentUserId } from "@/lib/authStorage";

export default function AssetTableConfig() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const [newTable, setNewTable] = useState({
    tableName: "",
    assignmentType: "global",
    enableCustomAssetId: false,
    lockTableOperations: false,
    publishStatus: "draft",
    viewRoles: [] as string[],
    editRoles: [] as string[],
  });

  const [customFields, setCustomFields] = useState<any[]>([]);
  const [renewalConfigs, setRenewalConfigs] = useState<any[]>([]);

  const [newField, setNewField] = useState({
    fieldName: "",
    fieldType: "text",
    isRequired: false,
    options: "",
    visibility: "always",
    renewalReminder: false,
    renewalDaysBefore: 30,
  });

  const fieldTypeMeta: Record<string, any> = {
    text: { icon: FileText, label: "Text" },
    number: { icon: Hash, label: "Number" },
    date: { icon: Calendar, label: "Date" },
    dropdown: { icon: FileText, label: "Dropdown" },
    file: { icon: FileText, label: "File" },
    image: { icon: ImageIcon, label: "Image" },
  };

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await fetchAssetTables();
      setTables(data);
    } catch (error) {
      console.error("Failed to load asset tables:", error);
      toast.error("Failed to load asset tables");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTables();
  }, []);

  const handleCreateTable = async () => {
    if (!newTable.tableName.trim()) {
      toast.error("Table name is required");
      return;
    }
    try {
      await createAssetTable({
        ...newTable,
        tableName: newTable.tableName.trim(),
        customFields,
        renewalReminderConfig: renewalConfigs,
        createdBy: getCurrentUserId(),
        organizationId: getOrganizationId(),
      });
      toast.success("Asset table created");
      setShowCreateDialog(false);
      setNewTable({
        tableName: "",
        assignmentType: "global",
        enableCustomAssetId: false,
        lockTableOperations: false,
        publishStatus: "draft",
        viewRoles: [],
        editRoles: [],
      });
      setCustomFields([]);
      setRenewalConfigs([]);
      await loadTables();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create asset table");
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable) return;
    try {
      await updateAssetTable(selectedTable.id, {
        ...selectedTable,
        updatedBy: getCurrentUserId(),
      });
      toast.success("Asset table updated");
      setShowEditDialog(false);
      await loadTables();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update asset table");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAssetTable(id);
      toast.success("Asset table published");
      await loadTables();
    } catch (error: any) {
      toast.error(error?.message || "Failed to publish asset table");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAssetTable(id);
      toast.success("Asset table archived");
      await loadTables();
    } catch (error: any) {
      toast.error(error?.message || "Failed to archive asset table");
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await deleteAssetTable(id);
      toast.success("Asset table deleted");
      await loadTables();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete asset table");
    }
  };

  const handleAddField = () => {
    if (!newField.fieldName) {
      toast.error("Field name is required");
      return;
    }
    const field: any = {
      fieldName: newField.fieldName.trim(),
      fieldType: newField.fieldType,
      isRequired: newField.isRequired,
      visibility: newField.visibility,
    };
    if (newField.fieldType === "dropdown") {
      field.options = newField.options.split(",").map((o) => o.trim()).filter(Boolean);
    }
    if (newField.fieldType === "date" && newField.renewalReminder) {
      field.renewalReminder = {
        enabled: true,
        daysBefore: newField.renewalDaysBefore,
      };
    }
    setCustomFields([...customFields, field]);
    if (newField.fieldType === "date" && newField.renewalReminder) {
      setRenewalConfigs([
        ...renewalConfigs,
        { field: field.fieldName, daysBefore: newField.renewalDaysBefore, channel: "email", enabled: true },
      ]);
    }
    setNewField({
      fieldName: "",
      fieldType: "text",
      isRequired: false,
      options: "",
      visibility: "always",
      renewalReminder: false,
      renewalDaysBefore: 30,
    });
  };

  const handleRemoveField = (index: number) => {
    const removed = customFields[index];
    setCustomFields(customFields.filter((_, i) => i !== index));
    if (removed?.renewalReminder?.enabled) {
      setRenewalConfigs(renewalConfigs.filter((c) => c.field !== removed.fieldName));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Assets
      </Button>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Asset Table Configuration</h1>
            <p className="text-muted-foreground mt-1">Configure and create asset tables</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Table
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Asset Table</DialogTitle>
              <DialogDescription>
                Configure a new asset table with custom fields and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tableName">Table Name *</Label>
                <Input
                  id="tableName"
                  placeholder="Enter table name"
                  value={newTable.tableName}
                  onChange={(e) => setNewTable({ ...newTable, tableName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Assignment Type</Label>
                <Select
                  value={newTable.assignmentType}
                  onValueChange={(value) => setNewTable({ ...newTable, assignmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Global Assignment</div>
                          <div className="text-xs text-muted-foreground">
                            All users can view and manage assets
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="limited">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Limited Assignment</div>
                          <div className="text-xs text-muted-foreground">
                            Assets assigned to specific users/stores
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Custom Asset ID</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow users to enter custom asset IDs
                  </p>
                </div>
                <Switch
                  checked={newTable.enableCustomAssetId}
                  onCheckedChange={(checked) =>
                    setNewTable({ ...newTable, enableCustomAssetId: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Lock Table Operations</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Restrict editing to specific roles only
                  </p>
                </div>
                <Switch
                  checked={newTable.lockTableOperations}
                  onCheckedChange={(checked) =>
                    setNewTable({ ...newTable, lockTableOperations: checked })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Fields</Label>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Field Name</Label>
                        <Input
                          placeholder="Enter field name"
                          value={newField.fieldName}
                          onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Field Type</Label>
                        <Select
                          value={newField.fieldType}
                          onValueChange={(value) => setNewField({ ...newField, fieldType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSET_FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Visibility</Label>
                        <Select
                          value={newField.visibility}
                          onValueChange={(value) => setNewField({ ...newField, visibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="owner_only">Owner only</SelectItem>
                            <SelectItem value="conditional">Conditional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newField.fieldType === "dropdown" && (
                        <div className="grid gap-2">
                          <Label>Options (comma separated)</Label>
                          <Input
                            placeholder="Option A, Option B, Option C"
                            value={newField.options}
                            onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                          />
                        </div>
                      )}
                      {newField.fieldType === "date" && (
                        <>
                          <div className="grid gap-2">
                            <Label>Renewal Reminder</Label>
                            <div className="flex items-center gap-2 h-10">
                              <Switch
                                checked={newField.renewalReminder}
                                onCheckedChange={(checked) =>
                                  setNewField({ ...newField, renewalReminder: checked })
                                }
                              />
                              <span className="text-sm text-muted-foreground">Enable</span>
                            </div>
                          </div>
                          {newField.renewalReminder && (
                            <div className="grid gap-2">
                              <Label>Days Before</Label>
                              <Input
                                type="number"
                                min={1}
                                value={newField.renewalDaysBefore}
                                onChange={(e) =>
                                  setNewField({ ...newField, renewalDaysBefore: Number(e.target.value) })
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={newField.isRequired}
                            onCheckedChange={(checked) =>
                              setNewField({ ...newField, isRequired: checked })
                            }
                          />
                          <span className="text-sm">Required</span>
                        </div>
                        <Button onClick={handleAddField}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {customFields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Added Fields</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Renewal Reminder</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customFields.map((field, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{field.fieldName}</TableCell>
                              <TableCell className="capitalize">{field.fieldType}</TableCell>
                              <TableCell>
                                {field.isRequired ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell className="capitalize">{field.visibility}</TableCell>
                              <TableCell>
                                {field.renewalReminder?.enabled
                                  ? `${field.renewalReminder.daysBefore} days`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <TableActionsMenu>
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveField(index)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </TableActionsMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTable}>Create Table</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : tables.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          No asset tables yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{table.tableName}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={table.assignmentType === "global" ? "default" : "secondary"}>
                        {table.assignmentType === "global" ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" /> Global
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" /> Limited
                          </>
                        )}
                      </Badge>
                      <Badge
                        variant={
                          table.publishStatus === "published"
                            ? "default"
                            : table.publishStatus === "archived"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {table.publishStatus || "draft"}
                      </Badge>
                      {table.lockTableOperations && (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <TableActionsMenu>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedTable(table);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {table.publishStatus !== "published" && (
                      <DropdownMenuItem onClick={() => handlePublish(table.id)}>
                        <Send className="w-4 h-4 mr-2" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    {table.publishStatus !== "archived" && (
                      <DropdownMenuItem onClick={() => handleArchive(table.id)}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteTable(table.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </TableActionsMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom ID:</span>
                    <span>{table.enableCustomAssetId ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom Fields:</span>
                    <span>{Array.isArray(table.customFields) ? table.customFields.length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renewal Reminders:</span>
                    <span>
                      {Array.isArray(table.renewalReminderConfig)
                        ? table.renewalReminderConfig.length
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{table.createdAt ? new Date(table.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset Table</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Table Name</Label>
                <Input
                  value={selectedTable.tableName || ""}
                  onChange={(e) =>
                    setSelectedTable({ ...selectedTable, tableName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Assignment Type</Label>
                <Select
                  value={selectedTable.assignmentType || "global"}
                  onValueChange={(value) =>
                    setSelectedTable({ ...selectedTable, assignmentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Custom Asset ID</Label>
                <Switch
                  checked={Boolean(selectedTable.enableCustomAssetId)}
                  onCheckedChange={(checked) =>
                    setSelectedTable({ ...selectedTable, enableCustomAssetId: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Lock Table Operations</Label>
                <Switch
                  checked={Boolean(selectedTable.lockTableOperations)}
                  onCheckedChange={(checked) =>
                    setSelectedTable({ ...selectedTable, lockTableOperations: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTable}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
