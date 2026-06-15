import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Building2, Filter, MoreVertical, ChevronDown, Store, Settings, Upload } from "lucide-react";

export default function Entities() {
  const [showFunctional, setShowFunctional] = useState(true);
  const [showNonFunctional, setShowNonFunctional] = useState(true);
  const [activeTab, setActiveTab] = useState("Entity");
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [isEditEntityDialogOpen, setIsEditEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [entityFormData, setEntityFormData] = useState({
    storeName: "",
    area: "",
    entityId: "",
    storeStatus: "Functional",
    city: "",
    staff: "",
    status: true,
    latitude: "0.00000000",
    longitude: "0.00000000",
    storeRadius: "100",
  });
  const [entities, setEntities] = useState<any[]>([]);
  const [totalEntityCount, setTotalEntityCount] = useState(0);
  const [functionalEntityCount, setFunctionalEntityCount] = useState(0);
  const [nonFunctionalEntityCount, setNonFunctionalEntityCount] = useState(0);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([
    'storeName', 'area', 'entityId', 'storeStatus', 'createdAt', 'city', 'staff', 'status', 'action'
  ]);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entities?organizationId=default-org');
      const data = await response.json();
      setEntities(data || []);
      
      // Calculate counts
      setTotalEntityCount(data?.length || 0);
      setFunctionalEntityCount(data?.filter((e: any) => e.storeStatus === 'Functional').length || 0);
      setNonFunctionalEntityCount(data?.filter((e: any) => e.storeStatus === 'Non-Functional').length || 0);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    }
  };

  const handleCreateEntity = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entityFormData,
          organizationId: 'default-org',
          staff: parseInt(entityFormData.staff) || 0,
          latitude: parseFloat(entityFormData.latitude) || 0,
          longitude: parseFloat(entityFormData.longitude) || 0,
          storeRadius: parseInt(entityFormData.storeRadius) || 100,
        }),
      });

      if (response.ok) {
        setEntityFormData({
          storeName: "",
          area: "",
          entityId: "",
          storeStatus: "Functional",
          city: "",
          staff: "",
          status: true,
          latitude: "0.00000000",
          longitude: "0.00000000",
          storeRadius: "100",
        });
        setIsEntityDialogOpen(false);
        fetchEntities();
      } else {
        console.error('Failed to create entity');
      }
    } catch (err) {
      console.error('Error creating entity:', err);
    }
  };

  const handleEditEntity = (entity: any) => {
    setEditingEntity(entity);
    setEntityFormData({
      storeName: entity.storeName,
      area: entity.area,
      entityId: entity.entityId,
      storeStatus: entity.storeStatus,
      city: entity.city,
      staff: entity.staff?.toString() || "",
      status: entity.status,
      latitude: entity.latitude?.toString() || "0.00000000",
      longitude: entity.longitude?.toString() || "0.00000000",
      storeRadius: entity.storeRadius?.toString() || "100",
    });
    setIsEditEntityDialogOpen(true);
  };

  const handleUpdateEntity = async () => {
    if (!editingEntity) return;

    try {
      const response = await fetch(`http://localhost:3009/api/org/entities/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entityFormData,
          staff: parseInt(entityFormData.staff) || 0,
          latitude: parseFloat(entityFormData.latitude) || 0,
          longitude: parseFloat(entityFormData.longitude) || 0,
          storeRadius: parseInt(entityFormData.storeRadius) || 100,
        }),
      });

      if (response.ok) {
        setEntityFormData({
          storeName: "",
          area: "",
          entityId: "",
          storeStatus: "Functional",
          city: "",
          staff: "",
          status: true,
          latitude: "0.00000000",
          longitude: "0.00000000",
          storeRadius: "100",
        });
        setEditingEntity(null);
        setIsEditEntityDialogOpen(false);
        fetchEntities();
      } else {
        console.error('Failed to update entity');
      }
    } catch (err) {
      console.error('Error updating entity:', err);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) return;

    try {
      const response = await fetch(`http://localhost:3009/api/org/entities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEntities();
      } else {
        console.error('Failed to delete entity');
      }
    } catch (err) {
      console.error('Error deleting entity:', err);
    }
  };

  const handleToggleEntityStatus = async (entity: any) => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/entities/${entity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entity,
          status: !entity.status,
        }),
      });

      if (response.ok) {
        fetchEntities();
      } else {
        console.error('Failed to update entity status');
      }
    } catch (err) {
      console.error('Error updating entity status:', err);
    }
  };

  const handleToggleColumn = (column: string) => {
    if (visibleColumns.includes(column)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((col) => col !== column));
      }
    } else {
      if (visibleColumns.length < 8) {
        setVisibleColumns([...visibleColumns, column]);
      } else {
        alert('You can select a maximum of 8 fields at a time');
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('organizationId', 'default-org');

      const response = await fetch('http://localhost:3009/api/org/entities/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setBulkFile(null);
        setIsBulkUploadDialogOpen(false);
        fetchEntities();
        alert('Bulk upload successful');
      } else {
        console.error('Failed to bulk upload entities');
        alert('Bulk upload failed');
      }
    } catch (err) {
      console.error('Error bulk uploading entities:', err);
      alert('Bulk upload failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Entities Management</h1>
            <p className="text-muted-foreground mt-1">Manage business entities and locations</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {["Entity", "Tags", "Removed Entity"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === "Entity" ? (
        <>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
              <Store className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm font-medium">Total Entity: {totalEntityCount}</p>
            </div>
            <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
              <p className="text-sm font-medium">Functional: {functionalEntityCount}</p>
            </div>
            <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
              <p className="text-sm font-medium">Non-Functional: {nonFunctionalEntityCount}</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Entity"
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All</DropdownMenuItem>
                <DropdownMenuItem>Functional</DropdownMenuItem>
                <DropdownMenuItem>Non-Functional</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Store Name (ASC)
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Store Name (ASC)</DropdownMenuItem>
                <DropdownMenuItem>Store Name (DESC)</DropdownMenuItem>
                <DropdownMenuItem>Area (ASC)</DropdownMenuItem>
                <DropdownMenuItem>Area (DESC)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">Apply</Button>
            <Button variant="ghost">Reset</Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Entity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Entities</DialogTitle>
                  <DialogDescription>
                    Upload a CSV or Excel file to create multiple entities at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkFile">Upload File</Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="bulkFile"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {bulkFile ? bulkFile.name : "Click to upload CSV or Excel file"}
                          </p>
                        </div>
                        <input
                          id="bulkFile"
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Required Columns</Label>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      <p className="font-medium mb-2">Your file must include these columns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Store Name</li>
                        <li>Entity ID</li>
                        <li>Area</li>
                        <li>City</li>
                        <li>Store Status</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkUpload}>
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Entity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Entity</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new entity.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={entityFormData.storeName}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeName: e.target.value })}
                        placeholder="Enter store name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityId">Entity Id</Label>
                      <Input
                        id="entityId"
                        value={entityFormData.entityId}
                        onChange={(e) => setEntityFormData({ ...entityFormData, entityId: e.target.value })}
                        placeholder="Enter entity ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">Area</Label>
                      <Input
                        id="area"
                        value={entityFormData.area}
                        onChange={(e) => setEntityFormData({ ...entityFormData, area: e.target.value })}
                        placeholder="Enter area"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={entityFormData.city}
                        onChange={(e) => setEntityFormData({ ...entityFormData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeStatus">Store-Status</Label>
                      <Select
                        value={entityFormData.storeStatus}
                        onValueChange={(value) => setEntityFormData({ ...entityFormData, storeStatus: value })}
                      >
                        <SelectTrigger id="storeStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Functional">Functional</SelectItem>
                          <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff">Staff</Label>
                      <Input
                        id="staff"
                        type="number"
                        value={entityFormData.staff}
                        onChange={(e) => setEntityFormData({ ...entityFormData, staff: e.target.value })}
                        placeholder="Enter staff count"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="status"
                        checked={entityFormData.status}
                        onCheckedChange={(checked) => setEntityFormData({ ...entityFormData, status: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entityFormData.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Geo-Location Details Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Geo-Location Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.latitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, latitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">latitude must be between -90 and 90</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.longitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, longitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">longitude must be between -180 and 180</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeRadius">Store Radius (meters)</Label>
                      <Input
                        id="storeRadius"
                        type="number"
                        value={entityFormData.storeRadius}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeRadius: e.target.value })}
                        placeholder="100"
                      />
                      <p className="text-xs text-muted-foreground">store radius must be between 100 meters and 1000 meters. default : 100m</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEntityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEntity}>
                    Create Entity
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit Entity Dialog */}
            <Dialog open={isEditEntityDialogOpen} onOpenChange={setIsEditEntityDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Entity</DialogTitle>
                  <DialogDescription>
                    Update the entity details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-storeName">Store Name</Label>
                      <Input
                        id="edit-storeName"
                        value={entityFormData.storeName}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeName: e.target.value })}
                        placeholder="Enter store name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-entityId">Entity Id</Label>
                      <Input
                        id="edit-entityId"
                        value={entityFormData.entityId}
                        onChange={(e) => setEntityFormData({ ...entityFormData, entityId: e.target.value })}
                        placeholder="Enter entity ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-area">Area</Label>
                      <Input
                        id="edit-area"
                        value={entityFormData.area}
                        onChange={(e) => setEntityFormData({ ...entityFormData, area: e.target.value })}
                        placeholder="Enter area"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={entityFormData.city}
                        onChange={(e) => setEntityFormData({ ...entityFormData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-storeStatus">Store Status</Label>
                      <Select
                        value={entityFormData.storeStatus}
                        onValueChange={(value) => setEntityFormData({ ...entityFormData, storeStatus: value })}
                      >
                        <SelectTrigger id="edit-storeStatus">
                          <SelectValue placeholder="Select store status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Functional">Functional</SelectItem>
                          <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-staff">Staff</Label>
                      <Input
                        id="edit-staff"
                        type="number"
                        value={entityFormData.staff}
                        onChange={(e) => setEntityFormData({ ...entityFormData, staff: e.target.value })}
                        placeholder="Enter staff count"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="edit-status"
                        checked={entityFormData.status}
                        onCheckedChange={(checked) => setEntityFormData({ ...entityFormData, status: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entityFormData.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Geo-Location Details Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Geo-Location Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-latitude">Latitude</Label>
                        <Input
                          id="edit-latitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.latitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, latitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">latitude must be between -90 and 90</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-longitude">Longitude</Label>
                        <Input
                          id="edit-longitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.longitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, longitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">longitude must be between -180 and 180</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-storeRadius">Store Radius (meters)</Label>
                      <Input
                        id="edit-storeRadius"
                        type="number"
                        value={entityFormData.storeRadius}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeRadius: e.target.value })}
                        placeholder="100"
                      />
                      <p className="text-xs text-muted-foreground">store radius must be between 100 meters and 1000 meters. default : 100m</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditEntityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateEntity}>
                    Update Entity
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuItem>Import</DropdownMenuItem>
                <DropdownMenuItem>Refresh</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Customize Table Columns</DialogTitle>
                  <DialogDescription>
                    Select up to 8 fields to display in the entity table.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {['storeName', 'area', 'entityId', 'storeStatus', 'createdAt', 'city', 'staff', 'status', 'action'].map((column) => (
                    <div key={column} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`column-${column}`}
                        checked={visibleColumns.includes(column)}
                        onChange={() => handleToggleColumn(column)}
                      />
                      <label htmlFor={`column-${column}`} className="text-sm capitalize">
                        {column}
                      </label>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {visibleColumns.length}/8 fields selected
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsColumnSettingsOpen(false)}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Entities Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.includes('storeName') && <TableHead>Store Name</TableHead>}
                    {visibleColumns.includes('area') && <TableHead>Area</TableHead>}
                    {visibleColumns.includes('entityId') && <TableHead>Entity Id</TableHead>}
                    {visibleColumns.includes('storeStatus') && <TableHead>Store-Status</TableHead>}
                    {visibleColumns.includes('createdAt') && <TableHead>Created At</TableHead>}
                    {visibleColumns.includes('city') && <TableHead>City</TableHead>}
                    {visibleColumns.includes('staff') && <TableHead>Staff</TableHead>}
                    {visibleColumns.includes('status') && <TableHead>Status</TableHead>}
                    {visibleColumns.includes('action') && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="text-center py-12 text-muted-foreground">
                        No entities available
                      </TableCell>
                    </TableRow>
                  ) : (
                    entities.map((entity, index) => (
                      <TableRow key={index}>
                        {visibleColumns.includes('storeName') && <TableCell className="font-medium">{entity.storeName}</TableCell>}
                        {visibleColumns.includes('area') && <TableCell>{entity.area}</TableCell>}
                        {visibleColumns.includes('entityId') && <TableCell>{entity.entityId}</TableCell>}
                        {visibleColumns.includes('storeStatus') && <TableCell>{entity.storeStatus}</TableCell>}
                        {visibleColumns.includes('createdAt') && <TableCell>{entity.createdAt}</TableCell>}
                        {visibleColumns.includes('city') && <TableCell>{entity.city}</TableCell>}
                        {visibleColumns.includes('staff') && <TableCell>{entity.staff}</TableCell>}
                        {visibleColumns.includes('status') && (
                          <TableCell>
                            <Switch checked={entity.status} onCheckedChange={() => handleToggleEntityStatus(entity)} />
                          </TableCell>
                        )}
                        {visibleColumns.includes('action') && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEntity(entity)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteEntity(entity.id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>{activeTab} tab content coming soon...</p>
        </div>
      )}
    </div>
  );
}
