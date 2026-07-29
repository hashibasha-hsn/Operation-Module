import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Search,
  Download,
  RefreshCw,
  Plus,
  Package,
  Edit,
  Trash2,
  RotateCcw,
  CalendarIcon,
  Filter,
  Settings,
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { getOrganizationId, getCurrentUserId } from "@/lib/authStorage";

const ORG_API = import.meta.env.VITE_ORG_API || "/api/org";

function isDeletedAsset(asset: any) {
  return Boolean(asset?.isDeleted) || String(asset?.status || "").toLowerCase() === "deleted";
}

export default function Assets() {
  const [activeTab, setActiveTab] = useState("Active");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const organizationId = getOrganizationId();

  const [newAsset, setNewAsset] = useState({
    assetName: "",
    customAssetId: "",
    userId: "",
    storeId: "",
    expiryDate: undefined as Date | undefined,
  });

  const tabs = [t("active"), t("deleted")];

  const loadAssets = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        fetch(`${ORG_API}/assets?organizationId=${encodeURIComponent(organizationId)}`),
        fetch(`${ORG_API}/assets/deleted?organizationId=${encodeURIComponent(organizationId)}`),
      ]);
      const active = activeRes.ok ? await activeRes.json() : [];
      const deleted = deletedRes.ok ? await deletedRes.json() : [];
      const byId = new Map<string, any>();
      [...(Array.isArray(active) ? active : []), ...(Array.isArray(deleted) ? deleted : [])].forEach(
        (asset) => {
          if (asset?.id) byId.set(asset.id, asset);
        },
      );
      setAssets(Array.from(byId.values()));
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      toast.error("Failed to load assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, [organizationId]);

  const currentAssets =
    activeTab === "Active"
      ? assets.filter((asset: any) => !isDeletedAsset(asset))
      : assets.filter((asset: any) => isDeletedAsset(asset));

  const filteredAssets = currentAssets.filter(
    (asset: any) =>
      asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.customAssetId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateAsset = async () => {
    if (!newAsset.assetName.trim()) {
      toast.error("Asset name is required");
      return;
    }
    try {
      const response = await fetch(`${ORG_API}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAsset,
          expiryDate: newAsset.expiryDate ? newAsset.expiryDate.toISOString() : null,
          organizationId,
          createdBy: getCurrentUserId(),
          status: "active",
        }),
      });

      if (!response.ok) throw new Error("Failed to create asset");
      await loadAssets();
      setShowCreateDialog(false);
      setNewAsset({
        assetName: "",
        customAssetId: "",
        userId: "",
        storeId: "",
        expiryDate: undefined,
      });
      toast.success("Asset created");
    } catch (error: any) {
      console.error("Failed to create asset:", error);
      toast.error(error?.message || "Failed to create asset");
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`${ORG_API}/assets/${selectedAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedAsset,
          updatedBy: getCurrentUserId(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update asset");
      await loadAssets();
      setShowEditDialog(false);
      toast.success("Asset updated");
    } catch (error: any) {
      console.error("Failed to update asset:", error);
      toast.error(error?.message || "Failed to update asset");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const response = await fetch(`${ORG_API}/assets/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete asset");
      await loadAssets();
      toast.success("Asset deleted");
    } catch (error: any) {
      console.error("Failed to delete asset:", error);
      toast.error(error?.message || "Failed to delete asset");
    }
  };

  const handleRestoreAsset = async (id: string) => {
    try {
      const response = await fetch(`${ORG_API}/assets/${id}/restore`, { method: "PUT" });
      if (!response.ok) throw new Error("Failed to restore asset");
      await loadAssets();
      toast.success("Asset restored");
    } catch (error: any) {
      console.error("Failed to restore asset:", error);
      toast.error(error?.message || "Failed to restore asset");
    }
  };

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
          <Button variant="outline" className="gap-2" onClick={() => void loadAssets()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("createAsset") || "Create Asset"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createAsset") || "Create Asset"}</DialogTitle>
                <DialogDescription>Add a new asset to your organization</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Asset Name</Label>
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
                  <Label>Store ID</Label>
                  <Input
                    value={newAsset.storeId}
                    onChange={(e) => setNewAsset({ ...newAsset, storeId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>User ID</Label>
                  <Input
                    value={newAsset.userId}
                    onChange={(e) => setNewAsset({ ...newAsset, userId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Expiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {newAsset.expiryDate
                          ? format(newAsset.expiryDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newAsset.expiryDate}
                        onSelect={(date) => setNewAsset({ ...newAsset, expiryDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAsset}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === (tab === t("deleted") ? "Deleted" : "Active") ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab(tab === t("deleted") ? "Deleted" : "Active")}
          >
            {tab}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              {activeTab === "Active" ? t("active") : t("deleted")} Assets
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredAssets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No assets found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetName}</TableCell>
                    <TableCell>{asset.customAssetId || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{asset.status || (isDeletedAsset(asset) ? "deleted" : "active")}</Badge>
                    </TableCell>
                    <TableCell>{asset.storeId || "—"}</TableCell>
                    <TableCell>
                      <TableActionsMenu>
                        {!isDeletedAsset(asset) ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestoreAsset(asset.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        )}
                      </TableActionsMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Asset Name</Label>
                <Input
                  value={selectedAsset.assetName || ""}
                  onChange={(e) =>
                    setSelectedAsset({ ...selectedAsset, assetName: e.target.value })
                  }
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAsset}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
