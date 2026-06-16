import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Search, Building2, Filter, MoreVertical, ChevronDown, ChevronLeft, ChevronRight, Store, Settings, Upload, Trash2, Edit, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { useLanguage } from "@/contexts/LanguageContext";

export default function Entities() {
  const { t } = useLanguage();
  const [showFunctional, setShowFunctional] = useState(true);
  const [showNonFunctional, setShowNonFunctional] = useState(true);
  const tabs = [
    { key: "Entity", label: t('entity') },
    { key: "Tags", label: t('tags') },
    { key: "Removed Entity", label: t('removedEntity') }
  ];
  const [activeTab, setActiveTab] = useState("Entity");
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [isEditEntityDialogOpen, setIsEditEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [entityFormData, setEntityFormData] = useState({
    storeName: "",
    area: "",
    entityId: "",
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
    'storeName', 'area', 'entityId', 'createdAt', 'city', 'staff', 'action'
  ]);
  const [tags, setTags] = useState<any[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isEditTagDialogOpen, setIsEditTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [tagData, setTagData] = useState({
    tag: '',
    tagValues: [] as string[],
    mandatory: false
  });
  const [tagValueInput, setTagValueInput] = useState('');
  const [createTagWithValue, setCreateTagWithValue] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string }>({});
  const [removedEntities, setRemovedEntities] = useState<any[]>([]);

  useEffect(() => {
    fetchEntities();
    fetchTags();
    fetchRemovedEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entities?organizationId=default-org');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Entities data:', data);
      setEntities(Array.isArray(data) ? data : []);

      // Calculate counts
      setTotalEntityCount(Array.isArray(data) ? data.length : 0);
      setFunctionalEntityCount(Array.isArray(data) ? data.filter((e: any) => e.storeStatus === 'Functional').length : 0);
      setNonFunctionalEntityCount(Array.isArray(data) ? data.filter((e: any) => e.storeStatus === 'Non-Functional').length : 0);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
      setEntities([]);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entity-tags?organizationId=default-org');
      const data = await response.json();
      // Transform database response to match frontend structure
      const transformedTags = Array.isArray(data) ? data.map((tag: any) => ({
        id: tag.id,
        tag: tag.tagName,
        tagValues: tag.tagValues || [],
        mandatory: tag.mandatory
      })) : [];
      setTags(transformedTags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setTags([]);
    }
  };

  const fetchRemovedEntities = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/removed-entities?organizationId=default-org');
      const data = await response.json();
      setRemovedEntities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch removed entities:', err);
      setRemovedEntities([]);
    }
  };

  const handleRestoreEntity = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/removed-entities/${id}/restore`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEntities();
        fetchRemovedEntities();
      } else {
        console.error('Failed to restore entity');
      }
    } catch (err) {
      console.error('Error restoring entity:', err);
    }
  };

  const exportToExcel = () => {
    const exportData = entities.map((entity: any) => ({
      'Store Name': entity.storeName,
      'Area': entity.area || '',
      'Entity ID': entity.entityId || '',
      'Store Status': entity.storeStatus || '',
      'City': entity.city || '',
      'Staff': entity.staff || 0,
      'Status': entity.status ? 'Active' : 'Inactive',
      'Latitude': entity.latitude || 0,
      'Longitude': entity.longitude || 0,
      'Store Radius': entity.storeRadius || 100,
      'Tags': entity.tags ? JSON.stringify(entity.tags) : '',
      'Created At': entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entities');
    XLSX.writeFile(workbook, 'entities.xlsx');
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
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        setEntityFormData({
          storeName: "",
          area: "",
          entityId: "",
          city: "",
          staff: "",
          status: true,
          latitude: "0.00000000",
          longitude: "0.00000000",
          storeRadius: "100",
        });
        setSelectedTags({});
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
      city: entity.city,
      staff: entity.staff?.toString() || "",
      status: entity.status,
      latitude: entity.latitude?.toString() || "0.00000000",
      longitude: entity.longitude?.toString() || "0.00000000",
      storeRadius: entity.storeRadius?.toString() || "100",
    });
    setSelectedTags(entity.tags || {});
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
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        setEntityFormData({
          storeName: "",
          area: "",
          entityId: "",
          city: "",
          staff: "",
          status: true,
          latitude: "0.00000000",
          longitude: "0.00000000",
          storeRadius: "100",
        });
        setSelectedTags({});
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

  const handleCreateTag = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entity-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagName: tagData.tag,
          tagValues: createTagWithValue ? tagData.tagValues : [],
          mandatory: tagData.mandatory ? 'YES' : 'NO',
          organizationId: 'default-org'
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        // Transform database response to match frontend structure
        const transformedTag = {
          id: newTag.id,
          tag: newTag.tagName,
          tagValues: newTag.tagValues || [],
          mandatory: newTag.mandatory
        };
        setTags([...tags, transformedTag]);
        setTagData({ tag: '', tagValues: [], mandatory: false });
        setTagValueInput('');
        setCreateTagWithValue(false);
        setIsTagDialogOpen(false);
      } else {
        console.error('Failed to create tag');
      }
    } catch (err) {
      console.error('Error creating tag:', err);
    }
  };

  const handleEditTag = (tag: any) => {
    setEditingTag(tag);
    setTagData({
      tag: tag.tag,
      tagValues: tag.tagValues || [],
      mandatory: tag.mandatory === 'YES'
    });
    setCreateTagWithValue(tag.tagValues && tag.tagValues.length > 0);
    setIsEditTagDialogOpen(true);
  };

  const handleUpdateTag = async () => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/entity-tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagName: tagData.tag,
          tagValues: tagData.tagValues,
          mandatory: tagData.mandatory ? 'YES' : 'NO'
        }),
      });

      if (response.ok) {
        const updatedTag = await response.json();
        // Transform database response to match frontend structure
        const transformedTag = {
          id: updatedTag.id,
          tag: updatedTag.tagName,
          tagValues: updatedTag.tagValues || [],
          mandatory: updatedTag.mandatory
        };
        setTags(tags.map(tag => tag.id === editingTag.id ? transformedTag : tag));
        setIsEditTagDialogOpen(false);
        setEditingTag(null);
        setTagData({ tag: '', tagValues: [], mandatory: false });
        setTagValueInput('');
        setCreateTagWithValue(false);
      } else {
        console.error('Failed to update tag');
      }
    } catch (err) {
      console.error('Error updating tag:', err);
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/entity-tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(tags.filter(tag => tag.id !== id));
      } else {
        console.error('Failed to delete tag');
      }
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const totalPages = Math.ceil(tags.length / itemsPerPage);
  const paginatedTags = tags.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('entitiesManagement')}</h1>
            <p className="text-muted-foreground mt-1">{t('manageBusinessEntitiesAndLocations')}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
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
              <p className="text-sm font-medium">{t('totalEntity')}: {totalEntityCount}</p>
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
                placeholder={t('searchEntity')}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {t('storeNameAsc')}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>{t('storeNameAsc')}</DropdownMenuItem>
                <DropdownMenuItem>{t('storeNameDesc')}</DropdownMenuItem>
                <DropdownMenuItem>{t('areaAsc')}</DropdownMenuItem>
                <DropdownMenuItem>{t('areaDesc')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">{t('apply')}</Button>
            <Button variant="ghost">{t('reset')}</Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={exportToExcel}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  {t('bulkEntity')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('bulkUploadEntities')}</DialogTitle>
                  <DialogDescription>
                    {t('bulkUploadEntitiesDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkFile">{t('uploadFile')}</Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="bulkFile"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {bulkFile ? bulkFile.name : t('clickToUploadCsvOrExcelFile')}
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
                    <Label>{t('requiredColumns')}</Label>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      <p className="font-medium mb-2">{t('yourFileMustIncludeTheseColumns')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>{t('storeName')}</li>
                        <li>{t('entityId')}</li>
                        <li>{t('area')}</li>
                        <li>{t('city')}</li>
                        <li>{t('storeStatus')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleBulkUpload}>
                    {t('upload')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('newEntity')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('addNewEntity')}</DialogTitle>
                  <DialogDescription>
                    {t('fillInTheDetailsToCreateANewEntity')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">{t('storeName')}</Label>
                      <Input
                        id="storeName"
                        value={entityFormData.storeName}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeName: e.target.value })}
                        placeholder={t('enterStoreName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityId">{t('entityId')}</Label>
                      <Input
                        id="entityId"
                        value={entityFormData.entityId}
                        onChange={(e) => setEntityFormData({ ...entityFormData, entityId: e.target.value })}
                        placeholder={t('enterEntityId')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">{t('area')}</Label>
                      <Input
                        id="area"
                        value={entityFormData.area}
                        onChange={(e) => setEntityFormData({ ...entityFormData, area: e.target.value })}
                        placeholder={t('enterArea')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('city')}</Label>
                      <Input
                        id="city"
                        value={entityFormData.city}
                        onChange={(e) => setEntityFormData({ ...entityFormData, city: e.target.value })}
                        placeholder={t('enterCity')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff">{t('staff')}</Label>
                      <Input
                        id="staff"
                        type="number"
                        value={entityFormData.staff}
                        onChange={(e) => setEntityFormData({ ...entityFormData, staff: e.target.value })}
                        placeholder={t('enterStaffCount')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('status')}</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="status"
                        checked={entityFormData.status}
                        onCheckedChange={(checked) => setEntityFormData({ ...entityFormData, status: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entityFormData.status ? t('active') : t('inactive')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Geo-Location Details Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">{t('geoLocationDetails')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">{t('latitude')}</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.latitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, latitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">{t('latitudeMustBeBetween')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">{t('longitude')}</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.00000001"
                          value={entityFormData.longitude}
                          onChange={(e) => setEntityFormData({ ...entityFormData, longitude: e.target.value })}
                          placeholder="0.00000000"
                        />
                        <p className="text-xs text-muted-foreground">{t('longitudeMustBeBetween')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeRadius">{t('storeRadiusMeters')}</Label>
                      <Input
                        id="storeRadius"
                        type="number"
                        value={entityFormData.storeRadius}
                        onChange={(e) => setEntityFormData({ ...entityFormData, storeRadius: e.target.value })}
                        placeholder="100"
                      />
                      <p className="text-xs text-muted-foreground">{t('storeRadiusMustBeBetween')}</p>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Tags</h3>
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags available. Create tags in the Tags tab first.</p>
                  ) : (
                    <div className="space-y-3">
                      {tags.map((tag: any) => (
                        <div key={tag.id} className="space-y-2">
                          <Label htmlFor={`tag-${tag.id}`}>{tag.tag}</Label>
                          {tag.tagValues && tag.tagValues.length > 0 ? (
                            <Select
                              value={selectedTags[tag.tag] || ''}
                              onValueChange={(value) => setSelectedTags({ ...selectedTags, [tag.tag]: value })}
                            >
                              <SelectTrigger id={`tag-${tag.id}`}>
                                <SelectValue placeholder={`Select ${tag.tag}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {tag.tagValues.map((value: string, index: number) => (
                                  <SelectItem key={index} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`tag-${tag.id}`}
                              placeholder={`Enter ${tag.tag}`}
                              value={selectedTags[tag.tag] || ''}
                              onChange={(e) => setSelectedTags({ ...selectedTags, [tag.tag]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEntityDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateEntity}>
                    {t('createEntity')}
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

                {/* Tags Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Tags</h3>
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags available. Create tags in the Tags tab first.</p>
                  ) : (
                    <div className="space-y-3">
                      {tags.map((tag: any) => (
                        <div key={tag.id} className="space-y-2">
                          <Label htmlFor={`edit-tag-${tag.id}`}>{tag.tag}</Label>
                          {tag.tagValues && tag.tagValues.length > 0 ? (
                            <Select
                              value={selectedTags[tag.tag] || ''}
                              onValueChange={(value) => setSelectedTags({ ...selectedTags, [tag.tag]: value })}
                            >
                              <SelectTrigger id={`edit-tag-${tag.id}`}>
                                <SelectValue placeholder={`Select ${tag.tag}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {tag.tagValues.map((value: string, index: number) => (
                                  <SelectItem key={index} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`edit-tag-${tag.id}`}
                              placeholder={`Enter ${tag.tag}`}
                              value={selectedTags[tag.tag] || ''}
                              onChange={(e) => setSelectedTags({ ...selectedTags, [tag.tag]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                  {['storeName', 'area', 'entityId', 'createdAt', 'city', 'staff', 'action'].map((column) => (
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
                    {visibleColumns.includes('storeName') && <TableHead>{t('storeName')}</TableHead>}
                    {visibleColumns.includes('area') && <TableHead>{t('area')}</TableHead>}
                    {visibleColumns.includes('entityId') && <TableHead>{t('entityId')}</TableHead>}
                    {visibleColumns.includes('createdAt') && <TableHead>{t('createdAt')}</TableHead>}
                    {visibleColumns.includes('city') && <TableHead>{t('city')}</TableHead>}
                    {visibleColumns.includes('staff') && <TableHead>{t('staff')}</TableHead>}
                    {tags.map((tag: any) => (
                      <TableHead key={tag.id}>{tag.tag}</TableHead>
                    ))}
                    {visibleColumns.includes('action') && <TableHead>{t('action')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + tags.length} className="text-center py-12 text-muted-foreground">
                        {t('noEntitiesAvailable')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entities.map((entity, index) => (
                      <TableRow key={index}>
                        {visibleColumns.includes('storeName') && <TableCell className="font-medium">{entity.storeName}</TableCell>}
                        {visibleColumns.includes('area') && <TableCell>{entity.area}</TableCell>}
                        {visibleColumns.includes('entityId') && <TableCell>{entity.entityId}</TableCell>}
                        {visibleColumns.includes('createdAt') && <TableCell>{entity.createdAt}</TableCell>}
                        {visibleColumns.includes('city') && <TableCell>{entity.city}</TableCell>}
                        {visibleColumns.includes('staff') && <TableCell>{entity.staff}</TableCell>}
                        {tags.map((tag: any) => (
                          <TableCell key={tag.id}>
                            {entity.tags && entity.tags[tag.tag] ? String(entity.tags[tag.tag]) : '-'}
                          </TableCell>
                        ))}
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
      ) : activeTab === "Tags" ? (
        <>
          {/* Tags Content */}
          <div className="flex items-center justify-between mb-4">
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createTag')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('createTag')}</DialogTitle>
                  <DialogDescription>
                    {t('addANewTagToTheSystem')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createTagWithValue"
                      checked={createTagWithValue}
                      onCheckedChange={(checked) => setCreateTagWithValue(checked as boolean)}
                    />
                    <Label htmlFor="createTagWithValue">
                      {t('createTagWithValue')}
                    </Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tag">{t('tagName')} <span className="text-destructive">*</span></Label>
                    <Input
                      id="tag"
                      placeholder={t('enterTagName')}
                      value={tagData.tag}
                      onChange={(e) => setTagData({ ...tagData, tag: e.target.value })}
                    />
                  </div>
                  {createTagWithValue && (
                    <div className="grid gap-2">
                      <Label htmlFor="tagValue">{t('tagValues')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tagValue"
                          placeholder={t('enterTagValueAndPressEnterOrClickAdd')}
                          value={tagValueInput}
                          onChange={(e) => setTagValueInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagValueInput.trim()) {
                              setTagData({ ...tagData, tagValues: [...tagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (tagValueInput.trim()) {
                              setTagData({ ...tagData, tagValues: [...tagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        >
                          {t('add')}
                        </Button>
                      </div>
                      {tagData.tagValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tagData.tagValues.map((value, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                              <span className="text-sm">{value}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTagData({
                                    ...tagData,
                                    tagValues: tagData.tagValues.filter((_, i) => i !== index)
                                  });
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mandatory"
                      checked={tagData.mandatory}
                      onCheckedChange={(checked) => setTagData({ ...tagData, mandatory: checked as boolean })}
                    />
                    <Label htmlFor="mandatory">
                      {t('mandatory')}
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateTag}>
                    {t('createTag')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Tag Dialog */}
            <Dialog open={isEditTagDialogOpen} onOpenChange={setIsEditTagDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('editTag')}</DialogTitle>
                  <DialogDescription>
                    {t('updateTheTagDetails')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-createTagWithValue"
                      checked={createTagWithValue}
                      onCheckedChange={(checked) => setCreateTagWithValue(checked as boolean)}
                    />
                    <Label htmlFor="edit-createTagWithValue">
                      {t('createTagWithValue')}
                    </Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-tag">{t('tagName')} <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-tag"
                      placeholder={t('enterTagName')}
                      value={tagData.tag}
                      onChange={(e) => setTagData({ ...tagData, tag: e.target.value })}
                    />
                  </div>
                  {createTagWithValue && (
                    <div className="grid gap-2">
                      <Label htmlFor="edit-tagValue">{t('tagValues')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-tagValue"
                          placeholder={t('enterTagValueAndPressEnterOrClickAdd')}
                          value={tagValueInput}
                          onChange={(e) => setTagValueInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagValueInput.trim()) {
                              setTagData({ ...tagData, tagValues: [...tagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (tagValueInput.trim()) {
                              setTagData({ ...tagData, tagValues: [...tagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        >
                          {t('add')}
                        </Button>
                      </div>
                      {tagData.tagValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tagData.tagValues.map((value, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                              <span className="text-sm">{value}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTagData({
                                    ...tagData,
                                    tagValues: tagData.tagValues.filter((_, i) => i !== index)
                                  });
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-mandatory"
                      checked={tagData.mandatory}
                      onCheckedChange={(checked) => setTagData({ ...tagData, mandatory: checked as boolean })}
                    />
                    <Label htmlFor="edit-mandatory">
                      {t('mandatory')}
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditTagDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleUpdateTag}>
                    {t('updateTag')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="text-sm text-muted-foreground">
              {t('tagsCreated')} {tags.length} / 25
            </div>
          </div>

          {/* Tags Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tag')}</TableHead>
                    <TableHead>{t('tagValue')}</TableHead>
                    <TableHead>{t('mandatory')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        {t('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTags.map((tag: any) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.tag}</TableCell>
                        <TableCell>
                          {tag.tagValues && tag.tagValues.length > 0
                            ? tag.tagValues.join(', ')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{tag.mandatory}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTag(tag)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-4">
            <div className="text-sm text-muted-foreground">
              {t('total')} {tags.length} {t('items')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('perPage')}</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      ) : activeTab === "Removed Entity" ? (
        <>
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('storeName')}</TableHead>
                    <TableHead>{t('area')}</TableHead>
                    <TableHead>{t('entityId')}</TableHead>
                    <TableHead>{t('city')}</TableHead>
                    <TableHead>{t('staff')}</TableHead>
                    <TableHead>{t('removedAt')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {removedEntities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t('noRemovedEntities')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    removedEntities.map((entity: any) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.storeName}</TableCell>
                        <TableCell>{entity.area || '-'}</TableCell>
                        <TableCell>{entity.entityId || '-'}</TableCell>
                        <TableCell>{entity.city || '-'}</TableCell>
                        <TableCell>{entity.staff || '-'}</TableCell>
                        <TableCell>{new Date(entity.removedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleRestoreEntity(entity.id)}>
                            {t('restore')}
                          </Button>
                        </TableCell>
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
          <p>{t('tabContentComingSoon')}</p>
        </div>
      )}
    </div>
  );
}
