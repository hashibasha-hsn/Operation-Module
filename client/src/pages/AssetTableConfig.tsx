import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AssetTableConfig() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const [newTable, setNewTable] = useState({
    tableName: "",
    assignmentType: "global",
    enableCustomAssetId: false,
    lockTableOperations: false,
  });

  const [customFields, setCustomFields] = useState<any[]>([]);

  const [newField, setNewField] = useState({
    fieldName: "",
    fieldType: "text",
    isRequired: false,
  });

  const mockTables = [
    {
      id: "ATBL-001",
      tableName: "Equipment Assets",
      assignmentType: "global",
      enableCustomAssetId: true,
      lockTableOperations: false,
      customFieldsCount: 5,
      createdAt: "2024-01-15",
    },
    {
      id: "ATBL-002",
      tableName: "License & Permits",
      assignmentType: "limited",
      enableCustomAssetId: true,
      lockTableOperations: true,
      customFieldsCount: 3,
      createdAt: "2024-01-14",
    },
  ];

  const fieldTypes = [
    { value: "text", label: "Text", icon: FileText },
    { value: "number", label: "Number", icon: FileText },
    { value: "date", label: "Date", icon: Calendar },
    { value: "image", label: "Image", icon: ImageIcon },
    { value: "dropdown", label: "Dropdown", icon: FileText },
  ];

  const handleCreateTable = () => {
    console.log("Creating table:", newTable, customFields);
    setShowCreateDialog(false);
    setNewTable({
      tableName: "",
      assignmentType: "global",
      enableCustomAssetId: false,
      lockTableOperations: false,
    });
    setCustomFields([]);
  };

  const handleEditTable = () => {
    console.log("Editing table:", selectedTable);
    setShowEditDialog(false);
  };

  const handleAddField = () => {
    if (!newField.fieldName) return;
    setCustomFields([...customFields, { ...newField, id: Date.now() }]);
    setNewField({ fieldName: "", fieldType: "text", isRequired: false });
  };

  const handleRemoveField = (fieldId: number) => {
    setCustomFields(customFields.filter((f) => f.id !== fieldId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Asset Table Configuration</h1>
            <p className="text-muted-foreground mt-1">Configure and create asset tables</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4" />
          Create New Table
        </Button>
      </div>

      {/* Existing Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTables.map((table) => (
          <Card key={table.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{table.tableName}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={table.assignmentType === "global" ? "default" : "secondary"}>
                      {table.assignmentType === "global" ? "Global" : "Limited"}
                    </Badge>
                    {table.lockTableOperations && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedTable(table);
                      setShowEditDialog(true);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custom ID:</span>
                  <span>{table.enableCustomAssetId ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custom Fields:</span>
                  <span>{table.customFieldsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{table.createdAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Table Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset Table</DialogTitle>
            <DialogDescription>
              Configure a new asset table with custom fields and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Table Name */}
            <div className="grid gap-2">
              <Label htmlFor="tableName">Table Name *</Label>
              <Input
                id="tableName"
                placeholder="Enter table name"
                value={newTable.tableName}
                onChange={(e) => setNewTable({ ...newTable, tableName: e.target.value })}
              />
            </div>

            {/* Assignment Type */}
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

            {/* Custom Asset ID */}
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

            {/* Lock Table Operations */}
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

            {/* Custom Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Custom Fields</Label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Field
                </Button>
              </div>

              {/* Add New Field */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Required</Label>
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          checked={newField.isRequired}
                          onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                        />
                        <span className="text-sm">Make required</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddField} className="w-full">
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Fields List */}
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.fieldName}</TableCell>
                            <TableCell className="capitalize">{field.fieldType}</TableCell>
                            <TableCell>
                              {field.isRequired ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveField(field.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
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
            <Button onClick={handleCreateTable}>
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing Switch component - adding it inline
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
