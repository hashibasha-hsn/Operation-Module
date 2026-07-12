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
import { API_GATEWAY_URL } from "@/lib/apiConfig";

export default function Assets() {
  const [activeTab, setActiveTab] = useState("Active");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const [newAsset, setNewAsset] = useState({
    assetName: "",
    customAssetId: "",
    userId: "",
    storeId: "",
    expiryDate: undefined as Date | undefined,
  });

  const tabs = [t('active'), t('deleted')];

  // Fetch assets from database
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${API_GATEWAY_URL}/api/assets`);
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const currentAssets = activeTab === "Active" 
    ? assets.filter((asset: any) => asset.status === "Active")
    : assets.filter((asset: any) => asset.status === "Deleted");
  
  const filteredAssets = currentAssets.filter((asset: any) =>
    asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.customAssetId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAsset = async () => {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAsset),
      });

      if (response.ok) {
        const createdAsset = await response.json();
        setAssets([...assets, createdAsset]);
        setShowCreateDialog(false);
        setNewAsset({
          assetName: "",
          customAssetId: "",
          userId: "",
          storeId: "",
          expiryDate: undefined,
        });
      } else {
        console.error('Failed to create asset');
      }
    } catch (error) {
      console.error('Failed to create asset:', error);
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedAsset),
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        setAssets(assets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
        setShowEditDialog(false);
      } else {
        console.error('Failed to update asset');
      }
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssets(assets.map(asset => 
          asset.id === id ? { ...asset, status: 'Deleted' } : asset
        ));
      } else {
        console.error('Failed to delete asset');
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const handleRestoreAsset = async (id: string) => {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/assets/${id}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        setAssets(assets.map(asset => 
          asset.id === id ? { ...asset, status: 'Active' } : asset
        ));
      } else {
        console.error('Failed to restore asset');
      }
    } catch (error) {
      console.error('Failed to restore asset:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('assetsManagement')}</h1>
            <p className="text-muted-foreground mt-1">{t('trackAndManage')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            {t('configureTable')}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t('exportCSV')}
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            {t('createEntry')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
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

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t('search')} ${t('assets').toLowerCase()} ${t('by')} ${t('assetName').toLowerCase()} ${t('or')} ${t('customId').toLowerCase()}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t('filter')}
        </Button>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('refresh')}
        </Button>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activeTab === "Active" ? t('activeAssets') : t('deletedAssets')}</span>
            <Badge variant="outline">{filteredAssets.length} {t('records')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('assetId')}</TableHead>
                    <TableHead>{t('assetName')}</TableHead>
                    <TableHead>{t('customId')}</TableHead>
                    <TableHead>{t('store')}</TableHead>
                    <TableHead>{t('assetStatus')}</TableHead>
                    <TableHead>{t('assetExpiryDate')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {t('noDataFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono text-sm">{asset.id}</TableCell>
                      <TableCell className="font-medium">{asset.assetName}</TableCell>
                      <TableCell>{asset.customAssetId || "N/A"}</TableCell>
                      <TableCell>{asset.store}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "Active" ? "default" : "destructive"
                          }
                        >
                          {asset.status === "Active" ? t('active') : t('deleted')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.expiryDate ? new Date(asset.expiryDate).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          {activeTab === "Active" ? (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedAsset(asset);
                                setShowEditDialog(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRestoreAsset(asset.id)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              {t('restore')}
                            </DropdownMenuItem>
                          )}
                        </TableActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create Asset Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createEntry')}</DialogTitle>
            <DialogDescription>
              {t('trackAndManage')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assetName">{t('assetName')} *</Label>
              <Input
                id="assetName"
                placeholder={`${t('enter')} ${t('assetName').toLowerCase()}`}
                value={newAsset.assetName}
                onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customAssetId">{t('customId')}</Label>
              <Input
                id="customAssetId"
                placeholder={`${t('enter')} ${t('customId').toLowerCase()} (${t('optional')})`}
                value={newAsset.customAssetId}
                onChange={(e) => setNewAsset({ ...newAsset, customAssetId: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="storeId">{t('store')}</Label>
                <Input
                  id="storeId"
                  placeholder={`${t('enter')} ${t('store').toLowerCase()} ${t('id')}`}
                  value={newAsset.storeId}
                  onChange={(e) => setNewAsset({ ...newAsset, storeId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('assetExpiryDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newAsset.expiryDate ? format(newAsset.expiryDate, "PPP") : t('pickADate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newAsset.expiryDate}
                      onSelect={(date) => setNewAsset({ ...newAsset, expiryDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateAsset}>
              {t('create')} {t('assets').slice(0, -1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit')} {t('assets').slice(0, -1)}</DialogTitle>
            <DialogDescription>
              {t('modifyAssessmentDetails')}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editAssetName">{t('assetName')}</Label>
                <Input
                  id="editAssetName"
                  defaultValue={selectedAsset.assetName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCustomAssetId">{t('customId')}</Label>
                <Input
                  id="editCustomAssetId"
                  defaultValue={selectedAsset.customAssetId}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEditAsset}>
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
