import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { getOrganizationId, getCurrentUserId } from "@/lib/authStorage";
import {
  Search,
  Download,
  RefreshCw,
  Plus,
  Package,
  Edit,
  Trash2,
  RotateCcw,
  Filter,
  FileUp,
  FileSpreadsheet,
  ArrowRightLeft,
  History,
  Ticket,
  FileDown,
  Save,
  UploadCloud,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Printer,
  Settings,
} from "lucide-react";
import * as XLSX from "xlsx";
import AddTicketModal from "@/components/AddTicketModal";
import {
  fetchAssets,
  fetchDeletedAssets,
  createAsset,
  saveAssetDraft,
  updateAsset,
  deleteAsset,
  restoreAsset,
  transferAsset,
  updateAssetStatus,
  bulkUploadAssets,
  fetchAssetTables,
  fetchAssetFilters,
  createAssetFilter,
  deleteAssetFilter,
  uploadAssetFile,
  ASSET_STATUSES,
  ASSET_CONDITIONS,
  type AssetFilters,
} from "@/lib/assetApi";
import { fetchUsers, fetchEntities, getUserDisplayName } from "@/lib/processApi";
import { createTicket } from "@/lib/ticketApi";
import { exportAssetsToPdf, exportAssetDetailPdf } from "@/lib/assetPdf";

const ORG_API = import.meta.env.VITE_ORG_API || "/api/org";

function isDeletedAsset(asset: any) {
  return Boolean(asset?.isDeleted) || String(asset?.status || "").toLowerCase() === "deleted";
}

export default function Assets() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const organizationId = getOrganizationId();
  const currentUserId = getCurrentUserId();

  const [activeTab, setActiveTab] = useState("Active");
  const [assets, setAssets] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<AssetFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [filterName, setFilterName] = useState("");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkParsedRows, setBulkParsedRows] = useState<any[]>([]);
  const [bulkRowsError, setBulkRowsError] = useState("");

  const [newAsset, setNewAsset] = useState<any>({
    assetName: "",
    customAssetId: "",
    storeId: "",
    tableId: "",
    status: "active",
    condition: "good",
    customFields: {},
  });
  const [draftCount, setDraftCount] = useState(0);

  const activeTable = tables.find((tb) => tb.id === selectedTableId) || null;
  const activeTableFields =
    activeTable?.customFields && Array.isArray(activeTable.customFields)
      ? activeTable.customFields
      : [];

  const loadData = async () => {
    setLoading(true);
    try {
      const [active, deleted, tableRows, userRows, filterRows, storeRows] = await Promise.all([
        fetchAssets(filters),
        fetchDeletedAssets(),
        fetchAssetTables(),
        fetchUsers(500).catch(() => []),
        fetchAssetFilters(currentUserId).catch(() => []),
        fetchEntities().catch(() => []),
      ]);
      const byId = new Map<string, any>();
      [...(active || []), ...(deleted || [])].forEach((asset) => {
        if (asset?.id) byId.set(asset.id, asset);
      });
      setAssets(Array.from(byId.values()));
      setTables(tableRows || []);
      setStores(storeRows || []);
      setUsers(
        (userRows || []).map((u: any) => ({
          id: (u.userId ?? u.id) as string,
          label: getUserDisplayName(u),
        })),
      );
      setSavedFilters(filterRows || []);
      setDraftCount((active || []).filter((a: any) => a.status === "draft").length);
    } catch (error) {
      console.error("Failed to load assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const currentAssets =
    activeTab === "Active"
      ? assets.filter((a: any) => !isDeletedAsset(a) && a.status !== "draft")
      : activeTab === "Drafts"
        ? assets.filter((a: any) => a.status === "draft" && !isDeletedAsset(a))
        : assets.filter((a: any) => isDeletedAsset(a));

  const saveCurrentFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Filter name is required");
      return;
    }
    try {
      await createAssetFilter({ name: filterName.trim(), criteria: filters, visibility: "private" });
      toast.success("Filter saved");
      setFilterName("");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save filter");
    }
  };

  const applySavedFilter = (filter: any) => {
    setFilters(filter.criteria || {});
  };

  const resetFilters = () => setFilters({});

  const handleCreateAsset = async () => {
    if (!newAsset.assetName.trim()) {
      toast.error("Asset name is required");
      return;
    }
    if (activeTable) {
      for (const field of activeTableFields) {
        if (field.isRequired && !newAsset.customFields?.[field.fieldName]) {
          toast.error(`Missing required field: ${field.fieldName}`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      await createAsset({
        ...newAsset,
        assetName: newAsset.assetName.trim(),
        organizationId,
        createdBy: currentUserId,
      });
      toast.success("Asset created");
      setShowCreateDialog(false);
      setNewAsset({
        assetName: "",
        customAssetId: "",
        storeId: "",
        tableId: "",
        status: "active",
        condition: "good",
        customFields: {},
      });
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!newAsset.assetName.trim()) {
      toast.error("Asset name is required");
      return;
    }
    setSubmitting(true);
    try {
      await saveAssetDraft({
        ...newAsset,
        assetName: newAsset.assetName.trim(),
        organizationId,
        createdBy: currentUserId,
      });
      toast.success("Draft saved");
      setShowCreateDialog(false);
      setNewAsset({
        assetName: "",
        customAssetId: "",
        storeId: "",
        tableId: "",
        status: "active",
        condition: "good",
        customFields: {},
      });
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;
    setSubmitting(true);
    try {
      await updateAsset(selectedAsset.id, {
        ...selectedAsset,
        updatedBy: currentUserId,
      });
      toast.success("Asset updated");
      setShowEditDialog(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAsset(id);
      toast.success("Asset deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete asset");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAsset(id);
      toast.success("Asset restored");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to restore asset");
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget || !newOwnerId) {
      toast.error("Select a new owner");
      return;
    }
    try {
      await transferAsset(transferTarget.id, newOwnerId);
      toast.success("Ownership transferred");
      setShowTransferDialog(false);
      setNewOwnerId("");
      setTransferTarget(null);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Transfer failed");
    }
  };

  const handleStatusChange = async (asset: any, status: string) => {
    try {
      await updateAssetStatus(asset.id, status);
      toast.success(`Status changed to ${status}`);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const downloadTemplate = () => {
    const headers = ["assetName", "customAssetId", "status", "condition", "storeId", "userId", "expiryDate", "renewalDate"];
    const fieldHeaders = activeTableFields.map((f: any) => `field.${f.fieldName}`);
    const worksheet = XLSX.utils.json_to_sheet([
      Object.fromEntries([...headers, ...fieldHeaders].map((h) => [h, ""])),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, activeTable ? `${activeTable.tableName}-template.xlsx` : "asset-template.xlsx");
  };

  const handleBulkFile = async (file: File) => {
    setBulkRowsError("");
    setBulkResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
      if (!rows.length) {
        setBulkRowsError("No rows found in the file");
        return;
      }
      const mapped = rows.map((row: any) => {
        const normalized: any = {};
        Object.entries(row).forEach(([key, value]) => {
          if (key.startsWith("field.")) {
            normalized.customFields = {
              ...(normalized.customFields || {}),
              [key.replace("field.", "")]: value,
            };
          } else {
            normalized[key] = value;
          }
        });
        return {
          assetName: normalized.assetName,
          customAssetId: normalized.customAssetId,
          tableId: selectedTableId || undefined,
          storeId: normalized.storeId,
          userId: normalized.userId,
          status: normalized.status || "active",
          condition: normalized.condition || "good",
          expiryDate: normalized.expiryDate,
          renewalDate: normalized.renewalDate,
          customFields: normalized.customFields,
        };
      });
      setBulkParsedRows(mapped);
    } catch (error) {
      setBulkRowsError("Failed to parse the file. Use the template format.");
    }
  };

  const confirmBulkUpload = async () => {
    if (!bulkParsedRows.length) return;
    setSubmitting(true);
    try {
      const result = await bulkUploadAssets(bulkParsedRows);
      setBulkResult(result);
      await loadData();
      if (result.failed === 0) toast.success(`Imported ${result.succeeded} assets`);
    } catch (error: any) {
      toast.error(error?.message || "Bulk upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPdf = () => {
    const rows = currentAssets.map((a: any) => ({
      assetName: a.assetName,
      customAssetId: a.customAssetId,
      status: a.status,
      condition: a.condition,
      storeId: a.storeId,
      ownerUserId: a.ownerUserId || a.userId,
      expiryDate: a.expiryDate,
      renewalDate: a.renewalDate,
      utilizationPercent: a.utilizationPercent,
      customFields: a.customFields,
    }));
    const ok = exportAssetsToPdf(rows, `assets-${Date.now()}.pdf`);
    if (!ok) toast.error("No assets to export");
  };

  const handleExportAssetPdf = async (asset: any) => {
    await exportAssetDetailPdf(asset, asset.history || []);
  };

  const handleDownloadExcel = () => {
    const rows = currentAssets.map((a: any) => ({
      assetName: a.assetName,
      customAssetId: a.customAssetId,
      status: a.status,
      condition: a.condition,
      storeId: a.storeId,
      owner: a.ownerUserId || a.userId,
      expiryDate: a.expiryDate,
      renewalDate: a.renewalDate,
      ...(a.customFields || {}),
    }));
    if (!rows.length) {
      toast.error("No assets to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, `assets-${Date.now()}.xlsx`);
  };

  const renderFieldInput = (field: any, value: any, onChange: (v: any) => void) => {
    const setValue = (v: any) => {
      onChange({ ...(newAsset.customFields || {}), [field.fieldName]: v });
    };
    switch (field.fieldType) {
      case "number":
        return (
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value || undefined)}
          />
        );
      case "dropdown":
        return (
          <Select value={value ?? ""} onValueChange={(v) => setValue(v || undefined)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "image":
      case "file": {
        const isImage = field.fieldType === "image";
        return (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept={isImage ? "image/*" : undefined}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadAssetFile(file);
                if (url) setValue(url);
              }}
            />
            {value && <Badge variant="outline">Uploaded</Badge>}
          </div>
        );
      }
      default:
        return <Input value={value ?? ""} onChange={(e) => setValue(e.target.value)} />;
    }
  };

  const renderCustomFields = (asset: any, onChange: (updates: any) => void) => {
    const fieldList =
      activeTableFields.length > 0
        ? activeTableFields
        : Object.entries(asset?.customFields || {}).map(([fieldName, value]) => ({
            fieldName,
            fieldType: typeof value === "number" ? "number" : typeof value === "boolean" ? "dropdown" : "text",
            isRequired: false,
          }));
    if (!fieldList.length) {
      return (
        <p className="text-sm text-muted-foreground">
          No custom fields defined. Create a table with custom fields first.
        </p>
      );
    }
    return (
      <div className="grid gap-3">
        {fieldList.map((field: any) => (
          <div key={field.fieldName} className="grid gap-2">
            <Label>
              {field.fieldName}
              {field.isRequired && <span className="text-destructive"> *</span>}
            </Label>
            {renderFieldInput(field, asset?.customFields?.[field.fieldName], onChange)}
          </div>
        ))}
      </div>
    );
  };

  const baseCreateForm = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Asset Table</Label>
        <Select
          value={selectedTableId}
          onValueChange={(value) => {
            setSelectedTableId(value);
            setNewAsset({ ...newAsset, tableId: value, customFields: {} });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select table" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((tb) => (
              <SelectItem key={tb.id} value={tb.id}>
                {tb.tableName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Asset Name *</Label>
        <Input
          value={newAsset.assetName}
          onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Custom Asset ID</Label>
        <Input
          value={newAsset.customAssetId}
          onChange={(e) => setNewAsset({ ...newAsset, customAssetId: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Store</Label>
        <Select
          value={newAsset.storeId || "none"}
          onValueChange={(v) => setNewAsset({ ...newAsset, storeId: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {stores.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.storeName || s.entityName || s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          value={newAsset.status}
          onValueChange={(v) => setNewAsset({ ...newAsset, status: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Condition</Label>
        <Select
          value={newAsset.condition}
          onValueChange={(v) => setNewAsset({ ...newAsset, condition: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Expiry Date</Label>
        <Input
          type="date"
          value={newAsset.expiryDate || ""}
          onChange={(e) => setNewAsset({ ...newAsset, expiryDate: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Renewal Date</Label>
        <Input
          type="date"
          value={newAsset.renewalDate || ""}
          onChange={(e) => setNewAsset({ ...newAsset, renewalDate: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Owner</Label>
        <Select
          value={newAsset.ownerUserId || "none"}
          onValueChange={(v) => setNewAsset({ ...newAsset, ownerUserId: v === "none" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {renderCustomFields(newAsset, (cf) => setNewAsset({ ...newAsset, customFields: cf }))}
    </div>
  );

  const tableHeaders = (() => {
    const base = ["Name", "Asset ID", "Status", "Condition", "Store", "Owner"];
    const customNames = activeTableFields.map((f: any) => f.fieldName);
    return [...base, ...customNames, "Expiry", "Actions"];
  })();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("assetsManagement")}</h1>
            <p className="text-muted-foreground mt-1">{t("trackAndManage")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void loadData()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
            <FileDown className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadExcel}>
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowBulkDialog(true)}>
            <FileUp className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/asset-table-config")}>
            <Settings className="w-4 h-4" />
            Manage Tables
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("createAsset") || "Create Asset"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("createAsset") || "Create Asset"}</DialogTitle>
                <DialogDescription>Add a new asset to your organization</DialogDescription>
              </DialogHeader>
              {baseCreateForm}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} disabled={submitting}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handleCreateAsset} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 border-b">
          {["Active", "Drafts", "Deleted"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              className="rounded-b-none"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === "Drafts" && draftCount > 0 && (
                <Badge className="ml-2" variant="secondary">{draftCount}</Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search assets..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "border-primary text-primary" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  className="w-40"
                  placeholder="Filter name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={saveCurrentFilter}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Table</Label>
                <Select
                  value={filters.tableId || "all"}
                  onValueChange={(v) => setFilters({ ...filters, tableId: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {tables.map((tb) => (
                      <SelectItem key={tb.id} value={tb.id}>
                        {tb.tableName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) => setFilters({ ...filters, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ASSET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Condition</Label>
                <Select
                  value={filters.condition || "all"}
                  onValueChange={(v) => setFilters({ ...filters, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ASSET_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Owner</Label>
                <Select
                  value={filters.userId || "all"}
                  onValueChange={(v) => setFilters({ ...filters, userId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Expiry From</Label>
                <Input
                  type="date"
                  value={filters.expiryFrom || ""}
                  onChange={(e) => setFilters({ ...filters, expiryFrom: e.target.value || undefined })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Expiry To</Label>
                <Input
                  type="date"
                  value={filters.expiryTo || ""}
                  onChange={(e) => setFilters({ ...filters, expiryTo: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            {savedFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {savedFilters.map((sf) => (
                  <Badge
                    key={sf.id}
                    variant="secondary"
                    className="cursor-pointer gap-1"
                    onClick={() => applySavedFilter(sf)}
                  >
                    {sf.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteAssetFilter(sf.id).then(() => loadData());
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              {activeTab === "Active" ? "Active" : activeTab === "Drafts" ? "Drafts" : "Deleted"} Assets
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : currentAssets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No assets found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableHeaders.map((h, i) => (
                      <TableHead key={i}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.assetName}</TableCell>
                      <TableCell>{asset.customAssetId || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "active"
                              ? "default"
                              : asset.status === "maintenance"
                                ? "secondary"
                                : asset.status === "disposed" || asset.status === "deleted"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {asset.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.condition || "good"}</TableCell>
                      <TableCell>{asset.storeId || "—"}</TableCell>
                      <TableCell>
                        {users.find((u) => u.id === (asset.ownerUserId || asset.userId))?.label ||
                          asset.ownerUserId ||
                          asset.userId ||
                          "—"}
                      </TableCell>
                      {activeTableFields.map((f: any) => (
                        <TableCell key={f.fieldName}>
                          {f.fieldType === "image" && asset.customFields?.[f.fieldName] ? (
                            <img
                              src={asset.customFields[f.fieldName]}
                              alt={f.fieldName}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : f.fieldType === "file" && asset.customFields?.[f.fieldName] ? (
                            <a
                              href={asset.customFields[f.fieldName]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              View
                            </a>
                          ) : (
                            String(asset.customFields?.[f.fieldName] ?? "—")
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {asset.expiryDate ? new Date(asset.expiryDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {isDeletedAsset(asset) ? (
                          <TableActionsMenu>
                            <DropdownMenuItem onClick={() => handleRestore(asset.id)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          </TableActionsMenu>
                        ) : (
                          <TableActionsMenu>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setTransferTarget(asset);
                                setNewOwnerId("");
                                setShowTransferDialog(true);
                              }}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAssetPdf(asset)}>
                              <FileDown className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowHistoryDialog(true);
                              }}
                            >
                              <History className="w-4 h-4 mr-2" />
                              History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowTicketDialog(true);
                              }}
                            >
                              <Ticket className="w-4 h-4 mr-2" />
                              Create Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(asset)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </TableActionsMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Asset Name</Label>
                <Input
                  value={selectedAsset.assetName || ""}
                  onChange={(e) => setSelectedAsset({ ...selectedAsset, assetName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Custom Asset ID</Label>
                <Input
                  value={selectedAsset.customAssetId || ""}
                  onChange={(e) =>
                    setSelectedAsset({ ...selectedAsset, customAssetId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={selectedAsset.status || "active"}
                  onValueChange={(value) => setSelectedAsset({ ...selectedAsset, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Condition</Label>
                <Select
                  value={selectedAsset.condition || "good"}
                  onValueChange={(value) => setSelectedAsset({ ...selectedAsset, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderCustomFields(selectedAsset, (cf) =>
                setSelectedAsset({ ...selectedAsset, customFields: cf }),
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAsset} disabled={submitting}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Asset Ownership</DialogTitle>
            <DialogDescription>
              {transferTarget?.assetName} — select the new owner
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>New Owner</Label>
              <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer}>
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset History</DialogTitle>
            <DialogDescription>{selectedAsset?.assetName}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {(selectedAsset?.history?.length ?? 0) > 0 ? (
              <div className="relative space-y-0">
                {selectedAsset.history.map((entry: any, index: number) => (
                  <div key={index} className="flex gap-3 pb-5">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                      {index < selectedAsset.history.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline">{entry.action}</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.user ? `${entry.user} · ` : ""}
                        {entry.date ? new Date(entry.date).toLocaleString() : ""}
                      </div>
                      {entry.note && <div className="mt-1 text-sm">{entry.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No history recorded yet.</p>
            )}
            {Array.isArray(selectedAsset?.previousOwners) && selectedAsset.previousOwners.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Previous Owners</h3>
                <div className="space-y-1">
                  {selectedAsset.previousOwners.map((po: any, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex justify-between">
                      <span>{po.userId}</span>
                      <span>
                        {po.transferredFrom ? new Date(po.transferredFrom).toLocaleDateString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Assets</DialogTitle>
            <DialogDescription>
              Download the template, fill it with asset data, then upload the file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Asset Table</Label>
              <Select
                value={selectedTableId}
                onValueChange={setSelectedTableId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((tb) => (
                    <SelectItem key={tb.id} value={tb.id}>
                      {tb.tableName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <div className="grid gap-2">
              <Label>Upload File (.xlsx / .csv)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleBulkFile(file);
                }}
              />
            </div>
            {bulkRowsError && <p className="text-sm text-destructive">{bulkRowsError}</p>}
            {bulkParsedRows.length > 0 && !bulkResult && (
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  Parsed {bulkParsedRows.length} rows — ready to import
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review the rows, then confirm to create these assets.
                </p>
              </div>
            )}
            {bulkResult && (
              <div className="space-y-2">
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Succeeded: {bulkResult.succeeded}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Failed: {bulkResult.failed}</span>
                  </div>
                </div>
                {bulkResult.errors?.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkResult.errors.map((err: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.assetName}</TableCell>
                          <TableCell className="text-destructive">{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Close
            </Button>
            {bulkParsedRows.length > 0 && !bulkResult && (
              <Button onClick={confirmBulkUpload} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-2" />
                )}
                Confirm Import
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAsset && (
        <AddTicketModal
          open={showTicketDialog}
          onOpenChange={setShowTicketDialog}
          onCreateTicket={async (data) => {
            try {
              const priorityMap: Record<string, "highest" | "high" | "medium" | "low" | "lowest"> = {
                low: "low",
                medium: "medium",
                high: "high",
                critical: "highest",
              };
              const ticket = await createTicket({
                title: data.title || `Issue for ${selectedAsset.assetName}`,
                description: data.description,
                priority: priorityMap[data.priority.toLowerCase()] ?? "medium",
                storeId: data.storeId || selectedAsset.storeId || undefined,
                assignedTo: data.assignedTo,
                dueDate: data.dueDate?.toISOString(),
                ticketType: data.tab,
                categoryId: data.categoryId || undefined,
                assetId: selectedAsset.id,
                status: "open",
              });
              if (ticket?.id) {
                const ticketIds = Array.isArray(selectedAsset.ticketIds)
                  ? selectedAsset.ticketIds
                  : [];
                if (!ticketIds.includes(ticket.id)) {
                  await updateAsset(selectedAsset.id, {
                    ...selectedAsset,
                    ticketIds: [...ticketIds, ticket.id],
                    tableId: selectedAsset.tableId || undefined,
                  });
                }
              }
              toast.success("Ticket created and linked to the asset");
              setShowTicketDialog(false);
            } catch (error: any) {
              toast.error(error?.message || "Failed to create ticket");
              throw error;
            }
          }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.assetName}"? It will be moved to
              deleted assets and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
